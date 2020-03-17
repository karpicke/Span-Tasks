const SS = require('string-similarity')
const SCORING_STRATEGY = require('./constants').SCORING_STRATEGY

class Scorer {
    constructor(strategy, params) {
        this.model = null
        switch (strategy) {
            case SCORING_STRATEGY.exact: this.model = new ExactModel(); break;
            case SCORING_STRATEGY.dice: this.model = new DiceModel(); break;
            case SCORING_STRATEGY.ultron: this.model = new UltronModel(params); break;
            default: throw new Error("Invalid scoring strategy specified " + strategy)
        }
    }

    score(cue, target) {
        return this.model.score(cue, target)
    }
}

class ScoringModel {
    _parseInput(cues, targets) {
        if (typeof cues !== "string" && !Array.isArray(cues)) {
            throw new Error("Input response is of invalid type " + JSON.stringify(cues))
        }

        if (typeof targets !== "string" && !Array.isArray(targets)) {
            throw new Error("Input target is of invalid type " + JSON.stringify(cues))
        }

        let parsed = {}

        if (typeof cues === "string") {
            parsed.cues = [cues]
        } else if (Array.isArray(cues)) {
            parsed.cues = cues
        }

        if (typeof targets === "string") {
            parsed.targets = [targets]
        } else if (Array.isArray(targets)) {
            parsed.targets = targets
        }

        if (parsed.cues.length !== parsed.targets.length) {
            throw new Error("Number of targets do not match number of responses")
        }

        parsed.cues.map(cue => cue ? cue : "")
        parsed.cues.map(cue => cue.trim())
        parsed.targets.map(target => target ? target : "")
        parsed.targets.map(target => target.trim())

        return parsed
    }

    score(cues, targets) {
        let parsed = this._parseInput(cues, targets)
        let _cues = parsed.cues
        let _targets = parsed.targets

        let res = this.kernel(_cues, _targets)

        return new Promise((resolve, reject) => {
            res.then(scores => {
                if (scores.length == 1) {
                    resolve(scores[0])
                }

                resolve(scores)
            }, err => reject(err))
        })
    }

    kernel(cues, targets) {
        throw new Error("ScoringModel is an abstract class and should not be called directly")
        return [0]
    }
}

class ExactModel extends ScoringModel {
    kernel(cues, targets) {
        return new Promise((resolve, reject) => {
            let scores = cues.map((cue, index) =>
                Number(cue.localeCompare(targets[index], 'en', { sensitivity: 'base' }) === 0))
            resolve(scores)
        })
    }
}

class DiceModel extends ScoringModel {
    kernel(cues, targets) {
        return new Promise((resolve, reject) => {
            let scores = cues.map((cue, index) => SS.compareTwoStrings(cue, targets[index]))
            resolve(scores)
        })
    }
}

class UltronModel extends ScoringModel {
    constructor(ultronParams) {
        super()

        if (ultronParams == null) {
            throw new Error("Automated scoring parameters not specified")
        }
        this.ultronParams = ultronParams
        this.apiUrl = 'https://ultron.psych.purdue.edu:5000/api/score-par'
    }

    kernel(cues, targets) {
        return new Promise((resolve, reject) => {
            let requests = []
            let scores = cues.map(() => -1)
            let errors = []

            cues.forEach((cue, index) => {
                const urlParams = {
                    targets: '["' + targets[index] + '"]',
                    response: cue,
                    models: this.ultronParams.models.join(','),
                    classifier: this.ultronParams.classifier
                }
                const req = $.ajax({
                    type: "get",
                    url: this.apiUrl,
                    data: urlParams,
                    success: (result) => {
                        const error = result.errors
                        if (error) {
                            errors.push(error)
                        } else {
                            scores[index] = score = result.scores[0]
                        }
                    },
                    error: (jqXHR, exception) => {
                        let msg = '';
                        if (jqXHR.status === 0) {
                            msg = 'Not connect.\n Verify Network.'
                        } else if (jqXHR.status == 404) {
                            msg = 'Requested page not found. [404]'
                        } else if (jqXHR.status == 500) {
                            msg = 'Internal Server Error [500].'
                        } else if (exception === 'parsererror') {
                            msg = 'Requested JSON parse failed.'
                        } else if (exception === 'timeout') {
                            msg = 'Time out error.'
                        } else if (exception === 'abort') {
                            msg = 'Ajax request aborted.'
                        } else {
                            msg = 'Uncaught Error.\n' + jqXHR.responseText
                        }
                        console.error(msg)
                    }
                })
                requests.push(req)
            })

            $.when(...requests).done(() => {
                if (errors.length) {
                    console.error(errors)
                }
                resolve(scores)
            })
        })
    }
}

module.exports = Scorer