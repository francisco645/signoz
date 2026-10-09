import { useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import { useIsDarkMode } from 'hooks/useDarkMode';

import CanvasTooltip from '../Canvas/CanvasTooltip';
import LinkTooltipContent from '../Canvas/LinkTooltipContent';
import NodeTooltipContent from '../Canvas/NodeTooltipContent';
import { useContainerSize } from '../hooks/useContainerSize';
import { usePanoramaScene } from '../hooks/usePanoramaScene';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { ServiceMapGraph } from '../types';
import { linkEndId } from '../utils/adjacency';
import type { LayoutPoint } from '../utils/panoramaLayout';
import type { ResolvedPlane } from '../utils/planes';
import PanoramaControls from './PanoramaControls';
import PanoramaLegend from './PanoramaLegend';
import PanoramaSummary from './PanoramaSummary';
import type { PanoramaView as CameraView } from './scene/cameraPoses';
import {
	buildPanoramaModel,
	getPanoramaPositions,
} from './scene/panoramaModel';
import { getPanoramaTheme } from './scene/panoramaTheme';
import type { PanoramaHit } from './scene/pointer';
import { describePanorama, PANORAMA_TEXT } from './panoramaText';
import { useLabelFonts } from './useLabelFonts';

import styles from './Panorama.module.scss';

interface PanoramaViewProps {
	graph: ServiceMapGraph;
	planes: ReadonlyMap<string, ResolvedPlane>;
	adjustedCount: number;
	onResetPlanes: () => void;
	width: number;
	height: number;
	windowLabel: string;
	selectedId?: string;
	/** Embedded in a small card: the host shows the legend, so only the scene and its controls stay. */
	isCompact?: boolean;
	onNodeClick: (id: string) => void;
}

interface Hover {
	hit: PanoramaHit;
	x: number;
	y: number;
}

/** Narrower canvases keep the scene centred and let the legend overlap. */
const LEGEND_INSET_MIN_WIDTH_PX = 900;

/** The 3D panorama: entry, internal and data planes, read-only apart from opening a service. */
function PanoramaView({
	graph,
	planes,
	adjustedCount,
	onResetPlanes,
	width,
	height,
	windowLabel,
	selectedId,
	isCompact = false,
	onNodeClick,
}: PanoramaViewProps): JSX.Element {
	const isDarkMode = useIsDarkMode();
	const reduceMotion = usePrefersReducedMotion();
	const isFontReady = useLabelFonts();
	const containerRef = useRef<HTMLDivElement>(null);
	const [legend, setLegend] = useState<HTMLElement | null>(null);
	const legendSize = useContainerSize(legend);
	const previousLayout = useRef<ReadonlyMap<string, LayoutPoint>>();
	const [view, setView] = useState<CameraView>('iso');
	const [isFlat, setIsFlat] = useState(false);
	const [isAutoRotating, setIsAutoRotating] = useState(true);
	const [hover, setHover] = useState<Hover>();

	const positions = useMemo(
		() => getPanoramaPositions(graph, previousLayout.current),
		[graph],
	);
	useEffect(() => {
		previousLayout.current = positions;
	}, [positions]);
	const model = useMemo(
		() => buildPanoramaModel(graph, positions, planes),
		[graph, planes, positions],
	);
	const theme = getPanoramaTheme(isDarkMode);
	const nodesById = useMemo(
		() => new Map(graph.nodes.map((node) => [node.id, node])),
		[graph.nodes],
	);

	usePanoramaScene({
		containerRef,
		isReady: isFontReady && width > 0 && height > 0,
		model,
		isDarkMode,
		reduceMotion,
		view,
		isFlat,
		isAutoRotating,
		selectedId,
		width,
		height,
		leftInsetPx:
			!isCompact && width > LEGEND_INSET_MIN_WIDTH_PX ? legendSize.width : 0,
		onHover: (hit, x, y) => setHover(hit ? { hit, x, y } : undefined),
		onNodeClick: (id) => {
			containerRef.current?.focus({ preventScroll: true });
			onNodeClick(id);
		},
		onAutoRotateStop: () => setIsAutoRotating(false),
	});

	const hoveredLink =
		hover?.hit.kind === 'link'
			? graph.links.find(
					(link) =>
						hover.hit.kind === 'link' &&
						linkEndId(link.source) === hover.hit.link.source &&
						linkEndId(link.target) === hover.hit.link.target,
				)
			: undefined;
	const hoveredNode =
		hover?.hit.kind === 'node' ? nodesById.get(hover.hit.id) : undefined;

	return (
		<div className={styles.panorama} data-testid="service-map-panorama">
			<div
				ref={containerRef}
				className={styles.stage}
				// Focusable, so Escape and the page shortcuts reach the workspace after a click.
				// eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
				tabIndex={0}
				// eslint-disable-next-line jsx-a11y/prefer-tag-over-role
				role="img"
				aria-label={PANORAMA_TEXT.canvasLabel}
			/>
			<PanoramaControls
				view={view}
				isFlat={isFlat}
				isAutoRotating={isAutoRotating && !reduceMotion}
				canAutoRotate={!reduceMotion}
				onViewChange={(next): void => {
					setIsFlat(false);
					setView(next);
				}}
				onFlatChange={(next): void => {
					setIsFlat(next);
					setView(next ? 'top' : 'iso');
				}}
				onAutoRotateChange={setIsAutoRotating}
			/>
			{!isCompact && (
				<>
					<PanoramaSummary model={model} windowLabel={windowLabel} />
					<PanoramaLegend
						ref={setLegend}
						model={model}
						theme={theme}
						adjustedCount={adjustedCount}
						onResetPlanes={onResetPlanes}
					/>
					<div className={cx(styles.card, styles.hint)}>{PANORAMA_TEXT.hint}</div>
				</>
			)}
			<div className={styles.srOnly} aria-live="polite">
				{describePanorama(model)}
			</div>
			{hover && (hoveredNode || hoveredLink) && (
				<CanvasTooltip x={hover.x} y={hover.y}>
					{hoveredNode ? (
						<NodeTooltipContent node={hoveredNode} />
					) : (
						hoveredLink && (
							<LinkTooltipContent
								link={hoveredLink}
								source={linkEndId(hoveredLink.source)}
								target={linkEndId(hoveredLink.target)}
								isServerSide={!!nodesById.get(linkEndId(hoveredLink.target))?.metrics}
							/>
						)
					)}
				</CanvasTooltip>
			)}
		</div>
	);
}

export default PanoramaView;
