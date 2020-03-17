(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports.MODES = {
    letter: 'letter',
    math: 'math'
}

module.exports.MATH_LABEL = 'When you have solved the math problem, click next to continue'

module.exports.LETTERS_LABEL = 'Select the letters in the order presented. Use the blank button to fill in forgotten letters'
},{}],2:[function(require,module,exports){
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
},{"./datahandler":3,"./logger":7,"./util":12}],3:[function(require,module,exports){
class DataHandler {
    static initialize() {
        DataHandler.datablocks = []

        DataHandler.totalLetters = 0
        DataHandler.totalMath = 0
        DataHandler.correctLetters = 0
        DataHandler.correctMath = 0

        DataHandler.listLengthLetters = 0
        DataHandler.listLengthMath = 0
        DataHandler.correctListLengthLetters = 0
        DataHandler.correctListLengthMath = 0
    }

    static initializeListLength() {
        DataHandler.listLengthLetters = 0
        DataHandler.listLengthMath = 0
        DataHandler.correctListLengthLetters = 0
        DataHandler.correctListLengthMath = 0
    }

    static register(datablock) {
        DataHandler.datablocks.push(datablock)
    }

    static addToTotalLetters(n) {
        DataHandler.totalLetters += n
        DataHandler.listLengthLetters += n
    }

    static addToTotalMath(n) {
        DataHandler.totalMath += n
        DataHandler.listLengthMath += n
    }

    static addToCorrectLetters(n) {
        DataHandler.correctLetters += n
        DataHandler.correctListLengthLetters += n
    }

    static addToCorrectMath(n) {
        DataHandler.correctMath += n
        DataHandler.correctListLengthMath += n
    }

    static finishTrial() {
        const datablocks = DataHandler.datablocks
        datablocks.slice(0, -1).forEach(db => db.write())
        jsPsych.finishTrial(datablocks.slice(-1)[0].toJSON())
    }
}

module.exports = DataHandler
},{}],4:[function(require,module,exports){
/* Blueprint */
const OperationSpan = require('./ospan')

/* Modes */
const MathMode = require('./mathmode')
const LetterMode = require('./lettermode')

/* Data */
const DataHandler = require('./datahandler')

/* Display */
const TrialFeedback = require('./trialFeedback')

/* Util */
const Logger = require('./logger')
const randomIntInRange = require('./util').randomIntInRange
const uuid = require('./util').uuid

class OSDriver extends OperationSpan {
    constructor(display_element, trial) {
        super(display_element, trial)

        this.displayElement = display_element
        this.trial = trial
        this.currentCycle = 0
        this.listLengthStack = []
    }

    startCycle() {
        this.currentCycle++

        if (this.listLength[0] === this.listLength[1]) {
            this.listLengthStack = [this.listLength[0]]
        } else {
            this.listLengthStack = jsPsych.randomization.shuffle(this._range(...this.listLength)).reverse()
        }

        this.showListLength()
    }

    showListLength() {
        const listLength = this.listLengthStack.pop()
        Logger.log("Starting list length")

        DataHandler.initializeListLength()

        this.mathmode = new MathMode(this.displayElement, this.trial, this.currentCycle, listLength)
        this.lettermode = new LetterMode(this.displayElement, this.trial, this.currentCycle, listLength)

        this.buildMathStimuli(listLength)
        this.buildLetterStimuli(listLength)

        this.mathmode.hideTemplate()
        this.lettermode.hideTemplate()
        this.showMathEquation()

    }

    showMathEquation() {
        if (this.mathmode.hasStimuli()) {
            this.mathmode.showEquation(() => {
                this.showLetter()
            })
        } else if (this.lettermode.hasStimuli()) {
            this.showLetter()
        } else {
            this.finishTrial()
        }
    }

    showLetter() {
        if (this.lettermode.hasStimuli()) {
            this.lettermode.showLetter(() => {
                this.showMathEquation()
            })
        } else if (this.mathmode.hasStimuli()) {
            this.showMathEquation()
        } else {
            this.finishTrial()
        }
    }

    buildMathStimuli(listLength) {
        const mathStimuli = []

        if (!this.mathStimuli.length) {
            this.mathmode.mathStimuli = mathStimuli
            return
        }

        if (this.mathStimuli.length && this.mathStimuli[0].length < this.listLength[1]) {
            throw new Error("Math stimuli length is less than list length")
        }


        const equationList = {}
        let correctMap = Array(listLength)
        correctMap.fill(1, 0, Math.ceil(listLength / 2))
        correctMap.fill(0, Math.ceil(listLength / 2))
        correctMap = jsPsych.randomization.shuffle(correctMap)

        for (let j = 0; j < listLength; j++) {
            let cue, lhs
            let rhs = -1

            while (rhs < 0) {
                const index1 = randomIntInRange(0, this.mathStimuli[0].length - 1)
                const index2 = randomIntInRange(0, this.mathStimuli[1].length - 1)
                const eq1 = this.mathStimuli[0][index1]
                const eq2 = this.mathStimuli[1][index2]

                lhs = eq1 + eq2
                rhs = eval(lhs.replace(/x/g, "*").replace(/÷/g, "/"))
                cue = correctMap[j] ? rhs : randomIntInRange(Math.max(rhs - 9, 0), rhs + 9)

                if (equationList[lhs]) {
                    rhs = -1
                }
            }

            equationList[lhs] = true

            const stim = { stimulus: lhs + " =", cue: cue, target: rhs === cue }
            mathStimuli.push(stim)
        }

        this.mathmode.mathStimuli = mathStimuli
    }

    buildLetterStimuli(listLength) {
        const letterStimuli = []

        if (!this.letterStimuli.length) {
            this.lettermode.letterStimuli = letterStimuli
            return
        }

        if (this.letterStimuli.length < this.listLength[1]) {
            throw new Error("Letter stimuli length is less than list length")
        }

        const letterList = {}

        this.letterStimuli.forEach(s => {
            s = s + ';' + uuid()
            letterList[s] = s
        })

        for (let j = 0; j < listLength; j++) {
            const index = randomIntInRange(0, Object.keys(letterList).length - 1)
            let letter = Object.keys(letterList)[index]

            delete letterList[letter]

            letter = letter.split(';')[0]
            letterStimuli.push(letter)
        }

        this.lettermode.letterStimuli = letterStimuli
    }

    finishTrial() {
        const finishBlock = () => {
            this.$displayElement.empty()
            if (this.listLengthStack.length > 0) {
                Logger.log('Done list length', this.currentCycle)
                this.showListLength()
            } else if (this.currentCycle < this.cycles) {
                Logger.log('Done cycle', this.currentCycle)
                this.startCycle()
            } else {
                DataHandler.finishTrial()
            }
        }

        if (this.letterStimuli.length) {
            if (this.trialFeedback) {
                this.lettermode.showLetterPad(() => {
                    const feedbackScreen = new TrialFeedback(this.displayElement, this.trial)
                    feedbackScreen.show(
                        DataHandler,
                        () => { finishBlock() }
                    )
                })
            } else {
                this.lettermode.showLetterPad(() => { finishBlock() })
            }
        } else {
            finishBlock()
        }
    }

    _range(start, end) {
        return Array(end - start + 1).fill().map((_, idx) => start + idx)
    }
}


module.exports = OSDriver
},{"./datahandler":3,"./lettermode":5,"./logger":7,"./mathmode":8,"./ospan":9,"./trialFeedback":11,"./util":12}],5:[function(require,module,exports){
/* Blueprint */
const OperationSpan = require('./ospan')

/* Data */
const DataHandler = require('./datahandler')
const DataBlock = require('./datablock')

/* Util */
const setParameter = require('./util').setParameter

/* Constants */
const LETTERS_LABEL = require('./constants').LETTERS_LABEL

/* Components */
const LetterPad = require('./letterpad')
const TrialFeedback = require('./trialFeedback')

class LetterMode extends OperationSpan {
    constructor(display_element, trial, cycle, listLength) {
        super(display_element, trial)

        // Internal
        this._letterStimuli = null
        this.cycle = cycle
        this.listLength = listLength

        // Stimulus parameters
        this.label = setParameter(trial.letter_label, LETTERS_LABEL, 'string')

        // Timing parameters
        this.stimulusTime = setParameter(trial.stimulus_time, 1000, 'number')

        this.buildTemplate()
    }

    startCycle() {
        this._showLetter(this.letterStack.pop())
    }

    showLetter(callback) {
        this._showLetter(this.letterStack.pop(), callback)
    }

    _showLetter(letter, callback) {
        this.showTemplate()

        const datablock = new DataBlock(letter)
        datablock.cycle = this.cycle
        datablock.list_length = this.listLength

        const $letter = $(`
            <div class="row" style="height: 25vh">
                <div class="col h-100 d-flex">
                    <h1 class="text-center mx-auto my-auto">${letter}</h1>
                </div>
            </div>
        `)
        $letter.appendTo(this.$trialContainer)

        setTimeout(() => {
            this.$trialContainer.empty()
            this.$buttonContainer.empty()
            this.isiWait(() => {
                this.hideTemplate()
                callback()
            })
        }, this.stimulusTime)
    }

    showLetterPad(callback) {
        this.showTemplate()

        const $label = $(`
            <div class="row">
                <div class="col">
                    <h3 class="text-center">${this.label}</h3>
                </div>
            </div>
        `)
        $label.appendTo(this.$trialContainer)

        const letterpadStartTime = Date.now()
        const letterpad = new LetterPad(this)
        letterpad.onFinish(letterpadData => {
            // Record response

            const responseLetters = letterpadData.map(d => d.response_numpad)
            for (let i = 0; i < Math.max(this.letterStimuli.length, responseLetters.length); i++) {
                const datablock = new DataBlock('', '', this.letterStimuli[i])
                datablock.recordResponse(responseLetters[i])
                datablock.cycle = this.cycle
                datablock.list_length = this.listLength

                // Record response times
                if (letterpadData.length) {
                    datablock.rt_first_keypress = Math.min(...letterpadData.map(d => d.response_time))
                    datablock.rt = Math.max(...letterpadData.map(d => d.response_time))
                } else {
                    datablock.rt_first_keypress = undefined
                    datablock.rt = undefined
                }
                datablock.rt_last_keypress = Date.now() - letterpadStartTime
            }

            // Get total letters and sum of correct responses
            const numLetters = this.letterStimuli.length
            const numCorrectLetters = this.letterStimuli
                .map((ls, i) => ls === responseLetters[i])
                .reduce((ps, a) => ps + a, 0)

            DataHandler.addToTotalLetters(numLetters)
            DataHandler.addToCorrectLetters(numCorrectLetters)

            // Finish trial
            this.$trialContainer.empty()
            this.$buttonContainer.empty()

            // Show feedback screen for letters
            if (this.letterFeedback) {
                const feedbackScreen = new TrialFeedback(this.$displayElement, this.trial)
                feedbackScreen.show({ listLengthLetters: numLetters, correctListLengthLetters: numCorrectLetters }, () => {
                    if (callback) {
                        this.isiWait(() => {
                            this.hideTemplate()
                            callback()
                        })
                    }
                })
            } else if (callback) {
                this.isiWait(() => {
                    this.hideTemplate()
                    callback()
                })
            }
        })
    }

    hasStimuli() {
        return Boolean(this.letterStack.length)
    }

    set letterStimuli(ls) {
        this._letterStimuli = ls
        this.letterStack = ls.filter(l => l.trim()).reverse()
    }

    get letterStimuli() {
        return this._letterStimuli
    }
}

module.exports = LetterMode
},{"./constants":1,"./datablock":2,"./datahandler":3,"./letterpad":6,"./ospan":9,"./trialFeedback":11,"./util":12}],6:[function(require,module,exports){
function Numpad(osInstance) {

    /* Data members */
    this._osInstance = osInstance
    this._onFinish = null
    this._buttonText = this._osInstance.buttonText
    this._continueButton = null
    this.trialContainer = this._osInstance.$trialContainer
    this.numDeletions = 0
    this.deletionTimes = []
    this._onFinish = () => { }

    this.onFinish = (callback) => {
        if (typeof callback != "function") {
            throw new Error("Numpad on finish callback must be a function")
        }

        this._onFinish = callback
    }

    /* private */
    const thisNumpad = this
    const birthTime = Date.now()
    let selectedNums = []

    // Numpad

    //Finish button
    this._continueButton = $('<button>', {
        id: "continue-button",
        class: "btn btn-primary btn-lg waves-effect",
        text: this._buttonText
    })

    //Number Display
    let numberContainer = $('<div>', {
        class: 'well',
    })

    numberContainer.css({
        'height': '100px',
        'padding': '40px 0',
        'background-color': '#ECEFF1',
        'width': '100%',
        'margin-top': '20px',
    })

    let numberLabel = $('<p>');

    const numCSS = {
        'font-size': '36px',
        'text-align': 'center',
        'height': '40px',
    }

    const updateNumberLabel = function () {
        // console.log(selectedNums)
        let text = ""

        selectedNums.forEach(dataPoint => {
            text += "   " + dataPoint.response_numpad
        })
        numberLabel.text(text);
    }

    numberLabel.css(numCSS)

    //Grid System
    let gridRow = function () {
        return $('<div>', {
            class: 'row',
        })
    }

    let gridCol = function (size) {
        return $('<div>', {
            class: 'col-sm-' + size,
        })
    }

    let gridContainer = $('<div>', {
        class: 'pcllab-cs-numpad-container',
    })

    const numRow = gridRow()
    const numCol = gridCol(12)
    numberContainer.append(numberLabel)
    numRow.append(numCol)
    numCol.append(numberContainer)
    numCol.css('padding', '0')
    gridContainer.append(numRow)

    const btnCSS = {
        'height': '84px',
        'font-size': '24px',
        'padding': '18px 0',
        'text-align': 'center',
        'background-color': '#455A64',
        'color': '#FFF',
    }

    const numberClick = function (event) {
        let clickData = {}
        clickData.response_numpad = event.target.textContent
        clickData.response_time = Date.now() - birthTime

        selectedNums.push(clickData)
        updateNumberLabel()
    }

    const blankClick = function () {
        let clickData = {}
        clickData.response_numpad = '_'
        clickData.response_time = Date.now() - birthTime

        selectedNums.push(clickData)
        updateNumberLabel()
    }

    const numpadBtn = function (value) {
        let btn = $('<div>', {
            class: 'waves-effect d-flex',
        })
        btn.css(btnCSS)
        btn.on('click', numberClick)
        btn.append($(`<span class="mx-auto my-auto">${value}</span>`))
        return btn
    }



    const letters = 'FHJKLNPQRSTY'.split('')
    let num = 0;
    for (let i = 0; i < 4; i++) {
        let row = gridRow();
        for (let j = 0; j < 3; j++) {
            let col = gridCol(4)
            let btn = numpadBtn(letters[num])
            col.append(btn)
            col.css('padding', '0')
            row.append(col)
            num++;
        }
        gridContainer.append(row)
    }

    const delBlankCSS = {
        'height': '84px',
        'font-size': '24px',
        'padding': '24px 0',
        'text-align': 'center',
        'background-color': '#607D8B',
        'color': '#FFF',
    }

    //Delete and Blank Buttons
    let delBtn = $('<div>', {
        class: 'waves-effect',
        text: 'Delete',
    })
    delBtn.css(delBlankCSS)

    delBtn.on('click', function (event) {
        selectedNums.pop()
        ++thisNumpad.numDeletions
        thisNumpad.deletionTimes.push(Date.now() - birthTime)

        updateNumberLabel()
    })

    let blankBtn = $('<div>', {
        class: 'waves-effect',
        text: 'Blank',
    })
    blankBtn.css(delBlankCSS)

    blankBtn.on('click', blankClick)

    let lastRow = gridRow()
    //lastRow.append(gridCol(2))

    let blankCol = gridCol(6)
    blankCol.css('padding', '0')
    blankCol.append(blankBtn)
    lastRow.append(blankCol)

    let delCol = gridCol(6)
    delCol.append(delBtn)
    delCol.css('padding', '0')
    lastRow.append(delCol)

    //lastRow.append(gridCol(2))
    gridContainer.append(lastRow)

    this.trialContainer.append(gridContainer)

    // Finish Button
    let buttonContainer = $('<div>', {
        class: "pcllab-button-container"
    })

    buttonContainer.append(this._continueButton.on('click', function () {
        thisNumpad._onFinish(selectedNums)
    }))

    this.trialContainer.append(buttonContainer)

}

Numpad.prototype = {

    constructor: Numpad,

    set buttonText(text) {
        this._buttonText = text
        this._continueButton.text(text)
    },

    get buttonText() {
        return this._buttonText
    }

}

module.exports = Numpad
},{}],7:[function(require,module,exports){
class Logger {
    static log(...message) {
        const shouldLog = localStorage.getItem("debug") == "true"

        if (shouldLog) {
            console.log(...message)
        }
    }
}

module.exports = Logger
},{}],8:[function(require,module,exports){
/* Blueprint */
const OperationSpan = require('./ospan')

/* Data */
const DataHandler = require('./datahandler')
const DataBlock = require('./datablock')

/* Util */
const setParameter = require('./util').setParameter

/* Constants */
const MATH_LABEL = require('./constants').MATH_LABEL

class MathMode extends OperationSpan {
    constructor(display_element, trial, cycle, listLength) {
        super(display_element, trial)

        // Internal
        this._mathStimuli = null
        this.cycle = cycle
        this.listLength = listLength

        // Stimulus parameters
        this.equationStack = []
        this.label = setParameter(trial.math_label, MATH_LABEL, 'string')

        // Timing parameters
        this.maximumTime = setParameter(trial.maximum_time, null, 'number')
        this.feedbackTime = setParameter(trial.feedback_time, 500, 'number')

        this.buildTemplate()
    }

    startCycle() {
        throw new Error("Do not call start directly")
    }

    showEquation(callback) {
        this._showEquation(this.equationStack.pop(), callback)
    }

    _showEquation(stimblock, callback) {
        this.showTemplate()

        const datablock = new DataBlock(stimblock.stimulus, stimblock.cue, stimblock.target)
        datablock.cycle = this.cycle
        datablock.list_length = this.listLength

        const $equation = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center">${stimblock.stimulus}</h3>
                </div>
            </div>
        `)
        $equation.appendTo(this.$trialContainer)

        const $label = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center">${this.label}</h3>
                </div>
            </div>
        `)
        $label.appendTo(this.$trialContainer)

        const $button = $('<button>', {
            class: 'btn btn-large btn-primary waves-effect waves-light',
            text: this.buttonText
        })
        $button.appendTo(this.$buttonContainer)

        const eqStartTime = Date.now()

        const clickLambda = () => {
            datablock.recordResponse()
            this.$trialContainer.empty()
            this.$buttonContainer.empty()

            this.isiWait(() => {
                const eqResponseTime = Date.now() - eqStartTime
                if (this.maximumTime && eqResponseTime > this.maximumTime) {
                    DataHandler.addToTotalMath(1)
                    callback()
                } else {
                    this.showTarget(stimblock, callback)
                }
            })
        }

        let timeoutId = null
        if (this.maximumTime) {
            timeoutId = setTimeout(() => clickLambda(), this.maximumTime)
        }

        $button.click(() => {
            clearTimeout(timeoutId)
            clickLambda()
        })
    }

    showTarget(stimblock, callback) {
        const datablock = new DataBlock(stimblock.stimulus, stimblock.cue, stimblock.target)
        datablock.cycle = this.cycle
        datablock.list_length = this.listLength

        const $cue = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center">${stimblock.cue}</h3>
                </div>
            </div>
        `)
        $cue.appendTo(this.$trialContainer)

        this.$trueButton = $('<button>', {
            class: 'btn btn-large btn-primary waves-effect waves-light mr-5',
            text: 'True'
        })
        this.$trueButton.appendTo(this.$buttonContainer)

        this.$falseButton = $('<button>', {
            class: 'btn btn-large btn-primary waves-effect waves-light ml-5',
            text: 'False'
        })
        this.$falseButton.appendTo(this.$buttonContainer)

        this.$trueButton.click(() => {
            this.selectResponse(true, stimblock, datablock, callback)
        })

        this.$falseButton.click(() => {
            this.selectResponse(false, stimblock, datablock, callback)
        })
    }

    selectResponse(response, stimblock, datablock, callback) {
        datablock.recordResponse(response)

        DataHandler.addToTotalMath(1)
        if (response === stimblock.target) {
            DataHandler.addToCorrectMath(1)
        }

        const $correctFeedback = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center text-success">Correct</h3>
                </div>
            </div>
        `)

        const $incorrectFeedback = $(`
            <div class="row mt-5 mb-5">
                <div class="col">
                    <h3 class="text-center text-danger">Incorrect</h3>
                </div>
            </div>
        `)

        const $feedback = response === stimblock.target ?
            $correctFeedback : $incorrectFeedback
        if (this.mathFeedback) {
            $feedback.appendTo(this.$buttonContainer)
        }

        this.$trueButton.attr('disabled', true)
        this.$falseButton.attr('disabled', true)

        // Finish trial
        setTimeout(() => {
            this.$trialContainer.empty()
            this.$buttonContainer.empty()

            if (callback)
                this.isiWait(() => {
                    this.hideTemplate()
                    callback()
                })
        }, this.feedbackTime)
    }

    hasStimuli() {
        return Boolean(this.equationStack.length)
    }

    set mathStimuli(ms) {
        this._mathStimuli = ms
        this.equationStack = ms.slice(0).reverse()
    }

    get mathStimuli() {
        return this._mathStimuli
    }
}

