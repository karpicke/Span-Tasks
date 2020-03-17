const OperationSpan = require('./driver')
const DataHandler = require('./datahandler')

jsPsych.plugins["pcllab-operation-span"] = (function () {
    let plugin = {}

    plugin.info = {
        name: 'pcllab-operation-span',
        parameters: {}
    }

    plugin.trial = function (display_element, trial) {
        trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial)

        DataHandler.initialize()
        const operationSpan = new OperationSpan(display_element, trial)
        operationSpan.startCycle()
    }

    return plugin
})()