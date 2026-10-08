import { ALPHA, CANVAS } from '../constants';
import type { HealthBand, ServiceMapPalette } from '../types';
import {
	bandColor,
	drawGlyph,
	drawLabel,
	getNodeRadius,
	Point,
} from './drawPrimitives';
import { isAlerting } from './health';
import type { LabelSpace } from './labelSpace';

export interface LinkVisual {
	band: HealthBand;
	/** Calls per second. */
	callRate: number;
	label?: string;
	isEmphasized: boolean;
	isDimmed: boolean;
	isBidirectional: boolean;
}

/** Width in screen pixels: 0.1 req/s → 1.3, 1 → 2, 10 → 3, 100 → 4, capped at 6. */
export const getLinkWidth = (callRate: number): number =>
	Math.min(6, Math.max(1, 1 + Math.log10(1 + 10 * Math.max(0, callRate))));

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

const drawArrow = (
	ctx: CanvasRenderingContext2D,
	start: Point,
	control: Point,
	end: Point,
	width: number,
	scale: number,
): void => {
	const distance = Math.hypot(end.x - start.x, end.y - start.y);
	const arrowLength = CANVAS.arrowLength / scale + width;
	const nodeRadius = getNodeRadius(scale) + CANVAS.ringGap / scale;
	const tip = pointOnCurve(
		start,
		control,
		end,
		Math.max(0, 1 - nodeRadius / distance),
	);
	const base = pointOnCurve(
		start,
		control,
		end,
		Math.max(0, 1 - (nodeRadius + arrowLength) / distance),
	);
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
};

export const drawLink = (
	ctx: CanvasRenderingContext2D,
	start: Point,
	end: Point,
	visual: LinkVisual,
	palette: ServiceMapPalette,
	scale: number,
	labelSpace?: LabelSpace,
): void => {
	if (Math.hypot(end.x - start.x, end.y - start.y) === 0) {
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
	drawArrow(ctx, start, control, end, width, scale);

	const middle = pointOnCurve(start, control, end, 0.5);
	if (alerting) {
		const glyphSize = CANVAS.glyphSize / scale;
		ctx.beginPath();
		ctx.arc(middle.x, middle.y, glyphSize * 1.8, 0, 2 * Math.PI);
		ctx.fillStyle = palette.background;
		ctx.fill();
		drawGlyph(ctx, visual.band, middle, glyphSize, color, 1.5 / scale, 'link');
	}
	if (visual.label) {
		drawLabel(
			ctx,
			visual.label,
			{ x: middle.x, y: middle.y + (CANVAS.glyphSize * 2) / scale },
			palette,
			scale,
			{
				fontSize: CANVAS.labelFontSize,
				fontWeight: 500,
				force: visual.isEmphasized,
				space: labelSpace,
			},
		);
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