module.exports = MathMode
},{"./constants":1,"./datablock":2,"./datahandler":3,"./ospan":9,"./util":12}],9:[function(require,module,exports){
/* Util */
const setParameter = require('./util').setParameter
const $hide = require('./util').$hide
const $show = require('./util').$show
const uuid = require('./util').uuid

class OperationSpan {
    constructor(display_element, trial) {
        if (!display_element) {
            throw new Error("Invalid display element", display_element)
        }

        if (!trial) {
            throw new Error("Invalid trial", trial)
        }

        // Plugin parameters
        this.trial = trial
        this.mode = setParameter(trial.mode, null, 'string')

        // Stimulus parameters
        this.cycles = setParameter(trial.cycles, 3, 'number')
        this.listLength = setParameter(trial.list_length, [3, 7], null)
        this.mathStimuli = setParameter(trial.math_stimuli, [], null)
        this.letterStimuli = setParameter(trial.letter_stimuli, [], null)
        this.title = setParameter(trial.title, '', null)
        this.buttonText = setParameter(trial.button_text, 'Next', null)

        // Feedback parameters
        this.mathFeedback = setParameter(trial.math_feedback, false, 'boolean')
        this.letterFeedback = setParameter(trial.letter_feedback, false, 'boolean')
        this.trialFeedback = setParameter(trial.trial_feedback, false, 'boolean')

        if (this.listLength.length !== 2) {
            throw new Error("List length must be in the format [min_length, max_length]")
        }

        // Template parameters
        this.$displayElement = $(display_element)
        this.$template = null
        this.$trialContainer = null
        this.$progressContainer = null
        this.$title = $()
        this.$buttonContainer = null
        this.$repeatButton = null

        // Timing parameters
        this.isi = setParameter(trial.isi, 250, 'number')
    }

    startCycle() { }

    buildTemplate() {
        const id = uuid()

        this.$template = $('<div>')
        this.$displayElement.append(this.$template)

        this.$title = $(`
            <div class="row justify-content-center">
                <h1>${this.title}</h1>
            </div>
        `)
        this.$template.append(this.$title)

        this.$template.append(`
            <div class="row mt-4 mb-4">
                <div class="col" id="trial_container${id}"></div>
            </div>
        `)
        this.$trialContainer = $('#trial_container' + id)

        this.$template.append(`
            <div class="row">
                <div class="col text-center" id="button_container${id}"></div>
            </div>
        `)
        this.$buttonContainer = $('#button_container' + id)

        this.$template.append(`
            <div class="row mt-2">
                <div class="col text-center" id="progress_container${id}"></div>
            </div>
        `)
        this.$progressContainer = $('#progress_container' + id)

        if (!this.show_progress) {
            this.$progressContainer.empty()
        }
    }

    hideTemplate() {
        this.$template.hide()
    }

    showTemplate() {
        this.$template.show()
    }

    isiWait(callback) {
        $hide(this, this.$title)
        $hide(this, this.$buttonContainer)
        $hide(this, this.$trialContainer)

        if (!this.progress_total_time) {
            this.$progressContainer.hide()
        } else if (this.show_progress && this.show_button) {
            // When experiment is self-paced, advance the progress bar through isi
            this._totalProgressBar.progressByTime(this.isi_time)
        }

        const self = this
        setTimeout(() => {
            $show(self, self.$title)
            $show(self, self.$buttonContainer)
            $show(self, self.$trialContainer)
            $show(self, self.$progressContainer)
            callback()
        }, this.isi)
    }
}

module.exports = OperationSpan
},{"./util":12}],10:[function(require,module,exports){
const OperationSpan = require('./driver')
const DataHandler = require('./datahandler')

jsPsych.plugins["pcllab-operation-span"] = (function () {
    let plugin = {}

    plugin.info = {
        name: 'pcllab-operation-span',
        parameters: {}
    }

    plugin.trial = function (display_element, trial) {
        trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial)

        DataHandler.initialize()
        const operationSpan = new OperationSpan(display_element, trial)
        operationSpan.startCycle()
    }

    return plugin
})()
},{"./datahandler":3,"./driver":4}],11:[function(require,module,exports){
/* Blueprint */
const OperationSpan = require('./ospan')

class TrialFeedback extends OperationSpan {
    show(data, callback) {
        this.buildTemplate()
        this.isiWait(() => {
            this._show(data, callback)
        })
    }

    _show(data, callback) {
        this.$title.remove()

        const totalMath = data.totalMath
        const correctMath = data.correctMath
        const listLengthLetters = data.listLengthLetters
        const listLengthMath = data.listLengthMath
        const correctListLengthLetters = data.correctListLengthLetters
        const correctListLengthMath = data.correctListLengthMath

        let feedbackText = null
        if (listLengthLetters && listLengthMath) {
            feedbackText = `You got ${correctListLengthLetters}/${listLengthLetters} letters correct and ${correctListLengthMath}/${listLengthMath} math problems correct.`
        } else if (listLengthLetters) {
            feedbackText = `You got ${correctListLengthLetters}/${listLengthLetters} letters correct.`
        } else if (listLengthMath) {
            feedbackText = `You got ${correctListLengthMath}/${listLengthMath} math problems correct.`
        }

        // Feedback message
        this.$trialContainer.append(`
            <div class="row mt-5">
                <div class="col">
                    <h3 class="text-center">${feedbackText}</h3>
                </div>
            </div>
        `)

        if (totalMath) {
            const accuracy = Math.round((correctMath / totalMath) * 100)
            const textColor = accuracy >= 85 ? "green-text" : "red-text"
            this.$trialContainer.append(`
                <div class="row mt-5">
                    <div class="col">
                        <h3 class="text-center ${textColor}">Overall math accuracy: ${accuracy}%</h3>
                    </div>
                </div>
            `)
        }

        const $button = $('<button>', {
            class: 'btn btn-large btn-primary waves-effect waves-light mt-4',
            text: this.buttonText
        })
        $button.click(() => {
            this.$displayElement.empty()
            this.isiWait(() => callback())
        })
        $button.appendTo(this.$buttonContainer)
    }
}

module.exports = TrialFeedback
},{"./ospan":9}],12:[function(require,module,exports){
module.exports.setParameter = (value, defaultValue, expectedType) => {
    if (typeof value === "function" && typeof value !== expectedType) {
        value = value()
    }

    if (expectedType && typeof value === expectedType) {
        return value
    }

    if (typeof value !== 'undefined') {
        return value
    }

    return defaultValue
}

module.exports.$hide = (coreInstance, $el) => {
    $el.addClass('notransition')
    if (coreInstance.progress_total_time) {
        $el.css("visibility", "hidden")
    } else {
        $el.hide()
    }
}

module.exports.$show = (coreInstance, $el) => {
    $el[0].offsetHeight
    $el.removeClass('notransition')
    if (coreInstance.progress_total_time) {
        $el.css("visibility", "visible")
    } else {
        $el.show()
    }
}

module.exports.uuid = () => {
    let dt = new Date().getTime()
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (dt + Math.random() * 16) % 16 | 0
        dt = Math.floor(dt / 16)
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    return uuid
}

module.exports.randomIntInRange = (min, max) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}
},{}]},{},[10])
//# sourceMappingURL=plugin.js.map
