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
class Form {
  constructor(title, questions, pages, displayElement, submitCallback) {
    this.title = title;
    this.pages = pages;
    this.displayElement = displayElement;
    this.pageIndex = 0;
    this.responses = {};
    this.required = {};
    this.fields = [];
    this.attemptedSubmit = false;
    this.questions = questions;
    this.submitCallback = submitCallback;
    this.startTime = Date.now();
  }

  run() {
    this.unfulfilled = [];
    //intialize fields array used for data ordering
    flattenQuestions(this.questions).forEach(question => {
      this.required[question.name] = question.optional ? false : true;
    })
    this.iterateInputs((input) => {
      if (!this.fields.includes(input.name))
        this.fields.push(input.name);
      this.responses[input.name] = null
    })
    this.loadNextPage();
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

    formPageContainer.append(this.createButtons());

    this.displayElement.append(formPageContainer);

    this.pageIndex++;
  }

  loadPreviousPage() {
    this.pageIndex -= 2;
    this.loadNextPage();
    if (this.attemptedSubmit) requirementsCheck(this);
  }

  createButtons() {
    const buttonsRow = $('<div>', {
      class: 'row',
    });

    const buttonsContainer = $('<div>', {
      class: 'col-md-6 offset-md-3 text-center'
    })

    const continueButton = $('<button>', {
      id: 'continue-button',
      class: 'btn btn-primary btn-lg',
      text: this.pageIndex === this.pages.length ? 'Submit' : 'Continue'
    });

    continueButton.append(
      continueButton.on('click', function () {
        this.recordResponses()
        if (this.pageIndex === this.pages.length) {
          this.submitCallback(this);
        } else {
          this.loadNextPage();
        }
      }.bind(this))
    );

    const previousButton = $('<button>', {
      id: 'previous-button',
      class: 'btn btn-primary btn-lg' + (this.pageIndex === 0 ? ' hidden' : ''),
      text: 'Previous'
    });

    previousButton.append(
      previousButton.on('click', function () {
        this.loadPreviousPage();
      }.bind(this))
    );

    if (this.pageIndex > 0)
      buttonsContainer.append(previousButton);

    buttonsContainer.append(continueButton);

    buttonsRow.append(buttonsContainer);

    return buttonsRow;
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

}

function formattedResponse(response) {
  if (Array.isArray(response)) {
    const uniqueResponses = new Set();
    response.forEach(r => uniqueResponses.add(r));
    return Array.from(uniqueResponses).join(';');
  }
  return response
}

function createSurveyPages(questions, trial) {
  let chunkedQuestions = [];
  if (!Array.isArray(questions[0]))
    chunkedQuestions = chunkQuestions(questions, trial.pageLength);
  else if (questions)
    chunkedQuestions = questions;

  return createHTMLPages(chunkedQuestions, trial.instructions, trial);
}

function chunkQuestions(questions, pageLen) {
  const chunkedQuestions = [];
  const pageLength = pageLen || 5;
  for (let i = 0; i < questions.length; i++) {
    if (i % pageLength == 0) {
      chunkedQuestions.push([]);
    }
    chunkedQuestions[Math.floor(i / pageLength)][i % pageLength] = questions[i];
  }
  const test = questions.reduce((chunkedQuestions, question, ind, arr) => {
    if (ind % pageLength == 0) {
      chunkedQuestions.push([]);
    }
    chunkedQuestions[Math.floor(ind / pageLength)][ind % pageLength] = arr[ind];
    return chunkedQuestions;
  }, []);
  return test;
}

// Appended to the end and hidden to detect bots
const honeypotField = `
<input type="checkbox" id="accept_terms" name="accept_terms" value="0" tabindex="-1" autocomplete="off">
`;

function createHTMLPages(chunkedQuestions, instructions, trial) {
  const htmlPages = chunkedQuestions.map(chunk =>
    convertChunkToHTMLPage(chunk, instructions, trial)
  );
  return htmlPages;
}

function convertChunkToHTMLPage(chunk, instructions, trial) {
  const formQuestionsContainer = $('<form>');

  if (instructions && instructions.trim().length > 0) {
    const instructionsContainer = $('<div>', {
      class: 'row mx-4 mb-2 p-2'
    });
    const instructionsEl = $(`<p>${instructions}</p>`);
    instructionsContainer.append(instructionsEl);
    formQuestionsContainer.append(instructionsContainer);
  }

  if (trial.randomize) {
    chunk = randomize(chunk);
  }

  chunk.forEach(question =>
    formQuestionsContainer.append(createHTMLQuestion(question))
  );

  formQuestionsContainer.append(honeypotField);

  return formQuestionsContainer;
}

function requirementsCheck(form, displayAlert) {
  const flatQuestions = flattenQuestions(form.questions);
  form.unfulfilled = [];
  flatQuestions.forEach((question, index) => {
    const response = formattedResponse(form.responses[question.name])
    if (form.required[question.name] && (!response || response.trim().length == 0)) {
      form.unfulfilled.push(question.name)
    }
  })
  //let alertMsg = 'The following questions are required: \n' + unfulfilled.join('\n');
  if (form.unfulfilled.length > 0) {
    if (displayAlert) alert('Please fill out all required fields before continuing.');
    clearRequired(form);
    form.unfulfilled.forEach(name => {
      displayRequired(name);
    })
    return false;
  }
  return true;
}

function clearRequired(form) {
  form.fields.forEach(field => {
    const requiredQuestion = document.getElementById(`rq-${field}`);
    if (!requiredQuestion) return;
    requiredQuestion.style.display = 'none';
  })
}

function displayRequired(name) {
  const requiredQuestion = document.getElementById(`rq-${name}`);
  if (!requiredQuestion) return;
  requiredQuestion.style.display = 'block';
}

function createHTMLQuestion(question) {
  const questionContainer = $('<div>', {
    class: 'row mx-4 mb-3 p-2',
    id: question.name,
  });
  questionContainer.append($(`<h3>${question.question}</h3>`));
  switch (question.type) {
    case 'checkbox':
    case 'radio':
      questionContainer.append(createInputOptions(question));
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

function createInputOptions(question) {
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

function demographicsForm(display_element) {

  display_element.load('plugins/pcllab-form/demographics-template.html', function () {
    const startTime = Date.now();

    $("#rb1").click(function () {
      $('#language_opt').prop('disabled', true)
      $('#language_opt_form').slideUp(100)
    })

    $("#rb2").click(function () {
      $('#language_opt').prop('disabled', false)
      $('#language_opt_form').slideDown(100)
    })

    $('input[id=age_demo]').on('input', function () {
      var age = $(this).val();

      if (isNaN(age) || age < 0 || age > 125) {
        $(this).parent().removeClass('has-success')
        $(this).parent().addClass('has-danger')
      } else {
        $(this).parent().addClass('has-success')
        $(this).parent().removeClass('has-danger')
      }
    })

    $("#continue_btn").click(function () {
      var data = {};

      var ageInput = $('input[id=age_demo]');
      var age = $('input[id=age_demo]').val();
      age = parseInt(age);
      console.log(!isNaN(age) && (age < 0 || age > 125))
      if (isNaN(age) || age < 0 || age > 125) {
        ageInput.parent().addClass('has-danger')
        return;
      }
      jsPsych.data.write({
        'question': 'age',
        'response': age
      })
      var gender = $('input[id=gender_demo]').val();
      if (!gender || !gender.trim()) {
        return;
      }
      jsPsych.data.write({
        'question': 'gender',
        'response': gender
      })

      data['question'] = 'language'
      if ($("#rb1").is(":checked")) {
        data['response'] = $('input:radio:checked[name=english_demo]').val();
      } else {
        var lang = $('#language_opt').val();
        data['response'] = lang;
        if (!lang || !lang.trim()) {
          return;
        }
      }

      if (document.getElementById('accept_terms').checked || document.getElementById('accept_terms').value == 1)
        data['honeypot'] = true;

      data['rt'] = Date.now() - startTime;

      /* This is a workaround to an issue with form submission in new browsers */
      const form = $('form')
      form.hide()
      $(document.body).append(form)

      display_element.html("");
      jsPsych.finishTrial(data);
    });
  })
}

function environmentSurvey(display_element) {
  const startTime = Date.now();

  display_element.html("");

  display_element.append("<h2>Please answer the following questions about your environment while you completed this session.</h2>");
  display_element.append("<br>");

  // Noise section

  display_element.append("<h4>What is the noise level of your environment?</h4>");
  display_element.append("<br>");

  display_element.append('<div style="font-size: larger;">' +
    '<div class="md-radio"><input type="radio" id="rad1" name="noise" value="1"><label for="rad1" class="radio-inline">&nbsp;Very Quiet (1)</label></div>' +
    '<div class="md-radio"><input type="radio" id="rad2" name="noise" value="2"><label for="rad2" class="radio-inline">&nbsp;Quiet (2)</label></div>' +
    '<div class="md-radio"><input type="radio" id="rad3" name="noise" value="3"><label for="rad3" class="radio-inline">&nbsp;Neutral (3)</label></div>' +
    '<div class="md-radio"><input type="radio" id="rad4" name="noise" value="4"><label for="rad4" class="radio-inline">&nbsp;Loud (4)</label></div>' +
    '<div class="md-radio"><input type="radio" id="rad5" name="noise" value="5"><label for="rad5" class="radio-inline">&nbsp;Very Loud (5)</label></div></div>');

  display_element.append("<br>");
  display_element.append("<br>");

  // Device section

  display_element.append("<h4>What device did you use during this experiment?</h4>");
  display_element.append("<br>");

  display_element.append('<div style="font-size: larger;">' +
    '<div class="md-radio"><input type="radio" id="rad6" name="device" value="laptop"><label for="rad6" class="radio-inline">&nbsp;Laptop</label></div>' +
    '<div class="md-radio"><input type="radio" id="rad7" name="device" value="desktop"><label for="rad7" class="radio-inline">&nbsp;Desktop</label></div>' +
    '<div class="md-radio"><input type="radio" id="rad8" name="device" value="netbook"><label for="rad8" class="radio-inline">&nbsp;Netbook</label></div>' +
    '<div class="md-radio"><input type="radio" id="rad9" name="device" value="smartphone"><label for="rad9" class="radio-inline">&nbsp;Smartphone</label></div>' +
    '<div class="md-radio"><input type="radio" id="rad10" name="device" value="tablet"><label for="rad10" class="radio-inline">&nbsp;Tablet/iPad</label></div></div>');

  display_element.append("<br>");
  display_element.append("<br>");

  // cheat section

  display_element.append("<h4>Did you cheat at all during the experiment? You will receive credit regardless of whether you cheated or not, so please answer truthfully.</h4>");
  display_element.append("<br>");

  display_element.append('<div style="font-size: larger;">' +
    '<div class="md-radio md-radio-inline"><input id="rad11" type="radio" name="cheat" value="yes"><label for="rad11" class="radio-inline">&nbsp;Yes</label></div>' +
    '<div class="md-radio md-radio-inline"><input id="rad12" type="radio" name="cheat" value="no"><label for="rad12" class="radio-inline">&nbsp;No</label></div></div>');

  display_element.append("<br>");
  display_element.append("<br>");

  // Comment section

  display_element.append("<h4>If you would like to provide any comments about the experiment, please enter them into the space below.</h4>");
  display_element.append("<br>");

  display_element.append('<textarea id="comment_area" class="form-control p-2" rows="6" style="font-size: larger;"></textarea>');

  display_element.append("<br>");
  display_element.append("<br>");

  // Bot honeypot

  display_element.append(honeypotField);

  display_element.append("<button id='continue_btn' class='btn btn-primary btn-lg waves-effect waves-light pcllab-button-center'>Continue</button>");

  $("#continue_btn").click(function () {
    if (!$("input:radio[name=noise]").is(":checked")) {
      alert("Please specify the noise level of the environment.");
      return;
    }
    if (!$("input:radio[name=device]").is(":checked")) {
      alert("Please specify the type of device you used for the experiment.");
      return;
    }
    if (!$("input:radio[name=cheat]").is(":checked")) {
      alert("Please specify whether you have cheated.");
      return;
    }

    jsPsych.data.write({
      cue: 'Please specify the noise level of the environment.',
      response: $('input:radio:checked[name=noise]').val()
    })
    jsPsych.data.write({
      cue: 'Please specify the type of device you used for the experiment.',
      response: $('input:radio:checked[name=device]').val()
    })
    jsPsych.data.write({
      cue: 'Please specify whether you have cheated.',
      response: $("input:radio:checked[name=cheat]").val()
    })
    const data = { // last data to finish with
      cue: 'If you would like to provide any comments about the experiment, please enter them into the space below.',
      response: $("#comment_area").val(),
      rt: Date.now() - startTime,
    }

    if (document.getElementById('accept_terms').checked || document.getElementById('accept_terms').value == 1)
      data['honeypot'] = true;

    display_element.html("");
    jsPsych.finishTrial(data);
  });
}

function flattenQuestions(questions) {
  return questions.reduce((acc, val) => acc.concat(val), []);
}

function randomize(questions) {
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions;
}

jsPsych.plugins['pcllab-form'] = (function () {
  var plugin = {};

  plugin.trial = function (display_element, trial) {
    const startTime = Date.now();
    let data = [];

    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    // Default trial parameters
    trial.title = trial.title || '';
    trial.instructions = trial.instructions || '';
    trial.button_text = trial.button_text || 'Continue';

    const submitData = (form) => {
      form.attemptedSubmit = true;
      const flatQuestions = flattenQuestions(form.questions);

      if (!requirementsCheck(form, true)) return;

      flatQuestions.forEach((question, index) => {
        const response = formattedResponse(form.responses[question.name])
        const data = {
          response_index: question.name,
          cue: flatQuestions[index].question || 'unknown',
          response: response
        }
        if (index < flatQuestions.length - 1) {
          jsPsych.data.write(data)
        } else {
          if (document.getElementById('accept_terms').checked || document.getElementById('accept_terms').value == 1) {
            jsPsych.data.write({ 'honeypot': true });
          }
          return jsPsych.finishTrial(Object.assign(data, { rt: Date.now() - startTime, timestamp: new Date().toString() }));
        }
      })
      display_element.html('');
    }

    if (trial.demographics) {
      return demographicsForm(display_element)
    }

    if (trial.environment) {
      return environmentSurvey(display_element)
    }

    if (trial.questions) {
      const formPages = createSurveyPages(trial.questions, trial);
      const form = new Form(trial.title, trial.questions, formPages, display_element, submitData);
      form.run();
    } else if (trial.questionFile) {
      $.getJSON(trial.questionFile, questions => {
        const formPages = createSurveyPages(questions, trial);
        const form = new Form(trial.title, questions, formPages, display_element, submitData);
        form.run();
      });
    } else {
      throw Error('Questions must be specified for this plugin, either via JSON file or JS object.');
    }

    function writeData() {
      var questionData = {};

      questionData.equation = trial.equations[equationIndex];
      questionData.rt = new Date().getTime() - startTime;
      questionData.first_interaction_time = firstInteractionTime || -1;
      questionData.answers = trial.answers;

      data.push(questionData);
      if (trial.equations.length !== 1) jsPsych.data.write(questionData);
    }

    function end_trial() {
      if (trial.output) {
        window[trial.output] = data;
      }

      if (trial.equations.length === 1) {
        jsPsych.finishTrial(data[0]);
      } else {
        jsPsych.finishTrial();
      }
    }
  };

  return plugin;
})();