require('../misc/slider')
const Data = require('../../data')

// Util
const UUID4 = require('uuid4')
const setParameter = require('../../util').setParameter
const setInterval = require('../../util').setInterval
const setTimeout = require('../../util').setTimeout

// Constants
const RESPONSE_ALIGNMENT = require('../../constants').RESPONSE_ALIGNMENT
const INPUT_SIZE = require('../../constants').INPUT_SIZE
const getButtonColorClass = require('../../constants').getButtonColorClass

/* Response container interface */
class ResponseContainer {
	constructor() {
		this._id = UUID4()
	}

	get$() { }
	focus() { }
	saveResponse() { }
	remove() { }
}

class InputResponseContainer extends ResponseContainer {
	constructor(generatorInstance, containerSize, textAlignment, stimulus, dataInstance) {
		super()

		this.generator = generatorInstance
		this.data = dataInstance
		this.stimulus = stimulus
		this.mouseOver = false

		if (!this.data) {
			throw new Error("No data instance specified")
		}

		this.form = $('<div>', {
			class: 'md-form core-input-form md-outline w-75',
			style: 'display: block; margin-left: auto; margin-right: auto;'
		})

		this.panel = $()

		let alignment = 'text-center'
		switch (textAlignment) {
			case RESPONSE_ALIGNMENT.center: alignment = 'text-center'; break;
			case RESPONSE_ALIGNMENT.left: alignment = 'text-left'; break;
			case RESPONSE_ALIGNMENT.right: alignment = 'text-right'; break;
		}

		switch (containerSize) {
			case INPUT_SIZE.small: {
				this.textarea = $('<input>', {
					class: `core-input-sm form-control pb-2 ${alignment}`,
					type: 'text',
					id: this._id
				})
				break
			}
			case INPUT_SIZE.medium: {
				this.textarea = $('<textarea>', {
					class: `md-textarea core-input-md form-control pb-2 ${alignment}`,
					id: this._id
				})
				break
			}
			case INPUT_SIZE.large: {
				this.textarea = $('<textarea>', {
					class: `md-textarea core-input-lg form-control pb-2 ${alignment}`,
					style: 'height: 130px',
					id: this._id
				})
				break
			}
			case INPUT_SIZE.xlarge: {
				this.textarea = $('<textarea>', {
					class: `md-textarea core-input-xl form-control pb-2 ${alignment}`,
					style: 'min-height: 500px; height: 55vh',
					id: this._id
				})
				// Make it extra thicc
				this.form.removeClass('w-75')
				this.form.addClass('w-100')
				break
			}
			default: {
				this.textarea = $('<textarea>', {
					class: `pcllab-cued-recall-xlarge-input core-input form-control pb-2 ${alignment}`,
					style: 'height: 200px',
					id: this._id
				})
			}
		}
		this.label = $('<label>', { text: 'Type your response', for: this._id })

		if (this.stimulus.response_panel_title) {
			this._makePanel()
		}

		this.textarea.keypress(this.onKeyPress())
		this.textarea.mouseenter(this.onMouseEnter())
		this.textarea.mouseleave(this.onMouseLeave())
		this.textarea.bind('copy paste cut', (e) => e.preventDefault())

		this.form.append(this.textarea)
		// this.form.append(this.label)
	}

	get$() {
		if (this.stimulus.response_panel_title) {
			if (this.generator.numResponseContainers == 1) {
				return this.generator.sharedResponsePanel
			} else {
				return $()
			}
		}
		else {
			return this.form
		}
	}

	remove() {
		if (this.stimulus.response_panel_title && this.generator.numResponseContainers == 1) {
			this.generator.sharedResponsePanel.remove()
		}
		else {
			this.form.remove()
		}
	}

	focus() {
		setTimeout(() => {
			this.form.find('textarea, input').focus();
		}, 0)
	}

	saveResponse() {
		this.data.recordResponse(this.textarea.val())
	}

	onKeyPress() {
		const self = this
		return ($event) => {
			self.data.registerKeyPress()
		}
	}

