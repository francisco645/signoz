import {
	formatDuration,
	formatPercent,
	formatRate,
	truncateMiddle,
} from '../format';

describe('format', () => {
	it.each([
		[850_000, '850 µs'],
		[45_000_000, '45.0 ms'],
		[120_000_000, '120 ms'],
		[2_400_000_000, '2.4 s'],
	])('formats %d ns as %s', (nanoseconds, expected) => {
		expect(formatDuration(nanoseconds)).toBe(expected);
	});

	it('formats rates and percentages without hiding small non-zero values', () => {
		expect(formatRate(0.004)).toBe('<0.01 req/s');
		expect(formatRate(12.34)).toBe('12.3 req/s');
		expect(formatPercent(0.05)).toBe('<0.1%');
		expect(formatPercent(7.43)).toBe('7.4%');
	});

	it('truncates long names in the middle', () => {
		expect(truncateMiddle('core-bills-reconciliation-worker', 24)).toBe(
			'core-bills-r…tion-worker',
		);
		expect(truncateMiddle('cart', 24)).toBe('cart');
	});
});
