class DataHandler {
    static initialize() {
        DataHandler.datablocks = []

        DataHandler.totalLetters = 0
        DataHandler.totalMath = 0
        DataHandler.correctLetters = 0
        DataHandler.correctMath = 0

        DataHandler.listLengthLetters = 0
        DataHandler.listLengthMath = 0
        DataHandler.correctListLengthLetters = 0
        DataHandler.correctListLengthMath = 0
    }

    static initializeListLength() {
        DataHandler.listLengthLetters = 0
        DataHandler.listLengthMath = 0
        DataHandler.correctListLengthLetters = 0
        DataHandler.correctListLengthMath = 0
    }

    static register(datablock) {
        DataHandler.datablocks.push(datablock)
    }

    static addToTotalLetters(n) {
        DataHandler.totalLetters += n
        DataHandler.listLengthLetters += n
    }

    static addToTotalMath(n) {
        DataHandler.totalMath += n
        DataHandler.listLengthMath += n
    }

    static addToCorrectLetters(n) {
        DataHandler.correctLetters += n
        DataHandler.correctListLengthLetters += n
    }

    static addToCorrectMath(n) {
        DataHandler.correctMath += n
        DataHandler.correctListLengthMath += n
    }

    static finishTrial() {
        const datablocks = DataHandler.datablocks
        datablocks.slice(0, -1).forEach(db => db.write())
        jsPsych.finishTrial(datablocks.slice(-1)[0].toJSON())
    }
}

module.exports = DataHandler