const ButtonResponseContainer = require('../views/response/responseContainer').ButtonResponseContainer

class ButtonHandler {
    constructor(nextButton, responseButtons) {
        this.$nextButton = nextButton
        this.responseButtons = responseButtons.filter(rb => rb instanceof ButtonResponseContainer)
    }

    handleInputs() {
        $('#button_container').hide()
        this.responseButtons.forEach(responseButton => {
            const $responseButton = responseButton.get$()
            $responseButton.click(() => {
                responseButton.select()
                this.$nextButton.click()
            })
        })
    }
}

module.exports = ButtonHandler