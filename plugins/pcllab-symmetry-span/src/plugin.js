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

            const onFinish = (data) => {
                jsPsych.finishTrial(data)
            }

            const symmetrySpan = new SymmetrySpan(display_element, square_stimuli, symmetry_stimuli, trial, onFinish)
            
            symmetrySpan.start()
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