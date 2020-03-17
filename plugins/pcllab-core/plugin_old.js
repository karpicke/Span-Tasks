/**
* @name Cued Recall
* @author Anirudh Manohar Chellani (achellan@purdue.edu)
* @param {string=} title - Sets the title of the page
* @param {boolean=} automtedScoringSwitch - Set to one to enable automted scoring
* @param {array=} automatedScoringParameters - Needs an array of parameters for automted scoring
* @param {int=} cueCount - Number of recalls to get
*/

jsPsych.plugins["pcllab-cued-recall"] = (function() {
  var plugin = {};
  plugin.trial = function(display_element, trial){

    /* Function sets up the display*/
    var dataSrc = trial.stimuli;
    var dataPos = 0;
    var cueCount = trial.cueCount || 1;
    function displayRecall(mediaType, content, target){
      display_element.html('');
      var titleView = $('<h2>', {
        class: 'pcllab-text-center pcllab-default-bottom-margin-medium',
        text: trial.title
      });
      var questionContainer = $('<div>', { class: 'row justify-content-center' });
      var questionTitleView;
      if(mediaType == 'media'){
        questionTitleView = $('<img>', {
          class: 'pcllab-default-bottom-margin-medium rounded mx-auto d-block',
          src: content
        });
      }
      else{
        questionTitleView = $('<h4>', {
          class: 'pcllab-default-bottom-margin-medium text-center',
        }).html(content);
      }/*
      var responseTextAreaView = $('<textarea>', {
        class: 'form-control pcllab-default-font-larger pcllab-short-answer-response-area',
        rows: 1,
        placeholder: 'Please type here'
      });
      responseTextAreaView.css("width", "4em");
      responseTextAreaView.css("margin-left", "auto");
      responseTextAreaView.css("margin-right", "auto");*/
      var buttonsPartialView = $('<div>', {
        id: 'pcllab_short_answer_buttons_div',
        class: 'pcllab-container-center',
      });

      var continueBtnPartialView = $('<button>', {
        class: 'btn btn-primary btn-lg waves-effect waves-light pcllab-short-answer-continue-btn',
        text: 'Next'
      });
      buttonsPartialView.append(continueBtnPartialView);
      questionContainer.append(questionTitleView);
      display_element.append(titleView);
      display_element.append(questionContainer);
      for(var i = 0; i<cueCount; i++){
        var responseTextAreaView = $('<textarea>', {
          class: 'form-control pcllab-default-font-larger pcllab-short-answer-response-area',
          rows: 1,
          placeholder: 'Please type here'
        });
        responseTextAreaView.css("width", "4em");
        responseTextAreaView.css("margin-left", "auto");
        responseTextAreaView.css("margin-right", "auto");

        display_element.append(responseTextAreaView);
      }
      display_element.append(buttonsPartialView);
      continueBtnPartialView.click(function(){
        var data = {};
        data['stimuli'] = content;
        data['stimuliType'] = (mediaType=='media')?'media':'text';
        data['response'] = [];
        $(".pcllab-short-answer-response-area").each(function(){
            console.log("here2")
           data['response'].push(this.value);
        });
        data['target'] = target;
        if (trial.automtedScoringSwitch == 1) {
          autoScore(target || "", data['response'], trial.automatedScoringParameters, function(error, score) {
            data.automated_score = error ? 'ERROR' : score;
            jsPsych.data.write(data);
            dataPos++;
            nextRecall();
          });
        }
        else{
          jsPsych.data.write(data);
          dataPos++;
          nextRecall();
        }
      });
    }
    function nextRecall(){
      if(dataPos < dataSrc.length){
        dataSrcC = dataSrc[dataPos];
        console.log(dataSrc[dataPos]);
        displayRecall(dataSrcC['type'], dataSrcC['text'], dataSrcC['target']);
      }
      else{
        display_element.html('');
        jsPsych.finishTrial();
      }
    }
    nextRecall();

    //displayRecall(trial.title, type, cue);


  };
  return plugin;
})();
