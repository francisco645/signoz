import { useCallback, useMemo } from 'react';
import type { LinkObject, NodeObject } from 'react-force-graph-2d';

import { CANVAS } from '../constants';
import type {
	ServiceMapLink,
	ServiceMapNode,
	ServiceMapPalette,
} from '../types';
import { Adjacency, linkEndId } from '../utils/adjacency';
import {
	drawLink,
	drawLinkPointerArea,
	drawNode,
	drawNodePointerArea,
} from '../utils/draw';
import { formatPercent, formatRate } from '../utils/format';
import { isAlerting } from '../utils/health';

export type GraphNode = NodeObject<ServiceMapNode>;
export type GraphLink = LinkObject<ServiceMapNode, ServiceMapLink>;

interface UseCanvasPaintersProps {
	palette: ServiceMapPalette;
	adjacency: Adjacency;
	hoveredId?: string;
	selectedId?: string;
	/** Services kept at full opacity; everything else is dimmed. */
	highlighted?: ReadonlySet<string>;
}

interface CanvasPainters {
	paintNode: (
		node: GraphNode,
		ctx: CanvasRenderingContext2D,
		scale: number,
	) => void;
	paintNodeArea: (
		node: GraphNode,
		color: string,
		ctx: CanvasRenderingContext2D,
		scale: number,
	) => void;
	paintLink: (
		link: GraphLink,
		ctx: CanvasRenderingContext2D,
		scale: number,
	) => void;
	paintLinkArea: (
		link: GraphLink,
		color: string,
		ctx: CanvasRenderingContext2D,
		scale: number,
	) => void;
}

/** force-graph swaps a link's ends for the node objects it lays out. */
const positionOf = (end: unknown): { x: number; y: number } => {
	const node =
		typeof end === 'object' && end !== null ? (end as GraphNode) : undefined;
	return { x: node?.x ?? 0, y: node?.y ?? 0 };
};

export const useCanvasPainters = ({
	palette,
	adjacency,
	hoveredId,
	selectedId,
	highlighted,
}: UseCanvasPaintersProps): CanvasPainters => {
	const activeId = hoveredId ?? selectedId;

	const neighbours = useMemo(() => {
		if (!activeId) {
			return undefined;
		}
		return new Set([
			activeId,
			...(adjacency.callers.get(activeId) ?? []),
			...(adjacency.callees.get(activeId) ?? []),
		]);
	}, [activeId, adjacency]);

	const paintNode = useCallback(
		(node: GraphNode, ctx: CanvasRenderingContext2D, scale: number): void => {
			const isDimmed = !!highlighted && !highlighted.has(node.id);
			const isSelected = node.id === selectedId;
			const isHovered = node.id === hoveredId;

			drawNode(
				ctx,
				{ x: node.x ?? 0, y: node.y ?? 0 },
				{
					band: node.band,
					label: node.id,
					isSelected,
					isHovered,
					isDimmed,
					showLabel:
						!isDimmed &&
						(scale >= CANVAS.labelMinZoom ||
							isSelected ||
							isHovered ||
							isAlerting(node.band) ||
							!!neighbours?.has(node.id)),
				},
				palette,
				scale,
			);
		},
		[highlighted, hoveredId, neighbours, palette, selectedId],
	);

	const paintNodeArea = useCallback(
		(
			node: GraphNode,
			color: string,
			ctx: CanvasRenderingContext2D,
			scale: number,
		): void => {
			drawNodePointerArea(ctx, { x: node.x ?? 0, y: node.y ?? 0 }, color, scale);
		},
		[],
	);

	const paintLink = useCallback(
		(link: GraphLink, ctx: CanvasRenderingContext2D, scale: number): void => {
			const source = linkEndId(link.source);
			const target = linkEndId(link.target);
			const isEmphasized =
				!!activeId && (source === activeId || target === activeId);
			const isDimmed =
				!!highlighted && !(highlighted.has(source) && highlighted.has(target));
			const showLabel =
				!isDimmed &&
				(isEmphasized ||
					(isAlerting(link.band) && scale >= CANVAS.linkLabelMinZoom));

			drawLink(
				ctx,
				positionOf(link.source),
				positionOf(link.target),
				{
					band: link.band,
					callRate: link.callRate,
					isBidirectional: link.isBidirectional,
					isEmphasized,
					isDimmed,
					label: showLabel
						? `${formatPercent(link.errorRate)} · ${formatRate(link.callRate)}`
						: undefined,
				},
				palette,
				scale,
			);
		},
		[activeId, highlighted, palette],
	);

	const paintLinkArea = useCallback(
		(
			link: GraphLink,
			color: string,
			ctx: CanvasRenderingContext2D,
			scale: number,
		): void => {
			drawLinkPointerArea(
				ctx,
				positionOf(link.source),
				positionOf(link.target),
				link,
				color,
				scale,
			);
		},
		[],
	);

	return { paintNode, paintNodeArea, paintLink, paintLinkArea };
};
