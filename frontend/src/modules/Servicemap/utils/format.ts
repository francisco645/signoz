const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

export const formatCount = (value: number): string =>
	NUMBER_FORMAT.format(Math.round(value));

export const formatRate = (callsPerSecond: number): string => {
	if (callsPerSecond > 0 && callsPerSecond < 0.01) {
		return '<0.01 req/s';
	}
	const digits = callsPerSecond >= 100 ? 0 : callsPerSecond >= 10 ? 1 : 2;
	return `${callsPerSecond.toFixed(digits)} req/s`;
};

export const formatPercent = (percent: number): string => {
	if (percent > 0 && percent < 0.1) {
		return '<0.1%';
	}
	return `${percent.toFixed(1)}%`;
};

export const formatDuration = (nanoseconds: number): string => {
	const milliseconds = nanoseconds / 1e6;
	if (milliseconds >= 1000) {
		return `${(milliseconds / 1000).toFixed(milliseconds >= 10_000 ? 0 : 1)} s`;
	}
	if (milliseconds >= 1) {
		return `${milliseconds.toFixed(milliseconds >= 100 ? 0 : 1)} ms`;
	}
	return `${Math.round(nanoseconds / 1000)} µs`;
};

/** Keeps both ends of a long name, which is where services usually differ. */
export const truncateMiddle = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) {
		return text;
	}
	const head = Math.ceil((maxLength - 1) / 2);
	const tail = Math.floor((maxLength - 1) / 2);
	return `${text.slice(0, head)}…${text.slice(text.length - tail)}`;
};
