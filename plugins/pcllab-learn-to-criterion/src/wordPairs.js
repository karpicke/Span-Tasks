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

		let matchIndex = -1
		for (let i = 0; i < this.remainingWords.length; i++) {
			const el = this.remainingWords[i]
			if (el.target.toLowerCase() === response.toLowerCase()) {
				matchIndex = i
				break
			}
		}

		const isResponseCorrect = compareTargetAndResponse(response, this.currentPair.target)
		if (isResponseCorrect) {
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
