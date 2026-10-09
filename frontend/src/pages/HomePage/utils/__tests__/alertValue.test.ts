import { getAlertValue } from '../alertValue';

describe('getAlertValue', () => {
	it.each([
		[
			'This alert is fired when error rate (current value: 6.8%) crosses the threshold (2%)',
			'6.8%',
		],
		['latency (current value: 2.91 s) crosses the threshold (2 s)', '2.91 s'],
		['lag (current value: 14.2k) crosses', '14.2k'],
		['delta (current value: -3) crosses', '-3'],
		['Current Value 1e+06) above', '1e+06'],
	])('reads %s', (description, value) => {
		expect(getAlertValue(description)).toBe(value);
	});

	it.each([
		['never rendered', 'value (current value: {{$value}}) crosses'],
		['no current value', 'Errors crossed the threshold (2%)'],
		[
			'a sentence, not a value',
			'x (current value: way above anything we expected today) y',
		],
		['no description', undefined],
	])('gives nothing when %s', (_, description) => {
		expect(getAlertValue(description)).toBeUndefined();
	});
});
