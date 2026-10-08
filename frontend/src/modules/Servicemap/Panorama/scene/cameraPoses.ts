import { Vector3 } from 'three';

export const PANORAMA_VIEWS = ['iso', 'side', 'top'] as const;

export type PanoramaView = (typeof PANORAMA_VIEWS)[number];

export interface CameraPose {
	position: Vector3;
	target: Vector3;
}

interface Extent {
	width: number;
	depth: number;
	cx: number;
	cz: number;
}

/** Width to height the prototype was framed at; narrower viewports pull the camera back. */
const FRAMED_ASPECT = 1.6;

/** Where the camera sits for each view, framing the planes. */
export const getCameraPose = (
	view: PanoramaView,
	extent: Extent,
	isFlat: boolean,
	aspect: number,
): CameraPose => {
	const reach =
		(Math.max(extent.width, extent.depth) + 70) *
		Math.max(1, FRAMED_ASPECT / Math.max(aspect, 0.2));
	const target = new Vector3(extent.cx, isFlat ? 0 : -4, extent.cz);
	const { cx, cz } = extent;
	if (view === 'side') {
		return {
			position: new Vector3(cx + reach * 0.25, reach * 0.2, cz + reach * 1.3),
			target,
		};
	}
	if (view === 'top') {
		return {
			position: new Vector3(cx, reach * 1.15, cz + 0.01),
			target,
		};
	}
	return {
		position: new Vector3(cx + reach * 0.8, reach * 0.72, cz + reach * 0.88),
		target,
	};
};

export const easeInOutCubic = (x: number): number =>
	x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
