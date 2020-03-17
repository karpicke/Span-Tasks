module.exports.RESPONSE_ALIGNMENT = {
	left: 'left',
	center: 'center',
	right: 'right'
}

module.exports.CUE_ALIGNMENT = {
	horizontal: 'horizontal',
	vertical: 'vertical'
}

module.exports.SCORING_STRATEGY = {
	dice: 'dice',
	exact: 'exact',
	ultron: 'ultron'
}

module.exports.INPUT_SIZE = {
	small: 'small',
	medium: 'medium',
	large: 'large',
	xlarge: 'xlarge'
}

module.exports.RESPONSE_TYPE = {
	input: 'input',
	study_items: 'study_items',
	free_recall: 'free_recall',
	slider: 'slider',
	checkbox: 'checkbox',
	radio: 'radio',
	button: 'button'
}

let buttonColorClass = 'btn-primary'

module.exports.getButtonColorClass = () => {
	return buttonColorClass
}

module.exports.setButtonColorClass = (newButtonClass) => {
	buttonColorClass = newButtonClass
}