	onMouseEnter() {
		const self = this
		return () => {
			self.mouseOver = true
		}
	}

	onMouseLeave() {
		const self = this
		return () => {
			self.mouseOver = false
		}
	}

	onDragEnd() {
		const self = this
		return (el) => {
			setTimeout(() => {
				if (self.mouseOver) {
					self.textarea.val($(el).text().trim())
					self.data.registerKeyPress()
				}
			}, 50)
		}
	}

	_makePanel() {
		this.form = $('<div>', {
			class: 'md-form md-outline w-100',
			style: 'display: block; margin-left: auto; margin-right: auto;'
		})

		if (this.generator.numResponseContainers == 0) {
			this.generator.sharedResponsePanel = $(`
				<div class="row card rounded z-depth-1-indigo mb-3">
					<div class="card-header indigo">
						<h5 class="white-text text-uppercase text-left" style="font-weight: 500">${this.stimulus.response_panel_title}</h5>
					</div>
				</div>
			`)

			this.generator.sharedResponsePanelBody = $(`
				<div class="card-body p-3"></div>
			`)
			this.generator.sharedResponsePanelBody.appendTo(this.generator.sharedResponsePanel)
		}
		this.generator.sharedResponsePanelBody.append(this.form)
	}
}

module.exports.InputResponseContainer = InputResponseContainer

class SliderResponseContainer extends ResponseContainer {
	constructor(generatorInstance, stimulus, dataInstance) {
		super()

		this.generator = setParameter(generatorInstance, null, null)
		this.data = setParameter(dataInstance, null, null)
		this.stimulus = setParameter(stimulus, null, null)

		this.min = setParameter(this.stimulus.slider_min, 0, 'number')
		this.max = setParameter(this.stimulus.slider_max, 100, 'number')
		this.labelLeft = setParameter(this.stimulus.slider_label_left, '', 'string')
		this.labelRight = setParameter(this.stimulus.slider_label_right, '', 'string')

		this.$sliderContainer = $(`
			<div class="d-flex justify-content-center my-4">
				<span class="mr-2 mt-1">${this.labelLeft}</span>
					<form class="range-field w-75">
						<input class="border-0" type="range" min="${this.min}" max="${this.max}" />
					</form>
				<span class="ml-2 mt-1">${this.labelRight}</span>
			</div>
		`)
		this.$slider = this.$sliderContainer.find('input')
		this.$slider.rangeSlider()

		if (!this.data) {
			throw new Error("No data instance specified")
		}
	}

	get$() {
		return this.$sliderContainer
	}

	remove() {
		this.$sliderContainer.remove()
	}
	focus() { }
	saveResponse() { }
}

module.exports.SliderResponseContainer = SliderResponseContainer

class RadioResponseContainer extends ResponseContainer {
	constructor(generatorInstance, stimulus, dataInstance) {
		super()

		this.generator = setParameter(generatorInstance, null, null)
		this.data = setParameter(dataInstance, null, null)
		this.stimulus = setParameter(stimulus, null, null)
		this.responseList = setParameter(stimulus.response_list, [], null)

		this._formWidth = -1
		this._selected = null

		if (!this.data) {
			throw new Error("No data instance specified")
		}

		this._makePanel()

		if (this.stimulus.radio_title) {
			this.generator.sharedResponsePanelBody.append(`
				<h5 class="text-center mt-2">${this.stimulus.radio_title}</h5>
			`)
		}

		this.form = $('<div>', { style: 'margin: 0 auto; text-align: left' })
		this.form.css("visibility", "hidden")
		this.form.appendTo(this.generator.sharedResponsePanelBody)
		this.responseList.forEach(label => {
			const _id = UUID4()
			const $radio = $(`
				<div class="md-radio">
					<input type="radio" id="${_id}" name="materialExampleRadios" value="${label}">
					<label style="display: inline-block; margin: 0 1%; font-size: 1rem; text-align: left; padding: 0 15px 0 28px" for="${_id}">${label}</label>
				</div>
			`)
			this.form.append($radio)

			// Listen for value changes
			$radio.find('input').change((event) => {
				this.data.registerKeyPress()
				this._selected = event.currentTarget.value
			})
		})

		// Update the size of the container based on max label width
		setTimeout(() => {
			this.form.find('.md-radio').each((_, radio) => {
				const $radio = $(radio)
				this._formWidth = Math.max($radio.find('label').outerWidth(), this._formWidth)
			})
			this.form.css({
				'width': this._formWidth * 1.1 + 'px',
				'visibility': 'visible'
			})
		}, 10)


	}

