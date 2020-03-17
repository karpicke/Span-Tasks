(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./PageHandler":2,"./QuestionsHandler":3}],2:[function(require,module,exports){
class PageHandler {
    constructor(questionsHandler, trial) {
        this.trial = trial;
        this.questionsHandler = questionsHandler;
    }

    createSurveyPages(questions) {
        let chunkedQuestions = [];
        if (!Array.isArray(questions[0]))
            chunkedQuestions = this.questionsHandler.chunkQuestions(this.trial.pageLength);
        else if (questions)
            chunkedQuestions = questions;

        return this.createHTMLPages(chunkedQuestions);
    }

    createHTMLPages(chunkedQuestions) {
        const htmlPages = chunkedQuestions.map(chunk =>
            this.convertChunkToHTMLPage(chunk)
        );
        return htmlPages;
    }

    convertChunkToHTMLPage(chunk) {
        const formQuestionsContainer = $('<form>');

        const instructions = this.trial.instructions;
        if (instructions && instructions.trim().length > 0) {
            const instructionsContainer = $('<div>', {
                class: 'row mx-4 mb-2 p-2'
            });
            const instructionsEl = $(`<p>${instructions}</p>`);
            instructionsContainer.append(instructionsEl);
            formQuestionsContainer.append(instructionsContainer);
        }

        if (this.randomize) {
            chunk = this.questionsHandler.randomize(chunk);
        }

        chunk.forEach(question =>
            formQuestionsContainer.append(this.createHTMLQuestion(question))
        );

        //formQuestionsContainer.append(honeypotField);

        return formQuestionsContainer;
    }

    createHTMLQuestion(question) {
        const questionContainer = $('<div>', {
            class: 'row mx-4 mb-3 p-2',
            id: question.name,
        });
        questionContainer.append($(`<h3>${question.question}</h3>`));
        switch (question.type) {
            case 'checkbox':
            case 'radio':
                questionContainer.append(this.createInputOptions(question));
                break;
            default:
                const formControlContainer = $(`<div>`, {
                    class: 'md-form',
                    style: 'margin: 0; width: 100%',
                })
                formControlContainer.append($(`
              <input style="width: 100%" type="${question.type}" name="${question.name}" id="f-${question.name}" class="form-control"/>
            `));
                questionContainer.append(formControlContainer)
        }
        const requiredField = $('<p>', {
            style: 'color: red; font-size: 1rem; display: none;',
            id: `rq-${question.name}`,
        }).text('This question is required.');
        questionContainer.append(requiredField);

        return questionContainer;
    }

    createInputOptions(question) {
        const optionsContainer = $('<div>', {
            class: 'col-md-12',
        });
        question.options.forEach(option => {
            const id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 7);
            let value = option.value || option;
            let label = option.label || option;
            // if(typeof option === 'object' && option.value) {
            //   value = option.value
            // }
            optionsContainer.append(
                `
            <div class="custom-control custom-${question.type}">
              <input type="${question.type}" id="${id}" name="${question.name}" value="${value}" class="custom-control-input"/>
              <label for="${id}" class="custom-control-label">${label}</label>
            </div>
            `
            );
        });

        return optionsContainer;
    }

    createButtons(continueCallback, previousCallback, pages, pageIndex) {
        const buttonsRow = $('<div>', {
            class: 'row',
        });

        const buttonsContainer = $('<div>', {
            class: 'col-md-6 offset-md-3 text-center'
        })

        const continueButton = $('<button>', {
            id: 'continue-button',
            class: 'btn btn-primary btn-lg',
            text: this.pageIndex === pages.length ? 'Submit' : 'Continue'
        });

        continueButton.append(
            continueButton.on('click', continueCallback)
        );

        const previousButton = $('<button>', {
            id: 'previous-button',
            class: 'btn btn-primary btn-lg' + (this.pageIndex === 0 ? ' hidden' : ''),
            text: 'Previous'
        });

        previousButton.append(
            previousButton.on('click', previousCallback)
        );

        if (pageIndex > 0)
            buttonsContainer.append(previousButton);

        buttonsContainer.append(continueButton);

        buttonsRow.append(buttonsContainer);

        return buttonsRow;
    }
}

module.exports = PageHandler;
},{}],3:[function(require,module,exports){
class QuestionsHandler {
    constructor(questions) {
        this.questions = questions;
    }

    flatQuestions() {
        return this.questions.reduce((acc, val) => acc.concat(val), []);
    }

    randomize() {
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        return questions;
    }

    chunkQuestions(pageLen) {
        const chunkedQuestions = [];
        const pageLength = pageLen || 5;
        for (let i = 0; i < this.questions.length; i++) {
            if (i % pageLength == 0) {
                chunkedQuestions.push([]);
            }
            chunkedQuestions[Math.floor(i / pageLength)][i % pageLength] = this.questions[i];
        }
        const test = this.questions.reduce((chunkedQuestions, question, ind, arr) => {
            if (ind % pageLength == 0) {
                this.chunkedQuestions.push([]);
            }
            chunkedQuestions[Math.floor(ind / pageLength)][ind % pageLength] = arr[ind];
            return chunkedQuestions;
        }, []);
        this.chunkedQuestions = test;
        console.log('chunked qs', test);
        return test;
    }

    static formattedResponse(response) {
        if (Array.isArray(response)) {
            const uniqueResponses = new Set();
            response.forEach(r => uniqueResponses.add(r));
            return Array.from(uniqueResponses).join(';');
        }
        return response
    }
}

module.exports = QuestionsHandler;
},{}],4:[function(require,module,exports){
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
},{"./Form":1}]},{},[1,2,3,4]);
