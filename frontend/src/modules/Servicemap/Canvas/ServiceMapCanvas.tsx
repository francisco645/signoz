import {
	memo,
	MouseEvent,
	MutableRefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { useIsDarkMode } from 'hooks/useDarkMode';

import {
	CAMERA_DURATION_MS,
	CHARGE_STRENGTH,
	COOLDOWN_TICKS,
	FIT_PADDING_PX,
	MAX_ZOOM,
	MIN_ZOOM,
	REDUCED_MOTION_WARMUP_TICKS,
	WARMUP_TICKS,
	ZOOM_STEP,
} from '../constants';
import {
	GraphLink,
	GraphNode,
	useCanvasPainters,
} from '../hooks/useCanvasPainters';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { ServiceMapGraph, ServiceMapLink, ServiceMapNode } from '../types';
import { buildAdjacency, linkEndId } from '../utils/adjacency';
import { fitCamera, Insets } from '../utils/camera';
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
	highlighted?: ReadonlySet<string>;
	onNodeClick?: (id: string) => void;
	onBackgroundClick?: () => void;
}

type Hovered =
	| { kind: 'node'; node: ServiceMapNode }
	| { kind: 'link'; link: ServiceMapLink };

function ServiceMapCanvas({
	fgRef,
	graph,
	width,
	height,
	insets,
	selectedId,
	highlighted,
	onNodeClick,
	onBackgroundClick,
}: ServiceMapCanvasProps): JSX.Element {
	const isDarkMode = useIsDarkMode();
	const prefersReducedMotion = usePrefersReducedMotion();
	const [hovered, setHovered] = useState<Hovered>();
	const [pointer, setPointer] = useState({ x: 0, y: 0 });
	const fittedNodesRef = useRef<string>();

	const palette = useMemo(() => getServiceMapPalette(isDarkMode), [isDarkMode]);
	const adjacency = useMemo(() => buildAdjacency(graph.links), [graph.links]);
	const nodesWithSpans = useMemo(
		() => new Set(graph.nodes.filter((n) => n.metrics).map((n) => n.id)),
		[graph.nodes],
	);
	const nodesKey = useMemo(
		() => graph.nodes.map((node) => node.id).join('\u0000'),
		[graph.nodes],
	);
	const cameraDuration = prefersReducedMotion ? 0 : CAMERA_DURATION_MS;

	const { paintNode, paintNodeArea, paintLink, paintLinkArea } =
		useCanvasPainters({
			palette,
			adjacency,
			hoveredId: hovered?.kind === 'node' ? hovered.node.id : undefined,
			selectedId,
			highlighted,
		});

	useEffect(() => {
		fgRef.current?.d3Force('charge')?.strength(CHARGE_STRENGTH);
	}, [fgRef, graph]);

	const fitToView = useCallback((): void => {
		const graphRef = fgRef.current;
		if (!graphRef || graph.nodes.length === 0) {
			return;
		}
		const camera = fitCamera(
			graphRef.getGraphBbox((node) => !highlighted || highlighted.has(node.id)),
			{ width, height },
			{
				top: insets.top + FIT_PADDING_PX,
				right: insets.right + FIT_PADDING_PX,
				bottom: insets.bottom + FIT_PADDING_PX,
				left: insets.left + FIT_PADDING_PX,
			},
			{ min: MIN_ZOOM, max: MAX_ZOOM },
		);
		graphRef.centerAt(camera.x, camera.y, cameraDuration);
		graphRef.zoom(camera.zoom, cameraDuration);
	}, [
		cameraDuration,
		fgRef,
		graph.nodes.length,
		height,
		highlighted,
		insets,
		width,
	]);

	useEffect(() => {
		if (highlighted) {
			fitToView();
		}
		// Refit only when the focused set changes, not on every resize.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [highlighted]);

	const handleEngineStop = useCallback((): void => {
		if (fittedNodesRef.current !== nodesKey) {
			fittedNodesRef.current = nodesKey;
			fitToView();
		}
	}, [fitToView, nodesKey]);

	const zoomBy = useCallback(
		(factor: number): void => {
			const graphRef = fgRef.current;
			if (graphRef) {
				graphRef.zoom(graphRef.zoom() * factor, cameraDuration);
			}
		},
		[cameraDuration, fgRef],
	);

	const handleMouseMove = (event: MouseEvent<HTMLDivElement>): void => {
		const bounds = event.currentTarget.getBoundingClientRect();
		setPointer({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
	};

	return (
		<div
			className={styles.canvas}
			onMouseMove={handleMouseMove}
			onMouseLeave={(): void => setHovered(undefined)}
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
				nodeCanvasObject={paintNode}
				nodePointerAreaPaint={paintNodeArea}
				linkCanvasObject={paintLink}
				linkPointerAreaPaint={paintLinkArea}
				nodeLabel={(): string => ''}
				linkLabel={(): string => ''}
				onNodeHover={(node): void =>
					setHovered(node ? { kind: 'node', node } : undefined)
				}
				onLinkHover={(link): void =>
					setHovered(link ? { kind: 'link', link } : undefined)
				}
				onNodeClick={(node): void => onNodeClick?.(node.id)}
				onLinkClick={(link): void => onNodeClick?.(linkEndId(link.target))}
				onBackgroundClick={onBackgroundClick}
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
}

export default memo(ServiceMapCanvas);
