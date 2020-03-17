class Logger {
    static log(...message) {
        const shouldLog = localStorage.getItem("debug") == "true"

        if (shouldLog) {
            console.log(...message)
        }
    }
}

module.exports = Logger