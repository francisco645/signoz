import { CANVAS } from '../constants';
import type { HealthBand, NodeKind, ServiceMapPalette } from '../types';
import type { LabelSpace } from './labelSpace';

export interface Point {
	x: number;
	y: number;
}

const FONT_FAMILY = 'Inter, sans-serif';

export const bandColor = (
	band: HealthBand,
	palette: ServiceMapPalette,
): string => {
	if (band === 'critical') {
		return palette.critical;
	}
	if (band === 'degraded') {
		return palette.degraded;
	}
	if (band === 'healthy') {
		return palette.secondaryForeground;
	}
	return palette.mutedForeground;
};

/**
 * Nodes mark a degraded service with a triangle. Links use a diamond instead,
 * which has no direction and cannot be read as a second arrow.
 */
export const drawGlyph = (
	ctx: CanvasRenderingContext2D,
	band: HealthBand,
	center: Point,
	size: number,
	color: string,
	lineWidth: number,
	on: 'node' | 'link',
): void => {
	ctx.save();
	ctx.strokeStyle = color;
	ctx.fillStyle = color;
	ctx.lineWidth = lineWidth;
	ctx.setLineDash([]);
	ctx.beginPath();
	if (band === 'degraded' && on === 'link') {
		ctx.moveTo(center.x, center.y - size);
		ctx.lineTo(center.x + size, center.y);
		ctx.lineTo(center.x, center.y + size);
		ctx.lineTo(center.x - size, center.y);
		ctx.closePath();
		ctx.fill();
	} else if (band === 'degraded') {
		ctx.moveTo(center.x, center.y - size);
		ctx.lineTo(center.x + size, center.y + size * 0.8);
		ctx.lineTo(center.x - size, center.y + size * 0.8);
		ctx.closePath();
		ctx.fill();
	} else if (band === 'critical') {
		ctx.moveTo(center.x - size, center.y - size);
		ctx.lineTo(center.x + size, center.y + size);
		ctx.moveTo(center.x + size, center.y - size);
		ctx.lineTo(center.x - size, center.y + size);
		ctx.stroke();
	} else if (band === 'noData') {
		ctx.moveTo(center.x - size, center.y);
		ctx.lineTo(center.x + size, center.y);
		ctx.stroke();
	}
	ctx.restore();
};

interface LabelOptions {
	fontSize: number;
	fontWeight: number;
	/** Drawn even when it overlaps another label. */
	force: boolean;
	space?: LabelSpace;
}

/** Draws a centred label with a halo; returns false when it was skipped for overlapping. */
export const drawLabel = (
	ctx: CanvasRenderingContext2D,
	text: string,
	position: Point,
	palette: ServiceMapPalette,
	scale: number,
	{ fontSize, fontWeight, force, space }: LabelOptions,
): boolean => {
	ctx.font = `${fontWeight} ${fontSize / scale}px ${FONT_FAMILY}`;
	const width = ctx.measureText(text).width;
	const height = (fontSize * 1.2) / scale;
	const fits =
		!space ||
		space.reserve(
			{
				left: position.x - width / 2,
				right: position.x + width / 2,
				top: position.y,
				bottom: position.y + height,
			},
			force,
		);
	if (!fits) {
		return false;
	}
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.lineJoin = 'round';
	ctx.lineWidth = CANVAS.labelHalo / scale;
	ctx.strokeStyle = palette.background;
	ctx.strokeText(text, position.x, position.y);
	ctx.fillStyle = palette.foreground;
	ctx.fillText(text, position.x, position.y);
	return true;
};

export const isCompact = (scale: number): boolean =>
	scale < CANVAS.pictogramMinZoom;

/** Node radius in canvas units at this zoom: arrows, rings and labels use it. */
export const getNodeRadius = (scale: number): number =>
	(isCompact(scale) ? CANVAS.compactNodeRadius : CANVAS.nodeRadius) / scale;

/**
 * A disc for every kind at normal zoom. Zoomed out, services stay round and
 * dependencies (database, queue, external) become rounded squares.
 */
export const traceNodeShape = (
	ctx: CanvasRenderingContext2D,
	kind: NodeKind,
	{ x, y }: Point,
	radius: number,
	scale: number,
): void => {
	ctx.beginPath();
	if (isCompact(scale) && kind !== 'service') {
		ctx.roundRect(x - radius, y - radius, radius * 2, radius * 2, 2 / scale);
	} else {
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
	}
};

const drawCriticalBadge = (
	ctx: CanvasRenderingContext2D,
	{ x, y }: Point,
	palette: ServiceMapPalette,
	scale: number,
): void => {
	ctx.arc(x, y, CANVAS.badgeRadius / scale, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.fillStyle = palette.critical;
	ctx.fill();
	const arm = 2 / scale;
	ctx.beginPath();
	ctx.moveTo(x - arm, y - arm);
	ctx.lineTo(x + arm, y + arm);
	ctx.moveTo(x + arm, y - arm);
	ctx.lineTo(x - arm, y + arm);
	ctx.lineWidth = 1.5 / scale;
	ctx.stroke();
};

const drawDegradedBadge = (
	ctx: CanvasRenderingContext2D,
	{ x, y }: Point,
	palette: ServiceMapPalette,
	scale: number,
): void => {
	const height = 10 / scale;
	const width = 11 / scale;
	const top = y - height * 0.58;
	ctx.moveTo(x, top);
	ctx.lineTo(x + width / 2, top + height);
	ctx.lineTo(x - width / 2, top + height);
	ctx.closePath();
	ctx.stroke();
	ctx.fillStyle = palette.degradedGlyph;
	ctx.fill();
	ctx.beginPath();
	ctx.moveTo(x, top + 3.4 / scale);
	ctx.lineTo(x, top + 6.4 / scale);
	ctx.lineWidth = 1.4 / scale;
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(x, top + 8.3 / scale, 0.8 / scale, 0, 2 * Math.PI);
	ctx.fillStyle = palette.background;
	ctx.fill();
};

/**
 * Health badge on the top right of the disc. Its shape tells the band apart
 * without colour: round with × is critical, a triangle with ! is degraded. A cut
 * in the background colour separates it from the node border.
 */
export const drawHealthBadge = (
	ctx: CanvasRenderingContext2D,
	band: HealthBand,
	nodeCenter: Point,
	radius: number,
	palette: ServiceMapPalette,
	scale: number,
): void => {
	if (band !== 'critical' && band !== 'degraded') {
		return;
	}
	const offset = radius * 0.74;
	const center = { x: nodeCenter.x + offset, y: nodeCenter.y - offset };
	ctx.save();
	ctx.setLineDash([]);
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.lineWidth = (CANVAS.badgeCut * 2) / scale;
	ctx.strokeStyle = palette.background;
	ctx.beginPath();
	if (band === 'critical') {
		drawCriticalBadge(ctx, center, palette, scale);
	} else {
		drawDegradedBadge(ctx, center, palette, scale);
	}
	ctx.restore();
};
