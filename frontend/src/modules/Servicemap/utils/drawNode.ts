import { ALPHA, BORDER_DASH, BORDER_WIDTH, CANVAS } from '../constants';
import type { HealthBand, NodeKind, ServiceMapPalette } from '../types';
import {
	bandColor,
	drawGlyph,
	drawHealthBadge,
	drawLabel,
	getNodeRadius,
	isCompact,
	Point,
	traceNodeShape,
} from './drawPrimitives';
import { truncateMiddle } from './format';
import { isAlerting } from './health';
import type { LabelSpace } from './labelSpace';
import { strokePictogram } from './pictograms';

export interface NodeVisual {
	kind: NodeKind;
	band: HealthBand;
	label: string;
	showLabel: boolean;
	/** The label is drawn even when it overlaps another one. */
	forceLabel: boolean;
	isSelected: boolean;
	isHovered: boolean;
	/** The keyboard cursor sits on this node. */
	isCursor: boolean;
	isDimmed: boolean;
}

const drawRing = (
	ctx: CanvasRenderingContext2D,
	position: Point,
	radius: number,
	visual: NodeVisual,
	palette: ServiceMapPalette,
	scale: number,
): void => {
	const isStrong = visual.isSelected || visual.isCursor;
	ctx.save();
	ctx.beginPath();
	ctx.arc(
		position.x,
		position.y,
		radius + CANVAS.ringGap / scale,
		0,
		2 * Math.PI,
	);
	if (visual.isCursor) {
		ctx.setLineDash([3 / scale, 2 / scale]);
	}
	ctx.lineWidth = (isStrong ? 2 : 1) / scale;
	ctx.strokeStyle = isStrong ? palette.selection : palette.foreground;
	if (!isStrong) {
		ctx.globalAlpha *= ALPHA.hoverRing;
	}
	ctx.stroke();
	if (visual.isSelected && visual.isCursor) {
		ctx.beginPath();
		ctx.arc(
			position.x,
			position.y,
			radius + (CANVAS.ringGap * 2) / scale,
			0,
			2 * Math.PI,
		);
		ctx.stroke();
	}
	ctx.restore();
};

/** The icon and health badge, or the band glyph alone when zoomed out. */
const drawNodeContent = (
	ctx: CanvasRenderingContext2D,
	position: Point,
	radius: number,
	visual: NodeVisual,
	palette: ServiceMapPalette,
	scale: number,
): void => {
	if (isCompact(scale)) {
		drawGlyph(
			ctx,
			visual.band,
			position,
			CANVAS.compactGlyphSize / scale,
			visual.band === 'degraded'
				? palette.degradedGlyph
				: bandColor(visual.band, palette),
			1.5 / scale,
			'node',
		);
		return;
	}
	const isMuted = visual.band === 'lowTraffic' || visual.band === 'noData';
	strokePictogram(
		ctx,
		visual.kind,
		position,
		CANVAS.pictogramSize / scale,
		isMuted ? palette.mutedForeground : palette.secondaryForeground,
		CANVAS.pictogramStroke / scale,
	);
	drawHealthBadge(ctx, visual.band, position, radius, palette, scale);
};

/**
 * A disc with the kind's icon. Health is told apart without colour too: border
 * width (1/2/3 px) and pattern (solid, dashed, dotted) and a badge (triangle or
 * cross). Zoomed out there is no room for the icon, so the node becomes a plain
 * shape and the band glyph returns to its centre.
 */
export const drawNode = (
	ctx: CanvasRenderingContext2D,
	position: Point,
	visual: NodeVisual,
	palette: ServiceMapPalette,
	scale: number,
	labelSpace?: LabelSpace,
): void => {
	const radius = getNodeRadius(scale);
	const color = bandColor(visual.band, palette);
	const baseAlpha = visual.isDimmed ? ALPHA.dimmed : 1;

	ctx.save();
	ctx.globalAlpha = baseAlpha;

	traceNodeShape(ctx, visual.kind, position, radius, scale);
	ctx.fillStyle =
		visual.band === 'noData' ? palette.background : palette.nodeFill;
	ctx.fill();

	if (isAlerting(visual.band)) {
		ctx.globalAlpha = baseAlpha * ALPHA.tint;
		ctx.fillStyle = color;
		ctx.fill();
		ctx.globalAlpha = baseAlpha;
	}

	ctx.lineWidth = BORDER_WIDTH[visual.band] / scale;
	ctx.setLineDash(BORDER_DASH[visual.band].map((dash) => dash / scale));
	ctx.strokeStyle = visual.band === 'healthy' ? palette.mutedForeground : color;
	ctx.stroke();
	ctx.setLineDash([]);

	drawNodeContent(ctx, position, radius, visual, palette, scale);

	if (visual.isSelected || visual.isHovered || visual.isCursor) {
		drawRing(ctx, position, radius, visual, palette, scale);
	}

	if (visual.showLabel) {
		drawLabel(
			ctx,
			truncateMiddle(visual.label, CANVAS.maxLabelLength),
			{ x: position.x, y: position.y + radius + CANVAS.labelGap / scale },
			palette,
			scale,
			{
				fontSize: visual.isSelected
					? CANVAS.selectedLabelFontSize
					: CANVAS.labelFontSize,
				fontWeight: visual.isSelected ? 600 : 500,
				force: visual.forceLabel,
				space: labelSpace,
			},
		);
	}

	ctx.restore();
};

export const drawNodePointerArea = (
	ctx: CanvasRenderingContext2D,
	position: Point,
	paintColor: string,
	scale: number,
): void => {
	ctx.fillStyle = paintColor;
	ctx.beginPath();
	ctx.arc(
		position.x,
		position.y,
		Math.max(CANVAS.nodeHitRadius / scale, getNodeRadius(scale) + 2 / scale),
		0,
		2 * Math.PI,
	);
	ctx.fill();
};
