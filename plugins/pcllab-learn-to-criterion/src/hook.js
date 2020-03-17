class Hook {
	constructor(pluginEngineInstance) {
		this.engine = pluginEngineInstance
		this._onTrialStart = () => { }
		this._onTrialEnd = () => { }
	}

	getTrialList() {
		return this.engine.trial_list
	}

	getTrialFromIndex(index) {
		if (isNaN(index) || !this.engine.trial_list[index]) {
			console.error(index, 'is not a valid index')
			return null
		}

		return this.engine.trial_list[index]
	}

	getTrialIndex() {
		return this.engine.timeline.currentIndex
	}

	setTimeline(newTimeline) {
		this.engine.pendingTrials = newTimeline
		this.engine.pendingTrials.forEach((index) => {
			console.log(index)

			if (!this.engine.trial_list[index]) {
				console.warn('Warning: trial_list does not contain item at index ' + index)
			}
		})
	}

	onTrialStart(callback) {
		this._onTrialStart = callback
	}

	onTrialEnd(callback) {
		this._onTrialStart = callback
	}
}

module.exports = Hook