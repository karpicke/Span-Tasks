const Scorer = require('./scoring')
const uuid4 = require('uuid4')

// Util
const setParameter = require('./util').setParameter

class Data {
    constructor(coreInstance) {
        this.coreInstance = coreInstance
        this.scoringStrategy = this.coreInstance.scoringStrategy
        this.scoringParams = this.coreInstance.scoringParams
        this.scorer = null
        this.dataBlocks = []
        this.response_index = 0
        this.currentDataBlock = {}
        this.startTime = -1

		/**
		 * When resolving a promise, an item is added to the stack.
		 * When resolved, an item is removed. If the stack is empty, there are
		 * no pending promises.
		 */
        this._promiseStack = []

		/**
		 * If the trial is done, mark this as true. It will be checked
		 * when a promise is resolved. If it is true and there is an unresolved
		 * promise, then finishTrial will be called from the promise.
		 */
        this._finishReady = false

        if (this.scoringStrategy) {
            this.scorer = new Scorer(this.scoringStrategy, this.scoringParams)
        }
    }

    startRecall({ cue = '', target = '', cue_list = [], target_list = [], type = "", metadata = {} }) {
        ++this.response_index
        this.startTime = Date.now()
        this.currentDataBlock = new DataBlock()
        this.currentDataBlock.cue = setParameter(cue, '', null)
        this.currentDataBlock.target = setParameter(target, '', null)
        this.currentDataBlock.type = setParameter(type, '', null)
        this.currentDataBlock.response_index = setParameter(this.response_index, '', null)
        this.currentDataBlock._data = setParameter(metadata, {}, null)

        if (cue_list.length) {
            this.currentDataBlock.cue_list = setParameter(cue_list, '', null)
        }

        if (target_list.length) {
            this.currentDataBlock.target_list = setParameter(target_list, '', null)
        }
    }

    endRecall() {
        // Score the data block
        if (this.scorer) {
            let targets = Boolean(this.currentDataBlock.target_list) ? this.currentDataBlock.target_list : this.currentDataBlock.target
            const responseIndex = this.response_index
            const currentDataBlock = this.currentDataBlock

            this._promiseStack.push(1)
            this.scorer
                .score(currentDataBlock.response, targets)
                .then(score => {
                    this._promiseStack.pop()
                    currentDataBlock.score = score
                    let prev_score = 0
                    if (responseIndex > 0) {
                        prev_score = this.dataBlocks[responseIndex - 1].cumulative_score
                    }

                    if (Array.isArray(currentDataBlock.score)) {
                        currentDataBlock.total_score = currentDataBlock.score.reduce((a, b) => a + b, 0)
                        currentDataBlock.cumulative_score = prev_score + currentDataBlock.total_score
                    } else {
                        currentDataBlock.cumulative_score = prev_score + currentDataBlock.score
                    }

                    // Promise has been resolved after the trial is done
                    if (this._finishReady) {
                        this.finishTrial()
                    }
                })
        }

        if (this.currentDataBlock.response.length === 0) {
            this.currentDataBlock.response = ''
        }

        if (this.currentDataBlock.response.length === 1) {
            this.currentDataBlock.response = setParameter(this.currentDataBlock.response[0], null, null)
        }

        if (this.coreInstance.show_button) {
            this.currentDataBlock.rt = Date.now() - this.startTime
        }

        // Record metadata
        const metadata = this.currentDataBlock._data
        delete this.currentDataBlock._data
        Object.assign(this.currentDataBlock, metadata)

        this.dataBlocks.push(this.currentDataBlock)
    }

    registerKeyPress() {
        if (this.currentDataBlock.rt_first_keypress === -1) {
            this.currentDataBlock.rt_first_keypress = Date.now() - this.startTime
        }

        this.currentDataBlock.rt_last_keypress = Date.now() - this.startTime
        this.currentDataBlock.rt = Date.now() - this.startTime
    }

    registerButtonPress() {
        this.currentDataBlock.rt = Date.now() - this.startTime
    }

    recordResponse(response) {
        this.currentDataBlock.response.push(response)
    }

    recordHoneypotResponse(response) {
        this.currentDataBlock.honeypot_response.push(response)
    }

    finishTrial() {
        this._finishReady = true

        if (this._promiseStack.length !== 0) {
            // Finish the trial after the unresolved promise is done
            return
        }

        const _db = this.dataBlocks.slice()
        const lastBlock = _db.pop()

        _db.forEach((dataBlock) => jsPsych.data.write(this._cleanDataBlock(dataBlock)))

        jsPsych.finishTrial(this._cleanDataBlock(lastBlock))
    }

    getDataBlocks() {
        return this.dataBlocks.slice()
    }

    _cleanDataBlock(block) {
        // We don't want jsPsych saving empty strings
        block.clean()
        block.setBlankResponseTimesToNull()

        return block
    }
}

class DataBlock {
    constructor() {
        this._id = uuid4()
        this.cue = ''
        this.cue_list = ''
        this.target = ''
        this.target_list = ''
        this.response = []
        this.response_index = 0
        this.rt = -1
        this.rt_first_keypress = -1
        this.rt_last_keypress = -1
        this.type = ''
        this.cumulative_score = ''
        this.total_score = ''
        this._data = {}
    }

    clean() {
        for (let key in this) {
            const value = this[key]
            if (typeof value === 'string' && value.length === 0) {
                delete this[key]
            }
        }

        delete this._id
    }

    setBlankResponseTimesToNull() {
        for (let key in this) {
            if ((this[key] === -1) && (key === "rt" || key === "rt_first_keypress" || key === "rt_last_keypress")) {
                delete this[key]
            }
        }
    }
}

module.exports = Data