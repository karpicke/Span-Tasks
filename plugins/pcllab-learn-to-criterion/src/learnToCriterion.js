/**
 * @name Learn To Criterion
 *
 * @param {string}      [title]                 The optional title
 * @param {string}      [button_text]           Text that will appear in place of 'Continue' on the button
 * @param {boolean}     [show_button]           Toggle showing the button to proceed
 * @param {number}      [max_recall_time]       The amount of time (in milliseconds) permitted for a recall screen
 * @param {number}      [max_study_time]        The amount of time (in milliseconds) permitted for a recall screen
 * @param {number}      [instructions_time]     The amount of time (in milliseconds) permitted for a recall screen
 * @param {number}      [minimum_time]          The amount of time until the experiment can be submitted
 * @param {boolean}     [user_timing]           If true, cue is shown until the user clicks on the continue button
 * @param {boolean}     [randomize]             If set to true, the order in which cues for study and recall trials appear is random
 * @param {boolean}     [show_progress]         Show progress bar when maximum time is specified
 * @param {number}      [isi_time]              Time between trials. Must be between 0 - 10000 ms
 * @param {number}      [max_attempts]          Maximum number of repeats allowed before the trials are ended
 * @param {list}        [word_list]             List of cues (and targets) for the trial
 * @param {string}      [word_list_url]         Url to JSON file with a word list
 * @param {string}      [study_instructions]    Instructions to show before the study phase
 * @param {string}      [recall_instructions]   Instructions to show before the recall phase
 * 
 * @param {function}    [hook]
 * 
 * @author Vishnu Vijayan
 */

const FreeRecall = require('./freeRecall')
const WordPairs = require('./wordPairs')
const PluginEngine = require('./pluginEngine')
const Data = require('./data')

/* Util */
const setParameter = require('./util').setParameter

// LTC modes enum
const LTC_MODES = {
    WORD_PAIRS: 'word_pairs',
    FREE_RECALL: 'free_recall',
    LTC_PLUGINS: 'ltc_plugins'
}

class LearnToCriterion {

    constructor(display_element, trial) {
        if (!display_element) {
            throw new Error("Invalid display element", display_element)
        }

        if (!trial) {
            throw new Error("Invalid trial", trial)
        }

        /* Stimulus parameters */
        this.word_list = trial.word_list
        this.word_list_url = trial.word_list_url
        this.max_attempts = isNaN(trial.max_attempts) ? -1 : trial.max_attempts
        this.randomize = typeof trial.randomize === "undefined" ? false : trial.randomize

        /* Display parameters */
        this.button_text = trial.button_text || 'Next'
        this.title = trial.title || null
        this.study_instructions = trial.study_instructions || null
        this.recall_instructions = trial.recall_instructions || null
        this.show_progress = typeof trial.show_progress === "undefined" ? false : trial.show_progress
        this.show_button = typeof trial.show_button === "undefined" ? true : trial.show_button

        /* Timing parameters */
        this.user_timing = trial.user_timing || false
        this.max_recall_time = isNaN(trial.max_recall_time) ? -1 : trial.max_recall_time
        this.max_study_time = isNaN(trial.max_study_time) ? -1 : trial.max_study_time
        this.instructions_time = isNaN(trial.instructions_time) ? -1 : trial.instructions_time
        this.isi_time = isNaN(trial.isi_time) ? 2000 : trial.isi_time

        /* Word-pairs parameters */
        this.post_recall_cb = trial.post_recall_cb || (() => { })

        /* Feedback parameters */
        this.correct_feedback = setParameter(trial.correct_feedback, false, 'boolean')
        this.correct_feedback_time = setParameter(trial.correct_feedback_time, 1500, 'number')

        /* Plugin Engine parameters */
        this.hook = trial.hook
        this.trial_list = trial.trial_list
        this.auto_validate = typeof trial.auto_validate === "undefined" ? true : trial.auto_validate
        this.instructions = trial.instructions

        /* Internal properties */
        this.$display_element = $(display_element)
        this.data = new Data()

        if (!trial.mode) {
            throw new Error("Invalid trial mode.")
        }

        switch (trial.mode.toLowerCase()) {
            case LTC_MODES.WORD_PAIRS:
                this.mode = LTC_MODES.WORD_PAIRS
                break
            case LTC_MODES.FREE_RECALL:
                this.mode = LTC_MODES.FREE_RECALL
                break
            case LTC_MODES.LTC_PLUGINS:
                this.mode = LTC_MODES.LTC_PLUGINS
                break
            default:
                throw new Error("Invalid trial mode.")
        }

        if (this.isi_time < 0) {
            console.warn("isi_time must be between 0 and 10000. Setting to 0")
            this.isi_time = 0
        }

        if (this.isi_time > 10000) {
            console.warn("isi_time must be between 0 and 10000. Setting to 10000")
            this.isi_time = 10000
        }
    }

    start() {
        // Fetch materials before starting
        if (this.word_list_url) {
            const self = this
            $.getJSON(this.word_list_url, (data) => {
                self.word_list = data
                self._start()
            })
        } else {
            if ((this.mode === LTC_MODES.FREE_RECALL || this.mode === LTC_MODES.WORD_PAIRS) && !this.word_list) {
                throw new Error("No word list present")
            }
            this._start()
        }
    }

    _start() {
        if (this.mode === LTC_MODES.FREE_RECALL) {
            const freeRecall = new FreeRecall(this)
            freeRecall.start()
        } else if (this.mode === LTC_MODES.WORD_PAIRS) {
            const wordPairs = new WordPairs(this)
            wordPairs.start()
        } else if (this.mode === LTC_MODES.LTC_PLUGINS) {
            const pluginEngine = new PluginEngine(this)
            pluginEngine.start()
        }
    }

    end() {
        this.$display_element.empty()
        this.data.finishTrial()
    }
}

module.exports = LearnToCriterion