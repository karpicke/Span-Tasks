/* Blueprint */
const OperationSpan = require('./ospan')

/* Modes */
const MathMode = require('./mathmode')
const LetterMode = require('./lettermode')

/* Data */
const DataHandler = require('./datahandler')

/* Display */
const TrialFeedback = require('./trialFeedback')

/* Util */
const Logger = require('./logger')
const randomIntInRange = require('./util').randomIntInRange
const uuid = require('./util').uuid

class OSDriver extends OperationSpan {
    constructor(display_element, trial) {
        super(display_element, trial)

        this.displayElement = display_element
        this.trial = trial
        this.currentCycle = 0
        this.listLengthStack = []
    }

    startCycle() {
        this.currentCycle++

        if (this.listLength[0] === this.listLength[1]) {
            this.listLengthStack = [this.listLength[0]]
        } else {
            this.listLengthStack = jsPsych.randomization.shuffle(this._range(...this.listLength)).reverse()
        }

        this.showListLength()
    }

    showListLength() {
        const listLength = this.listLengthStack.pop()
        Logger.log("Starting list length")

        DataHandler.initializeListLength()

        this.mathmode = new MathMode(this.displayElement, this.trial, this.currentCycle, listLength)
        this.lettermode = new LetterMode(this.displayElement, this.trial, this.currentCycle, listLength)

        this.buildMathStimuli(listLength)
        this.buildLetterStimuli(listLength)

        this.mathmode.hideTemplate()
        this.lettermode.hideTemplate()
        this.showMathEquation()

    }

    showMathEquation() {
        if (this.mathmode.hasStimuli()) {
            this.mathmode.showEquation(() => {
                this.showLetter()
            })
        } else if (this.lettermode.hasStimuli()) {
            this.showLetter()
        } else {
            this.finishTrial()
        }
    }

    showLetter() {
        if (this.lettermode.hasStimuli()) {
            this.lettermode.showLetter(() => {
                this.showMathEquation()
            })
        } else if (this.mathmode.hasStimuli()) {
            this.showMathEquation()
        } else {
            this.finishTrial()
        }
    }

    buildMathStimuli(listLength) {
        const mathStimuli = []

        if (!this.mathStimuli.length) {
            this.mathmode.mathStimuli = mathStimuli
            return
        }

        if (this.mathStimuli.length && this.mathStimuli[0].length < this.listLength[1]) {
            throw new Error("Math stimuli length is less than list length")
        }


        const equationList = {}
        let correctMap = Array(listLength)
        correctMap.fill(1, 0, Math.ceil(listLength / 2))
        correctMap.fill(0, Math.ceil(listLength / 2))
        correctMap = jsPsych.randomization.shuffle(correctMap)

        for (let j = 0; j < listLength; j++) {
            let cue, lhs
            let rhs = -1

            while (rhs < 0) {
                const index1 = randomIntInRange(0, this.mathStimuli[0].length - 1)
                const index2 = randomIntInRange(0, this.mathStimuli[1].length - 1)
                const eq1 = this.mathStimuli[0][index1]
                const eq2 = this.mathStimuli[1][index2]

                lhs = eq1 + eq2
                rhs = eval(lhs.replace(/x/g, "*").replace(/÷/g, "/"))
                cue = correctMap[j] ? rhs : randomIntInRange(Math.max(rhs - 9, 0), rhs + 9)

                if (equationList[lhs]) {
                    rhs = -1
                }
            }

            equationList[lhs] = true

            const stim = { stimulus: lhs + " =", cue: cue, target: rhs === cue }
            mathStimuli.push(stim)
        }

        this.mathmode.mathStimuli = mathStimuli
    }

    buildLetterStimuli(listLength) {
        const letterStimuli = []

        if (!this.letterStimuli.length) {
            this.lettermode.letterStimuli = letterStimuli
            return
        }

        if (this.letterStimuli.length < this.listLength[1]) {
            throw new Error("Letter stimuli length is less than list length")
        }

        const letterList = {}

        this.letterStimuli.forEach(s => {
            s = s + ';' + uuid()
            letterList[s] = s
        })

        for (let j = 0; j < listLength; j++) {
            const index = randomIntInRange(0, Object.keys(letterList).length - 1)
            let letter = Object.keys(letterList)[index]

            delete letterList[letter]

            letter = letter.split(';')[0]
            letterStimuli.push(letter)
        }

        this.lettermode.letterStimuli = letterStimuli
    }

    finishTrial() {
        const finishBlock = () => {
            this.$displayElement.empty()
            if (this.listLengthStack.length > 0) {
                Logger.log('Done list length', this.currentCycle)
                this.showListLength()
            } else if (this.currentCycle < this.cycles) {
                Logger.log('Done cycle', this.currentCycle)
                this.startCycle()
            } else {
                DataHandler.finishTrial()
            }
        }

        if (this.letterStimuli.length) {
            if (this.trialFeedback) {
                this.lettermode.showLetterPad(() => {
                    const feedbackScreen = new TrialFeedback(this.displayElement, this.trial)
                    feedbackScreen.show(
                        DataHandler,
                        () => { finishBlock() }
                    )
                })
            } else {
                this.lettermode.showLetterPad(() => { finishBlock() })
            }
        } else {
            finishBlock()
        }
    }

    _range(start, end) {
        return Array(end - start + 1).fill().map((_, idx) => start + idx)
    }
}


module.exports = OSDriver