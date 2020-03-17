/* Blueprint */
const OperationSpan = require('./ospan')

/* Data */
const DataHandler = require('./datahandler')
const DataBlock = require('./datablock')

/* Util */
const setParameter = require('./util').setParameter

/* Constants */
const MATH_LABEL = require('./constants').MATH_LABEL

class MathMode extends OperationSpan {
    constructor(display_element, trial, cycle, listLength) {
        super(display_element, trial)

        // Internal
        this._mathStimuli = null
        this.cycle = cycle
        this.listLength = listLength

        // Stimulus parameters
        this.equationStack = []
        this.label = setParameter(trial.math_label, MATH_LABEL, 'string')

        // Timing parameters
        this.feedbackTime = setParameter(trial.feedback_time, 500, 'number')

        this.buildTemplate()
    }

    startCycle() {
        throw new Error("Do not call start directly")
    }

    showEquation(callback) {
        this._showEquation(this.equationStack.pop(), callback)
    }

    _showEquation(stimblock, callback) {
        this.showTemplate()

        const datablock = new DataBlock(stimblock.stimulus, stimblock.cue, stimblock.target)
        datablock.cycle = this.cycle
        datablock.list_length = this.listLength

        const $equation = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center">${stimblock.stimulus}</h3>
                </div>
            </div>
        `)
        $equation.appendTo(this.$trialContainer)

        const $label = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center">${this.label}</h3>
                </div>
            </div>
        `)
        $label.appendTo(this.$trialContainer)

        const $button = $('<button>', {
            class: 'btn btn-large btn-primary waves-effect waves-light',
            text: this.buttonText
        })
        $button.appendTo(this.$buttonContainer)

        $button.click(() => {
            datablock.recordResponse()
            this.$trialContainer.empty()
            this.$buttonContainer.empty()
            this.isiWait(() => { this.showTarget(stimblock, callback) })
        })
    }

    showTarget(stimblock, callback) {
        const datablock = new DataBlock(stimblock.stimulus, stimblock.cue, stimblock.target)
        datablock.cycle = this.cycle
        datablock.list_length = this.listLength

        const $cue = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center">${stimblock.cue}</h3>
                </div>
            </div>
        `)
        $cue.appendTo(this.$trialContainer)

        this.$trueButton = $('<button>', {
            class: 'btn btn-large btn-primary waves-effect waves-light mr-5',
            text: 'True'
        })
        this.$trueButton.appendTo(this.$buttonContainer)

        this.$falseButton = $('<button>', {
            class: 'btn btn-large btn-primary waves-effect waves-light ml-5',
            text: 'False'
        })
        this.$falseButton.appendTo(this.$buttonContainer)

        this.$trueButton.click(() => {
            this.selectResponse(true, stimblock, datablock, callback)
        })

        this.$falseButton.click(() => {
            this.selectResponse(false, stimblock, datablock, callback)
        })
    }

    selectResponse(response, stimblock, datablock, callback) {
        datablock.recordResponse(response)

        DataHandler.addToTotalMath(1)
        if (response === stimblock.target) {
            DataHandler.addToCorrectMath(1)
        }

        const $correctFeedback = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center text-success">Correct</h3>
                </div>
            </div>
        `)

        const $incorrectFeedback = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center text-danger">Incorrect</h3>
                </div>
            </div>
        `)

        const $feedback = response === stimblock.target ?
            $correctFeedback : $incorrectFeedback
        if (this.mathFeedback) {
            $feedback.appendTo(this.$buttonContainer)
        }

        this.$trueButton.attr('disabled', true)
        this.$falseButton.attr('disabled', true)

        // Finish trial
        setTimeout(() => {
            this.$trialContainer.empty()
            this.$buttonContainer.empty()

            if (callback)
                this.isiWait(() => {
                    this.hideTemplate()
                    callback()
                })
        }, this.feedbackTime)
    }

    hasStimuli() {
        return Boolean(this.equationStack.length)
    }

    set mathStimuli(ms) {
        this._mathStimuli = ms
        this.equationStack = ms.slice(0).reverse()
    }

    get mathStimuli() {
        return this._mathStimuli
    }
}

module.exports = MathMode