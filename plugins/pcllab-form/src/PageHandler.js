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