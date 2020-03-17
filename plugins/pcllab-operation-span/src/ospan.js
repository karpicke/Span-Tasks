/* Util */
const setParameter = require('./util').setParameter
const $hide = require('./util').$hide
const $show = require('./util').$show
const uuid = require('./util').uuid

class OperationSpan {
    constructor(display_element, trial) {
        if (!display_element) {
            throw new Error("Invalid display element", display_element)
        }

        if (!trial) {
            throw new Error("Invalid trial", trial)
        }

        // Plugin parameters
        this.trial = trial
        this.mode = setParameter(trial.mode, null, 'string')

        // Stimulus parameters
        this.cycles = setParameter(trial.cycles, 3, 'number')
        this.listLength = setParameter(trial.list_length, [3, 7], null)
        this.mathStimuli = setParameter(trial.math_stimuli, [], null)
        this.letterStimuli = setParameter(trial.letter_stimuli, [], null)
        this.title = setParameter(trial.title, '', null)
        this.buttonText = setParameter(trial.button_text, 'Next', null)

        // Feedback parameters
        this.mathFeedback = setParameter(trial.math_feedback, false, 'boolean')
        this.letterFeedback = setParameter(trial.letter_feedback, false, 'boolean')
        this.trialFeedback = setParameter(trial.trial_feedback, false, 'boolean')

        if (this.listLength.length !== 2) {
            throw new Error("List length must be in the format [min_length, max_length]")
        }

        // Template parameters
        this.$displayElement = $(display_element)
        this.$template = null
        this.$trialContainer = null
        this.$progressContainer = null
        this.$title = $()
        this.$buttonContainer = null
        this.$repeatButton = null

        // Timing parameters
        this.isi = setParameter(trial.isi, 250, 'number')
    }

    startCycle() { }

    buildTemplate() {
        const id = uuid()

        this.$template = $('<div>')
        this.$displayElement.append(this.$template)

        this.$title = $(`
            <div class="row justify-content-center">
                <h1>${this.title}</h1>
            </div>
        `)
        this.$template.append(this.$title)

        this.$template.append(`
            <div class="row mt-4 mb-4">
                <div class="col" id="trial_container${id}"></div>
            </div>
        `)
        this.$trialContainer = $('#trial_container' + id)

        this.$template.append(`
            <div class="row">
                <div class="col text-center" id="button_container${id}"></div>
            </div>
        `)
        this.$buttonContainer = $('#button_container' + id)

        this.$template.append(`
            <div class="row mt-2">
                <div class="col text-center" id="progress_container${id}"></div>
            </div>
        `)
        this.$progressContainer = $('#progress_container' + id)

        if (!this.show_progress) {
            this.$progressContainer.empty()
        }
    }

    hideTemplate() {
        this.$template.hide()
    }

    showTemplate() {
        this.$template.show()
    }

    isiWait(callback) {
        $hide(this, this.$title)
        $hide(this, this.$buttonContainer)
        $hide(this, this.$trialContainer)

        if (!this.progress_total_time) {
            this.$progressContainer.hide()
        } else if (this.show_progress && this.show_button) {
            // When experiment is self-paced, advance the progress bar through isi
            this._totalProgressBar.progressByTime(this.isi_time)
        }

        const self = this
        setTimeout(() => {
            $show(self, self.$title)
            $show(self, self.$buttonContainer)
            $show(self, self.$trialContainer)
            $show(self, self.$progressContainer)
            callback()
        }, this.isi)
    }
}

module.exports = OperationSpan