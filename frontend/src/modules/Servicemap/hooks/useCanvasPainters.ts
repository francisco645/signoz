import { useCallback, useMemo, useRef } from 'react';
import type { LinkObject, NodeObject } from 'react-force-graph-2d';

import { CANVAS } from '../constants';
import type {
	ServiceMapLink,
	ServiceMapNode,
	ServiceMapPalette,
} from '../types';
import { Adjacency, linkEndId } from '../utils/adjacency';
import { drawLink, drawLinkPointerArea } from '../utils/drawLink';
import { drawNode, drawNodePointerArea } from '../utils/drawNode';
import { formatPercent, formatRate } from '../utils/format';
import { isAlerting } from '../utils/health';
import { LabelSpace } from '../utils/labelSpace';

export type GraphNode = NodeObject<ServiceMapNode>;
export type GraphLink = LinkObject<ServiceMapNode, ServiceMapLink>;

interface UseCanvasPaintersProps {
	palette: ServiceMapPalette;
	adjacency: Adjacency;
	hoveredId?: string;
	selectedId?: string;
	/** Node the keyboard cursor sits on. */
	cursorId?: string;
	/** Services kept at full opacity; everything else is dimmed. */
	highlighted?: ReadonlySet<string>;
	/** Nodes called over a degraded or critical link: their names stay visible. */
	alertingTargets: ReadonlySet<string>;
}

interface CanvasPainters {
	/** Frees the label space; call before every frame. */
	resetLabels: () => void;
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
	cursorId,
	highlighted,
	alertingTargets,
}: UseCanvasPaintersProps): CanvasPainters => {
	const activeId = hoveredId ?? selectedId;
	const labelSpaceRef = useRef(new LabelSpace());
	const resetLabels = useCallback((): void => labelSpaceRef.current.reset(), []);

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
			const isCursor = node.id === cursorId;
			const forceLabel =
				isSelected ||
				isHovered ||
				isCursor ||
				isAlerting(node.band) ||
				alertingTargets.has(node.id) ||
				!!neighbours?.has(node.id);

			drawNode(
				ctx,
				{ x: node.x ?? 0, y: node.y ?? 0 },
				{
					kind: node.kind,
					band: node.band,
					label: node.id,
					isSelected,
					isHovered,
					isCursor,
					isDimmed,
					forceLabel,
					showLabel: !isDimmed && (scale >= CANVAS.labelMinZoom || forceLabel),
				},
				palette,
				scale,
				labelSpaceRef.current,
			);
		},
		[
			alertingTargets,
			cursorId,
			highlighted,
			hoveredId,
			neighbours,
			palette,
			selectedId,
		],
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
					(isAlerting(link.colorBand) && scale >= CANVAS.linkLabelMinZoom));

			drawLink(
				ctx,
				positionOf(link.source),
				positionOf(link.target),
				{
					band: link.colorBand,
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
				labelSpaceRef.current,
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

	return { resetLabels, paintNode, paintNodeArea, paintLink, paintLinkArea };
};
