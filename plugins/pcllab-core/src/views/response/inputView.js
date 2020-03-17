const InputResponseContainer = require('./responseContainer').InputResponseContainer
const HoneypotResponseContainer = require('./responseContainer').HoneypotResponseContainer

// Util
const setParameter = require('../../util').setParameter

// Handler
const InputHandler = require('../../handlers/inputHandler')

class InputView {
    constructor($displayElement, coreInstance, dataInstance, stimulus) {
        this.$displayElement = $displayElement
        this.coreInstance = coreInstance
        this.dataInstance = dataInstance
        this.stimulus = stimulus
        this.responseContainers = []

        // Generator properties
        this.sharedResponsePanelBody = $()
        this.sharedResponsePanel = $()
        this.numResponseContainers = 0
    }

    newResponseContainer() {
        const rc = new InputResponseContainer(this,
            this.coreInstance.input_size,
            this.coreInstance.response_box_align,
            this.stimulus,
            this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers

        return rc
    }

    newHoneypotResponseContainer() {
        const rc = new HoneypotResponseContainer(this,
            this.coreInstance.input_size,
            this.coreInstance.response_box_align,
            this.stimulus,
            this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers

        return rc
    }

    render() {
        // Use stimulus response count over global response count, if mentioned
        const responseCount = setParameter(this.stimulus.response_count, this.coreInstance.response_count, 'number')

        for (let i = 0; i < responseCount; i++) {
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
        }

        // Auto focus first input
        this.focusContainer(0)

        // Render honeypot input
        const hpResponseContainer = this.newHoneypotResponseContainer()
        this.$displayElement.append(hpResponseContainer.get$())
    }

    focusContainer(containerIndex) {
        if (this.responseContainers.length) {
            this.responseContainers[containerIndex].focus()
        }
    }

    createHandler(nextButton) {
        return new InputHandler(nextButton)
    }
}

module.exports = InputView