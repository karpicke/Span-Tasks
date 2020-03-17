const InputView = require('./inputView')
const FreeRecallResponseContainer = require('./responseContainer').FreeRecallResponseContainer
const FreeRecallHandler = require('../../handlers/freeRecallHandler')

// Util
const setParameter = require('../../util').setParameter

class FreeRecallView extends InputView {
    constructor($displayElement, coreInstance, dataInstance, stimulus) {
        super($displayElement, coreInstance, dataInstance, stimulus)
        this.responseContainer = null
    }

    newResponseContainer() {
        const rc = new FreeRecallResponseContainer(this,
            this.stimulus,
            this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers

        return rc
    }

    render() {
        const $row = $('<div>', { class: 'row mx-auto', style: 'width: 70%' })
        $row.appendTo(this.$displayElement)
        const $col = $('<div>', { class: 'col' })
        $col.appendTo($row)

        this.responseContainer = this.newResponseContainer()
        $col.append(this.responseContainer.get$())

        this.focusContainer(0)

        // Render Honeypot input
        const hpResponseContainer = this.newHoneypotResponseContainer()
        this.$displayElement.append(hpResponseContainer.get$())
    }

    createHandler(nextButton) {
        return new FreeRecallHandler(nextButton, this.responseContainer)
    }
}

module.exports = FreeRecallView