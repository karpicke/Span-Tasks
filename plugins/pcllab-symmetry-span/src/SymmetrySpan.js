const RecallGrid = require('./recallGrid')
const SymmetryPrompt = require('./symmetryPrompt')
const Util = require('./util')

/**
 * Symmetry Span
 * 
 * Andrew Arpasi
 */

class SymmetrySpan {
    constructor(display_element, square_stimuli, symmetry_stimuli, trial, onFinish) {
        this.display_element = display_element
        this.availableSquareStimuli = square_stimuli
        this.availableSymmetryStimuli = symmetry_stimuli
        this.trial = trial
        this.onFinish = onFinish
        this.phase = ''
        this.practice = trial.practice // "square" or "symmetry" or undefined
        this.displayIndex = 0
        this.stimulusTime = trial.symmetry_time || 650
        this.isi = trial.isi || 250
        this.currentStimulus = null
        this.feedbackTime = trial.feedback_time || 500
        this.symmetryPromptText = this.trial.symmetry_prompt
        this.isDisplayingSymmetry = false
        this.minimumTime = trial.minimum_time || 500
        this.container = null
        this.preloadTime = trial.preload_time || 500
        this.listLength = trial.list_length
        this.cycles = trial.cycles || 1
        this.data = []
        this.currentCycle = 0
            
        if(this.listLength && !Array.isArray(this.listLength)) {
            this.listLength = [this.listLength]
        } else if(!trial.list_length) {
            this.listLength = [1]
        }
        this.currentListLength = this.listLength[this.currentCycle]
    }

    select(_, row, col) {
        console.log(`clicked (${row},${col})`)
        this.selection = {row, col}
        if(!this.recallPrompt.buttonVisible)
            this.recallPrompt.showButton()
    }

    /**
     * Start plugin
     */
    start() {
        setTimeout(() => {
            this.display_element.ready(() => {
                this.cycle()
            })
        }, this.preloadTime)
    }

    cycle() {
        console.log('Starting cycle ', this.currentCycle)
        this.gridRecall = false
        this.isDisplayingSymmetry = false
        this.displayIndex = 0
        this.availableSquareStimuli = Util.shuffleArray(this.availableSquareStimuli)
        this.availableSymmetryStimuli = Util.shuffleArray(this.availableSymmetryStimuli)
        if(this.availableSquareStimuli.length > 0) {
            this.squareStimuli = this.availableSquareStimuli.slice(this.availableSquareStimuli.length - this.listLength[this.currentCycle])
            this.availableSquareStimuli = this.availableSquareStimuli.splice(0, this.availableSquareStimuli.length - this.squareStimuli.length)
            this.grid = new RecallGrid(trial.rows,trial.cols, this.squareStimuli)
        }
        if(this.availableSymmetryStimuli.length > 0) {
            this.symmetryStimuli = this.availableSymmetryStimuli.slice(this.availableSymmetryStimuli.length - this.listLength[this.currentCycle])
            this.availableSymmetryStimuli = this.availableSymmetryStimuli.splice(0, this.availableSymmetryStimuli.length - this.symmetryStimuli.length)
        }
        console.log('square stimuli',this.squareStimuli,'avail',this.availableSquareStimuli)
        console.log('symmetry stimuli',this.symmetryStimuli,'avail',this.availableSymmetryStimuli)
        setTimeout(()=>this.nextDisplay(),this.isi)
    }
    
    done() {
        console.log('done')
        this.display_element.empty()
        this.currentCycle++
        
        if(this.currentCycle < this.cycles) {
            this.record(this.grid.data)
            this.cycle()
            return
        } else {
            this.record(this.grid.data, true)
            return
        }
    }

    /**
     * Record data for trial and write it to jsPsych data
     */
    record(data, finish) {
        if(Array.isArray(data)) {
            data.forEach((item, index) => {
                if(finish && index === data.length - 1) {
                    this.onFinish(item)
                } else {
                    jsPsych.data.write(item)
                }
            })
        } else {
            jsPsych.data.write(data)
        }
        
    }

    nextDisplay() {
        $(this.display_element).empty()
        if(this.squareStimuli.length > 0 && this.displayIndex == this.squareStimuli.length) {
            this.gridRecall = true
            setTimeout(()=>{
                this.render(this.display_element, null)
            },this.isi)
            return
        } else if(this.symmetryStimuli.length > 0 && this.symmetryStimuli.length == this.displayIndex) {
            this.done()
            return
        }
        if(this.symmetryStimuli.length > 0) {
            // present squares then recall, run through both
            this.currentStimulus = this.symmetryStimuli[this.displayIndex]
            this.isDisplayingSymmetry = true
            setTimeout(()=>{
                this.render(this.display_element, null)
            },this.isi)
        } else if(this.squareStimuli.length > 0) {
            // run through only square cues
            this.displayGridStimulus()
        }
    }

