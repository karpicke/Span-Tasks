const LearnToCriterion = require('./learnToCriterion')

jsPsych.plugins["pcllab-learn-to-criterion"] = (function () {

    let plugin = {}

    plugin.info = {
        name: 'pcllab-learn-to-criterion',
        parameters: {}
    }

    plugin.trial = function (display_element, trial) {
        const ltc = new LearnToCriterion(display_element, trial)
        ltc.start()
    }

    return plugin
})()