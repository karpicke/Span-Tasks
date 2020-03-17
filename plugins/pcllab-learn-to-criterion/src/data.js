/* Util */
const compareTargetAndResponse = require('./util').compareTargetAndResponse

class Data {
	constructor() {
		this.datablocks = []
		this.birthTime = Date.now()
		this.studyRounds = -1
		this.recallRounds = -1
		this.roundIndex = -1
		this.responseTimeStart = null
		this.currentDatablock = {}
	}

	/* Study period data */
	nextStudyRound() {
		++this.studyRounds
		this.roundIndex = -1
	}

	startStudy(cue, target, condition) {
		this.currentDatablock = {}
		++this.roundIndex
		this.responseTimeStart = Date.now()

		this.currentDatablock.acc = 0
		this.currentDatablock.condition = condition
		this.currentDatablock.study_index = 1 + this.roundIndex
		this.currentDatablock.study_period = 1 + this.studyRounds

		if (cue) {
			this.currentDatablock.cue = cue
		}

		if (target) {
			this.currentDatablock.target = target
		}
	}

	endStudy() {
		this.currentDatablock.rt = Date.now() - this.responseTimeStart
		this.datablocks.push(this.currentDatablock)
	}

	/* Free recall period data */
	startFreeRecall(condition) {
		++this.recallRounds
		this.roundIndex = -1

		this.currentDatablock = {}
		++this.roundIndex
		this.responseTimeStart = Date.now()

		this.currentDatablock.condition = condition
		this.currentDatablock.test_index = 1 + this.roundIndex
		this.currentDatablock.test_period = 1 + this.recallRounds
	}

	recordFreeRecallResponse(response) {
		this.currentDatablock = {
			condition: this.currentDatablock.condition,
			test_index: this.currentDatablock.test_index,
			test_period: this.currentDatablock.test_period,
			response: response,
			rt: Date.now() - this.responseTimeStart
		}

		this.datablocks.push(this.currentDatablock)
		this.responseTimeStart = Date.now()
	}

	/* Word Pair recall period data */
	nextWPRecallRound() {
		++this.recallRounds
		this.roundIndex = -1
	}

	startWPRecall(pair, condition) {
		++this.roundIndex
		this.responseTimeStart = Date.now()

		this.currentDatablock = {}
		this.currentDatablock.condition = condition
		this.currentDatablock.test_index = 1 + this.roundIndex
		this.currentDatablock.test_period = 1 + this.recallRounds
		this.currentDatablock.cue = pair.cue
		this.currentDatablock.target = pair.target
	}

	recordWPResponse(response) {
		this.currentDatablock.response = response
		this.currentDatablock.rt = Date.now() - this.responseTimeStart
		this.currentDatablock.acc = compareTargetAndResponse(this.currentDatablock.target, response)
		this.datablocks.push(this.currentDatablock)
	}

	registerKeypress() {
		if (!this.currentDatablock)
			return

		if (!this.currentDatablock.rt_first_keypress) {
			this.currentDatablock.rt_first_keypress = Date.now() - this.responseTimeStart
		}
		this.currentDatablock.rt_last_keypress = Date.now() - this.responseTimeStart
	}

	/* Instructions data */
	startInstructions(condition) {
		this.currentDatablock = {}
		this.responseTimeStart = Date.now()

		this.currentDatablock.condition = condition + '_instructions'
	}

	endInstructions() {
		this.currentDatablock.rt = Date.now() - this.responseTimeStart
		this.datablocks.push(this.currentDatablock)
	}

	finishTrial() {
		this.datablocks.slice(0, -1).forEach((datablock) => {
			jsPsych.data.write(datablock)
		})
		jsPsych.finishTrial(this.datablocks.slice(-1)[0])
	}
}

module.exports = Data