    promptSymmetrical() {
        const promptDone = response => {
            this.record({
                prompt: this.symmetryPrompt,
                cue: this.currentStimulus.cue,
                target: this.currentStimulus.target,
                response,
                correct: response == this.currentStimulus.target ? 1 : 0,
            })
            setTimeout(()=>{
                if(this.symmetryStimuli.length > 0 && this.squareStimuli.length > 0) {
                    this.displayGridStimulus()
                } else {
                    this.displayIndex++
                    this.nextDisplay()
                }
                
            },this.feedbackTime)
        }

        const symmetryPrompt = new SymmetryPrompt(this.symmetryPrompt,this.currentStimulus.target,promptDone)

        $(this.display_element).empty()
        setTimeout(() => {
           symmetryPrompt.render(this.display_element)
        },this.isi)
    }

    displayGridStimulus() {
        $(this.display_element).empty()
        
        setTimeout(() => {
            this.currentStimulus = this.squareStimuli[this.displayIndex]
            this.isDisplayingSymmetry = false
            this.render(this.display_element, null)
            this.displayIndex++
            setTimeout(() => {
                this.nextDisplay()
            },this.stimulusTime)
        },this.isi)
    }

    /**
    * Render plugin onto display element
    */
    render($container,doneCallback) {
        $container.ready(()=>{
            $container.empty()
            const gridRow = document.createElement('div')
            gridRow.classList.add('row')
            gridRow.classList.add('justify-content-md-center')
            const gridContainer = document.createElement('div')
            gridContainer.classList.add('col')
            gridContainer.id = "gridContainer"
            if(this.trial.title) {
                const title = document.createElement('h1')
                title.classList.add('pcllab-text-center','pcllab-default-bottom-margin-medium')
                title.innerHTML = this.trial.title
                $container.append(title)
            }
            gridRow.appendChild(gridContainer)
            this.container = gridContainer

            if(this.gridRecall) {
                gridContainer.classList.remove('col-md-12')
                gridContainer.classList.add('col-md-8')
                this.grid.render($(gridContainer),this.updateGrid,doneCallback)
            }
            if(!this.gridRecall && this.currentStimulus) {
                gridContainer.classList.remove('col-md-8')
                gridContainer.classList.add('col-md-12')
                const stimulusImage = document.createElement('img')
                stimulusImage.style.width = '100%'
                stimulusImage.src = this.currentStimulus.cue
                gridContainer.appendChild(stimulusImage)
            }

            $container.append(gridRow)
            
            const buttonContainer = document.createElement('div')
            buttonContainer.classList.add('w-100')
            buttonContainer.classList.add('text-center')

            // continue button
            const button = document.createElement('button')
            button.id = 'continue-button'
            button.innerText = 'Continue'
            button.classList.add('btn-continue')
            button.classList.add('btn')
            button.classList.add('btn-primary')
            button.classList.add('waves-effect')
            button.classList.add('waves-light')
            button.style.display = 'none'

            // Clear Button
            const clearButton = document.createElement('button')
            clearButton.id = 'clear-button'
            clearButton.innerText = 'Clear'
            clearButton.classList.add('btn-continue')
            clearButton.classList.add('btn')
            clearButton.classList.add('btn-primary')
            clearButton.classList.add('waves-effect')
            clearButton.classList.add('waves-light')
            
            clearButton.addEventListener('click', event => {
                this.grid.clearGrid(this.grid.canvas,this.grid.canvasLength)
                button.style.display = 'none'
            })

            //append buttons
            if(this.isDisplayingSymmetry) {
                button.addEventListener('click', event => {
                    this.promptSymmetrical()
                })
                buttonContainer.appendChild(button)
                setTimeout(()=>{
                    button.style.display = null
                },this.minimumTime)
            }
            if(this.gridRecall) {
                buttonContainer.appendChild(clearButton)
                buttonContainer.appendChild(button)
                button.addEventListener('click', event => {
                    this.done()
                })
            }
            $container.append(buttonContainer)
        })
    }
}

module.exports = SymmetrySpan