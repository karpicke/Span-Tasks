var state = 0;
var innerState = 0;
var currentObject = "";
var gCondition = 0;
var startC = false;
var sound;
var e1;

$.getJSON("experiment.json", function(json) {
    e1 = json;
});

$(document).ready(function() {
    preloadImages();
    $(".imageButtonC").toggle();
});

function preloadImages() {
    var images = [
        "boge.jpg",
        "dora-1.jpg",
        "dora-2.jpg",
        "dora-3.jpg",
        "geenay.jpg",
        "goose.jpg",
        "maylup.jpg",
        "pibe.jpg",
        "tekket.jpg",
        "tiger.jpg",
        "toma.jpg"
    ]

    images.forEach(function(image) {
        var img = new Image();
        img.src = "./Images/" + image;
    });
}

function start(condition) {
    if (typeof(e1) === 'undefined') {
        alert("Error loading JSON data from server. \n Please reload the page.");
        return;
    }
    $(".initialButtonC").toggle();
    $(".imageButtonC").toggle();
    $(".mainImg").css('background-image', "url('./Images/dora-1.jpg')");
    if (condition == 1) {
        gCondition = 'cb1';
    } else if (condition == 2) {
        gCondition = 'cb2';
    } else if (condition == 3) {
        gCondition = 'cb3';
    } else if (condition == 4) {
        gCondition = 'cb4';
    } else if (condition == 5) {
        gCondition = 'recall1';
    } else if (condition == 6) {
        gCondition = 'recall2';
    }
    $(".repeatB").toggle();
    $(".nextB").toggle();
}

function nextState() {

    toggleButtons();
    toggleImg();
    setTimeout(function() {
        toggleImg();
        if (innerState == (e1.states[gCondition][state].length - 1) && startC) {
            state += 1;
            innerState = 0;
        } else if (startC) {
            innerState += 1;
        }
        if (innerState == 0) {
            currentObject = e1.states[gCondition][state][0];
            innerState++;
        }
        var image;

        if (state >= 0) {
            image = e1.pairs[currentObject][0];
            sound = e1.pairs[currentObject][1];
        }

        var cLetter = e1.states[gCondition][state][innerState];

        // Study
        if (cLetter == 's') {

        }
        // Recall 1 - "What is this called?"
        else if (cLetter == 'r1') {
            sound = 'WHAT_IS_THIS_CALLED';
        }
        // Recall 2 - "What does it like?"
        else if (cLetter == 'r2') {
            sound = 'WHAT_DOES_IT_LIKE';
        }
        // Break
        else if (cLetter == 'b') {
            image = 'dora-2';
            sound = '';
            toggleButtons();
        }
        // End
        else if (cLetter == 'end') {
            finish();
            return;
        }

        $(".mainImg").css('background-image', "url('./Images/" + image + ".jpg')");
        playAudio(sound);
        if (!startC) {
            startC = true;
        }
    }, 600);
}

function hiddennextState() {

    if (innerState == (e1.states[gCondition][state].length - 1) && startC) {
        state += 1;
        innerState = 0;
    } else if (startC) {
        innerState += 1;
    }
    if (innerState == 0) {
        currentObject = e1.states[gCondition][state][0];
        innerState++;
    }

    var image;

    if (state >= 0) {
        image = e1.pairs[currentObject][0];
        sound = e1.pairs[currentObject][1];
    }

    var cLetter = e1.states[gCondition][state][innerState];

    if (cLetter == 's') {

    } else if (cLetter == 'r1') {
        sound = 'WHAT_IS_THIS_CALLED';
    } else if (cLetter == 'r2') {
        sound = 'WHAT_DOES_IT_LIKE';
    } else if (cLetter == 'b') {
        image = 'dora-2';
        sound = '';
    } else if (cLetter == 'end') {
        finish();
        return;
    }

    $(".mainImg").css('background-image', "url('./Images/" + image + ".jpg')");

    if (!startC) {
        startC = true;
    }
}

function repeat() {
    toggleButtons();
    playAudio(sound);
}

function begin() {
    $(".readyB").toggle();
    setTimeout(function() {
        $(".repeatB").toggle();
        $(".nextB").toggle();
    }, 1200);
    nextState();
}

function toggleButtons() {
    $(".imageButtonC").toggle();
}

function toggleImg() {
    $(".mainImg").toggle();
}

function playAudio(filename) {
    var audio = new Audio("./Sounds/" + filename + ".wav");
    audio.addEventListener('ended', toggleButtons);
    audio.play();
}

function finish() {
    $(".mainImg").css('background-image', "url('./Images/dora-3.jpg')");
}