	get$() {
		if (this.generator.numResponseContainers == 1) {
			return this.generator.sharedResponsePanel
		} else {
			return $()
		}
	}

	remove() {
		if (this.generator.numResponseContainers == 1) {
			this.generator.sharedResponsePanel.remove()
		}
	}

	focus() { }

	saveResponse() {
		this.data.recordResponse(this._selected)
	}

	_makePanel() {
		if (this.generator.numResponseContainers === 0) {
			if (this.stimulus.response_panel_title) {
				this.generator.sharedResponsePanel = $(`
					<div class="row card rounded z-depth-1-indigo mb-3">
						<div class="card-header indigo">
							<h5 class="white-text text-uppercase text-left" style="font-weight: 500">${this.stimulus.response_panel_title}</h5>
						</div>
					</div>
				`)

				this.generator.sharedResponsePanelBody = $(`
					<div class="card-body p-3"></div>
				`)
				this.generator.sharedResponsePanelBody.appendTo(this.generator.sharedResponsePanel)
			} else {
				this.generator.sharedResponsePanel = $('<div>', { class: 'row' })
				this.generator.sharedResponsePanelBody = $('<div>', { class: 'col' })
				this.generator.sharedResponsePanel.append(this.generator.sharedResponsePanelBody)
			}
		}
	}
}

module.exports.RadioResponseContainer = RadioResponseContainer

class ButtonResponseContainer extends ResponseContainer {
	constructor(generatorInstance, buttonLabel, stimulus, dataInstance) {
		super()

		this.generator = setParameter(generatorInstance, null, null)
		this.data = setParameter(dataInstance, null, null)
		this.stimulus = setParameter(stimulus, null, null)
		this.buttonLabel = buttonLabel

		if (!this.data) {
			throw new Error("No data instance specified")
		}

		this._selected = false

		this.$button = $('<button>', {
			class: `btn btn-large ${getButtonColorClass()}`,
			text: this.buttonLabel
		})
	}

	get$() {
		return this.$button
	}

	remove() {
		this.$button.remove()
	}

	focus() {
		setTimeout(() => {
			this.$button.focus();
		}, 0)
	}

	select() {
		this._selected = true
		this.data.registerKeyPress()
	}

	saveResponse() {
		if (this._selected) {
			this.data.recordResponse(this.buttonLabel)
		}
	}
}

module.exports.ButtonResponseContainer = ButtonResponseContainer

class FreeRecallResponseContainer extends ResponseContainer {
	constructor(generatorInstance, stimulus, dataInstance) {
		super()

		this.generator = setParameter(generatorInstance, null, null)
		this.data = setParameter(dataInstance, null, null)
		this.stimulus = setParameter(stimulus, null, null)
		this.textAlignment = setParameter(this.generator.text_align | this.stimulus.text_align,
			RESPONSE_ALIGNMENT.center, 'string')

		let alignment = 'text-center'
		switch (this.textAlignment) {
			case RESPONSE_ALIGNMENT.center: alignment = 'text-center'; break;
			case RESPONSE_ALIGNMENT.left: alignment = 'text-left'; break;
			case RESPONSE_ALIGNMENT.right: alignment = 'text-right'; break;
		}

		this.$listBody = $()
		this.$inputBody = $()

		this.responseList = []

		this.$label = $('<label>', { text: 'Type your response', for: this._id })
		this.$input = $('<input>', {
			class: `form-control pb-2 ${alignment}`,
			type: 'text',
			id: this._id
		})
		this.$input.keypress(this._keyPress())

		if (!this.data) {
			throw new Error("No data instance specified")
		}

		this._makePanel()
	}

