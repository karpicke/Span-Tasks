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