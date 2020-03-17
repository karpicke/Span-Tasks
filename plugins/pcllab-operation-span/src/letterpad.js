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