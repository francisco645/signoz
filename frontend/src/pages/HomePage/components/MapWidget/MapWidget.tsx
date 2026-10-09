import { useRef, useState } from 'react';
import { EyeOff } from '@signozhq/icons';
import cx from 'classnames';
import ServiceMapCanvas, {
	ServiceMapGraphRef,
} from 'modules/Servicemap/Canvas/ServiceMapCanvas';
import { useAnimateDirection } from 'modules/Servicemap/hooks/useAnimateDirection';
import { useContainerSize } from 'modules/Servicemap/hooks/useContainerSize';
import { usePanoramaPlanes } from 'modules/Servicemap/hooks/usePanoramaPlanes';
import PanoramaSlot from 'modules/Servicemap/Panorama/PanoramaSlot';
import type { ServiceMapGraph } from 'modules/Servicemap/types';
import { isWebGLAvailable } from 'modules/Servicemap/utils/webgl';

import { HOME_HEALTH_LABELS } from '../../constants';
import MapWidgetHeader from './MapWidgetHeader';

import styles from './MapWidget.module.scss';

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const MS_TO_NS = 1e6;

interface MapWidgetProps {
	graph: ServiceMapGraph;
	subtitle: string;
	focus?: ReadonlySet<string>;
	/** Last known topology while traces are missing. */
	staleNotice?: string;
	highlightedId?: string;
	startMs: number;
	endMs: number;
	windowLabel: string;
	view: '2d' | '3d';
	isExpanded: boolean;
	onViewChange: (view: '2d' | '3d') => void;
	onExpandChange: (isExpanded: boolean) => void;
	onNodeClick: (id: string) => void;
	onOpen: () => void;
}

/** The Service Map in the Home's colours: 2D in the card, 3D when expanded. */
function MapWidget({
	graph,
	subtitle,
	focus,
	staleNotice,
	highlightedId,
	startMs,
	endMs,
	windowLabel,
	view,
	isExpanded,
	onViewChange,
	onExpandChange,
	onNodeClick,
	onOpen,
}: MapWidgetProps): JSX.Element {
	const fgRef: ServiceMapGraphRef = useRef();
	const [body, setBody] = useState<HTMLDivElement | null>(null);
	const { width, height } = useContainerSize(body);
	const [is3dAvailable, setIs3dAvailable] = useState(isWebGLAvailable);
	const animate = useAnimateDirection();
	const is3d = view === '3d' && is3dAvailable;
	const planes = usePanoramaPlanes(
		graph,
		startMs * MS_TO_NS,
		endMs * MS_TO_NS,
		is3d,
	);

	return (
		<section
			className={cx(styles.map, { [styles.expanded]: isExpanded })}
			aria-label="Service map"
			data-testid="home-map"
		>
			<MapWidgetHeader
				subtitle={subtitle}
				view={is3d ? '3d' : '2d'}
				is3dAvailable={is3dAvailable && !staleNotice}
				isExpanded={isExpanded}
				onViewChange={onViewChange}
				onExpandChange={onExpandChange}
				onOpen={onOpen}
			/>
			<div ref={setBody} className={styles.body}>
				{staleNotice && (
					<div className={styles.notice} data-testid="home-map-stale-notice">
						<EyeOff size={13} />
						{staleNotice}
					</div>
				)}
				{is3d ? (
					<PanoramaSlot
						graph={graph}
						width={width}
						height={height}
						windowLabel={windowLabel}
						planes={planes.planes}
						adjustedCount={planes.adjustedCount}
						onResetPlanes={planes.reset}
						isCompact={!isExpanded}
						onNodeClick={onNodeClick}
						onError={(): void => {
							setIs3dAvailable(false);
							onViewChange('2d');
						}}
					/>
				) : (
					<ServiceMapCanvas
						fgRef={fgRef}
						graph={graph}
						width={width}
						height={height}
						insets={NO_INSETS}
						highlighted={focus}
						selectedId={highlightedId}
						isUpdating={false}
						isFlowEnabled={animate.isEnabled}
						isStale={!!staleNotice}
						healthLabels={HOME_HEALTH_LABELS}
						onNodeClick={onNodeClick}
					/>
				)}
			</div>
			<div className={styles.footer}>
				<span className={styles.legend}>
					<i className={cx(styles.swatch, styles.critical)} /> critical alert
				</span>
				<span className={styles.legend}>
					<i className={cx(styles.swatch, styles.outside)} /> outside usual range
				</span>
				<span>width = req/s · dots = caller → callee</span>
				<span className={styles.why}>Missing edge can mean failed calls</span>
			</div>
		</section>
	);
}

export default MapWidget;
