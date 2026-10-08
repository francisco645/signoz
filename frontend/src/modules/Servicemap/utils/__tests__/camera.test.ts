import { fitCamera } from '../camera';

const limits = { min: 0.2, max: 8 };
const noInsets = { top: 0, right: 0, bottom: 0, left: 0 };

describe('fitCamera', () => {
	it('centres the graph and fits its larger side', () => {
		expect(
			fitCamera(
				{ x: [0, 200], y: [0, 100] },
				{ width: 400, height: 400 },
				noInsets,
				limits,
			),
		).toStrictEqual({ zoom: 2, x: 100, y: 50 });
	});

	it('keeps the graph above a bottom inset', () => {
		const camera = fitCamera(
			{ x: [0, 100], y: [0, 100] },
			{ width: 400, height: 400 },
			{ ...noInsets, bottom: 200 },
			limits,
		);

		expect(camera.zoom).toBe(2);
		// The graph centre sits 100px above the viewport centre.
		expect(camera.y).toBe(100);
	});

	it('respects the zoom limits', () => {
		expect(
			fitCamera(
				{ x: [0, 1], y: [0, 1] },
				{ width: 400, height: 400 },
				noInsets,
				limits,
			).zoom,
		).toBe(8);
	});
});
