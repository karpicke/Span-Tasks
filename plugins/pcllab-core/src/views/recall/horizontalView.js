const RecallStandardView = require('./standardView')

class RecallHorizontalView extends RecallStandardView {
	renderCueList($element) {
		const $row = $('<div>', { class: 'row justify-content-center' })
		$row.appendTo($element)

		this.cue_list.forEach((cue) => {
			$row.append(`
				<div class="col-3 text-center">
					<h3 class="text-center">${cue}</h3>
				</div>
			`)
		})
	}
}

module.exports = RecallHorizontalView