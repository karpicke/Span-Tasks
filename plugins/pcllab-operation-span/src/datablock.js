const DataHandler = require('./datahandler')
const Logger = require('./logger')

/* Util */
const setParameter = require('./util').setParameter

class DataBlock {
    constructor(stimulus, cue, target) {
        this._creationTime = Date.now()
        this.rt = undefined
        this.rt_first_keypress = undefined
        this.rt_last_keypress = undefined
        this.stimulus = stimulus
        this.cue = setParameter(cue, '', null)
        this.target = setParameter(target, '', null)
        this.response = ''
        this.acc = 0

        DataHandler.register(this)
    }

    recordResponse(response) {
        this.response = setParameter(response, '', null)
        this.keypress()
        this.rt = Date.now() - this._creationTime

        if (typeof response === "string"
            && typeof this.target === "string"
            && response.length === this.target.length) {
            this.acc = response.split('').map((c, i) => c === this.target[i]).reduce((a, b) => a + b) / this.target.length
        } else {
            this.acc = Number(this.response === this.target)
        }
    }

    keypress() {
        this.rt_last_keypress = Date.now() - this._creationTime

        if (typeof this.rt_first_keypress === typeof undefined)
            this.rt_first_keypress = Date.now() - this._creationTime
    }

    write() {
        Object.keys(this).forEach(k => {
            if (this[k] === null) {
                this[k] = undefined
            }
        })

        Logger.log("Writing data", this)
        jsPsych.data.write(this.toJSON())
    }

    toJSON() {
        let _db = this
        delete _db._creationTime
        return _db
    }
}

module.exports = DataBlock