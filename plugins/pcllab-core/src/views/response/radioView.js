const InputView = require('./inputView')
const RadioResponseContainer = require('./responseContainer').RadioResponseContainer

// Util
const setParameter = require('../../util').setParameter

// Handler
const RadioHandler = require('../../handlers/radioHandler')

class RadioView extends InputView {
    constructor($displayElement, coreInstance, dataInstance, stimulus) {
        super($displayElement, coreInstance, dataInstance, stimulus)
    }

    newResponseContainer() {
        const rc = new RadioResponseContainer(this, this.stimulus, this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers
        return rc
    }

    render() {
        const responseContainer = this.newResponseContainer()

        const row = $('<div>', {
            class: 'row'
        })

        const col = $('<div>', {
            class: 'col text-center'
        })

        this.$displayElement.append(row)
        row.append(col)

        col.append(responseContainer.get$())

        // Auto focus first input
        this.focusContainer(0)

        // Render honeypot input
        const hpResponseContainer = this.newHoneypotResponseContainer()
        this.$displayElement.append(hpResponseContainer.get$())
    }

    createHandler(nextButton) {
        return new RadioHandler(nextButton)
    }
}

module.exports = RadioView