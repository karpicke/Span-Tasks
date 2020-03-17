/**
 * Handler that disables the next button if any of the inputs
 * have less than 3 characters in them
 */

class ForcedResponseHandler {
	constructor() {
		this.$nextButton = null
	}

	register(nextButton, responseView) {
		this.view = responseView
		this.$nextButton = nextButton
		this.$nextButton.prop('disabled', true)
		this.handler = this.view.createHandler(this.$nextButton)
		this.handler.handleInputs()
	}
}

module.exports = ForcedResponseHandler