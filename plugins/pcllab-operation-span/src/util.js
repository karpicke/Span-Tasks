module.exports.setParameter = (value, defaultValue, expectedType) => {
    if (typeof value === "function" && typeof value !== expectedType) {
        value = value()
    }

    if (expectedType && typeof value === expectedType) {
        return value
    }

    if (typeof value !== 'undefined') {
        return value
    }

    return defaultValue
}

module.exports.$hide = (coreInstance, $el) => {
    $el.addClass('notransition')
    if (coreInstance.progress_total_time) {
        $el.css("visibility", "hidden")
    } else {
        $el.hide()
    }
}

module.exports.$show = (coreInstance, $el) => {
    $el[0].offsetHeight
    $el.removeClass('notransition')
    if (coreInstance.progress_total_time) {
        $el.css("visibility", "visible")
    } else {
        $el.show()
    }
}

module.exports.uuid = () => {
    let dt = new Date().getTime()
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (dt + Math.random() * 16) % 16 | 0
        dt = Math.floor(dt / 16)
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    return uuid
}

module.exports.randomIntInRange = (min, max) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}