import {
	forwardRef,
	memo,
	MouseEvent,
	MutableRefObject,
	useEffect,
	useMemo,
	useState,
} from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import cx from 'classnames';
import { useIsDarkMode } from 'hooks/useDarkMode';

import {
	CHARGE_STRENGTH,
	COOLDOWN_TICKS,
	GRAVITY_STRENGTH,
	MAX_ZOOM,
	MIN_ZOOM,
	REDUCED_MOTION_WARMUP_TICKS,
	SERVICE_MAP_TEXT,
	WARMUP_TICKS,
	ZOOM_STEP,
} from '../constants';
import {
	GraphLink,
	GraphNode,
	useCanvasPainters,
} from '../hooks/useCanvasPainters';
import { useGraphCamera } from '../hooks/useGraphCamera';
import { useLinkParticles } from '../hooks/useLinkParticles';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { ServiceMapGraph, ServiceMapLink, ServiceMapNode } from '../types';
import { buildAdjacency, linkEndId } from '../utils/adjacency';
import type { Insets } from '../utils/camera';
import { createGravityForce } from '../utils/forces';
import { isAlerting } from '../utils/health';
import { getServiceMapPalette } from '../utils/palette';
import CanvasTooltip from './CanvasTooltip';
import LinkTooltipContent from './LinkTooltipContent';
import NodeTooltipContent from './NodeTooltipContent';
import ZoomControls from './ZoomControls';

import styles from './ServiceMapCanvas.module.scss';

export type ServiceMapGraphRef = MutableRefObject<
	ForceGraphMethods<GraphNode, GraphLink> | undefined
>;

interface ServiceMapCanvasProps {
	fgRef: ServiceMapGraphRef;
	graph: ServiceMapGraph;
	width: number;
	height: number;
	/** Screen space covered by overlays, kept free when fitting the graph. */
	insets: Insets;
	selectedId?: string;
	/** Node the keyboard cursor sits on. */
	cursorId?: string;
	highlighted?: ReadonlySet<string>;
	/** A refresh is in flight: the graph is drawn faded, overlays are not. */
	isUpdating: boolean;
	/** Particles run along the edges, caller to callee. */
	isFlowEnabled: boolean;
	onNodeClick?: (id: string) => void;
}

type Hovered =
	| { kind: 'node'; node: ServiceMapNode }
	| { kind: 'link'; link: ServiceMapLink };

/**
 * The canvas itself is focusable: once it has focus the map's shortcuts and the
 * arrow keys apply, and the keyboard cursor is drawn on the graph.
 */
