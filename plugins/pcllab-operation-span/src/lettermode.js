/* Blueprint */
const OperationSpan = require('./ospan')

/* Data */
const DataHandler = require('./datahandler')
const DataBlock = require('./datablock')

/* Util */
const setParameter = require('./util').setParameter

/* Constants */
const LETTERS_LABEL = require('./constants').LETTERS_LABEL

/* Components */
const LetterPad = require('./letterpad')
const TrialFeedback = require('./trialFeedback')

class LetterMode extends OperationSpan {
    constructor(display_element, trial, cycle, listLength) {
        super(display_element, trial)

        // Internal
        this._letterStimuli = null
        this.cycle = cycle
        this.listLength = listLength

        // Stimulus parameters
        this.label = setParameter(trial.letter_label, LETTERS_LABEL, 'string')

        // Timing parameters
        this.stimulusTime = setParameter(trial.stimulus_time, 1000, 'number')

        this.buildTemplate()
    }

    startCycle() {
        this._showLetter(this.letterStack.pop())
    }

    showLetter(callback) {
        this._showLetter(this.letterStack.pop(), callback)
    }

    _showLetter(letter, callback) {
        this.showTemplate()

        const datablock = new DataBlock(letter)
        datablock.cycle = this.cycle
        datablock.list_length = this.listLength

        const $letter = $(`
            <div class="row" style="height: 25vh">
                <div class="col h-100 d-flex">
                    <h1 class="text-center mx-auto my-auto">${letter}</h1>
                </div>
            </div>
        `)
        $letter.appendTo(this.$trialContainer)

        setTimeout(() => {
            this.$trialContainer.empty()
            this.$buttonContainer.empty()
            this.isiWait(() => {
                this.hideTemplate()
                callback()
            })
        }, this.stimulusTime)
    }

    showLetterPad(callback) {
        this.showTemplate()

        const $label = $(`
            <div class="row">
                <div class="col">
                    <h3 class="text-center">${this.label}</h3>
                </div>
            </div>
        `)
        $label.appendTo(this.$trialContainer)

        const letterpadStartTime = Date.now()
        const letterpad = new LetterPad(this)
        letterpad.onFinish(letterpadData => {
            // Record response

            const responseLetters = letterpadData.map(d => d.response_numpad)
            for (let i = 0; i < Math.max(this.letterStimuli.length, responseLetters.length); i++) {
                const datablock = new DataBlock('', '', this.letterStimuli[i])
                datablock.recordResponse(responseLetters[i])
                datablock.cycle = this.cycle
                datablock.list_length = this.listLength

                // Record response times
                if (letterpadData.length) {
                    datablock.rt_first_keypress = Math.min(...letterpadData.map(d => d.response_time))
                    datablock.rt = Math.max(...letterpadData.map(d => d.response_time))
                } else {
                    datablock.rt_first_keypress = undefined
                    datablock.rt = undefined
                }
                datablock.rt_last_keypress = Date.now() - letterpadStartTime
            }

            // Get total letters and sum of correct responses
            const numLetters = this.letterStimuli.length
            const numCorrectLetters = this.letterStimuli
                .map((ls, i) => ls === responseLetters[i])
                .reduce((ps, a) => ps + a, 0)

            DataHandler.addToTotalLetters(numLetters)
            DataHandler.addToCorrectLetters(numCorrectLetters)

            // Finish trial
            this.$trialContainer.empty()
            this.$buttonContainer.empty()

            // Show feedback screen for letters
            if (this.letterFeedback) {
                const feedbackScreen = new TrialFeedback(this.$displayElement, this.trial)
                feedbackScreen.show({ listLengthLetters: numLetters, correctListLengthLetters: numCorrectLetters }, () => {
                    if (callback) {
                        this.isiWait(() => {
                            this.hideTemplate()
                            callback()
                        })
                    }
                })
            } else if (callback) {
                this.isiWait(() => {
                    this.hideTemplate()
                    callback()
                })
            }
        })
    }

    hasStimuli() {
        return Boolean(this.letterStack.length)
    }

    set letterStimuli(ls) {
        this._letterStimuli = ls
        this.letterStack = ls.filter(l => l.trim()).reverse()
    }

    get letterStimuli() {
        return this._letterStimuli
    }
}

module.exports = LetterMode