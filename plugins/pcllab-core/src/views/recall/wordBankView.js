const HoneypotResponseContainer = require('../response/responseContainer').HoneypotResponseContainer
const setParameter = require('../../util').setParameter
const CUE_ALIGNMENT = require('../../constants').CUE_ALIGNMENT
const dragula = require('dragula')

class RecallWordBankView {
    constructor(stimulus, alignment) {
        this.word_list = setParameter(stimulus.word_list, [], null)
        this.alignment = setParameter(alignment, CUE_ALIGNMENT.vertical, 'string')
        this._drake = null
    }

    appendTo($element) {
        this.renderWordBank($element)
    }

    renderWordBank($element) {
        this._drake = dragula({
            accepts: (el, target, source, sibling) => {
                if (target == source) {
                    return false
                }
            }
        })
        this._drake.on('accepts', (el) => {
            console.log(el)
        })

        let rowHeight = ''
        if (this.alignment === CUE_ALIGNMENT.vertical) {
            rowHeight = 'h-100'
        }

        let $row = $('<div>', {
            class: `row ${rowHeight} mb-3 p-3 ml-1 mr-1`,
            style: 'border: 1px solid #EBEBEB; border-radius: 0.3em'
        })

        let colWidth = 'col-3'
        if (this.alignment === CUE_ALIGNMENT.vertical) {
            colWidth = 'col-12'
        }

        for (let i = 0; i < this.word_list.length; i++) {
            let $col = $(`
                <div class="${colWidth} mb-2 text-center">
                    <span style="cursor: pointer">
                        ${this.word_list[i]}
                    </span>
                </div>
            `)
            $row.append($col)
        }
        this._drake.containers.push($row[0])
        $element.append($row)
    }

    dragEnd(callback) {
        this._drake.on('dragend', (el, container, source) => {
            callback(el)
        })
    }

    attachInputs(responseContainers) {
        for (let responseContainer of responseContainers) {
            if (responseContainer instanceof HoneypotResponseContainer) {
                continue
            }
            this.dragEnd(responseContainer.onDragEnd())
        }
    }
}

module.exports = RecallWordBankView