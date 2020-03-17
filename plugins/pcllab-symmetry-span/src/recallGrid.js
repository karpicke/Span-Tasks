const Util = require('./util')
const Graphics = require('./graphics')

class RecallGrid {
    // target format: { row: Number, col: Number }
    constructor(rows, cols, square_stimuli, properties = {}) {
        this.properties = Object.assign({
            backgroundColor: '#FFFFFF',
            backgroundAlpha: 0,
            borderColor: '#212121',
            borderThickness: 6,
            cellColor: '#ff5b3a',
            textColor: '#212121',
            cellFont: '30px Arial'
        }, properties)
        this.gridState = {}
        this.recallIndex = 1
        this.rowCount = rows
        this.columnCount = cols
        this.squareStimuli = square_stimuli
        this.startTime = Date.now()
        this.data = []
    }

    select(canvas, cell, length) {
        const ctx = canvas.getContext("2d")

        if(!this.gridState[cell.row]) this.gridState[cell.row] = {}
        if(this.gridState[cell.row][cell.col] > 0) return
        if(this.recallIndex > this.squareStimuli.length) return

        if(this.recallIndex == this.squareStimuli.length) {
            document.getElementById('continue-button').style.display = null;
        }

        const currentStimulus = this.squareStimuli[this.recallIndex - 1]

        const target = `${String.fromCharCode(65 + currentStimulus.target_col - 1)}${currentStimulus.target_row}`
        const response = `${String.fromCharCode(65 + cell.col)}${cell.row + 1}`

        const data = {
            cue: currentStimulus.cue,
            target,
            response,
            correct: target === response ? 1 : 0,
            rt: Date.now() - this.startTime, // Start time needs to be fixed
            type: 'Recall'
        }
        this.data.push(data)

        this.gridState[cell.row][cell.col] = this.recallIndex
        console.log("Recall index: ", this.recallIndex)
        this.renderGrid(canvas, length)
        this.recallIndex++
    }

    clearGrid(canvas, length) {
        const ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.gridState = {}
        this.recallIndex = 1
        this.data = []
        this.renderGrid(canvas, length)
    }

    renderGrid(canvas, length) {
        const ctx = canvas.getContext("2d")
        Graphics.drawGrid(
            ctx, 
            this.rowCount, 
            this.columnCount, 
            length, 
            this.properties.borderColor, 
            this.properties.borderThickness
        )
        Object.keys(this.gridState).forEach(row => {
            Object.keys(this.gridState[row]).forEach(col => {
                const index = this.gridState[row][col]
                // fill in cell with row and number
                Graphics.fillCell(
                    ctx, 
                    row, 
                    col, 
                    this.properties.cellColor, 
                    length / this.rowCount, 
                    this.properties.borderThickness
                )
                Graphics.cellText(
                    ctx,
                    row,
                    col,
                    `${index}`,
                    length / this.rowCount,
                    this.properties.cellFont,
                    this.properties.textColor
                )
            })
        })
    }

    render($container) {
        $container.ready(()=>{
            const canvasLength = $container.width() < 500 ? 2 * Math.round($container.width()/2) : 500
            const canvas = document.createElement('canvas')
            canvas.setAttribute('width',canvasLength),
            canvas.setAttribute('height',canvasLength)
            canvas.id = 'grid-canvas'
            this.canvas = canvas
            this.canvasLength = canvasLength - this.properties.borderThickness * 2

            canvas.style.display = 'block'
            canvas.style.margin = '0 auto'
            canvas.style.cursor = 'pointer'

            this.renderGrid(canvas, canvasLength - this.properties.borderThickness * 2)

            $container.append(canvas)

            canvas.addEventListener('click', event => {
                const viewportOffset = canvas.getBoundingClientRect()
                const pos = {
                    x: event.clientX - viewportOffset.left,
                    y: event.clientY - viewportOffset.top
                }
                const cellLength = (canvasLength - this.properties.borderThickness * 2) / this.rowCount
                const cell = Graphics.detectGridArea(pos.x,pos.y,cellLength)
                this.select(canvas, cell, canvasLength - this.properties.borderThickness * 2)
            })

            this.startTime = Date.now()
        })
    }
}

module.exports = RecallGrid