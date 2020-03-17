/* 
 * @param isi_time
 * @author: Vishnu Vijayan GitHub: vi-v email: vvijayan@purdue.edu
 * 
 */

var learnWords = (function($) {

    var _learnWords = {};

    var data = []; //Data collected by the trials

    _learnWords.getData = function() {
        return data;
    }

    _learnWords.onFinish = _learnWords.onFinish || function() { };

    _learnWords.init = function(trial) {

        trial.isi_time = trial.isi_time=="undefined"? 2000: trial.isi_time;
        
        var counterbalances; //Array containing the counterbalancing orders
        var _counterbalance_index = 0; //Index position of current counterbalancing order
        var _counterbalance_map = []; //Array of positions of counterbalancing orders that have been completed
        var trials; //Array containg data for all the trials of the current counterbalancing order
        var currentTrialNumber = -1; //Index of current trial in the trials array
        var currentTrialCb; //Current counterbalancing order of trials
        var _index = 0; //Number of trials completed
        var _startTime; // Start time of plugin
        var experimentStartTime; //Start time of counterbalancing order
        var trialStartTime;
        var prodModeEnabled = false; //Toggles buttons and audio for development
        
        //Get json data
        $.getJSON(trial.trialUrl, function(json_data) {
            console.log('init');
            console.log(json_data);
            _startTime = Date.now();
            experimentStartTime = _startTime;
            counterbalances = json_data;
            trials = json_data;
            //Map counterbalancing orders
            for(var i = 0; i<counterbalances.length; i++) _counterbalance_map.push(false);

            preloadImages();
            renderMainPage();
        }); 

        function renderMainPage() {
            console.log('emptying container');
            trial.experiment_container.empty();
            trial.experiment_container.load('./templates/main_template.html', function() {

                counterbalances.forEach(function(counterbalancing_order, i) {
                    var buttonText = counterbalancing_order.counterbalancing_order;
                    var buttonId = counterbalancing_order.counterbalancing_order.replace(/ /g, '_');

                    //Create button
                    $('.button-row').append('<button class="btn btn-lg" index='+i+' id="'+buttonId+'">'+buttonText+'</button>');

                    //Bind trial to button
                    $('#'+buttonId).on('click', function() {
                        var buttonIndex = $(this).attr('index');
                        currentTrialNumber = -1;
                        currentTrialCb = counterbalances[buttonIndex].counterbalancing_order;
                        _counterbalance_index = buttonIndex;
                        trials = counterbalances[buttonIndex].trials;
                        renderExperimentPage();
                    });
                });

            });
        }

        function renderExperimentPage() {
            console.log('emptying container');
            trial.experiment_container.empty();
            trial.experiment_container.load('./templates/trial_template.html', function() {
                //Once the template loads, attach functions to buttons
                bindFunctionsToButtons();
                experimentStartTime = Date.now();
                performTrial(++currentTrialNumber);
            });
        }

        function performTrial(trial_index) {
            var currentTrial = trials[trial_index]; //Fetch trial at current trial index
            var intervalTime; //Time between trials

            //If it is the first trial, load it immediately
            if(trial_index === 0) intervalTime = 0;
            else intervalTime = trial.isi_time;
            
            console.log(currentTrial.type.toLowerCase());
            if(trial.isi_time !== 0) $('#image-container').empty();
            if(trial_index >= trials.length) {
                //Set current counterbalancing order to completed
                _counterbalance_map[_counterbalance_index] = true;
                if(isExperimentCompleted()) {
                    // Finish experiment
                    finish();
                } else {
                    renderMainPage();
                }
                
            } else if(currentTrial.type.toLowerCase() === 'study') {
                delayTrial(study, currentTrial, trial.isi_time);
            } else if (currentTrial.type.toLowerCase() === 'recall') {
                delayTrial(recall, currentTrial, trial.isi_time);
            } else if (currentTrial.type.toLowerCase() === 'familiarize') {
                delayTrial(familiarize, currentTrial, trial.isi_time);
            } else if (currentTrial.type.toLowerCase() === 'break') {
                delayTrial(takeBreak, currentTrial, trial.isi_time);
            } else if (currentTrial.type.toLowerCase() === 'end') {
                delayTrial(endExperiment, currentTrial, trial.isi_time);
            }
        }

        /* End trial function */
        function endExperiment(end_trial) {
            //Hide buttons from previous trials
            $('.button-row').find('button').hide();

            //Load image
            $('<img src="'+ end_trial.image +'">').load(function() {
                if($('#image-container img').attr('src') !== end_trial.image) {
                    console.log('emptying image container');
                    $('#image-container').empty();
                    $(this).appendTo('#image-container');
                }

                //Start timer for trial
                trialStartTime = Date.now();
            });

            //Display end trial message
            $('.button-row').append('<h2>'+end_trial.message+'</h2>');

            // Finish experiment and do not empty container
            finish(false);
        }

        /* Break trial function */
        function takeBreak(break_trial) {
            //Hide buttons from previous trials
            $('.button-row').find('button').hide();

            //Load image
            $('<img src="'+ break_trial.image +'">').load(function() {
                if($('#image-container img').attr('src') !== break_trial.image) {
                    console.log('emptying image container');
                    $('#image-container').empty();
                    $(this).appendTo('#image-container');
                }

                //Show ready button to begin next trial
                $('#ready_button').show();

                //Start timer for trial
                trialStartTime = Date.now();
            });
        }

        /* Recall trial function */
        function recall(recall_trial) {
            //Hide buttons from previous trials
            $('.button-row').find('button').hide();

            //Hide buttons till audio finishes playing
            toggleButtons();
            
            //Load image
            $('<img src="'+ recall_trial.image +'">').load(function() {
                if($('#image-container img').attr('src') !== recall_trial.image) {
                    console.log('emptying image container');
                    $('#image-container').empty();
                    $(this).appendTo('#image-container');
                }

                //Show repeat and next buttons
                $('#repeat_button').show();
                $('#next_button').show();

                //Start timer for trial
                trialStartTime = Date.now();

                 //Play audio file
                playAudio(recall_trial.sound);
            });
        }

        /* Study trial function */
        function study(study_trial) {
            //Hide buttons from previous trials
            $('.button-row').find('button').hide();

            //Hide buttons till audio finishes playing
            toggleButtons();

            //Load image
            $('<img src="'+ study_trial.image +'">').load(function() {
                if($('#image-container img').attr('src') !== study_trial.image) {
                    console.log('emptying image container');
                    $('#image-container').empty();
                    $(this).appendTo('#image-container');
                }

                //Show repeat and next buttons
                $('#repeat_button').show();
                $('#next_button').show();

                //Start timer for trial
                trialStartTime = Date.now();

                //Play audio file
                playAudio(study_trial.sound);
            });
        }

        /* Familiarize trial function */
        function familiarize(familiarize_trial) {
            //Hide buttons from previous trials
            $('.button-row').find('button').hide();

            //Load image
            $('<img src="'+ familiarize_trial.image +'">').load(function() {
                console.log('emptying image container');
                $('#image-container').empty();
                $(this).appendTo('#image-container');

                //Show play button
                $('#play_button').show();
                
                //Start timer for trial
                trialStartTime = Date.now();

                //Bind audio file to play button
                bindPlayButton(familiarize_trial.sound);

            });
        }

        /* Function called when all trials are done */
        function finish(emptyContainer) {

            //Check if emptyContainer exists. If not, set default value of true
            if(typeof emptyContainer === "undefined") emptyContainer = true

            if(emptyContainer) trial.experiment_container.empty();
            _learnWords.onFinish();
        }

        /* Run trial after isi time */
        function delayTrial(trialFunc, trial_data, delay_time) {

            //This is to prevent a flicker before each trial
            if( delay_time === 0 ) {
                trialFunc(trial_data);
            } else {
                //Hide experiment container for isi duration
                trial.experiment_container.hide();
                
                setTimeout(function() {
                    trial.experiment_container.show();
                    trialFunc(trial_data);
                },delay_time);
            }
        }

        /* Audio playback function */
        function playAudio(filename, callback) {
            var audio = new Audio(filename);
            audio.addEventListener('ended', function() {
                toggleButtons();
                if(callback) callback();
            });

            if(prodModeEnabled) return;
            audio.play();
        }

        /* Toggle visibility of buttons */
        function toggleButtons() {
            if(prodModeEnabled) return;

            //If hidden, then show. Otherwise hide
            if($(".button-row").is(":visible")) $(".button-row").hide();
            else $(".button-row").show();
        }

        //Log data for trial that just finished
        function logTrialData() {
            data.push({
                counterbalancing_order: counterbalances[_counterbalance_index].counterbalancing_order,
                index: _index++,
                trial: trials[currentTrialNumber].trial,
                response_time: Date.now() - trialStartTime,
                cb_time_elapsed: Date.now() - experimentStartTime,
                time_elapsed: Date.now() - _startTime
            });
        }

        //Checks if all counterbalancing orders have been completed
        function isExperimentCompleted() {
            var _completed = true;
            _counterbalance_map.forEach(function(mapval) {
                if(!mapval) _completed = false;
            });

            return _completed;
        }

        /* Button functions */
        function bindFunctionsToButtons() {
            $('#ready_button').on('click', function() {               
                logTrialData();
                performTrial(++currentTrialNumber);
            });

            $('#next_button').on('click', function() {
                logTrialData();
                performTrial(++currentTrialNumber);
            });

            $('#repeat_button').on('click', function() {
                logTrialData();
                performTrial(currentTrialNumber);
            });
        }

        /* Bind audio playback to play button */
        function bindPlayButton(audioUrl) {
            //Unbind previous click function first
            $('#play_button').unbind('click');

            $('#play_button').on('click', function() {
                //Hide buttons
                $('.button-row').find('button').hide();

                //Play audio file
                playAudio(audioUrl, function() {
                    //Show repeat and next buttons
                    $('#repeat_button').show();
                    $('#next_button').show();
                    $('.button-row').show();
                });
            });
        }

        /* Function to preload images */
        function preloadImages() {
            var images = [];

            counterbalances.forEach( function(counterbalance) {
                //Geat each counterbalance
                counterbalance.trials.forEach( function(trial) {
                    //Get each trial in counterbalance

                    //Push image to images
                    if(trial.image) images.push(trial.image);
                });
            });

            images = getUnique(images);
            $(images).each(function () {
                $('<img />').attr('src',this).appendTo('body').css('display','none');
            });
        }

        /* Remove duplicates from array */
        function getUnique(a) {
            var seen = {};
            return a.filter(function(item) {
                return seen.hasOwnProperty(item) ? false : (seen[item] = true);
            });
        }

    }

    return _learnWords;

})(jQuery);