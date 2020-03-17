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