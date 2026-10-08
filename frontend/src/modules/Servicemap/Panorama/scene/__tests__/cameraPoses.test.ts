import { getCameraPose } from '../cameraPoses';

const extent = { width: 300, depth: 200, cx: 0, cz: 0 };

describe('getCameraPose', () => {
	it('looks straight down from the top view', () => {
		const pose = getCameraPose('top', extent, true, 1.6);
		expect(pose.position.x).toBeCloseTo(pose.target.x);
		expect(pose.position.y).toBeGreaterThan(pose.target.y);
	});

	it('pulls back on narrow screens so the planes still fit', () => {
		const wide = getCameraPose('iso', extent, false, 1.6);
		const narrow = getCameraPose('iso', extent, false, 0.8);
		expect(narrow.position.length()).toBeGreaterThan(wide.position.length());
	});
});
