class RadioHandler {
    constructor(nextButton) {
        this.$nextButton = nextButton
    }

    checkInputs() {
        if (!this.$nextButton) return

        let isValid = false
        $('input[type=radio]:not(.pcllab-hp-input), textarea:not(.pcllab-hp-input)').each(function () {
            const $input = $(this)
            if ($input.is(':checked')) {
                isValid = true
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
        $('input[type=radio]').off('click.forcedResponse')

        const self = this
        $('input[type=radio]').each(function () {
            const $input = $(this)
            $input.on('click.forcedResponse', () => {
                self.checkInputs()
            })
        })
    }
}

module.exports = RadioHandler