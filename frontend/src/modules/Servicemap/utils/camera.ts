export interface Bounds {
	x: [number, number];
	y: [number, number];
}

export interface Insets {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface Camera {
	zoom: number;
	x: number;
	y: number;
}

/**
 * Zoom and centre, in graph coordinates, that fit `bounds` into the part of the
 * viewport the insets leave free, so no node ends up under the legend or a panel.
 */
export const fitCamera = (
	bounds: Bounds,
	viewport: { width: number; height: number },
	insets: Insets,
	limits: { min: number; max: number },
): Camera => {
	const freeWidth = Math.max(1, viewport.width - insets.left - insets.right);
	const freeHeight = Math.max(1, viewport.height - insets.top - insets.bottom);
	const graphWidth = Math.max(1, bounds.x[1] - bounds.x[0]);
	const graphHeight = Math.max(1, bounds.y[1] - bounds.y[0]);
	const zoom = Math.min(
		limits.max,
		Math.max(
			limits.min,
			Math.min(freeWidth / graphWidth, freeHeight / graphHeight),
		),
	);

	const offsetX = (insets.left - insets.right) / 2;
	const offsetY = (insets.top - insets.bottom) / 2;

	return {
		zoom,
		x: (bounds.x[0] + bounds.x[1]) / 2 - offsetX / zoom,
		y: (bounds.y[0] + bounds.y[1]) / 2 - offsetY / zoom,
	};
};
