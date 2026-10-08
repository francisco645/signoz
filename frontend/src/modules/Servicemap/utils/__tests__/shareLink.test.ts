import { buildShareLink } from '../shareLink';

describe('buildShareLink', () => {
	it('pins the window and keeps the selection, focus and filters', () => {
		const link = new URL(
			buildShareLink(
				'https://signoz.example/service-map?relativeTime=1h&resourceAttribute=abc&selected=cart&focus=cart&focusDir=up',
				1_000_000_000_000,
				4_600_000_000_000,
			),
		);

		expect(link.searchParams.get('relativeTime')).toBeNull();
		expect(link.searchParams.get('startTime')).toBe('1000000');
		expect(link.searchParams.get('endTime')).toBe('4600000');
		expect(link.searchParams.get('selected')).toBe('cart');
		expect(link.searchParams.get('focus')).toBe('cart');
		expect(link.searchParams.get('focusDir')).toBe('up');
		expect(link.searchParams.get('resourceAttribute')).toBe('abc');
	});
});
