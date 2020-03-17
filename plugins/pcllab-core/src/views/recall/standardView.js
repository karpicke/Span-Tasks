const RESPONSE_TYPE = require('../../constants').RESPONSE_TYPE

/* Util */
const setParameter = require('../../util').setParameter
const $disableSelect = require('../../util').$disableSelect

class RecallStandardView {
	constructor(stimulus) {
		this.response_type = setParameter(stimulus.response_type, RESPONSE_TYPE.input, 'string')

		this.text = setParameter(stimulus.text, '', 'string')
		this.text_panel_title = setParameter(stimulus.text_panel_title, null, 'string')
		this.show_text = setParameter(stimulus.show_text, true, 'boolean')

		this.image = setParameter(stimulus.image, '', 'string')
		this.image_panel_title = setParameter(stimulus.image_panel_title, null, 'string')
		this.show_image = setParameter(stimulus.show_image, true, 'boolean')

		this.cue = setParameter(stimulus.cue, '', 'string')
		this.cue_panel_title = setParameter(stimulus.cue_panel_title, null, 'string')
		this.show_cue = setParameter(stimulus.show_cue, true, 'boolean')

		this.target = setParameter(stimulus.target, '', 'string')
		this.target_panel_title = setParameter(stimulus.target_panel_title, null, 'string')
		this.show_target = setParameter(stimulus.show_target, false, 'boolean')

		this.cue_list = setParameter(stimulus.cue_list, [], null)
		this.cue_list_panel_title = setParameter(stimulus.cue_list_panel_title, null, 'string')
		this.show_cue_list = setParameter(stimulus.show_cue_list, true, 'boolean')

		this.audio_file = setParameter(stimulus.audio_file, null, null)
		this.show_audio = setParameter(stimulus.show_audio, true, 'boolean')
	}

	appendTo($element) {
		if (this.text && this.show_text) {
			this.renderText($element)
		}

		if (this.image && this.show_image) {
			this.renderImage($element)
		}

		if (this.cue && this.show_cue) {
			this.renderCue($element)
		}

		if (this.cue_list && this.show_cue_list) {
			this.renderCueList($element)
		}

		if (this.audio_file && this.show_audio) {
			this.renderAudio($element)
		}
	}

	renderText($element) {
		if (this.text_panel_title) {
			this.renderTextPanel($element)
			return
		}

		const $text = this._make$(`
			<div class="row mb-2">
				<div class="col">
					${this.text}
				</div>
			</div>
		`)
		$element.append($text)
	}

	renderTextPanel($element) {
		let $panel = this._make$(`
			<div class="row card z-depth-1-indigo mb-3">
				<div class="card-header indigo">
					<h5 class="white-text text-uppercase" style="font-weight: 500">${this.text_panel_title}</h5>
				</div>
			</div>
		`)

		let $panelBody = $(`
			<div class="card-body p-3"></div>
		`)
		$panelBody.appendTo($panel)
		$panelBody.append(this._make$(`
			<div class="row">
				<div class="col text-left">
					${this.text}
				</div>
			</div>
		`))
		$element.append($panel)
	}

	renderImage($element) {
		if (this.image_panel_title) {
			this.renderImagePanel($element)
			return
		}

		$element.append(this._make$(`
			<div class="row text-center mb-2">
				<div class="col text-center">
					<img src="${this.image}" style="max-width:100%">
				</div>
			</div>
		`))
	}

	renderImagePanel($element) {
		let $panel = $(this._make$(`
		<div class="row card z-depth-1-indigo mb-3">
			<div class="card-header indigo">
				<h5 class="white-text text-uppercase" style="font-weight: 500">${this.image_panel_title}</h5>
			</div>
		</div>
		`))
		let $panelBody = $(`
			<div class="card-body p-3"></div>
		`)
		$panelBody.appendTo($panel)
		$panelBody.append(this._make$(`
			<div class="row text-center mb-2">
				<div class="col text-center">
					<img src="${this.image}" style="max-width:100%">
				</div>
			</div>
		`))
		$element.append($panel)
	}

