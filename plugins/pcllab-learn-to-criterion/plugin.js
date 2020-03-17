(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* Util */
const compareTargetAndResponse = require('./util').compareTargetAndResponse

class Data {
	constructor() {
		this.datablocks = []
		this.birthTime = Date.now()
		this.studyRounds = -1
		this.recallRounds = -1
		this.roundIndex = -1
		this.responseTimeStart = null
		this.currentDatablock = {}
	}

	/* Study period data */
	nextStudyRound() {
		++this.studyRounds
		this.roundIndex = -1
	}

	startStudy(cue, target, condition) {
		this.currentDatablock = {}
		++this.roundIndex
		this.responseTimeStart = Date.now()

		this.currentDatablock.acc = 0
		this.currentDatablock.condition = condition
		this.currentDatablock.study_index = 1 + this.roundIndex
		this.currentDatablock.study_period = 1 + this.studyRounds

		if (cue) {
			this.currentDatablock.cue = cue
		}

		if (target) {
			this.currentDatablock.target = target
		}
	}

	endStudy() {
		this.currentDatablock.rt = Date.now() - this.responseTimeStart
		this.datablocks.push(this.currentDatablock)
	}

	/* Free recall period data */
	startFreeRecall(condition) {
		++this.recallRounds
		this.roundIndex = -1

		this.currentDatablock = {}
		++this.roundIndex
		this.responseTimeStart = Date.now()

		this.currentDatablock.condition = condition
		this.currentDatablock.test_index = 1 + this.roundIndex
		this.currentDatablock.test_period = 1 + this.recallRounds
	}

	recordFreeRecallResponse(response) {
		this.currentDatablock = {
			condition: this.currentDatablock.condition,
			test_index: this.currentDatablock.test_index,
			test_period: this.currentDatablock.test_period,
			response: response,
			rt: Date.now() - this.responseTimeStart
		}

		this.datablocks.push(this.currentDatablock)
		this.responseTimeStart = Date.now()
	}

	/* Word Pair recall period data */
	nextWPRecallRound() {
		++this.recallRounds
		this.roundIndex = -1
	}

	startWPRecall(pair, condition) {
		++this.roundIndex
		this.responseTimeStart = Date.now()

		this.currentDatablock = {}
		this.currentDatablock.condition = condition
		this.currentDatablock.test_index = 1 + this.roundIndex
		this.currentDatablock.test_period = 1 + this.recallRounds
		this.currentDatablock.cue = pair.cue
		this.currentDatablock.target = pair.target
	}

	recordWPResponse(response) {
		this.currentDatablock.response = response
		this.currentDatablock.rt = Date.now() - this.responseTimeStart
		this.currentDatablock.acc = compareTargetAndResponse(this.currentDatablock.target, response)
		this.datablocks.push(this.currentDatablock)
	}

	registerKeypress() {
		if (!this.currentDatablock)
			return

		if (!this.currentDatablock.rt_first_keypress) {
			this.currentDatablock.rt_first_keypress = Date.now() - this.responseTimeStart
		}
		this.currentDatablock.rt_last_keypress = Date.now() - this.responseTimeStart
	}

	/* Instructions data */
	startInstructions(condition) {
		this.currentDatablock = {}
		this.responseTimeStart = Date.now()

		this.currentDatablock.condition = condition + '_instructions'
	}

	endInstructions() {
		this.currentDatablock.rt = Date.now() - this.responseTimeStart
		this.datablocks.push(this.currentDatablock)
	}

	finishTrial() {
		this.datablocks.slice(0, -1).forEach((datablock) => {
			jsPsych.data.write(datablock)
		})
		jsPsych.finishTrial(this.datablocks.slice(-1)[0])
	}
}

module.exports = Data
},{"./util":8}],2:[function(require,module,exports){
const Data = require('./data')
const ProgressBar = require('./progressBar')

const FR_MODES = {
    STUDY: 'study',
    RECALL: 'recall'
}

class FreeRecall {
    constructor(ltcInstance) {
        this.ltc = ltcInstance
        this.targetStack = this.ltc.word_list.slice().reverse()
        this.recallStack = this.ltc.word_list.slice().reverse()
        this.remainingWords = this.ltc.word_list.slice()
        this.completedWords = []
        this.$title = null
        this.$trial_container = null
        this.$progress_container = null
        this.$button_container = null
        this.$continueButton = null
        this.buildTemplate()
    }

    start() {
        this.showInstructions(FR_MODES.STUDY)
    }

    buildTemplate() {
        if (this.ltc.title) {
            this.$title = $(`
				<div class="row justify-content-center">
					<h1>${this.ltc.title}</h1>
				</div>
			`)
            this.ltc.$display_element.append(this.$title)
            this.$title.hide()
        }

        this.ltc.$display_element.append(`
			<div class="row mt-4 mb-4">
				<div class="col" id="trial_container"></div>
			</div>
		`)
        this.$trial_container = $('#trial_container')

        this.ltc.$display_element.append(`
			<div class="row">
				<div class="col text-center" id="button_container"></div>
			</div>
		`)
        this.$button_container = $('#button_container')

        this.ltc.$display_element.append(`
				<div class="row">
					<div class="col text-center" id="progress_container"></div>
				</div>
			`)
        this.$progress_container = $('#progress_container')

        if (!this.ltc.show_progress) {
            this.$progress_container.empty()
        }
    }

    showInstructions(mode) {
        let instructions = null

        switch (mode) {
            case FR_MODES.STUDY:
                instructions = this.ltc.study_instructions
                break
            case FR_MODES.RECALL:
                instructions = this.ltc.recall_instructions
                break
        }

        if (!instructions) {
            this._proceedInstructions(mode)
            return
        }

        this.ltc.data.startInstructions(mode)

        this.$title.show()
        this.$button_container.empty()
        this.$trial_container.empty()
        this.$progress_container.empty()

        this.$trial_container.append(`
            <div class="row mb-4 ml-0 mr-0 pl-0 pr-0 w-100" style="height: 100px; margin-top: 100px">
                <div class="col h-100 d-flex text-center">
                    <span style="margin: auto; font-weight: 400; font-size: 24px">${instructions}</span>
                </div>
            </div>
		`)

        const self = this
        let nextButton = new NextButton(this.buttonText)
        nextButton.click(() => {
            self.ltc.data.endInstructions()
            self._proceedInstructions(mode)
        })

        if (this.ltc.show_button) {
            this.$button_container.append(nextButton)
        } else if (this.ltc.instructions_time === -1) {
            throw new Error("instructions_time must be specified")
        }

        if (this.ltc.instructions_time !== -1) {
            setTimeout(() => {
                this.ltc.data.endInstructions()
                this._proceedInstructions(mode)
            }, this.ltc.instructions_time)
        }
    }

    _proceedInstructions(mode) {
        this.isi_wait(() => {
            if (mode === FR_MODES.STUDY) {
                if (this.ltc.randomize) {
                    this.targetStack = jsPsych.randomization.shuffle(this.targetStack)
                    this.recallStack = jsPsych.randomization.shuffle(this.targetStack)
                }

                this.ltc.data.nextStudyRound()
                this.showNextTarget()
            }

            if (mode === FR_MODES.RECALL) {
                this.showRecallList()
            }
        })
    }

    showNextTarget() {
        this.$title.hide()
        this.$button_container.empty()
        this.$trial_container.empty()
        this.$progress_container.empty()

        const targetWord = this.targetStack.pop()
        const word = targetWord.cue || targetWord.target

        this.ltc.data.startStudy(null, targetWord.target, FR_MODES.STUDY)


        this.$trial_container.append(`
			<div style="height: 500px; display: flex">
				<span style="margin: auto; font-weight: 400; font-size: 24px">${word}</span>
			</div>
		`)

        if (this.ltc.user_timing) {
            const self = this
            let nextButton = new NextButton(this.buttonText)
            nextButton.click(() => {
                self._showNextTarget(targetWord)
            })
            this.$button_container.append(nextButton)
        } else {
            const intervalTime = isNaN(targetWord.time) ? this.ltc.max_study_time : Number(targetWord.time)

            // Render progress bar
            if (this.ltc.show_progress) {
                const progressBar = new ProgressBar(intervalTime)
                this.$progress_container.append(progressBar.get$Element())
                progressBar.start()
            }

            setTimeout(() => {
                this._showNextTarget(targetWord)
            }, intervalTime)
        }
    }

    _showNextTarget(targetWord) {
        this.ltc.data.endStudy()

        this.isi_wait(() => {
            if (this.targetStack.length === 0) {
                this.showInstructions(FR_MODES.RECALL)
            } else {
                this.showNextTarget()
            }
        })
    }

    showRecallList() {
        this.$title.show()
        this.$button_container.empty()
        this.$trial_container.empty()
        this.$progress_container.empty()

        this.ltc.data.startFreeRecall(FR_MODES.RECALL)

        const self = this
        let responses = []

        let nextButton = new NextButton(this.buttonText)
        nextButton.click(() => {
            responses.forEach((response) => {
                let matchIndex = -1
                for (let i = 0; i < self.remainingWords.length; i++) {
                    const el = self.remainingWords[i]
                    if (el.target.toLowerCase() === response.toLowerCase()) {
                        matchIndex = i
                        break
                    }
                }
                if (matchIndex >= 0) self.remainingWords.splice(matchIndex, 1)
            })

            self.targetStack = self.remainingWords.slice().reverse()

            if (self.remainingWords.length === 0) {
                self.ltc.end()
            } else {
                self.ltc.data.nextStudyRound()
                self.showNextTarget()
            }
        })
        nextButton.prop('disabled', true)
        this.$button_container.append(nextButton)

        const $responseListContainer = $(`
			<div class="row justify-content-center">
				<div class="recall-list-container" id="response_list"></div>
			</div>
		`)
        this.$trial_container.append($responseListContainer)
        const $responseList = $('#response_list')

        const $responseInputContainer = $(`
			<div class="row justify-content-center mt-3">
				<div class="md-form form-lg" style="width: 75%">
					<input type="text" id="res_input" class="form-control form-control-lg text-center">
					<label for="res_input">Word</label>
				</div>
			</div>
		`)
        this.$trial_container.append($responseInputContainer)
        const $responseInput = $('#res_input')

        $responseInput.keypress((e) => {
            if (e.keyCode == 13) {
                if (!$responseInput.val().trim()) return

                self.ltc.data.recordFreeRecallResponse($responseInput.val().trim())

                responses.push($responseInput.val().trim())
                $responseInput.val('')
                self._renderList($responseList, responses)
                nextButton.prop('disabled', false)
            }
        })
    }

    _renderList($responseList, responses) {
        $responseList.empty()
        responses.forEach((response) => {
            $responseList.append(`
				<div class="recall-list-item">
					<span>${response}</span>
				</div>
			`)
        })
        $responseList.scrollTop($responseList.prop('scrollHeight'))
    }

    isi_wait(callback) {
        this.$title.hide()
        this.$button_container.hide()
        this.$trial_container.hide()
        this.$progress_container.hide()

        const self = this
        setTimeout(() => {
            self.$button_container.show()
            self.$trial_container.show()
            self.$progress_container.show()
            callback()
        }, this.ltc.isi_time)
    }
}

class NextButton {
    constructor(text) {
        const buttonText = text || 'Next'

        return $('<button>', {
            class: 'btn btn-primary waves-effect waves-light',
            text: buttonText
        })
    }
}

module.exports = FreeRecall
},{"./data":1,"./progressBar":7}],3:[function(require,module,exports){
class Hook {
	constructor(pluginEngineInstance) {
		this.engine = pluginEngineInstance
		this._onTrialStart = () => { }
		this._onTrialEnd = () => { }
	}

	getTrialList() {
		return this.engine.trial_list
	}

	getTrialFromIndex(index) {
		if (isNaN(index) || !this.engine.trial_list[index]) {
			console.error(index, 'is not a valid index')
			return null
		}

		return this.engine.trial_list[index]
	}

	getTrialIndex() {
		return this.engine.timeline.currentIndex
	}

	setTimeline(newTimeline) {
		this.engine.pendingTrials = newTimeline
		this.engine.pendingTrials.forEach((index) => {
			console.log(index)

			if (!this.engine.trial_list[index]) {
				console.warn('Warning: trial_list does not contain item at index ' + index)
			}
		})
	}

	onTrialStart(callback) {
		this._onTrialStart = callback
	}

	onTrialEnd(callback) {
		this._onTrialStart = callback
	}
}

module.exports = Hook
},{}],4:[function(require,module,exports){
/**
 * @name Learn To Criterion
 *
 * @param {string}      [title]                 The optional title
 * @param {string}      [button_text]           Text that will appear in place of 'Continue' on the button
 * @param {boolean}     [show_button]           Toggle showing the button to proceed
 * @param {number}      [max_recall_time]       The amount of time (in milliseconds) permitted for a recall screen
 * @param {number}      [max_study_time]        The amount of time (in milliseconds) permitted for a recall screen
 * @param {number}      [instructions_time]     The amount of time (in milliseconds) permitted for a recall screen
 * @param {number}      [minimum_time]          The amount of time until the experiment can be submitted
 * @param {boolean}     [user_timing]           If true, cue is shown until the user clicks on the continue button
 * @param {boolean}     [randomize]             If set to true, the order in which cues for study and recall trials appear is random
 * @param {boolean}     [show_progress]         Show progress bar when maximum time is specified
 * @param {number}      [isi_time]              Time between trials. Must be between 0 - 10000 ms
 * @param {number}      [max_attempts]          Maximum number of repeats allowed before the trials are ended
 * @param {list}        [word_list]             List of cues (and targets) for the trial
 * @param {string}      [word_list_url]         Url to JSON file with a word list
 * @param {string}      [study_instructions]    Instructions to show before the study phase
 * @param {string}      [recall_instructions]   Instructions to show before the recall phase
 * 
 * @param {function}    [hook]
 * 
 * @author Vishnu Vijayan
 */

const FreeRecall = require('./freeRecall')
const WordPairs = require('./wordPairs')
const PluginEngine = require('./pluginEngine')
const Data = require('./data')

/* Util */
const setParameter = require('./util').setParameter

// LTC modes enum
const LTC_MODES = {
    WORD_PAIRS: 'word_pairs',
    FREE_RECALL: 'free_recall',
    LTC_PLUGINS: 'ltc_plugins'
}

class LearnToCriterion {

    constructor(display_element, trial) {
        if (!display_element) {
            throw new Error("Invalid display element", display_element)
        }

        if (!trial) {
            throw new Error("Invalid trial", trial)
        }

        /* Stimulus parameters */
        this.word_list = trial.word_list
        this.word_list_url = trial.word_list_url
        this.max_attempts = isNaN(trial.max_attempts) ? -1 : trial.max_attempts
        this.randomize = typeof trial.randomize === "undefined" ? false : trial.randomize

        /* Display parameters */
        this.button_text = trial.button_text || 'Next'
        this.title = trial.title || null
        this.study_instructions = trial.study_instructions || null
        this.recall_instructions = trial.recall_instructions || null
        this.show_progress = typeof trial.show_progress === "undefined" ? false : trial.show_progress
        this.show_button = typeof trial.show_button === "undefined" ? true : trial.show_button

        /* Timing parameters */
        this.user_timing = trial.user_timing || false
        this.max_recall_time = isNaN(trial.max_recall_time) ? -1 : trial.max_recall_time
        this.max_study_time = isNaN(trial.max_study_time) ? -1 : trial.max_study_time
        this.instructions_time = isNaN(trial.instructions_time) ? -1 : trial.instructions_time
        this.isi_time = isNaN(trial.isi_time) ? 2000 : trial.isi_time

        /* Word-pairs parameters */
        this.post_recall_cb = trial.post_recall_cb || (() => { })

        /* Feedback parameters */
        this.correct_feedback = setParameter(trial.correct_feedback, false, 'boolean')
        this.correct_feedback_time = setParameter(trial.correct_feedback_time, 1500, 'number')

        /* Plugin Engine parameters */
        this.hook = trial.hook
        this.trial_list = trial.trial_list
        this.auto_validate = typeof trial.auto_validate === "undefined" ? true : trial.auto_validate
        this.instructions = trial.instructions

        /* Internal properties */
        this.$display_element = $(display_element)
        this.data = new Data()

        if (!trial.mode) {
            throw new Error("Invalid trial mode.")
        }

        switch (trial.mode.toLowerCase()) {
            case LTC_MODES.WORD_PAIRS:
                this.mode = LTC_MODES.WORD_PAIRS
                break
            case LTC_MODES.FREE_RECALL:
                this.mode = LTC_MODES.FREE_RECALL
                break
            case LTC_MODES.LTC_PLUGINS:
                this.mode = LTC_MODES.LTC_PLUGINS
                break
            default:
                throw new Error("Invalid trial mode.")
        }

        if (this.isi_time < 0) {
            console.warn("isi_time must be between 0 and 10000. Setting to 0")
            this.isi_time = 0
        }

        if (this.isi_time > 10000) {
            console.warn("isi_time must be between 0 and 10000. Setting to 10000")
            this.isi_time = 10000
        }
    }

    start() {
        // Fetch materials before starting
        if (this.word_list_url) {
            const self = this
            $.getJSON(this.word_list_url, (data) => {
                self.word_list = data
                self._start()
            })
        } else {
            if ((this.mode === LTC_MODES.FREE_RECALL || this.mode === LTC_MODES.WORD_PAIRS) && !this.word_list) {
                throw new Error("No word list present")
            }
            this._start()
        }
    }

    _start() {
        if (this.mode === LTC_MODES.FREE_RECALL) {
            const freeRecall = new FreeRecall(this)
            freeRecall.start()
        } else if (this.mode === LTC_MODES.WORD_PAIRS) {
            const wordPairs = new WordPairs(this)
            wordPairs.start()
        } else if (this.mode === LTC_MODES.LTC_PLUGINS) {
            const pluginEngine = new PluginEngine(this)
            pluginEngine.start()
        }
    }

    end() {
        this.$display_element.empty()
        this.data.finishTrial()
    }
}

module.exports = LearnToCriterion
},{"./data":1,"./freeRecall":2,"./pluginEngine":6,"./util":8,"./wordPairs":9}],5:[function(require,module,exports){
const LearnToCriterion = require('./learnToCriterion')

jsPsych.plugins["pcllab-learn-to-criterion"] = (function () {

    let plugin = {}

    plugin.info = {
        name: 'pcllab-learn-to-criterion',
        parameters: {}
    }

    plugin.trial = function (display_element, trial) {
        const ltc = new LearnToCriterion(display_element, trial)
        ltc.start()
    }

    return plugin
})()
},{"./learnToCriterion":4}],6:[function(require,module,exports){
const Hook = require('./hook')

/*
 * Warning: Some parts of this plugin are very janky and work because of 
 * arcane magic. Test thoroughly whenever a change is made.
 */

class PluginEngine {

	constructor(ltcInstance) {
		this.ltc = ltcInstance
		this.auto_validate = this.ltc.auto_validate
		this.trial_list = this.ltc.trial_list.slice()
		this.instructions = this.ltc.instructions
		this.timeline = []
		this.pendingTrials = []
		this.failedTrials = []
		this.roundNumber = 0
		this.condition = null
		this.hookAPI = new Hook(this)

		/* Initiatlize plugin hook */
		if (this.ltc.hook) {
			this.ltc.hook(this.hookAPI)
		}
	}

	start() {
		if (this.ltc.randomize) {
			this.trial_list = jsPsych.randomization.shuffle(this.trial_list)
		}

		// Prepend instructions trial to trial_list
		if (this.ltc.instructions) {
			const instructions_trial = { trial: this.instructions, success: () => { return true } }
			this.trial_list = [instructions_trial].concat(this.trial_list)
		}

		this.timeline = this.trial_list.map((t, index) => { return index }) // Holds indices of the trial objects
		this.timeline.currentIndex = 0

		this.condition = 'study'

		// Start learn to criterion
		this.performTrial(this.trial_list[this.timeline[this.timeline.currentIndex]].trial, this.onTrialEnd, this)
	}

	performTrial(nestedTrial, callback, self) {
		const args = arguments

		self.hookAPI._onTrialStart(nestedTrial, self.timeline.currentIndex)

		let $iframe = $('<iframe>', {
			src: 'plugins/pcllab-learn-to-criterion/template.html',
			id: 'myFrame',
			frameborder: 0,
			scrolling: 'no',
			style: "height: 100%; width: 100%; background: none",
			allowTransparency: "true"
		})

		$iframe.appendTo(self.ltc.$display_element)

		$iframe.on('load', () => {
			$iframe.contents().find('html').css({ 'padding-left': '20px', 'padding-right': '20px' })
			let iframeContent = document.getElementById('myFrame').contentWindow

			const scriptUrl = `plugins/${nestedTrial.type}/plugin.js`
			const timeline = [nestedTrial]
			// console.log('loading: ', scriptUrl);
			iframeContent.loadScripts([scriptUrl], () => {
				iframeContent.init(timeline, (trialData) => {
					clearInterval(intervalId)
					$iframe.remove()
					callback(trialData, nestedTrial, self)
				})
			})
		})

		// Change height of iframe based on content
		let lastHeight = 0, currHeight = 0
		const intervalId = setInterval(function () {
			currHeight = $iframe.contents().find('html').height()
			if (currHeight != lastHeight) {
				$iframe.css('height', (lastHeight = currHeight) + 10 + 'px')
			}
		}, 200)
	}

	/* Somehow the reference to 'this' gets lost by the time this function gets
	 * executed. Javascript is weird, so the reference to 'this' has to be
	 * passed down the callback chain as self for things to work.
	 */
	onTrialEnd(data, nestedTrial, self) {
		// Check if the cue trial was a success
		const success = self.trial_list[self.timeline.currentIndex].success(data)

		// Store the result of the trial with the trial metadata
		self.trial_list[self.timeline.currentIndex].result = success

		/* Append cue trial data to jsPsych data */
		data.forEach(dataSegment => {
			dataSegment.ltc_condition = self.condition
			dataSegment.ltc_index = self.roundNumber
			dataSegment.ltc_success = success
			dataSegment.ltc_trial_type = dataSegment.trial_type
			dataSegment.ltc_time_elapsed = dataSegment.time_elapsed
			jsPsych.data.write(dataSegment)
		})

		self.hookAPI._onTrialEnd(nestedTrial, success, self.timeline.currentIndex)


		if (!success && self.auto_validate) {
			// If auto_validate is off, then the user is constructing the next timeline instead
			self.failedTrials.push(self.timeline.currentIndex)
		}

		++self.timeline.currentIndex

		if (self.timeline.currentIndex >= self.timeline.length) {

			// Check if the user has created a new timeline, if so then run it
			if (self.pendingTrials.length) {
				self.failedTrials = JSON.parse(JSON.stringify(self.pendingTrials))
				self.pendingTrials = []
			}

			if (self.failedTrials.length === 0 || (self.max_attempts >= 0 && self.roundNumber >= self.max_attempts)) {
				// All trials were successful, earn to criterion has finished
				console.log('triggered end', self.failedTrials)
				jsPsych.finishTrial()
				return
			} else {
				// Re-do failed trials
				self.timeline = self.failedTrials.slice()

				// Prepend instructions trial index
				if (self.instructions) {
					self.timeline = [0].concat(self.timeline)
				}

				self.timeline.currentIndex = 0

				self.failedTrials = []
				++self.roundNumber
			}
		}

		if (self.roundNumber > 0) {
			self.condition = 'recall'
		}

		// Perform next trial in list
		self.isi_wait(() => {
			const nextIndex = self.timeline[self.timeline.currentIndex]
			self.performTrial(self.trial_list[nextIndex].trial, self.onTrialEnd, self)
		})
	}

	isi_wait(callback) {
		const self = this
		setTimeout(() => {
			callback()
		}, this.ltc.isi_time)
	}
}

module.exports = PluginEngine
},{"./hook":3}],7:[function(require,module,exports){
/**
 * @name Progress Bar
 *
 * @param {number}	[duration]	Duration of the progress bar in ms
 * @param {boolean}	[reverse]	If true, renders the progress bar backwards
 * 
 * @author Vishnu Vijayan
 */

class ProgressBar {
	constructor(duration, reverse) {
		if (isNaN(duration)) {
			throw new Error("Progress bar duration is invalid")
		}

		this.duration = duration
		this.reverse = Boolean(reverse)

		this.$progressBarContainer = $('<div class="progress"></div>')
		this.$progressBar = $('<div class="determinate" id="progressBar"></div>')
		this.$progressBar.css({ 'animation-duration': this.duration + 'ms' })

		if(this.reverse) {
			this.$progressBar.addClass('reverse')
		}

		this.$progressBarContainer.append(this.$progressBar)
	}

	get$Element() {
		return this.$progressBarContainer
	}

	start() {
		this.$progressBarContainer.show()
		this.$progressBar.show()
		this.$progressBar.css({ 'animation-play-state': 'running' })
	}

	stop() {
		this.$progressBar.css({ 'animation-play-state': 'paused' })
	}

	done(callback) {
		if(typeof callback === 'function') {
			this.$progressBar.on('animationend', callback)
		}
	}
}

module.exports = ProgressBar
},{}],8:[function(require,module,exports){
module.exports.setParameter = (value, defaultValue, expectedType) => {
    if (typeof value === "function" && typeof value !== expectedType) {
        value = value()
    }

    if (expectedType && typeof value === expectedType) {
        return value
    }

    if (typeof value !== 'undefined') {
        return value
    }

    return defaultValue
}

module.exports.copy = (obj) => {
    return Object.assign({}, obj)
}

module.exports.compareTargetAndResponse = (target, response) => {
    if (target === response) {
        return 1
    }

    if (typeof target === 'string' && typeof response === 'string') {
        const substr1 = target.trim().toUpperCase().substr(0, 3)
        const substr2 = response.trim().toUpperCase().substr(0, 3)
        return Number(substr1 === substr2)
    }

    return Number(target == response)
}

},{}],9:[function(require,module,exports){
const ProgressBar = require('./progressBar')
const FreeRecall = require('./freeRecall')

/* Util */
const copy = require('./util').copy
const compareTargetAndResponse = require('./util').compareTargetAndResponse

const WP_MODES = {
	STUDY: 'study',
	RECALL: 'recall'
}

class WordPairs extends FreeRecall {
	constructor(ltcInstance) {
		super(ltcInstance)
		this.wordMap = this.targetStack.map(() => false)
		this.currentPair = null
		this.numAttempts = 1
		this.post_recall_cb = this.ltc.post_recall_cb
	}

	showNextTarget() {
		this.$title.hide()
		this.$button_container.empty()
		this.$trial_container.empty()
		this.$progress_container.empty()

		const targetWord = this.targetStack.pop()

		this.ltc.data.startStudy(targetWord.cue, targetWord.target, WP_MODES.STUDY)

		this.$trial_container.append(`
			<div class="row mb-4 ml-0 mr-0 pl-0 pr-0 w-100" style="height: 100px; margin-top: 100px">
				<div class="col h-100 d-flex text-center">
					<span style="margin: auto; font-weight: 400; font-size: 24px">${targetWord.cue}</span>
				</div>
			</div>

			<div class="row mt-4 ml-0 mr-0 pl-0 pr-0 w-100" style="height: 100px; margin-bottom: 100px">
				<div class="col h-100 d-flex text-center">
					<span style="margin: auto; font-weight: 400; font-size: 24px">${targetWord.target}</span>
				</div>
			</div>
		`)

		if (this.ltc.user_timing) {
			const self = this
			let nextButton = new NextButton(this.buttonText)
			nextButton.click(() => {
				self._showNextTarget(targetWord)
			})
			this.$button_container.append(nextButton)
		} else {
			const intervalTime = isNaN(targetWord.time) ? this.ltc.max_study_time : Number(targetWord.time)

			// Render progress bar
			if (this.ltc.show_progress) {
				const progressBar = new ProgressBar(intervalTime)
				this.$progress_container.append(progressBar.get$Element())
				progressBar.start()
			}

			setTimeout(() => {
				this._showNextTarget(targetWord)
			}, intervalTime)
		}
	}

	showRecallList() {
		this.ltc.data.nextWPRecallRound()
		this.showNextPair()
	}

	showNextPair() {
		this.$title.hide()
		this.$button_container.empty()
		this.$trial_container.empty()
		this.$progress_container.empty()

		const self = this
		this.currentPair = this.recallStack.pop()

		this.ltc.data.startWPRecall(this.currentPair, WP_MODES.RECALL)

		const $centered_container = $(`
			<div class="row mb-4 ml-0 mr-0 pl-0 pr-0 w-100" style="height: 100px; margin-top: 100px">
				<div class="col h-100 d-flex text-center">
					<span style="margin: auto; font-weight: 400; font-size: 24px">${this.currentPair.cue}</span>
				</div>
			</div>

			<div class="row mt-4 ml-0 mr-0 pl-0 pr-0 w-100" style="height: 100px; margin-bottom: 100px">
				<div class="col h-100 text-center">
					<div class="md-form mx-auto core-input-form md-outline w-75">
						<input type="text" id="res_input" class="core-input-sm form-control pb-2 text-center">
					</div>
				</div>
			</div>
		`)
		this.$trial_container.append($centered_container)

		const $responseInput = $('#res_input')
		$responseInput.focus()
		$responseInput.keyup((e) => {
			this.ltc.data.registerKeypress()

			if (this.ltc.user_timing && e.keyCode == 13) {
				// Enter key pressed
				if (!$responseInput.val().trim()) return
				self.validateResponse($responseInput)
				return
			} else {
				nextButton.prop('disabled', false)
			}

			if (!$responseInput.val().length) {
				nextButton.prop('disabled', true)
			}
		})

		let idkButton = new NextButton("I don't know")
		idkButton.addClass('mr-4').addClass('btn-secondary').removeClass('btn-primary')
		idkButton.click(() => {
			$responseInput.val("I don't know")
			nextButton.prop('disabled', false)
			$("label[for='res_input']").addClass('active')
		})

		if (this.ltc.show_i_dont_know) {
			this.$button_container.append(idkButton)
		}

		let nextButton = new NextButton(this.buttonText)
		nextButton.click(() => {
			self.validateResponse($responseInput)
		})
		nextButton.prop('disabled', true)

		if (this.ltc.user_timing) {
			this.$button_container.append(nextButton)
		} else {
			const intervalTime = this.ltc.max_recall_time

			// Render progress bar
			if (this.ltc.show_progress) {
				const progressBar = new ProgressBar(intervalTime)
				this.$progress_container.append(progressBar.get$Element())
				progressBar.start()
			}

			setTimeout(() => {
				self.validateResponse($responseInput, true)
			}, intervalTime)
		}
	}

	validateResponse($responseInput, forceNextPair) {
		$responseInput.prop('disabled', true)
		const response = $responseInput.val().trim()

		if (response.length === 0 && !forceNextPair) return

		this.ltc.data.recordWPResponse(response)

		const isResponseCorrect = compareTargetAndResponse(response, this.currentPair.target)
		if (isResponseCorrect) {
			const matchIndex = this.remainingWords.indexOf(this.currentPair)
			this.completedWords = this.remainingWords[matchIndex]
			this.remainingWords.splice(matchIndex, 1)
		}

		if (this.ltc.correct_feedback && isResponseCorrect) {
			this.renderCorrectFeedback()
		}

		const correctFeedbackTime = this.ltc.correct_feedback && isResponseCorrect ? this.ltc.correct_feedback_time : 0
		setTimeout(() => {
			if (this.recallStack.length === 0) {
				// Recall screens are done
				if (this.remainingWords.length !== 0 && this.numAttempts < this.ltc.max_attempts) {
					this.numAttempts++
					this.targetStack = jsPsych.randomization.shuffle(this.remainingWords)
					this.recallStack = jsPsych.randomization.shuffle(this.remainingWords)
					this.post_recall_cb(copy(this.ltc.data.currentDatablock), copy(this.currentPair))
					this.isi_wait(() => this.showInstructions(WP_MODES.STUDY))
				} else {
					this.post_recall_cb(copy(this.ltc.data.currentDatablock), copy(this.currentPair))
					this.isi_wait(() => this.ltc.end())
				}
			} else {
				this.post_recall_cb(copy(this.ltc.data.currentDatablock), copy(this.currentPair))
				this.isi_wait(() => this.showNextPair())
			}
		}, correctFeedbackTime)
	}

	renderCorrectFeedback() {
		this.$trial_container.append(`
			<div class="row">
				<div class="col text-center">
					<h2 class="text-success">Correct</h2>
				</div>
			</div>
		`)
	}
}

class NextButton {
	constructor(text) {
		const buttonText = text || 'Next'

		return $('<button>', {
			class: 'btn btn-primary waves-effect waves-light',
			text: buttonText
		})
	}
}

module.exports = WordPairs

},{"./freeRecall":2,"./progressBar":7,"./util":8}]},{},[5])
//# sourceMappingURL=plugin.js.map
