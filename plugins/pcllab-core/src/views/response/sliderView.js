const InputView = require('./inputView')
const SliderResponseContainer = require('./responseContainer').SliderResponseContainer

// Util
const setParameter = require('../../util').setParameter

class SliderView extends InputView {
    constructor($displayElement, coreInstance, dataInstance, stimulus) {
        super($displayElement, coreInstance, dataInstance, stimulus)
    }

    newResponseContainer() {
        const rc = new SliderResponseContainer(this, this.stimulus, this.dataInstance)
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

            const $sliderContainer = responseContainer.get$()
            col.append($sliderContainer)
        }

        // Auto focus first input
        this.focusContainer(0)

        // Render honeypot input
        const hpResponseContainer = this.newHoneypotResponseContainer()
        this.$displayElement.append(hpResponseContainer.get$())
    }
}

module.exports = SliderView