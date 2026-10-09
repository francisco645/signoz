import ROUTES from 'constants/routes';

import type { OverviewData } from '../../hooks/useOverviewData';
import { hasValue } from '../../types/sources';
import { HOME_TEXT } from '../../text';
import FiringAlerts from '../FiringAlerts/FiringAlerts';
import NoDataRules from '../NoDataRules/NoDataRules';
import Section from '../Section/Section';
import ServiceTable from '../ServiceTable/ServiceTable';
import SourceError from '../SourceError/SourceError';

import styles from '../Section/Section.module.scss';

const TOP_SERVICES = 4;

interface OverviewListsProps {
	data: OverviewData;
	nowMs: number;
	hovered?: string;
	onHover: (name: string | undefined) => void;
	onNavigate: (path: string) => void;
	onOpenService: (name: string) => void;
}

/** Left column: what is wrong, worst first. */
function OverviewLists({
	data,
	nowMs,
	hovered,
	onHover,
	onNavigate,
	onOpenService,
}: OverviewListsProps): JSX.Element {
	const { alerts, rules, services, verdict, critical, outside } = data;
	const toAlerts = {
		label: HOME_TEXT.allRules,
		onClick: (): void => onNavigate(ROUTES.LIST_ALL_ALERT),
	};
	const toServices = {
		label: HOME_TEXT.allServices,
		onClick: (): void => onNavigate(ROUTES.APPLICATION),
	};

	if (verdict.level === 'blind') {
		const noData = hasValue(rules.source)
			? rules.source.value.filter((rule) => rule.state === 'nodata')
			: [];
		return (
			<Section
				title={HOME_TEXT.rulesNoData}
				count={noData.length}
				link={toAlerts}
				testId="home-no-data-rules"
			>
				{rules.source.status === 'failed' ? (
					<SourceError source="rules" onRetry={rules.retry} />
				) : (
					<NoDataRules rules={noData} nowMs={nowMs} />
				)}
			</Section>
		);
	}

	const firing = hasValue(alerts.source) ? alerts.source.value : undefined;
	const comparisons = hasValue(services.source) ? services.source.value : [];
	const ranked = comparisons.filter((item) => !item.isLowVolume);
	const shown = outside.size
		? ranked.filter((item) => outside.has(item.name) || critical.has(item.name))
		: [...ranked]
				.sort((a, b) => b.now.calls - a.now.calls)
				.slice(0, TOP_SERVICES);
	const lowVolume = comparisons.length - ranked.length;

	return (
		<>
			{alerts.source.status === 'failed' && (
				<Section title={HOME_TEXT.firingAlerts} testId="home-firing-alerts">
					<SourceError source="alerts" onRetry={alerts.retry} />
				</Section>
			)}
			{firing && firing.firing.length > 0 && (
				<Section
					title={HOME_TEXT.firingAlerts}
					count={firing.firing.length}
					link={toAlerts}
					testId="home-firing-alerts"
				>
					<FiringAlerts summary={firing} nowMs={nowMs} />
				</Section>
			)}
			<Section
				title={outside.size ? HOME_TEXT.servicesOutside : HOME_TEXT.services}
				count={outside.size || comparisons.length}
				link={toServices}
				testId="home-services"
			>
				{services.source.status === 'failed' ? (
					<SourceError source="services" onRetry={services.retry} />
				) : (
					<>
						<ServiceTable
							services={shown}
							outside={outside}
							critical={critical}
							highlighted={hovered}
							onHover={onHover}
							onOpen={onOpenService}
						/>
						<div className={styles.note}>
							{outside.size ? (
								<>
									<span>{HOME_TEXT.sortedBy}</span>
									<span>{HOME_TEXT.withinRange(ranked.length - outside.size)}</span>
								</>
							) : (
								<span>
									{HOME_TEXT.topByTraffic} · {HOME_TEXT.showAll(comparisons.length)}
								</span>
							)}
							{lowVolume > 0 && <span>{HOME_TEXT.lowVolume(lowVolume)}</span>}
						</div>
					</>
				)}
			</Section>
		</>
	);
}

export default OverviewLists;
