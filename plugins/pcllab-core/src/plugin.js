const Core = require('./core')
const evaluateFunctionParameters = require('./util').evaluateFunctionParameters

jsPsych.plugins["pcllab-core"] = (function () {
	let plugin = {}

	plugin.info = {
		name: 'pcllab-core',
		parameters: {}
	}

	plugin.trial = function (display_element, trial) {
		trial = evaluateFunctionParameters(trial)

		$('body').bind('copy paste', function (e) {
			e.preventDefault(); return false;
		})

		const core = new Core(display_element, trial)
		core.start()
	}

	return plugin
})()