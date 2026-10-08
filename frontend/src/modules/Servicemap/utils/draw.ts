import { ALPHA, BORDER_DASH, BORDER_WIDTH, CANVAS } from '../constants';
import type { HealthBand, ServiceMapPalette } from '../types';
import { truncateMiddle } from './format';
import { isAlerting } from './health';

interface Point {
	x: number;
	y: number;
}

export interface NodeVisual {
	band: HealthBand;
	label: string;
	showLabel: boolean;
	isSelected: boolean;
	isHovered: boolean;
	isDimmed: boolean;
}

export interface LinkVisual {
	band: HealthBand;
	/** Calls per second. */
	callRate: number;
	label?: string;
	isEmphasized: boolean;
	isDimmed: boolean;
	isBidirectional: boolean;
}

const FONT_FAMILY = 'Inter, sans-serif';

/** Width in screen pixels: 0.1 req/s → 1.3, 1 → 2, 10 → 3, 100 → 4, capped at 6. */
export const getLinkWidth = (callRate: number): number =>
	Math.min(6, Math.max(1, 1 + Math.log10(1 + 10 * Math.max(0, callRate))));

const bandColor = (band: HealthBand, palette: ServiceMapPalette): string => {
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

const drawGlyph = (
	ctx: CanvasRenderingContext2D,
	band: HealthBand,
	center: Point,
	size: number,
	color: string,
	lineWidth: number,
): void => {
	ctx.save();
	ctx.strokeStyle = color;
	ctx.fillStyle = color;
	ctx.lineWidth = lineWidth;
	ctx.setLineDash([]);
	ctx.beginPath();
	if (band === 'degraded') {
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

const drawLabel = (
	ctx: CanvasRenderingContext2D,
	text: string,
	position: Point,
	fontSize: number,
	fontWeight: number,
	palette: ServiceMapPalette,
	scale: number,
): void => {
	ctx.font = `${fontWeight} ${fontSize / scale}px ${FONT_FAMILY}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.lineJoin = 'round';
	ctx.lineWidth = CANVAS.labelHalo / scale;
	ctx.strokeStyle = palette.background;
	ctx.strokeText(text, position.x, position.y);
	ctx.fillStyle = palette.foreground;
	ctx.fillText(text, position.x, position.y);
};

const drawRing = (
	ctx: CanvasRenderingContext2D,
	position: Point,
	radius: number,
	isSelected: boolean,
	palette: ServiceMapPalette,
	scale: number,
): void => {
	ctx.save();
	ctx.beginPath();
	ctx.arc(
		position.x,
		position.y,
		radius + CANVAS.ringGap / scale,
		0,
		2 * Math.PI,
	);
	ctx.lineWidth = (isSelected ? 2 : 1) / scale;
	ctx.strokeStyle = isSelected ? palette.selection : palette.foreground;
	if (!isSelected) {
		ctx.globalAlpha *= ALPHA.hoverRing;
	}
	ctx.stroke();
	ctx.restore();
};

/**
 * Health is told apart without colour too: border width (1/2/3 px), a glyph
 * (none, triangle, cross, dash) and the border pattern (solid or dashed).
 */
export const drawNode = (
	ctx: CanvasRenderingContext2D,
	position: Point,
	visual: NodeVisual,
	palette: ServiceMapPalette,
	scale: number,
): void => {
	const radius = CANVAS.nodeRadius / scale;
	const color = bandColor(visual.band, palette);

	ctx.save();
	ctx.globalAlpha = visual.isDimmed ? ALPHA.dimmed : 1;

	ctx.beginPath();
	ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
	ctx.fillStyle =
		visual.band === 'noData' ? palette.background : palette.nodeFill;
	ctx.fill();

	if (isAlerting(visual.band)) {
		ctx.globalAlpha *= ALPHA.tint;
		ctx.fillStyle = color;
		ctx.fill();
		ctx.globalAlpha = visual.isDimmed ? ALPHA.dimmed : 1;
	}

	ctx.lineWidth = BORDER_WIDTH[visual.band] / scale;
	ctx.setLineDash(BORDER_DASH[visual.band].map((dash) => dash / scale));
	ctx.strokeStyle = color;
	ctx.stroke();
	ctx.setLineDash([]);

	drawGlyph(
		ctx,
		visual.band,
		position,
		CANVAS.glyphSize / scale,
		color,
		1.5 / scale,
	);

	if (visual.isSelected || visual.isHovered) {
		drawRing(ctx, position, radius, visual.isSelected, palette, scale);
	}

	if (visual.showLabel) {
		drawLabel(
			ctx,
			truncateMiddle(visual.label, CANVAS.maxLabelLength),
			{ x: position.x, y: position.y + radius + CANVAS.labelGap / scale },
			visual.isSelected ? CANVAS.selectedLabelFontSize : CANVAS.labelFontSize,
			visual.isSelected ? 600 : 500,
			palette,
			scale,
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
	ctx.arc(position.x, position.y, CANVAS.nodeHitRadius / scale, 0, 2 * Math.PI);
	ctx.fill();
};

/** Control point of the curve between two nodes; straight links return the midpoint. */
const getControlPoint = (
	start: Point,
	end: Point,
	curvature: number,
): Point => {
	const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
	return {
		x: mid.x + curvature * (end.y - start.y),
		y: mid.y - curvature * (end.x - start.x),
	};
};

const pointOnCurve = (
	start: Point,
	control: Point,
	end: Point,
	t: number,
): Point => ({
	x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
	y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
});

const traceLink = (
	ctx: CanvasRenderingContext2D,
	start: Point,
	end: Point,
	isBidirectional: boolean,
): Point => {
	const control = getControlPoint(
		start,
		end,
		isBidirectional ? CANVAS.curvature : 0,
	);
	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
	return control;
};

export const drawLink = (
	ctx: CanvasRenderingContext2D,
	start: Point,
	end: Point,
	visual: LinkVisual,
	palette: ServiceMapPalette,
	scale: number,
): void => {
	const distance = Math.hypot(end.x - start.x, end.y - start.y);
	if (distance === 0) {
		return;
	}

	const alerting = isAlerting(visual.band);
	let color = palette.mutedForeground;
	if (alerting) {
		color = bandColor(visual.band, palette);
	} else if (visual.isEmphasized) {
		color = palette.foreground;
	}
	const width =
		(getLinkWidth(visual.callRate) + (visual.isEmphasized ? 1 : 0)) / scale;

	ctx.save();
	ctx.globalAlpha = visual.isDimmed ? ALPHA.dimmedLink : 1;
	ctx.strokeStyle = color;
	ctx.fillStyle = color;
	ctx.lineWidth = width;

	const control = traceLink(ctx, start, end, visual.isBidirectional);
	ctx.stroke();

	const arrowLength = CANVAS.arrowLength / scale + width;
	const nodeRadius = (CANVAS.nodeRadius + CANVAS.ringGap) / scale;
	const tipT = Math.max(0, 1 - nodeRadius / distance);
	const baseT = Math.max(0, 1 - (nodeRadius + arrowLength) / distance);
	const tip = pointOnCurve(start, control, end, tipT);
	const base = pointOnCurve(start, control, end, baseT);
	const angle = Math.atan2(tip.y - base.y, tip.x - base.x);
	const halfWidth = arrowLength / 2;

	ctx.beginPath();
	ctx.moveTo(tip.x, tip.y);
	ctx.lineTo(
		base.x + halfWidth * Math.sin(angle),
		base.y - halfWidth * Math.cos(angle),
	);
	ctx.lineTo(
		base.x - halfWidth * Math.sin(angle),
		base.y + halfWidth * Math.cos(angle),
	);
	ctx.closePath();
	ctx.fill();

	if (alerting || visual.label) {
		const middle = pointOnCurve(start, control, end, 0.5);

		if (alerting) {
			const glyphSize = CANVAS.glyphSize / scale;
			ctx.beginPath();
			ctx.arc(middle.x, middle.y, glyphSize * 1.8, 0, 2 * Math.PI);
			ctx.fillStyle = palette.background;
			ctx.fill();
			drawGlyph(ctx, visual.band, middle, glyphSize, color, 1.5 / scale);
		}

		if (visual.label) {
			drawLabel(
				ctx,
				visual.label,
				{ x: middle.x, y: middle.y + (CANVAS.glyphSize * 2) / scale },
				CANVAS.labelFontSize,
				500,
				palette,
				scale,
			);
		}
	}

	ctx.restore();
};

export const drawLinkPointerArea = (
	ctx: CanvasRenderingContext2D,
	start: Point,
	end: Point,
	visual: Pick<LinkVisual, 'callRate' | 'isBidirectional'>,
	paintColor: string,
	scale: number,
): void => {
	ctx.strokeStyle = paintColor;
	ctx.lineWidth =
		Math.max(getLinkWidth(visual.callRate), CANVAS.linkHitWidth) / scale;
	traceLink(ctx, start, end, visual.isBidirectional);
	ctx.stroke();
};
