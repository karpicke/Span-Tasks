# Table of Contents

- [Table of Contents](#table-of-contents)
- [Learn to Criterion Plugins](#learn-to-criterion-plugins)
- [Parameters](#parameters)
- [Creating the Trial List](#creating-the-trial-list)
    - [trial object](#trial-object)
    - [success callback function](#success-callback-function)
- [The instruction Trial](#the-instruction-trial)
- [Example Experiment](#example-experiment)
- [Trial Data](#trial-data)

# Learn to Criterion Plugins

Learn to Criterion is a plugin to display cues and record responses related to these cues. Learn to Criterion Plugins works in a similar fashion to the 'single words' mode of Learn to Criterion, but with the difference that cues are trials of jsPsych or Learning Lab plugins.

# Parameters

| Parameter    | Value Type | Default Value  | Description                                                                                                          |
| ------------ | ---------- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| isi_time     | number     | 200            | Time between trials. Must be greater than 0                                                                          |
| randomize    | boolean    | false          | Randomize initial order of cue trials                                                                                |
| max_attempts | number     | 0              | Maximum number of recall attempts for a set of cues. Set to 0 for no limit                                           |
| intructions  | trial      | null           | Instruction trial to run before every set of cue trials. Eg: pcllab-instructions [See below](#the-instruction-trial) |
| trial_list   | trial []   | ***required*** | List of trial objects for LTC-Plugins to run as cues. [See below](#creating-the-trial-list)                          |

# Creating the Trial List

Learn to Criterion Plugins requires a list of objects to run as cues in the format

```javascript
[
    { trial: trial_1, success: success_func_1 },
    { trial: trial_2, success: success_func_2 }
]
```

Let's break it down. 
## trial object

The ```trial``` key holds as its value the json data of the trial you want to run as a cue. If we wanted to run a short answer text trial as a cue, it would look something like

```javascript
const sat_trial = {
    type: 'pcllab-short-answer-text',
    title: 'Example Short Answer Text',
    text_title: "Rivers",
    text: "This is the text.",
    question: ["Question 1", "Quesiton Two", "Question Three", "Question Four", "Question Five"],
    minimum_time: 1000,
    one_page: false,
    show_I_dont_know: true,
    force_advance: true
}
```

## success callback function

The ```success``` key holds a callback function that is run whenever the cue trial is completed. This evaluates the data returned by the trial and returns a boolean value (true or false) telling LTC-Plugins if the trial was a success or failure.
The callback function must have one parameter which contains the data of the trial that was just completed.

```javascript
const sat_success = function(sat_data) {
    let isSuccess = true

    sat_data.forEach(data => {
        // Check your data here to determine if the trial was a success
        // ...
        // ...

        // If some data was unsatisfactory, set the flag to false to mark the trial as a failure
        isSuccess = false
    })

    /* You MUST return a boolean value */
    return isSuccess
}
```
---
Putting both of the above together, we can construct our cue object

```javascript
const sat_cue = {
    trial: sat_trial,
    success: sat_success
}
```

Pass it on to LTC-Plugins

```javascript
const ltc_plugins = {
    type: 'pcllab-learn-to-criterion-plugins',
    trial_list: [ sat_cue ]
}
```

# The instruction Trial

Learn to Criterion Plugins provides an optional parameter ```instructions``` to run a trial before every set of cue trials (usually pcllab-instructions).
To use this parameter, simply set its value to the trial object you want to run.

For example,

```javascript
const intruction_trial = {
    type: 'pcllab-instructions',
    label: 'label1',
    url: 'plugins/pcllab-learn-to-criterion-plugins/instructions.json'
}

const ltc_plugins = {
    type: 'pcllab-learn-to-criterion-plugins',
    instructions: instruction_trial,
    trial_list: [ sat_cue ]
}
```

# Example Experiment

```javascript
/* Instructions */
const instructions = {
    type: 'pcllab-instructions',
    label: 'label1',
    url: 'plugins/pcllab-learn-to-criterion-plugins/instructions.json'
}

/* Stop Sign */
const ss_nested = {
    type: 'pcllab-stop-sign',
    title: 'Please wait for instructions.',
    minimum_time: 1000
}

const ss_nested_success = (trial_data) => {
    return true
}

/* Short Answer Text*/
const sa_nested = {
    type: 'pcllab-short-answer-text',
    title: 'Example Short Answer Text',
    text_title: "Rivers",
    text: "This is the text.",
    question: ["Question 1", "Quesiton Two", "Question Three", "Question Four", "Question Five"],
    minimum_time: 1000,
    one_page: false,
    show_I_dont_know: true,
    force_advance: true
}

const sa_nested_success = (trial_data) => {
    let isSuccessful = true

    trial_data.forEach(data => {
        if(data.answer == "I don't know") {
            isSuccessful = false
        }
    })

    return isSuccessful
}

const ltc_plugins = {
    type: 'pcllab-learn-to-criterion-plugins',
    randomize: true,
    isi_time: 50,
    max_attempts: 2,
    instructions: instructions,
    trial_list: [
        { trial: ss_nested, success: ss_nested_success },
        { trial: sa_nested, success: sa_nested_success }
    ]
}

jsPsych.init({
    timeline: [ltc_plugins],
    display_element: $("div#experiment_container"),
    on_finish: function () {
        jsPsych.data.displayData();
    }
});
```

# Trial Data
Learn to Criterion Plugins returns the following data after it has finished running:

- **index** - The index of the set of cues displayed. For example, if the cues were being displayed for the second time - index would be 1
- **time_elapsed** - The time elapsed since the start of the LTC-Plugins trial
- **ltc_condition** - The condition of the cue set (study or recall). It is set to 'study' the first time the cues are run and is 'recall' for all subsequent iterations
- **ltc_success** - true if the trial was evaluated to be a success, false if otherwise
- **ltc_index** - The 'index' data of the cue trial
- **ltc\_trial\_type** - The 'trial_type' data of the cue trial
- **ltc\_time\_elapsed** - The 'time_elapsed' data of the cue trial
- Data of the cue trial