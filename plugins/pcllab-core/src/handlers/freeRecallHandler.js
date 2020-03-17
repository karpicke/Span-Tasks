const setInterval = require('../util').setInterval
const setTimeout = require('../util').setTimeout

class FreeRecallHandler {
    constructor(nextButton, responseContainer) {
        this.$nextButton = nextButton
        this.responseContainer = responseContainer
    }

    checkInputs() {
        if (!this.$nextButton) return

        let isValid = true
        isValid = this.responseContainer
            .generator
            .sharedResponsePanelBody
            .find('.text-col').length > 0

        if (isValid) {
            this.$nextButton.prop('disabled', false)
        } else {
            this.$nextButton.prop('disabled', true)
        }
    }

    handleInputs() {
        this.responseContainer.generator.sharedResponsePanelBody.click(() => {
            this.checkInputs()
        })
        this.responseContainer.$input.keydown((event) => {
            if (event.which === 13)
                setTimeout(() => this.checkInputs(), 10)
        })
    }
}

module.exports = FreeRecallHandler