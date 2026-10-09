import { useState } from 'react';
import { useSafeNavigate } from 'hooks/useSafeNavigate';

import type { HomeWindowKey } from '../../constants';
import { useOverviewData } from '../../hooks/useOverviewData';
import { usePinnedDashboards } from '../../hooks/usePinnedDashboards';
import { hasValue } from '../../types/sources';
import { formatClock } from '../../utils/format';
import { serviceLink, serviceMapLink } from '../../utils/links';
import HomeToolbar from '../HomeToolbar/HomeToolbar';
import KpiStrip from '../KpiStrip/KpiStrip';
import MapWidget from '../MapWidget/MapWidget';
import PinnedDashboards from '../PinnedDashboards/PinnedDashboards';
import VerdictBanner from '../VerdictBanner/VerdictBanner';
import OverviewLists from './OverviewLists';
import OverviewTelemetry from './OverviewTelemetry';

import styles from './Overview.module.scss';

/** "Is everything fine? If not, how far does it reach?" on one page. */
function Overview(): JSX.Element {
	const [windowKey, setWindowKey] = useState<HomeWindowKey>('15m');
	const [hovered, setHovered] = useState<string>();
	const [isMapExpanded, setIsMapExpanded] = useState(false);
	const { safeNavigate } = useSafeNavigate();
	const data = useOverviewData(windowKey);
	const pinned = usePinnedDashboards();
	const { clock, scope, verdict, homeGraph, mapWindow } = data;
	const environmentLabel = scope.environments.join(', ') || 'all environments';
	const rules = hasValue(data.rules.source)
		? data.rules.source.value
		: undefined;
	const noData = rules?.filter((rule) => rule.state === 'nodata');
	const comparisons = hasValue(data.services.source)
		? data.services.source.value
		: undefined;
	const firing = hasValue(data.alerts.source)
		? data.alerts.source.value
		: undefined;
	const affected = data.critical.size + data.outside.size;
	const openMap = (selected?: string): void =>
		safeNavigate(
			serviceMapLink(scope.queries, mapWindow.startMs, mapWindow.endMs, selected),
		);

	let mapSubtitle = `${homeGraph?.nodes.length ?? 0} services and dependencies`;
	if (data.isBlind) {
		mapSubtitle = `last known · ${formatClock(mapWindow.startMs)}–${formatClock(mapWindow.endMs)}`;
	} else if (affected > 0) {
		mapSubtitle = `${affected} affected + neighbors`;
	}

	const map = homeGraph && (
		<MapWidget
			graph={homeGraph}
			subtitle={mapSubtitle}
			focus={data.focus}
			staleNotice={
				data.isBlind
					? 'The map is built from traces. No traces now, so this is the last known topology, without live traffic.'
					: undefined
			}
			highlightedId={hovered}
			startMs={mapWindow.startMs}
			endMs={mapWindow.endMs}
			windowLabel={`${formatClock(mapWindow.startMs)}–${formatClock(mapWindow.endMs)}`}
			isExpanded={isMapExpanded}
			onExpandChange={setIsMapExpanded}
			onNodeClick={(id): void => setHovered(id)}
			onOpen={(): void => openMap(hovered)}
		/>
	);

	return (
		<div className={styles.overview} data-testid="home-overview">
			<HomeToolbar
				environment={scope.environments[0]}
				environments={scope.options}
				windowKey={windowKey}
				updatedAtMs={clock.tickedAt}
				refreshMs={clock.refreshMs}
				onEnvironmentChange={scope.setEnvironment}
				onWindowChange={setWindowKey}
				onRefresh={clock.refresh}
			/>
			<div className={styles.content}>
				<VerdictBanner
					verdict={verdict}
					environmentLabel={environmentLabel}
					onNavigate={safeNavigate}
					servicesTotal={comparisons?.length}
					noDataRules={noData?.length}
					telemetry={
						hasValue(data.telemetry.source) ? data.telemetry.source.value : undefined
					}
					tracesSilentSince={
						data.lastTrace.lastTraceMs
							? formatClock(data.lastTrace.lastTraceMs)
							: undefined
					}
				/>
				{verdict.level === 'normal' && (
					<KpiStrip
						firing={firing?.firing.length}
						silenced={firing?.silenced}
						outside={verdict.outside}
						services={comparisons?.length}
						noData={noData?.length}
						rules={rules?.length}
					/>
				)}
				{isMapExpanded && <div className={styles.full}>{map}</div>}
				<div className={styles.columns}>
					<div>
						<OverviewLists
							data={data}
							nowMs={clock.tickedAt}
							hovered={hovered}
							onHover={setHovered}
							onNavigate={safeNavigate}
							onOpenService={(name): void => safeNavigate(serviceLink(name))}
						/>
						<PinnedDashboards
							pinned={pinned.pinned}
							more={pinned.more}
							onNavigate={safeNavigate}
						/>
					</div>
					<div>
						{!isMapExpanded && map}
						<OverviewTelemetry data={data} nowMs={clock.tickedAt} />
					</div>
				</div>
			</div>
		</div>
	);
}

export default Overview;
