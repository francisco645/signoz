import {
	isLow,
	isSilent,
	lastSeenMs,
	sumSeries,
	toSignalSnapshot,
	volumeRatio,
} from '../telemetry';

const series = (values: [number, number][]) => ({
	aggregations: [
		{
			series: [
				{ values: values.map(([timestamp, value]) => ({ timestamp, value })) },
			],
		},
	],
});

describe('telemetry', () => {
	it('sums a series and finds the end of the last minute with data', () => {
		const result = series([
			[0, 3],
			[60_000, 4],
			[120_000, 0],
		]);
		expect(sumSeries(result)).toBe(7);
		expect(lastSeenMs(result)).toBe(120_000);
		expect(sumSeries(undefined)).toBeUndefined();
	});

	it('compares with last week only above the baseline', () => {
		expect(volumeRatio(500, 2_000)).toBe(0.25);
		expect(volumeRatio(5, 10)).toBeUndefined();
		expect(volumeRatio(undefined, 2_000)).toBeUndefined();
	});

	it('is silent with nothing now but data last week, and low under half', () => {
		expect(
			isSilent(toSignalSnapshot('traces', series([[0, 0]]), series([[0, 50]]))),
		).toBe(true);
		expect(
			isSilent(toSignalSnapshot('traces', series([[0, 0]]), series([[0, 0]]))),
		).toBe(false);
		expect(
			isLow(toSignalSnapshot('logs', series([[0, 900]]), series([[0, 2_000]]))),
		).toBe(true);
	});
});