const ServiceMapCanvas = forwardRef<HTMLDivElement, ServiceMapCanvasProps>(
	function ServiceMapCanvas(
		{
			fgRef,
			graph,
			width,
			height,
			insets,
			selectedId,
			cursorId,
			highlighted,
			isUpdating,
			isFlowEnabled,
			onNodeClick,
		},
		ref,
	): JSX.Element {
		const isDarkMode = useIsDarkMode();
		const prefersReducedMotion = usePrefersReducedMotion();
		const [hovered, setHovered] = useState<Hovered>();
		const [pointer, setPointer] = useState({ x: 0, y: 0 });

		const palette = useMemo(() => getServiceMapPalette(isDarkMode), [isDarkMode]);
		const adjacency = useMemo(() => buildAdjacency(graph.links), [graph.links]);
		const nodesWithSpans = useMemo(
			() => new Set(graph.nodes.filter((n) => n.metrics).map((n) => n.id)),
			[graph.nodes],
		);
		const alertingTargets = useMemo(
			() =>
				new Set(
					graph.links
						.filter((link) => isAlerting(link.colorBand))
						.map((link) => linkEndId(link.target)),
				),
			[graph.links],
		);

		const hoveredId = hovered?.kind === 'node' ? hovered.node.id : undefined;

		const { resetLabels, paintNode, paintNodeArea, paintLink, paintLinkArea } =
			useCanvasPainters({
				palette,
				adjacency,
				hoveredId,
				selectedId,
				cursorId,
				highlighted,
				alertingTargets,
			});

		const particles = useLinkParticles({
			fgRef,
			links: graph.links,
			isEnabled: isFlowEnabled,
			activeId: hoveredId ?? selectedId,
			highlighted,
			palette,
		});

		const { fitToView, zoomBy, handleEngineStop } = useGraphCamera({
			fgRef,
			graph,
			width,
			height,
			insets,
			highlighted,
			prefersReducedMotion,
		});

		useEffect(() => {
			const graphRef = fgRef.current;
			graphRef?.d3Force('charge')?.strength(CHARGE_STRENGTH);
			graphRef?.d3Force('gravity', createGravityForce(GRAVITY_STRENGTH));
		}, [fgRef, graph]);

		const handleMouseMove = (event: MouseEvent<HTMLDivElement>): void => {
			const bounds = event.currentTarget.getBoundingClientRect();
			setPointer({
				x: event.clientX - bounds.left,
				y: event.clientY - bounds.top,
			});
		};

		return (
			// A focusable map region, like a slippy map: the arrow keys move a cursor across services.
			<div
				ref={ref}
				className={cx(styles.canvas, { [styles.isUpdating]: isUpdating })}
				onMouseMove={handleMouseMove}
				onMouseLeave={(): void => setHovered(undefined)}
				// eslint-disable-next-line jsx-a11y/prefer-tag-over-role
				role="application"
				aria-roledescription="service map"
				aria-label={SERVICE_MAP_TEXT.canvasLabel}
				// eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
				tabIndex={0}
				data-testid="service-map-canvas"
			>
				<ForceGraph2D<ServiceMapNode, ServiceMapLink>
					ref={fgRef}
					graphData={graph}
					width={width}
					height={height}
					backgroundColor={palette.background}
					minZoom={MIN_ZOOM}
					maxZoom={MAX_ZOOM}
					warmupTicks={
						prefersReducedMotion ? REDUCED_MOTION_WARMUP_TICKS : WARMUP_TICKS
					}
					cooldownTicks={prefersReducedMotion ? 0 : COOLDOWN_TICKS}
					onEngineStop={handleEngineStop}
					onRenderFramePre={resetLabels}
					nodeCanvasObject={paintNode}
					nodePointerAreaPaint={paintNodeArea}
					linkCanvasObject={paintLink}
					linkPointerAreaPaint={paintLinkArea}
					{...particles}
					nodeLabel={(): string => ''}
					linkLabel={(): string => ''}
					onNodeHover={(node): void =>
						setHovered(node ? { kind: 'node', node } : undefined)
					}
					onLinkHover={(link): void =>
						setHovered(link ? { kind: 'link', link } : undefined)
					}
					onZoom={(): void =>
						setHovered((current) => (current ? undefined : current))
					}
					onNodeClick={(node): void => onNodeClick?.(node.id)}
					onLinkClick={(link): void => onNodeClick?.(linkEndId(link.target))}
				/>

				{hovered && (
					<CanvasTooltip x={pointer.x} y={pointer.y}>
						{hovered.kind === 'node' ? (
							<NodeTooltipContent node={hovered.node} />
						) : (
							<LinkTooltipContent
								link={hovered.link}
								source={linkEndId(hovered.link.source)}
								target={linkEndId(hovered.link.target)}
								isServerSide={nodesWithSpans.has(linkEndId(hovered.link.target))}
							/>
						)}
					</CanvasTooltip>
				)}

				<ZoomControls
					onZoomIn={(): void => zoomBy(ZOOM_STEP)}
					onZoomOut={(): void => zoomBy(1 / ZOOM_STEP)}
					onFit={fitToView}
				/>
			</div>
		);
	},
);

export default memo(ServiceMapCanvas);
