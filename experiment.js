CONSTANTS = {
    math_stimulus_file: 'materials/math_stimuli.json',
    s1_stimulus_file: 'materials/word-pairs.json', // or debug.json
    s2_stimulus_file: 'materials/word-pairs.json',
    instructions_file: 'materials/instructions.json',
}

class Experiment {
    constructor() {
        this.session = jsPsych.data.urlVariables().session
        this.workerId = jsPsych.data.urlVariables().workerId
        this.cbOrder = jsPsych.data.urlVariables().cbOrder

        this.instructions = null

        /* Session 1*/
        this.rawStimuliS1 = null
        this.rawStimuliS2 = null
        this.mathStimuli = []
        this.ltcStimuli = []
        this.ltcStimuliMap = {}
        this.ltcSwitch = true

        /* Session 2 */
        this.ospanMaximumTime = null

        this.timeline = []

        this.loadMaterials()
    }

    loadMaterials() {
        const self = this
        $.when(
            $.getJSON(CONSTANTS.math_stimulus_file, (data) => {
                self.mathStimuli = data
            }),
            $.getJSON(CONSTANTS.instructions_file, (data) => {
                self.instructions = data
            }),
        ).then(() => {
            self.buildTimeline()
        })
    }

    buildTimeline() {
        if (this.session === "Ospan") {
            this.buildOperationSpan()
        } else if (this.session === "Sspan") {
            this.buildSymmetrySpan()
        }
    }

