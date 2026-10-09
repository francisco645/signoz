import { alignWindow } from '../window';

describe('alignWindow', () => {
	it('ends at the last whole minute before now', () => {
		expect(alignWindow(3 * 60_000 + 59_000, 60_000)).toStrictEqual({
			startMs: 60_000,
			endMs: 120_000,
		});
		expect(alignWindow(3 * 60_000, 60_000)).toStrictEqual({
			startMs: 60_000,
			endMs: 120_000,
		});
	});
});
