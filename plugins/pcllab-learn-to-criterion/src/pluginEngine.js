const Hook = require('./hook')

/*
 * Warning: Some parts of this plugin are very janky and work because of 
 * arcane magic. Test thoroughly whenever a change is made.
 */

class PluginEngine {

	constructor(ltcInstance) {
		this.ltc = ltcInstance
		this.auto_validate = this.ltc.auto_validate
		this.trial_list = this.ltc.trial_list.slice()
		this.instructions = this.ltc.instructions
		this.timeline = []
		this.pendingTrials = []
		this.failedTrials = []
		this.roundNumber = 0
		this.condition = null
		this.hookAPI = new Hook(this)

		/* Initiatlize plugin hook */
		if (this.ltc.hook) {
			this.ltc.hook(this.hookAPI)
		}
	}

	start() {
		if (this.ltc.randomize) {
			this.trial_list = jsPsych.randomization.shuffle(this.trial_list)
		}

		// Prepend instructions trial to trial_list
		if (this.ltc.instructions) {
			const instructions_trial = { trial: this.instructions, success: () => { return true } }
			this.trial_list = [instructions_trial].concat(this.trial_list)
		}

		this.timeline = this.trial_list.map((t, index) => { return index }) // Holds indices of the trial objects
		this.timeline.currentIndex = 0

		this.condition = 'study'

		// Start learn to criterion
		this.performTrial(this.trial_list[this.timeline[this.timeline.currentIndex]].trial, this.onTrialEnd, this)
	}

	performTrial(nestedTrial, callback, self) {
		const args = arguments

		self.hookAPI._onTrialStart(nestedTrial, self.timeline.currentIndex)

		let $iframe = $('<iframe>', {
			src: 'plugins/pcllab-learn-to-criterion/template.html',
			id: 'myFrame',
			frameborder: 0,
			scrolling: 'no',
			style: "height: 100%; width: 100%; background: none",
			allowTransparency: "true"
		})

		$iframe.appendTo(self.ltc.$display_element)

		$iframe.on('load', () => {
			$iframe.contents().find('html').css({ 'padding-left': '20px', 'padding-right': '20px' })
			let iframeContent = document.getElementById('myFrame').contentWindow

			const scriptUrl = `plugins/${nestedTrial.type}/plugin.js`
			const timeline = [nestedTrial]
			// console.log('loading: ', scriptUrl);
			iframeContent.loadScripts([scriptUrl], () => {
				iframeContent.init(timeline, (trialData) => {
					clearInterval(intervalId)
					$iframe.remove()
					callback(trialData, nestedTrial, self)
				})
			})
		})

		// Change height of iframe based on content
		let lastHeight = 0, currHeight = 0
		const intervalId = setInterval(function () {
			currHeight = $iframe.contents().find('html').height()
			if (currHeight != lastHeight) {
				$iframe.css('height', (lastHeight = currHeight) + 10 + 'px')
			}
		}, 200)
	}

	/* Somehow the reference to 'this' gets lost by the time this function gets
	 * executed. Javascript is weird, so the reference to 'this' has to be
	 * passed down the callback chain as self for things to work.
	 */
	onTrialEnd(data, nestedTrial, self) {
		// Check if the cue trial was a success
		const success = self.trial_list[self.timeline.currentIndex].success(data)

		// Store the result of the trial with the trial metadata
		self.trial_list[self.timeline.currentIndex].result = success

		/* Append cue trial data to jsPsych data */
		data.forEach(dataSegment => {
			dataSegment.ltc_condition = self.condition
			dataSegment.ltc_index = self.roundNumber
			dataSegment.ltc_success = success
			dataSegment.ltc_trial_type = dataSegment.trial_type
			dataSegment.ltc_time_elapsed = dataSegment.time_elapsed
			jsPsych.data.write(dataSegment)
		})

		self.hookAPI._onTrialEnd(nestedTrial, success, self.timeline.currentIndex)


		if (!success && self.auto_validate) {
			// If auto_validate is off, then the user is constructing the next timeline instead
			self.failedTrials.push(self.timeline.currentIndex)
		}

		++self.timeline.currentIndex

		if (self.timeline.currentIndex >= self.timeline.length) {

			// Check if the user has created a new timeline, if so then run it
			if (self.pendingTrials.length) {
				self.failedTrials = JSON.parse(JSON.stringify(self.pendingTrials))
				self.pendingTrials = []
			}

			if (self.failedTrials.length === 0 || (self.max_attempts >= 0 && self.roundNumber >= self.max_attempts)) {
				// All trials were successful, earn to criterion has finished
				console.log('triggered end', self.failedTrials)
				jsPsych.finishTrial()
				return
			} else {
				// Re-do failed trials
				self.timeline = self.failedTrials.slice()

				// Prepend instructions trial index
				if (self.instructions) {
					self.timeline = [0].concat(self.timeline)
				}

				self.timeline.currentIndex = 0

				self.failedTrials = []
				++self.roundNumber
			}
		}

		if (self.roundNumber > 0) {
			self.condition = 'recall'
		}

		// Perform next trial in list
		self.isi_wait(() => {
			const nextIndex = self.timeline[self.timeline.currentIndex]
			self.performTrial(self.trial_list[nextIndex].trial, self.onTrialEnd, self)
		})
	}

	isi_wait(callback) {
		const self = this
		setTimeout(() => {
			callback()
		}, this.ltc.isi_time)
	}
}

module.exports = PluginEngine