/* Blueprint */
const OperationSpan = require('./ospan')

class TrialFeedback extends OperationSpan {
    show(data, callback) {
        this.buildTemplate()
        this.isiWait(() => {
            this._show(data, callback)
        })
    }

    _show(data, callback) {
        this.$title.remove()

        const totalMath = data.totalMath
        const correctMath = data.correctMath
        const listLengthLetters = data.listLengthLetters
        const listLengthMath = data.listLengthMath
        const correctListLengthLetters = data.correctListLengthLetters
        const correctListLengthMath = data.correctListLengthMath

        let feedbackText = null
        if (listLengthLetters && listLengthMath) {
            feedbackText = `You got ${correctListLengthLetters}/${listLengthLetters} letters correct and ${correctListLengthMath}/${listLengthMath} math problems correct.`
        } else if (listLengthLetters) {
            feedbackText = `You got ${correctListLengthLetters}/${listLengthLetters} letters correct.`
        } else if (listLengthMath) {
            feedbackText = `You got ${correctListLengthMath}/${listLengthMath} math problems correct.`
        }

        // Feedback message
        this.$trialContainer.append(`
            <div class="row mt-5">
                <div class="col">
                    <h3 class="text-center">${feedbackText}</h3>
                </div>
            </div>
        `)

        if (totalMath) {
            const accuracy = Math.round((correctMath / totalMath) * 100)
            const textColor = accuracy >= 85 ? "green-text" : "red-text"
            this.$trialContainer.append(`
                <div class="row mt-5">
                    <div class="col">
                        <h3 class="text-center ${textColor}">Overall math accuracy: ${accuracy}%</h3>
                    </div>
                </div>
            `)
        }

        const $button = $('<button>', {
            class: 'btn btn-large btn-primary waves-effect waves-light mt-4',
            text: this.buttonText
        })
        $button.click(() => {
            this.$displayElement.empty()
            this.isiWait(() => callback())
        })
        $button.appendTo(this.$buttonContainer)
    }
}

module.exports = TrialFeedback