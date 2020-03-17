const getButtonColorClass = require('./constants').getButtonColorClass
class NextButton {
	constructor(text) {
		const buttonText = text || 'Next'

		return $('<button>', {
			class: `btn ${getButtonColorClass()} waves-effect waves-light`,
			text: buttonText
		})
	}
}

module.exports.NextButton = NextButton

class IDKButton {
	constructor(dataInstance) {
		this._data = dataInstance

		const $button = $('<button>', {
			class: 'btn btn-secondary waves-effect waves-light',
			text: "I don't know"
		})
		$button.click(() => this._populateInput())

		return $button
	}

	_populateInput() {
		const $inputs = $('input[type=text], textarea')
		$inputs.each(function () {
			const $input = $(this)
			if (!$input.val() && !$input.hasClass('pcllab-hp-input')) {
				$input.val("I don't know")
				$input.trigger(jQuery.Event('keyup'))
				$input.trigger(jQuery.Event('keydown'))
				$input.trigger(jQuery.Event('keypress'))
			}
		})
		this._data.registerButtonPress()
	}
}

module.exports.IDKButton = IDKButton

class RepeatButton {
	constructor(dataInstance) {
		this._data = dataInstance

		return $('<button>', {
			class: `btn ${getButtonColorClass()} waves-effect waves-light`,
			text: 'Repeat',
			id: 'repeat_button',
			click: this.onClick()
		})
	}

	onClick() {
		return () => {
			const audio = $('#audio_element')[0]
			audio.currentTime = 0
			audio.play()
			this._data.registerKeyPress()
		}
	}
}

module.exports.RepeatButton = RepeatButton