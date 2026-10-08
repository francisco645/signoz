import type { NodeKind } from '../types';

/**
 * Paths of the @signozhq/icons glyphs the legend shows for each kind (Box,
 * Database, Layers, Globe), on their 16×16 grid. Kept as strings so the canvas
 * strokes them as vectors at any zoom.
 */
export const PICTOGRAM_PATHS: Record<NodeKind, string> = {
	service:
		'M2.2 4.667 8 8m0 0 5.8-3.333M8 8v6.667m6-9.334a1.333 1.333 0 0 0-.667-1.153L8.667 1.513a1.333 1.333 0 0 0-1.334 0L2.667 4.18A1.333 1.333 0 0 0 2 5.333v5.334a1.334 1.334 0 0 0 .667 1.153l4.666 2.667a1.334 1.334 0 0 0 1.334 0l4.666-2.667A1.333 1.333 0 0 0 14 10.667V5.333Z',
	database:
		'M14 3.333c0 1.105-2.686 2-6 2s-6-.895-6-2m12 0c0-1.104-2.686-2-6-2s-6 .896-6 2m12 0v9.334c0 .53-.632 1.039-1.757 1.414-1.126.375-2.652.586-4.243.586-1.591 0-3.117-.211-4.243-.586C2.632 13.706 2 13.197 2 12.667V3.333M2 8c0 .53.632 1.04 1.757 1.414C4.883 9.79 6.41 10 8 10c1.591 0 3.117-.21 4.243-.586C13.368 9.04 14 8.53 14 8',
	queue:
		'M14.666 11.767 8.553 14.54a1.334 1.334 0 0 1-1.107 0l-6.113-2.773m13.333-3.334-6.113 2.774a1.334 1.334 0 0 1-1.107 0L1.333 8.433m7.22-6.98a1.333 1.333 0 0 0-1.107 0l-5.713 2.6a.667.667 0 0 0 0 1.22l5.72 2.607a1.333 1.333 0 0 0 1.107 0l5.72-2.6a.667.667 0 0 0 0-1.22L8.553 1.453Z',
	external:
		'M14.666 8A6.667 6.667 0 0 1 8 14.667M14.666 8A6.667 6.667 0 0 0 8 1.333M14.666 8H1.333M8 14.667A6.667 6.667 0 0 1 1.333 8M8 14.667A9.666 9.666 0 0 1 8 1.333m0 13.334A9.666 9.666 0 0 0 8 1.333M1.333 8A6.667 6.667 0 0 1 8 1.333',
};

const ICON_GRID = 16;
const cache = new Map<NodeKind, Path2D>();

/** Built lazily and once per kind: jsdom has no Path2D, and 500 nodes share four paths. */
const getPictogram = (kind: NodeKind): Path2D => {
	let path = cache.get(kind);
	if (!path) {
		path = new Path2D(PICTOGRAM_PATHS[kind]);
		cache.set(kind, path);
	}
	return path;
};

/** Strokes the kind's icon centred on `center`; `size` and `lineWidth` are in canvas units. */
export const strokePictogram = (
	ctx: CanvasRenderingContext2D,
	kind: NodeKind,
	center: { x: number; y: number },
	size: number,
	color: string,
	lineWidth: number,
): void => {
	const unit = size / ICON_GRID;
	ctx.save();
	ctx.translate(center.x - size / 2, center.y - size / 2);
	ctx.scale(unit, unit);
	ctx.setLineDash([]);
	ctx.lineWidth = lineWidth / unit;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.strokeStyle = color;
	ctx.stroke(getPictogram(kind));
	ctx.restore();
};
