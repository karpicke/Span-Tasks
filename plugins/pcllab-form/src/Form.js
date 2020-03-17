/**
 * @name <pcllab-form>
 *
 * @param {string} title - This title will appear above the plugin.
 * @param {string} instructions - Text prompt that will appear in the trial
 * @param {string=Continue} button_text - Text that will appear on the 'continue' button.
 * @param {string} type - Name of the plugin (pcllab-math-equation)
 * @param {string} questions - Object containing questions and pages
 * @param {string} questionFile - JSON file containing an array of questions for the survery
 * @param {boolean} demographics - If true, will show the demographics form.
 * @param {boolean} environment - If true, will show the environment survey form.
 * @param {number} pageLength - Default: 5, the number of questions per page.
 * @param {boolean} randomize - Default: false, if true will randomize order of questions
 * 
 * @author Jeremy Lehman
 * @author Andrew Arpasi
 */
const QuestionsHandler = require('./QuestionsHandler');
const PageHandler = require('./PageHandler');

class Form {
    constructor(trial, questions, displayElement) {
        this.trial = trial;
        this.title = trial.title || 'Form';
        this.questions = questions;
        this.questionsHandler = new QuestionsHandler(this.questions);
        this.pageHandler = new PageHandler(this.questionsHandler, trial);
        this.pages = this.pageHandler.createSurveyPages(this.questions);
        this.displayElement = displayElement;
        this.pageIndex = 0;
        this.responses = {};
        this.required = {};
        this.fields = [];
        this.attemptedSubmit = false;
        this.startTime = Date.now();
        this.unfulfilled = [];
    }

    static createAndRun(trial, display_element) {
        if (trial.questions) {
            const form = new Form(trial, trial.questions, display_element);
            form.run();
        } else if (trial.questionFile) {
            $.getJSON(trial.questionFile, questions => {
                const form = new Form(trial, questions, display_element);
                form.run();
            });
        } else {
            throw Error('Questions must be specified for this plugin, either via JSON file or JS object.');
        }
    }

    run() {
        //intialize fields array used for data ordering
        this.questionsHandler.flatQuestions().forEach(question => {
            this.required[question.name] = question.optional ? false : true;
        })
        this.iterateInputs((input) => {
            if (!this.fields.includes(input.name))
                this.fields.push(input.name);
            this.responses[input.name] = null
        })
        this.loadNextPage();
    }

    submit() {
        this.attemptedSubmit = true;

        if (!this.requirementsCheck(true)) return;

        const flatQuestions = this.questionsHandler.flatQuestions();
        flatQuestions.forEach((question, index) => {
            const response = QuestionsHandler.formattedResponse(this.responses[question.name])
            const data = {
                response_index: question.name,
                cue: flatQuestions[index].question || 'unknown',
                response: response
            }
            if (index < flatQuestions.length - 1) {
                jsPsych.data.write(data)
            } else {
                if (this.trial.honeypot && (document.getElementById('accept_terms').checked || document.getElementById('accept_terms').value == 1)) {
                    jsPsych.data.write({
                        'honeypot': true
                    });
                }
                return jsPsych.finishTrial(Object.assign(data, {
                    rt: Date.now() - this.startTime,
                    timestamp: new Date().toString()
                }));
            }
        })
        this.displayElement.html('');
    }

    onContinue() {
        this.recordResponses()
        if (this.pageIndex === this.pages.length) {
            this.submit();
        } else {
            this.loadNextPage();
        }
    }

    loadNextPage() {
        this.displayElement.html('');
        const formPageContainer = $('<div>', {
            class: 'pcllab-template pcllab-form'
        });

        formPageContainer.append(
            $(`<h1 style='text-align: center; padding-bottom: 12px;'>
            ${this.title}
        </h1>`)
        );

        formPageContainer.append(this.pages[this.pageIndex]);

        formPageContainer.append(
            this.pageHandler.createButtons(
                this.onContinue.bind(this), 
                this.loadPreviousPage.bind(this), 
                this.pages, 
                this.pageIndex
            )
        );

        this.displayElement.append(formPageContainer);

        this.pageIndex++;
    }

    loadPreviousPage() {
        this.pageIndex -= 2;
        this.loadNextPage();
        if (this.attemptedSubmit) this.requirementsCheck();
    }

    iterateInputs(questionCallback) {
        this.pages.forEach((page) => {
            const form = $(page[0])
            form.find(':input').each((index, input) => {
                questionCallback(input)
            })
        })
    }

    recordResponses() {
        this.iterateInputs((input) => {
            if (input.type === 'checkbox' && input.checked === true) {
                if (!this.responses[input.name]) this.responses[input.name] = [];
                this.responses[input.name].push(input.value)
            } else if (input.type === 'radio' && input.checked === true) {
                this.responses[input.name] = input.value
            } else if (input.type != 'checkbox' && input.type != 'radio') {
                this.responses[input.name] = input.value
            }
        })
        console.log(this.responses)
    }

    clearRequired() {
        this.fields.forEach(field => {
            const requiredQuestion = document.getElementById(`rq-${field}`);
            if (!requiredQuestion) return;
            requiredQuestion.style.display = 'none';
        })
    }

    displayRequired(name) {
        const requiredQuestion = document.getElementById(`rq-${name}`);
        if (!requiredQuestion) return;
        requiredQuestion.style.display = 'block';
    }

    requirementsCheck(displayAlert) {
        const flatQuestions = this.questionsHandler.flatQuestions();
        this.unfulfilled = [];
        flatQuestions.forEach((question, index) => {
          const response = QuestionsHandler.formattedResponse(this.responses[question.name])
          if (this.required[question.name] && (!response || response.trim().length == 0)) {
            this.unfulfilled.push(question.name)
          }
        })
        //let alertMsg = 'The following questions are required: \n' + unfulfilled.join('\n');
        if (this.unfulfilled.length > 0) {
          if (displayAlert) alert('Please fill out all required fields before continuing.');
          this.clearRequired();
          this.unfulfilled.forEach(name => {
            this.displayRequired(name);
          })
          return false;
        }
        return true;
      }
}

module.exports = Form;