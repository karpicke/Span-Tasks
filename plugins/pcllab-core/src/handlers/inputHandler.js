class InputHandler {
    constructor(nextButton) {
        this.$nextButton = nextButton
    }

    checkInputs() {
        if (!this.$nextButton) return

        let isValid = true
        $('input[type=text]:not(.pcllab-hp-input), textarea:not(.pcllab-hp-input)').each(function () {
            const $input = $(this)
            if ($input.val().length < 3) {
                isValid = false
            }
        })

        if (isValid) {
            this.$nextButton.prop('disabled', false)
        } else {
            this.$nextButton.prop('disabled', true)
        }
    }

    handleInputs() {
        // Reset event listeners
        $('input[type=text], textarea').off('keyup.forcedResponse')

        const self = this
        $('input[type=text], textarea').each(function () {
            const $input = $(this)
            $input.on('keyup.forcedResponse', () => {
                self.checkInputs()
            })
        })
    }
}

module.exports = InputHandler