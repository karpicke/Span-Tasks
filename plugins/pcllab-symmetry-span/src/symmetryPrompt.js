class SymmetryPrompt {
    constructor(promptText, target, responseCallback) {
        this.promptText = promptText || "Is this symmetrical?"
        this.target = target
        this.responseCallback = responseCallback
    }

    handleResponse(response, callback) {
        const isCorrect = this.target === response
        callback(isCorrect);
        this.responseCallback(response);
    }

    render($container) {
        $container.ready(()=>{
            const $prompt = $('<h2>', {
                class: 'pcllab-text-center pcllab-default-bottom-margin-medium',
                text: this.promptText
            })

            const $yesButton = $('<button>', {
                class: 'btn btn-large btn-primary waves-effect waves-light mr-5',
                text: 'Yes'
            })
            
            const $noButton = $('<button>', {
                class: 'btn btn-large btn-primary waves-effect waves-light ml-5',
                text: 'No'
            })

            const $buttonRow = $(`<div class="row">`)
            const $buttonContainer = $(`<div class="col text-center">`)

            const $correctFeedback = $(`
                <div class="row mt-5 mb-5">
                    <div class="col">
                        <h3 class="text-center text-success">Correct</h3>
                    </div>
                </div>
            `)

            const $incorrectFeedback = $(`
                <div class="row mt-5 mb-5">
                    <div class="col">
                        <h3 class="text-center text-danger">Incorrect</h3>
                    </div>
                </div>
            `)

            $buttonContainer.append($yesButton)
            $buttonContainer.append($noButton)
            $buttonRow.append($buttonContainer)

            $container.append($prompt)
            $container.append($buttonContainer)

            $yesButton.click(()=>{
                this.handleResponse(true, isCorrect =>{
                    $buttonContainer.append(isCorrect ? $correctFeedback : $incorrectFeedback)
                })
            })

            $noButton.click(()=>{
                this.handleResponse(false, isCorrect =>{
                    $buttonContainer.append(isCorrect ? $correctFeedback : $incorrectFeedback)
                })
            })
        })
    }
}

module.exports = SymmetryPrompt