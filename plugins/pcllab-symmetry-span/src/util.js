class Util {
	static setParameter(value, defaultValue, expectedType) {
		if (expectedType && typeof value === expectedType) {
			return value
		}
	
		if (typeof value !== 'undefined') {
			return value
		}
	
		return defaultValue
	}

	static shuffleArray(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}
}

module.exports = Util