	renderCue($element) {
		if (this.cue_panel_title) {
			this.renderCuePanel($element)
			return
		}

		let cueStyle = ''
		let targetStyle = ''

		if (this.response_type === RESPONSE_TYPE.study_items) {
			// cueStyle += 'font-size: 35px;'
			cueStyle += 'font-weight: 500;'

			targetStyle += 'margin-top: 2em;'
		}

		const $cue = this._make$(`
			<div class="row">
				<div class="col text-center">
					<h3 class="text-center" style="${cueStyle}">${this.cue}</h3>
				</div>
			</div>
		`)
		$element.append($cue)

		if (this.response_type === RESPONSE_TYPE.study_items) {
			$element.append(this._make$(`
				<div class="row">
					<div class="col text-center">
						<h3 class="text-center" style="${targetStyle}">${this.target}</h3>
					</div>
				</div>
			`))
		}
	}

	renderCuePanel($element) {
		let $panel = this._make$(`
			<div class="row card z-depth-1-indigo mb-3">
				<div class="card-header indigo">
					<h5 class="white-text text-uppercase" style="font-weight: 500">${this.cue_panel_title}</h5>
				</div>
			</div>
		`)
		let $panelBody = $(`
			<div class="card-body p-3"></div>
		`)
		$panelBody.appendTo($panel)


		let cueStyle = ''
		let targetStyle = ''

		if (this.response_type === RESPONSE_TYPE.study_items) {
			cueStyle += 'font-weight: 500;'
		}

		$panelBody.append(this._make$(`
			<div class="row">
				<div class="col text-left">
					<p tyle="${cueStyle}">${this.cue}</p>
				</div>
			</div>
		`))
		$element.append($panel)

		if (this.response_type === RESPONSE_TYPE.study_items) {
			$panel = this._make$(`
				<div class="row card z-depth-1-indigo mb-3">
					<div class="card-header indigo">
						<h5 class="white-text text-uppercase" style="font-weight: 500">${this.target_panel_title}</h5>
					</div>
				</div>
			`)
			let $panelBody = $(`
				<div class="card-body p-3"></div>
			`)
			$panelBody.appendTo($panel)

			$panelBody.append(this._make$(`
				<div class="row">
					<div class="col text-left">
						<p style="${targetStyle}">${this.target}</p>
					</div>
				</div>
			`))
			$element.append($panel)
		}
	}

	renderCueList($element) {
		if (this.cue_list_panel_title) {
			this.renderCueListPanel($element)
			return
		}

		this.cue_list.forEach((cue) => {
			$element.append(this._make$(`
				<div class="row">
					<div class="col text-center">
						<h3 class="text-center">${cue}</h3>
					</div>
				</div>
			`))
		})
	}

	renderCueListPanel($element) {
		let $panel = $(this._make$(`
			<div class="row card z-depth-1-indigo mb-3">
				<div class="card-header indigo">
					<h5 class="white-text text-uppercase" style="font-weight: 500">${this.cue_list_panel_title}</h5>
				</div>
			</div>
		`))
		let $panelBody = $(`
			<div class="card-body p-3"></div>
		`)
		$panelBody.appendTo($panel)
		this.cue_list.forEach((cue, index) => {
			// Render n-1 dividers
			let hr = index == this.cue_list.length - 1 ? '' : '<hr>'

			$panelBody.append(this._make$(`
				<div class="row">
					<div class="col text-center">
						<h3 class="text-center">${cue}</h3>
						${hr}
					</div>
				</div>
			`))
		})
		$element.append($panel)
	}

	renderAudio($element) {
		// const $iFrame = $(`<iframe src="${this.audio_file}" allow="autoplay" style="display:none" id="audio_element"></iframe>`)
		const $iFrame = $(`<iframe allow="autoplay" style="display:none" ></iframe>`)
		const $iFrameAudio = $(`
			<audio autoplay id="audio_element">
				<source src="${this.audio_file}" type="audio/mpeg">
			</audio>
		`)
		$iFrame.html($iFrameAudio)
		$element.append($iFrame)

		const $audio = $("<audio></audio>").attr({
			'src': this.audio_file,
			'autoplay': 'autoplay',
			'id': 'audio_element'
		})
		$element.append($audio)

		const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
		if (!isChrome) {
			$iFrame.remove()
		} else {
			$audio.remove()
		}
	}

	_make$(content) {
		const $el = $(content)
		$disableSelect($el)
		return $el
	}
}

module.exports = RecallStandardView