    buildOperationSpan() {
        console.log("buildOperationSpan")

        const letterInstructions = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-letters']],
            show_button: true,
            button_text: 'Begin',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        const practiceLetters = {
            type: 'pcllab-operation-span',
            list_length: [2, 2],
            cycles: 2,
            letter_stimuli: ['F', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'Y'],
            isi: 250,
            button_text: 'Continue',
            letter_feedback: true,
            data: {
                phase: "practice-letters"
            }
        }

        const mathInstructions = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-math']],
            show_button: true,
            button_text: 'Begin',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        const practiceMath = {
            type: 'pcllab-operation-span',
            list_length: [16, 16],
            cycles: 1,
            math_stimuli: this.mathStimuli,
            isi: 250,
            button_text: 'Continue',
            math_label: 'When you have solved the math problem, click continue',
            math_feedback: true,
            data: {
                phase: "practice-math"
            }
        }

        const practiceOspanInstructions = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-ospan']],
            show_button: true,
            button_text: 'Begin',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        const practiceOspan = {
            type: 'pcllab-operation-span',
            list_length: [2, 2],
            cycles: 3,
            math_stimuli: this.mathStimuli,
            letter_stimuli: ['F', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'Y'],
            isi: 250,
            maximum_time: this.calculateOspanMaximumTime(),
            button_text: 'Continue',
            math_label: '',
            trial_feedback: true,
            data: {
                phase: "practice-ospan"
            }
        }

        const actualOspanInstructions = {
            type: 'pcllab-core',
            stimuli: [this.instructions['actual-ospan']],
            show_button: true,
            button_text: 'Begin',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        const actualOspan = {
            type: 'pcllab-operation-span',
            list_length: [3, 7],
            cycles: 3,
            math_stimuli: this.mathStimuli,
            letter_stimuli: ['F', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'Y'],
            isi: 250,
            maximum_time: this.calculateOspanMaximumTime(),
            button_text: 'Continue',
            math_label: '',
            trial_feedback: true,
            data: {
                phase: "actual-ospan"
            }
        }

        this.timeline = this.timeline.concat([
            letterInstructions,
            practiceLetters,
            mathInstructions,
            practiceMath,
            practiceOspanInstructions,
            practiceOspan,
            actualOspanInstructions,
            actualOspan
        ])

        if (this.session === "Ospan") {
            this.run()
        }
    }

    calculateOspanMaximumTime() {
        return () => {
            if (this.ospanMaximumTime) {
                return this.ospanMaximumTime
            }

            const data = []
            const filteredData = jsPsych.data.getData().filter(d => d.phase === "practice-math")
            filteredData.forEach((d, i) => {
                if (d.acc === 1) {
                    data.push(filteredData[i - 1].rt_last_keypress)
                }
            })

            if (data.length === 0) {
                this.ospanMaximumTime = 5000
            } else {
                const mean = data.reduce((a, b) => a + b) / data.length
                const sd = Math.sqrt(data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (data.length - 1))
                this.ospanMaximumTime = mean + 2.5 * sd
                console.log('mean',mean,'stdev',sd)
                console.log('calculated max time', this.ospanMaximumTime)
            }

            return this.ospanMaximumTime
        }
    }

    buildSymmetrySpan() {
        const symmetryMaxTime = () => {
            let practiceEntries = jsPsych.data.getData().filter(d => d.phase === "practice-symmetry" && d.acc === 1).map(d => d.rt)
            let totalRt = practiceEntries.reduce((a, b) => a + b)
            if (practiceEntries.length == 0) {
                return 5000 // edge case of everything incorrect
            }
            const mean = totalRt / practiceEntries.length
            const stdev = Math.sqrt(practiceEntries.map(x => Math.pow(x-mean,2)).reduce((a,b) => a+b)/(practiceEntries.length-1));
            const maxtime = mean + 2.5 * stdev
            console.log('mean',mean,'stdev',stdev)
            console.log('calculated max time', maxtime)
            return maxtime
        }

        const lookUp = {
            type: 'pcllab-core',
            stimuli: [this.instructions['look-up']],
            response_count: 0,
            show_button: true,
            button_text: 'Continue',
            data: {
                phase: 'instructions',
            }
        }

        const squareInstructions = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-squares']],
            show_button: true,
            button_text: 'Begin',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        // Practice Squares
        const practiceSquares = {
            type: 'pcllab-symmetry-span',
            list_length: [2, 2],
            cycles: 2,
            url: 'materials/practice-squares.json',
            isi: 250,
            button_text: 'Continue',
            squares_feedback: true,
            minimum_time: 5000,
            data: {
                phase: "practice-squares"
            }
        }

        // Symmetry Instructions with Examples
        const symmetryInstructions1 = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-symmetry-1']],
            show_button: true,
            button_text: 'Continue',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        const symmetryExample1 = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-example-1']],
            show_button: true,
            button_text: 'Continue',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        const symmetryExample2 = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-example-2']],
            show_button: true,
            button_text: 'Continue',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        const symmetryExample3 = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-example-3']],
            show_button: true,
            button_text: 'Continue',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        const symmetryExample4 = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-example-4']],
            show_button: true,
            button_text: 'Continue',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        const symmetryInstructions2 = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-symmetry-2']],
            show_button: true,
            button_text: 'Begin',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        // Practice Symmetry
        const practiceSymmetry = {
            type: 'pcllab-symmetry-span',
            list_length: [15], // 15
            cycles: 1,
            url: 'materials/practice-symmetry.json',
            isi: 250,
            button_text: 'Continue',
            symmetry_feedback: true,
            // randomize: true // we need to be able to randomize this
            data: {
                phase: "practice-symmetry"
            }
        }

        const practiceSspanInstructions = {
            type: 'pcllab-core',
            stimuli: [this.instructions['practice-sspan']],
            show_button: true,
            button_text: 'Begin',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        // Practice Symmetry Span
        const practiceSspan = {
            type: 'pcllab-symmetry-span',
            list_length: [2, 2], // length 2
            cycles: 3, // 3 cycles, so 3 trials of length 2
            url: 'materials/practice-sspan.json',
            maximum_time: symmetryMaxTime,
            isi: 250,
            button_text: 'Continue',
            trial_feedback: true,
            data: {
                phase: "practice-sspan"
            }
        }

        const actualSspanInstructions = {
            type: 'pcllab-core',
            stimuli: [this.instructions['actual-sspan']],
            show_button: true,
            button_text: 'Begin',
            response_count: 0,
            data: {
                phase: "instructions"
            }
        }

        // Actual Symmetry Span
        const actualSspan = {
            type: 'pcllab-symmetry-span',
            list_length: [2, 5], // lengths 2, 3, 4, and 5
            cycles: 3, // 3 cycles, so 12 trials total
            url: 'materials/actual-sspan.json',
            isi: 250,
            button_text: 'Continue',
            trial_feedback: true,
            maximum_time: symmetryMaxTime,
            data: {
                phase: "actual-sspan"
            }
        }

        this.timeline = this.timeline.concat([
            lookUp,
            squareInstructions,
            practiceSquares,
            symmetryInstructions1,
            symmetryExample1,
            symmetryExample2,
            symmetryExample3,
            symmetryExample4,
            symmetryInstructions2,
            practiceSymmetry,
            practiceSspanInstructions,
            practiceSspan,
            actualSspanInstructions,
            actualSspan
        ])

        if (this.session === "Sspan") {
            this.run()
        }

    }

    run() {
        jsPsych.init({
            timing_post_trial: 250,
            display_element: $("div#experiment_container"),
            timeline: this.timeline,
            on_finish: () => {
                jsPsych.data.addProperties({
                    worker_id: this.workerId,
                    session: this.session,
                    cb_order: this.cbOrder,
                    // condition: this.condition,
                    timestamp: new Date().toUTCString()
                })

                let myData = jsPsych.data.dataAsJSON() // Data for the experiment
                $.ajax(`https://jarvis.psych.purdue.edu/api/v1/experiments/data/${CONSTANTS.experiment_id}`, {
                    data: myData,
                    contentType: 'application/json',
                    type: 'POST'
                })

                $('#jspsych-content').css('text-align', 'center');
                $('#jspsych-content').html(`
                    <h2>Thank you for your participation!</h2><br><br>
                    <h4>Please remain seated quietly</h4>
                    <h4>until everyone else is finished</h4>
                    `)

                if (this.session === "2") {
                    $('#jspsych-content').html(`
					<h2>Thank you for your participation!</h2>
				  	<h4>Please remain seated quietly</h4>
				  	<h4>until everyone else is finished</h4><br><br>	
					<a href="debriefing.html" target="_blank">Click here to read about the purpose of this experiment</a>
                    `)
                }

                // jsPsych.data.localSave('WMRP-E2-' + this.workerId + '-' + this.session + '.csv', 'csv')
            }
        })
    }
}