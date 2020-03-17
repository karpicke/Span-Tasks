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

module.exports.copy = (obj) => {
    return Object.assign({}, obj)
}

module.exports.compareTargetAndResponse = (target, response) => {
    if (target === response) {
        return 1
    }

    if (typeof target === 'string' && typeof response === 'string') {
        return Number(target.trim().toUpperCase() === response.trim().toUpperCase())
    }

    return Number(target == response)
}