	get$() {
		if (this.generator.numResponseContainers == 1) {
			return this.generator.sharedResponsePanel
		} else {
			return $()
		}
	}

	remove() {
		if (this.generator.numResponseContainers == 1) {
			this.generator.sharedResponsePanel.remove()
		}
	}

	focus() {
		setTimeout(() => {
			this.$input.focus()
		}, 0)
	}

	select() {
		this.data.registerKeyPress()
	}

	saveResponse() {
		const self = this
		this.generator
			.sharedResponsePanelBody
			.find('.text-col')
			.each(function () {
				self.data.recordResponse($(this).text())
			})
	}

	_makePanel() {
		if (this.generator.numResponseContainers === 0) {
			this.generator.sharedResponsePanel = $('<div>', {
				class: 'row'
			})
			this.generator.sharedResponsePanelBody = $('<div>', {
				class: 'col md-form md-outline'
			})

			this.generator.sharedResponsePanelBody.appendTo(this.generator.sharedResponsePanel)

			// Response list
			const $listRow = $('<div>', {
				class: 'row'
			})
			this.generator.sharedResponsePanelBody.append($listRow)

			this.$listBody = $('<div>', {
				class: 'col rounded p-3',
				style: 'border: 1px solid #BDBDBD; min-height: 270px'
			})
			$listRow.append(this.$listBody)

			// this.generator.sharedResponsePanelBody.append($('<hr>'))

			const $inputRow = $('<div>', {
				class: 'row mt-4'
			})
			const $inputCol = $('<div>', {
				class: 'col p-0'
			})
			$inputRow.append($inputCol)
			$inputCol.append(this.$input)
			// $inputCol.append(this.$label)
			this.generator.sharedResponsePanelBody.append($inputRow)
		}
	}

	_keyPress() {
		const self = this
		return function (event) {
			const $input = $(this)
			const keycode = event.which

			if (keycode === 13) {
				const text = $input.val().trim()
				$input.val('')
				if (text) {
					self._addListItem(text)
				}
			}

			self.select()
		}
	}

	_addListItem(text) {
		const $row = $('<div>', {
			class: 'row pt-1 pb-1'
		})

		const $fillerCol = $('<div>', {
			class: 'col text-center'
		})
		$fillerCol.appendTo($row)

		const $textCol = $('<div>', {
			class: 'col-10 text-center text-col',
			text: text
		})
		$textCol.appendTo($row)

		const $deleteCol = $('<div>', {
			class: 'col text-center d-flex'
		})
		$deleteCol.appendTo($row)
		const $deleteButton = $(`
			<button class="btn btn-white p-1 pl-2 pr-2 m-0 my-auto" style="border-radius: 99em; box-shadow: none;">
				<span style="color: #f44336; font-weight: bold">✕</span>
			</button>
		`)
		$deleteButton.appendTo($deleteCol)

		$deleteButton.click(() => {
			$row.remove()
			self.select()
		})

		this.$listBody.append($row)
	}
}

module.exports.FreeRecallResponseContainer = FreeRecallResponseContainer

class HoneypotResponseContainer extends InputResponseContainer {
	constructor(generatorInstance, containerSize, textAlignment, stimulus, dataInstance) {
		super(generatorInstance, containerSize, textAlignment, stimulus, dataInstance)
		this.form.css('display', 'none')
		this.label.remove()
	}
	get$() {
		const name_attrs = [
			'age_input', 'name_input', 'breakfast_input',
			'gender_input', 'language_input', 'email_input'
		]
		this.textarea.attr('name', name_attrs[Math.floor(Math.random() * name_attrs.length)])
		this.textarea.attr('tabindex', 1)
		this.textarea.attr('autocomplete', 'off')
		this.textarea.addClass('pcllab-hp-input')
		return this.form
	}

	saveResponse() {
		if (this.textarea.val()) {
			this.data.recordHoneypotResponse(this.textarea.val())
		}
	}

	onKeyPress() {
		return () => { }
	}
}

module.exports.HoneypotResponseContainer = HoneypotResponseContainer
