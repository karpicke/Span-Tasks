const Form = require('./Form');

jsPsych.plugins["pcllab-form"] = (function () {

	let plugin = {}

	plugin.info = {
		name: 'pcllab-form',
		parameters: {}
	}

	plugin.trial = (display_element, trial) => {
        trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial)

        Form.createAndRun(trial,display_element);
	}

	return plugin
})()