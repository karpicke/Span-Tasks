(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const RecallGrid = require('./recallGrid')
const SymmetryPrompt = require('./symmetryPrompt')
const Util = require('./util')

/**
 * Symmetry Span
 * 
 * Andrew Arpasi
 */

class SymmetrySpan {
    constructor(display_element, square_stimuli, symmetry_stimuli, totalDisplays, correctSymmetryCount, trial, writeHandler, onFinish) {
        this.display_element = display_element
        this.availableSquareStimuli = square_stimuli || []
        this.availableSymmetryStimuli = symmetry_stimuli || []
        this.trial = trial
        this.writeHandler = writeHandler
        this.onFinish = onFinish
        this.phase = ''
        this.practice = trial.practice // "square" or "symmetry" or undefined
        this.displayIndex = 0
        this.stimulusTime = trial.symmetry_time || 650
        this.isi = trial.isi || 250
        this.currentStimulus = null
        this.feedbackTime = trial.feedback_time || 500
        this.symmetryFeedback = trial.symmetry_feedback || false
        this.trialFeedback = trial.trial_feedback || false
        this.symmetryPromptText = this.trial.symmetry_prompt
        this.squaresFeedback = trial.squares_feedback || false
        this.squareRecallInstructions = trial.squares_instructions || 'Select the squares in order. Use the blank button to fill in forgotten squares.'
        this.isDisplayingSymmetry = false
        this.minimumTime = trial.minimum_time || 500
        this.maximumTime = trial.maximum_time || 0
        this.container = null
        this.preloadTime = trial.preload_time || 500
        this.data = []
        this.currentListPhase = 0
        this.listRange = trial.list_length
        this.correctSymmetryCount = correctSymmetryCount || 0
        this.currentCorrectSymmetryCount = 0
        this.totalDisplays = totalDisplays || 0

        if (typeof this.maximumTime === 'function') {
            this.maximumTime = this.maximumTime()
        }

        this.buildListLengths()
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
        const images = this.availableSquareStimuli.map(s=>s.cue).concat(this.availableSymmetryStimuli.map(s=>s.cue))
        Util.preloadImages(images, () => {
            setTimeout(() => {
                this.display_element.ready(() => {
                    this.listPhase()
                })
            }, this.preloadTime)
        })
    }

    buildListLengths() {
        this.listLengths = []
        for (let i = this.listRange[0]; i <= this.listRange[1]; i++) {
            this.listLengths.push(i)
        }
        this.listLengths = Util.shuffleArray(this.listLengths);
        console.log('list lengths', this.listLengths)
    }

    listPhase() {
        console.log('Starting listPhase ', this.currentListPhase)
        this.gridRecall = false
        this.isDisplayingSymmetry = false
        this.displayIndex = 0
        this.currentCorrectSymmetryCount = 0
        this.displayingSquareFeedback = false
        this.availableSquareStimuli = Util.shuffleArray(this.availableSquareStimuli)
        this.availableSymmetryStimuli = Util.shuffleArray(this.availableSymmetryStimuli)
        if(this.availableSquareStimuli.length > 0) {
            this.squareStimuli = this.availableSquareStimuli.slice(this.availableSquareStimuli.length - this.listLengths[this.currentListPhase])
            this.availableSquareStimuli = this.availableSquareStimuli.splice(0, this.availableSquareStimuli.length - this.squareStimuli.length)
            this.grid = new RecallGrid(this.trial.rows,this.trial.cols, this.squareStimuli, this.squareRecallInstructions)
        }
        if(this.availableSymmetryStimuli.length > 0) {
            this.symmetryStimuli = this.availableSymmetryStimuli.slice(this.availableSymmetryStimuli.length - this.listLengths[this.currentListPhase])
            this.availableSymmetryStimuli = this.availableSymmetryStimuli.splice(0, this.availableSymmetryStimuli.length - this.symmetryStimuli.length)
        }
        console.log('square stimuli',this.squareStimuli,'avail',this.availableSquareStimuli)
        console.log('symmetry stimuli',this.symmetryStimuli,'avail',this.availableSymmetryStimuli)
        this.nextDisplay()
    }
    
    done() {
        console.log('done')
        this.grid.data = this.grid.data.map(item => Object.assign(item, {list_length: this.listLengths[this.currentListPhase]}))

        this.currentListPhase++

        if(this.currentListPhase < this.listLengths.length && this.squareStimuli) {
            this.record(this.grid.data)
            this.listPhase()
            return
        } else if(this.squareStimuli) {
            this.record(this.grid.data, true)
            return
        }
    }

    /**
     * Record data for trial and write it to data
     */
    record(data, finish) {
        if(Array.isArray(data)) {
            data.forEach((item, index) => {
                if(finish && index === data.length - 1) {
                    this.display_element.empty()
                    this.onFinish(item)
                } else {
                    this.writeHandler(item)
                }
            })
        } else {
            if(finish) {
                this.display_element.empty()
                this.onFinish(data)
            } else {
                this.writeHandler(data)
            }
        }
        
    }

    nextDisplay() {
        $(this.display_element).empty()
        if(this.squareStimuli && this.squareStimuli.length > 0 && this.displayIndex == this.squareStimuli.length) {
            this.gridRecall = true
            this.render(this.display_element, null, this.isi)
            return
        } else if(this.symmetryStimuli && this.symmetryStimuli.length > 0 && this.symmetryStimuli.length == this.displayIndex) {
            this.done()
            return
        }
        if(this.symmetryStimuli && this.symmetryStimuli.length > 0) {
            // present squares then recall, run through both
            this.currentStimulus = this.symmetryStimuli[this.displayIndex]
            this.isDisplayingSymmetry = true
            this.symmetryStartTime = Date.now()
            this.render(this.display_element, null, this.isi)
        } else if(this.squareStimuli && this.squareStimuli.length > 0) {
            // run through only square cues
            this.displayGridStimulus()
        }
    }

    promptSymmetrical(skip) {
        const rt = Date.now() - this.symmetryStartTime

        if(skip) {
            this.record({
                prompt: this.symmetryPrompt,
                cue: this.currentStimulus.cue,
                target: this.currentStimulus.target,
                response: '',
                type: 'Problem',
                rt: this.maximumTime,
                acc: 0,
                list_length: this.listLengths[this.currentListPhase]
            }, this.symmetryStimuli.length  == this.displayIndex + 1 && !this.squareStimuli)
            if(this.symmetryStimuli.length > 0 && this.squareStimuli && this.squareStimuli.length > 0) {
                this.displayGridStimulus()
            } else {
                this.displayIndex++
                this.nextDisplay()
            }
            return
        }

        const promptDone = response => {
            setTimeout(()=>{
                this.record({
                    prompt: this.symmetryPrompt,
                    cue: this.currentStimulus.cue,
                    target: this.currentStimulus.target,
                    response,
                    type: 'Problem',
                    rt,
                    acc: response == this.currentStimulus.target ? 1 : 0,
                    list_length: this.listLengths[this.currentListPhase]
                }, this.symmetryStimuli.length  == this.displayIndex + 1 && !this.squareStimuli)
                if(this.symmetryStimuli.length == this.displayIndex + 1 && !this.squareStimuli) {
                    return
                }
                if(this.symmetryStimuli.length > 0 && this.squareStimuli && this.squareStimuli.length > 0) {
                    this.displayGridStimulus()
                } else {
                    this.displayIndex++
                    this.nextDisplay()
                }
            },this.symmetryFeedback ? this.feedbackTime : 0)
            if (response == this.currentStimulus.target) {
                this.correctSymmetryCount++
                this.currentCorrectSymmetryCount++
            }
        }

        const symmetryPrompt = new SymmetryPrompt(this.symmetryPrompt,this.currentStimulus.target,this.symmetryFeedback,promptDone)

        $(this.display_element).empty()
        setTimeout(() => {
           symmetryPrompt.render(this.display_element)
        },this.isi)
    }

    displayGridStimulus() {
        $(this.display_element).empty()
        
        this.currentStimulus = this.squareStimuli[this.displayIndex]
        this.isDisplayingSymmetry = false
        this.render(this.display_element, null, this.isi)
        this.displayIndex++
        setTimeout(() => {
            this.nextDisplay()
        },this.stimulusTime + this.isi)
    }

    displaySquaresFeedback($container) {
        if (!this.squaresFeedback)
            return

        $container.empty()

        const blankButton = document.querySelector('#blank-button')
        const deleteButton = document.querySelector('#delete-button')
        const continueButton = document.querySelector('#continue-button')
        
        blankButton.parentElement.removeChild(blankButton)
        deleteButton.parentElement.removeChild(deleteButton)

        continueButton.style.display = 'none'

        setTimeout(() => {
            continueButton.style.display = ''

            const feedbackLabel = document.createElement('h2')
            feedbackLabel.classList.add('text-center')
            feedbackLabel.style.padding = '128px 0'

            let correctCount = 0
            this.grid.data.forEach(selection => selection.acc ? correctCount++ : null)

            const correctText = `You got ${correctCount}/${this.squareStimuli.length} squares correct.`

            feedbackLabel.innerHTML = correctText

            this.displayingSquareFeedback = true

            $container.append(feedbackLabel)
        }, this.isi)
    }

    displayTrialFeedback($container) {
        if (!this.trialFeedback || this.squareStimuli.length == 0 || this.symmetryStimuli.length == 0)
            return

        $container.empty()

        const blankButton = document.querySelector('#blank-button')
        const deleteButton = document.querySelector('#delete-button')
        const continueButton = document.querySelector('#continue-button')
        
        blankButton.parentElement.removeChild(blankButton)
        deleteButton.parentElement.removeChild(deleteButton)

        continueButton.style.display = 'none'

        setTimeout(() => {
            continueButton.style.display = ''

            const feedbackLabel = document.createElement('h2')
            feedbackLabel.classList.add('text-center')
            feedbackLabel.style.padding = '64px 0'

            const accuracyLabel = document.createElement('h2')
            accuracyLabel.classList.add('text-center')

            accuracyLabel.style.padding = '16px 0'

            let correctCount = 0
            this.grid.data.forEach(selection => selection.acc ? correctCount++ : null)

            const correctText = `You got ${correctCount}/${this.squareStimuli.length} squares correct and ${this.currentCorrectSymmetryCount}/${this.symmetryStimuli.length} symmetry problems correct.`

            const accuracy = Math.round(100*(this.correctSymmetryCount/this.totalDisplays))

            if(accuracy < 85) {
                accuracyLabel.classList.add('text-danger')
            } else {
                accuracyLabel.classList.add('text-success')
            }

            const accuracyText = `Overall symmetry accuracy: ${accuracy}%`

            console.log("Trial feedback:", correctText, `total correct: ${this.correctSymmetryCount} total displays: ${this.totalDisplays}`)

            feedbackLabel.innerHTML = correctText
            accuracyLabel.innerHTML = accuracyText

            this.displayingSquareFeedback = true

            $container.append(feedbackLabel)
            $container.append(accuracyLabel)
        }, this.isi)
    }

    /**
    * Render plugin onto display element
    */
    render($container,doneCallback,isi) {
        $container.ready(()=>{
            $container.empty()
            Util.isiRender($container.get(0), isi)
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
            
            const preButtonContainer = document.createElement('div')
            preButtonContainer.classList.add('w-100')
            preButtonContainer.classList.add('text-center')

            // continue button
            const button = document.createElement('button')
            button.id = 'continue-button'
            button.innerText = 'Continue'
            button.classList.add('btn-continue')
            button.classList.add('btn')
            button.classList.add('btn-primary')
            button.classList.add('waves-effect')
            button.classList.add('waves-light')
            button.style.margin = '32px 0'

            // Blank Button
            const blankButton = document.createElement('button')
            blankButton.id = 'blank-button'
            blankButton.innerText = 'Blank'
            blankButton.classList.add('btn-continue')
            blankButton.classList.add('btn')
            blankButton.classList.add('btn-blue-grey')
            blankButton.classList.add('waves-effect')
            blankButton.classList.add('waves-light')
            blankButton.style.margin = '0 96px'
            blankButton.style.width = '128px'

            // Delete Button
            const deleteButton = document.createElement('button')
            deleteButton.id = 'delete-button'
            deleteButton.innerText = 'Delete'
            deleteButton.classList.add('btn-continue')
            deleteButton.classList.add('btn')
            deleteButton.classList.add('btn-blue-grey')
            deleteButton.classList.add('waves-effect')
            deleteButton.classList.add('waves-light')
            deleteButton.style.margin = '0 96px'
            deleteButton.style.width = '128px'

            blankButton.addEventListener('click', event => {
                this.grid.insertBlank()
            })

            deleteButton.addEventListener('click', event => {
                this.grid.clearLast(this.grid.canvas,this.grid.canvasLength)
            })

            //append buttons
            if (this.isDisplayingSymmetry) {
                let timeout = undefined
                if (this.maximumTime) {
                    timeout = setTimeout(()=>{
                        this.promptSymmetrical(true)
                    },this.maximumTime)
                }
                button.addEventListener('click', event => {
                    clearTimeout(timeout)
                    this.promptSymmetrical()
                })
                buttonContainer.appendChild(button)
                setTimeout(()=>{
                    button.style.display = null
                },this.minimumTime)
            }
            if (this.gridRecall) {
                preButtonContainer.appendChild(blankButton)
                preButtonContainer.appendChild(deleteButton)
                buttonContainer.appendChild(button)
                button.addEventListener('click', event => {
                    if (!this.displayingSquareFeedback && this.trialFeedback) {
                        this.totalDisplays += this.squareStimuli.length
                        this.displayTrialFeedback($(gridContainer))
                    } else if (!this.displayingSquareFeedback && this.squaresFeedback) {
                        this.totalDisplays += this.squareStimuli.length
                        this.displaySquaresFeedback($(gridContainer))
                    } else {
                        this.grid.done()
                        this.done()
                    }
                })
                $container.append(preButtonContainer);
            }

            $container.append(buttonContainer)
        })
    }
}

module.exports = SymmetrySpan
},{"./recallGrid":4,"./symmetryPrompt":5,"./util":6}],2:[function(require,module,exports){
/**
 * Graphics Utility Class
 * 
 * Used for various plugins such as Spatial Recall and Symmetry Span
 * 
 * Andrew Arpasi
 */

class Graphics {
	static hexToRgb(hex) {
		const res = hex.match(/[a-f0-9]{2}/gi);
		return res && res.length === 3
		  ? res.map(function(v) { return parseInt(v, 16) })
		  : null;
	}

	/**
	 * Replace a color in an image with another color
	 * Mainly used to manage backgroud colors
	 * 
	 * @param {CanvasRenderingContext2D} ctx - Canvas context 
	 * @param {number} x - X pos of image
	 * @param {number} y - Y pos of image
	 * @param {number} width - Image width
	 * @param {number} height - Image height
	 * @param {string} oldColor - Color to be replaced
	 * @param {string} newColor - Color to replace with
	 * @param {number} tolerance - Tolerance for replacement (0 < t < 255)
	 * @param {number} alpha - New color alpha (0 < a < 255)
	 */
	static overwriteColor(ctx, x, y, width, height, oldColor, newColor, tolerance = 1, alpha = 255) {
		const imageData = ctx.getImageData(x, y, width, height);
		const pixels = imageData.data;
		const oldRGB = this.hexToRgb(oldColor);
		const newRGB = this.hexToRgb(newColor);
		for (let k = 0, n = pixels.length; k < n; k += 4) {
			if(	pixels[k] >= oldRGB[0] - tolerance && 
				pixels[k+1] >= oldRGB[1] - tolerance && 
				pixels[k+2] >= oldRGB[2] - tolerance
			){
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = alpha;
			}
		}
		ctx.putImageData(imageData, x, y);
		return imageData
	}

	/**
	 * Draw an image on top of another, overlaying it and removing the background
	 * 
	 * @param {Function} imageDraw - Function to draw the image
	 * @param {CanvasRenderingContext2D} ctx - Canvas context 
	 * @param {number} x - X pos of image
	 * @param {number} y - Y pos of image
	 * @param {number} width - Image width
	 * @param {number} height - Image height
	 * @param {string} replaceColor - Color to be replaced
	 * @param {number} tolerance - Tolerance for replacement (0 < t < 255)
	 */
	static drawImageOverlay(imageDraw, ctx, x, y, width, height, replaceColor, tolerance = 0) {
		const originalData = ctx.getImageData(x, y, width, height);
		const origPixels = originalData.data;
		imageDraw()
		const imageData = ctx.getImageData(x, y, width, height);
		const pixels = imageData.data;
		const oldRGB = this.hexToRgb(replaceColor);
		for (let k = 0, n = pixels.length; k < n; k += 4) {
			if(	pixels[k] >= oldRGB[0] - tolerance && 
				pixels[k+1] >= oldRGB[1] - tolerance && 
				pixels[k+2] >= oldRGB[2] - tolerance
			){
				pixels[k] = origPixels[k];
				pixels[k+1] = origPixels[k+1];
				pixels[k+2] = origPixels[k+2];
				pixels[k+3] = origPixels[k+3];
			}
		}
		ctx.putImageData(imageData, x, y);
		return imageData
	}

	static detectGridArea(x, y, length) {
		return {
			row: parseInt(Math.floor((y/length) % length)),
			col: parseInt(Math.floor((x/length) % length))
		}
	}

	static getCellData(ctx, row, col, length) {
		const originalData = ctx.getImageData(col * length, row * length, length, length);
		return originalData;
    }
    
    static drawGrid(ctx, rows, cols, gridLength, color, thickness) {
        let cellHeight = gridLength / rows;
        let cellWidth = gridLength / cols;
        const edgeOffset = thickness / 2;
        for(let row = 0; row <= rows; row++) {
            ctx.beginPath();
            ctx.lineWidth = thickness;
            ctx.strokeStyle = color;
            ctx.moveTo(0,(row * cellHeight) + edgeOffset);
            ctx.lineTo(gridLength + edgeOffset * 2, (row * cellHeight) + edgeOffset);
            ctx.stroke();
        }
        for(let col = 0; col <= cols; col++) {
            ctx.beginPath();
            ctx.lineWidth = thickness;
            ctx.strokeStyle = color;
            ctx.moveTo((col * cellWidth) + edgeOffset, 0);
            ctx.lineTo((col * cellWidth) + edgeOffset, gridLength + edgeOffset * 2);
            ctx.stroke();
        }
    }

    static fillCell(ctx, row, col, color, cellLength, borderOffset = 0) {
        const cellX = col * cellLength;
        const cellY = row * cellLength;
        console.log(`row: ${row} col: ${col}`)
        ctx.fillStyle = color
        ctx.fillRect(cellX + (borderOffset), cellY + (borderOffset), cellLength - (borderOffset), cellLength - (borderOffset));
    }

    static cellText(ctx, row, col, text, cellLength, font, color) {
        // use canvas measureText() method
        ctx.font = font;
        ctx.fillStyle = color
        const textWidth = ctx.measureText(text).width
        const textHeight = parseInt(font.split(' ')[0]);
        console.log("Text width",textWidth,"Text height",textHeight)
        const cellCenterX = (col * cellLength) + (cellLength / 2) - (textWidth / 2);
        const cellCenterY = (row * cellLength) + (cellLength / 2) + (textHeight / 2);

        ctx.fillText(text, cellCenterX, cellCenterY); 
    }

	static drawCellBorder(ctx, row, col, length, color, thickness) {
		const originalData = ctx.getImageData(col * length, row * length, length, length);
		const imageData = ctx.getImageData(col * length, row * length, length, length);
		const pixels = imageData.data;
		const newRGB = this.hexToRgb(color);
		for (let k = 0, n = pixels.length; k < n; k += 4) {
			// top
			if((k / 4) <= thickness * length) {
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = 255;
			}
			// bottom
			if((pixels.length / 4) - (k / 4) <= thickness * length) {
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = 255;
			}
			//left side
			if((k / 4) % length <= thickness) {
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = 255;
			}
			// right side
			if(((pixels.length / 4) - (k / 4)) % length <= thickness) {
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = 255;
			}
		}
		ctx.putImageData(imageData, col * length, row * length);
		return originalData;
	}

	static restoreCell(ctx, row, col, length, original) {
		const origPixels = original.data;
		const imageData = ctx.getImageData(col * length, row * length, length, length);
		const pixels = imageData.data;
		for (let k = 0, n = pixels.length; k < n; k += 4) {
			if(	origPixels[k] != pixels[k]) {
				pixels[k] = origPixels[k];
				pixels[k+1] = origPixels[k+1];
				pixels[k+2] = origPixels[k+2];
				pixels[k+3] = origPixels[k+3];
			}
		}
		ctx.putImageData(imageData, col * length, row * length);
	}
}

module.exports = Graphics
},{}],3:[function(require,module,exports){
const SymmetrySpan = require('./SymmetrySpan')

jsPsych.plugins["pcllab-symmetry-span"] = (function () {

	let plugin = {}

	plugin.info = {
		name: 'pcllab-symmetry-span',
		parameters: {}
	}

	plugin.trial = (display_element, trial) => {
        trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial)
        
        const start = (square_stimuli, symmetry_stimuli) => {
            // set default params if not set already
            if(!symmetry_stimuli) symmetry_stimuli = []
            if(!square_stimuli) square_stimuli = []

            const numCycles = trial.cycles || 1

            let cycle = 1

            // persist between cycles
            let availableSymmetryStimuli = symmetry_stimuli
            let totalDisplays = 0
            let correctSymmetryCount = 0

            const write = (data) => {
                const fullData = Object.assign(data, {
                    cycle
                })
                jsPsych.data.write(fullData)
            }

            const onFinish = (data) => {
                if (cycle == numCycles) {
                    const fullData = Object.assign(data, {
                        cycle
                    })
                    jsPsych.finishTrial(fullData)
                } else {
                    availableSymmetryStimuli = this.symmetrySpan.availableSymmetryStimuli
                    totalDisplays = this.symmetrySpan.totalDisplays
                    correctSymmetryCount = this.symmetrySpan.correctSymmetryCount
                    console.log("Start Cycle", cycle)
                    write(data)
                    cycle++
                    run(onFinish)
                }
            }

            const run = (onFinish) => {
                this.symmetrySpan = new SymmetrySpan(display_element, square_stimuli.slice(), availableSymmetryStimuli.slice(), totalDisplays, correctSymmetryCount, trial, write, onFinish)
            
                this.symmetrySpan.start()
            }

            run(onFinish)
        }

        if (trial.url) { // load displays from JSON file
            $.getJSON(trial.url, function (data) {
                start(data.square_stimuli, data.symmetry_stimuli)
            })
        } else {
            start(trial.square_stimuli, trial.symmetry_stimuli)
        }
	}

	return plugin
})()
},{"./SymmetrySpan":1}],4:[function(require,module,exports){
const Util = require('./util')
const Graphics = require('./graphics')

class RecallGrid {
    // target format: { row: Number, col: Number }
    constructor(rows, cols, square_stimuli, instructions, properties = {}) {
        this.properties = Object.assign({
            backgroundColor: '#FFFFFF',
            backgroundAlpha: 0,
            borderColor: '#212121',
            borderThickness: 2,
            cellColor: '#ff5b3a',
            textColor: '#212121',
            margin: '60px auto',
            cellFont: '20px Arial'
        }, properties)
        this.gridState = {}
        this.gridHistory = []
        this.rowCount = rows || 4
        this.columnCount = cols || 4
        this.squareStimuli = square_stimuli
        this.startTime = Date.now()
        this.instructions = instructions
        this.data = []
    }

    recallIndex() {
        return this.gridHistory.length
    }

    select(canvas, cell, length) {
        const ctx = canvas.getContext("2d")

        if(!this.gridState[cell.row]) this.gridState[cell.row] = {}
        if(this.gridState[cell.row][cell.col] > 0) return
        if (this.gridHistory.length >= this.columnCount * this.rowCount)
            return
        
        this.gridHistory.push(cell)
        const response = `${String.fromCharCode(65 + cell.col)}${cell.row + 1}`

        if(this.recallIndex() <= this.squareStimuli.length) {
            const currentStimulus = this.squareStimuli[this.recallIndex() - 1]

            const target = `${String.fromCharCode(65 + currentStimulus.target_col - 1)}${currentStimulus.target_row}`

            const data = {
                cue: currentStimulus.cue,
                target,
                response,
                acc: target === response ? 1 : 0,
                rt: Date.now() - this.startTime, // Start time needs to be fixed
                type: 'Recall'
            }
            this.data.push(data)
        } else {
            const data = {
                cue: '', // TODO: Figure out variable length data output
                target: '',
                response,
                acc: 0,
                rt: Date.now() - this.startTime, // Start time needs to be fixed
                type: 'Recall'
            }
            this.data.push(data)
        }
        this.gridState[cell.row][cell.col] = this.gridHistory.length
        console.log("Recall index: ", this.recallIndex())
        this.renderGrid(canvas, length)
    }

    done() {
        // Fill in empty response rows for unfilled targets
        if(this.recallIndex() < this.squareStimuli.length) {
            for(let i = this.recallIndex(); i < this.squareStimuli.length; i++) {
                const currentStimulus = this.squareStimuli[i]
                const target = `${String.fromCharCode(65 + currentStimulus.target_col - 1)}${currentStimulus.target_row}`
                
                const data = {
                    cue: currentStimulus.cue,
                    target,
                    response: '',
                    acc: 0,
                    rt: Date.now() - this.startTime, // Start time needs to be fixed
                    type: 'Recall'
                }
                this.data.push(data)
            }
        }
    }

    insertBlank() {
        if (this.gridHistory.length >= this.columnCount * this.rowCount)
            return
        this.gridHistory.push({blank: true})
        if (this.recallIndex() <= this.squareStimuli.length) {
            const currentStimulus = this.squareStimuli[this.recallIndex() - 1]

            const target = `${String.fromCharCode(65 + currentStimulus.target_col - 1)}${currentStimulus.target_row}`

            const data = {
                cue: currentStimulus.cue,
                target,
                response: 'blank',
                acc: 0,
                rt: Date.now() - this.startTime, // Start time needs to be fixed
                type: 'Recall'
            }
            this.data.push(data)
        } else {
            const data = {
                cue: '', // TODO: Figure out variable length data output
                target: '',
                response: 'blank',
                acc: 0,
                rt: Date.now() - this.startTime, // Start time needs to be fixed
                type: 'Recall'
            }
            this.data.push(data)
        }
    }

    clearLast(canvas, length) {
        if(this.gridHistory.length == 0) return
        const lastItem = this.gridHistory.pop()
        this.data.pop()
        if(lastItem.blank) return
        const ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.gridState[lastItem.row][lastItem.col] = null
        this.renderGrid(canvas, length)
    }

    clearGrid(canvas, length) {
        const ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.gridState = {}
        this.gridHistory = []
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
                if(this.gridState[row][col]) {
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
                }
            })
        })
    }

    render($container) {
        $container.ready(()=>{
            const canvasLength = $container.width() < 320 ? 2 * Math.round($container.width()/2) : 320
            const canvas = document.createElement('canvas')
            canvas.setAttribute('width',canvasLength),
            canvas.setAttribute('height',canvasLength)
            canvas.style.margin = this.properties.margin
            canvas.id = 'grid-canvas'
            this.canvas = canvas
            this.canvasLength = canvasLength - this.properties.borderThickness * 2

            canvas.style.display = 'block'
            canvas.style.cursor = 'pointer'

            this.renderGrid(canvas, canvasLength - this.properties.borderThickness * 2)

            const instructionsLabel = document.createElement('h4')
            instructionsLabel.classList.add('text-center')
            instructionsLabel.innerHTML = this.instructions
            
            $container.append(instructionsLabel)
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
},{"./graphics":2,"./util":6}],5:[function(require,module,exports){
class SymmetryPrompt {
    constructor(promptText, target, showFeedback, responseCallback) {
        this.promptText = promptText || "Is this symmetrical?"
        this.target = target
        this.showFeedback = showFeedback
        this.responseCallback = responseCallback
    }

    handleResponse(response, callback) {
        const isCorrect = this.target === response
        callback(isCorrect);
        this.responseCallback(response);
    }

    render($container) {
        $container.ready(()=>{
            const $prompt = $('<h2>', {
                class: 'pcllab-text-center pcllab-default-bottom-margin-medium',
                text: this.promptText
            })

            $prompt.css('padding', '128px 0')

            const $yesButton = $('<button>', {
                class: 'btn btn-large btn-primary waves-effect waves-light mr-5',
                text: 'Yes'
            })
            
            const $noButton = $('<button>', {
                class: 'btn btn-large btn-primary waves-effect waves-light ml-5',
                text: 'No'
            })

            const $buttonRow = $(`<div class="row">`)
            const $buttonContainer = $(`<div class="col text-center">`)

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

            $buttonContainer.append($yesButton)
            $buttonContainer.append($noButton)
            $buttonRow.append($buttonContainer)

            $container.append($prompt)
            $container.append($buttonContainer)

            $yesButton.click(()=>{
                this.handleResponse(true, isCorrect =>{
                    if(this.showFeedback)
                        $buttonContainer.append(isCorrect ? $correctFeedback : $incorrectFeedback)
                })
            })

            $noButton.click(()=>{
                this.handleResponse(false, isCorrect =>{
                    if(this.showFeedback)
                        $buttonContainer.append(isCorrect ? $correctFeedback : $incorrectFeedback)
                })
            })
        })
    }
}

module.exports = SymmetryPrompt
},{}],6:[function(require,module,exports){
class Util {
	static setParameter(value, defaultValue, expectedType) {
		if (expectedType && typeof value === expectedType) {
			return value
		}
	
		if (typeof value !== 'undefined') {
			return value
		}
	
		return defaultValue
	}

	static shuffleArray(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
    }

    static isiRender(element, isi) {
        if (!isi) return
        element.style.visibility = 'hidden'
        setTimeout(() => {
            element.style.visibility = 'visible'
        }, isi)
    }
    
    static preloadImages(imagePaths, completionHandler) {
        let loadCount = 0
        imagePaths.forEach(imagePath => {
            const image = new Image()

            image.addEventListener('load', () => {
                loadCount++
                if (loadCount == imagePaths.length) {
                    completionHandler()
                    console.log("Preloaded " + loadCount + " images")
                }
                // const progressBar = `[${'#'.repeat(Math.floor((loadCount/imagePaths.length)*20))}${' '.repeat(Math.ceil((1-(loadCount/imagePaths.length))*20))}]`
                // console.log(progressBar, 'Preloaded:', imagePath)
            })

            image.src = imagePath
        })
    }
}

module.exports = Util

},{}]},{},[1,2,3,4,5,6]);
