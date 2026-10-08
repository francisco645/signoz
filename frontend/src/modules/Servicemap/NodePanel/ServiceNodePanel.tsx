import { ReactNode, useMemo } from 'react';
import { Badge } from '@signozhq/ui/badge';
import { Button } from '@signozhq/ui/button';
import { Callout } from '@signozhq/ui/callout';
import DetailsHeader, {
	HeaderAction,
} from 'components/DetailsPanel/DetailsHeader/DetailsHeader';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import type { ServicesList } from 'types/api/metrics/getService';

import { SERVICE_MAP_TEXT } from '../constants';
import { useNodeLinks } from '../hooks/useNodeLinks';
import { useWindowLabel } from '../hooks/useWindowLabel';
import BlindSpotPopover from '../Legend/BlindSpotPopover';
import type { ServiceMapGraph } from '../types';
import { getServiceDeltas } from '../utils/delta';
import { getNeighbours } from '../utils/neighbours';
import HealthSummary from './HealthSummary';
import NeighbourList from './NeighbourList';
import NodeLinks from './NodeLinks';

import styles from './ServiceNodePanel.module.scss';

interface ServiceNodePanelProps {
	id: string;
	graph: ServiceMapGraph;
	services: ReadonlyMap<string, ServicesList>;
	yesterday: ReadonlyMap<string, ServicesList>;
	queries: IResourceAttribute[];
	scopeLabels: string[];
	minTime: number;
	maxTime: number;
	actions?: HeaderAction[];
	children?: ReactNode;
	onSelect: (id: string) => void;
	onClose: () => void;
}

function ServiceNodePanel({
	id,
	graph,
	services,
	yesterday,
	queries,
	scopeLabels,
	minTime,
	maxTime,
	actions,
	children,
	onSelect,
	onClose,
}: ServiceNodePanelProps): JSX.Element {
	const node = graph.nodes.find((candidate) => candidate.id === id);
	const windowLabel = useWindowLabel(minTime, maxTime);
	const links = useNodeLinks(id, !!node?.metrics, queries, minTime, maxTime);
	const callers = useMemo(
		() => getNeighbours(graph, id, 'callers'),
		[graph, id],
	);
	const callees = useMemo(
		() => getNeighbours(graph, id, 'callees'),
		[graph, id],
	);

	return (
		<aside
			className={styles.panel}
			aria-label={`${id} details`}
			data-testid="service-map-panel"
		>
			<DetailsHeader title={id} onClose={onClose} actions={actions} />
			<div className={styles.content}>
				{node ? (
					<>
						<div className={styles.meta}>
							<Badge color="secondary" capitalize>
								{node.metrics
									? SERVICE_MAP_TEXT.panelService
									: SERVICE_MAP_TEXT.panelDataStore}
							</Badge>
							{scopeLabels.map((label) => (
								<Badge key={label} color="vanilla">
									{label}
								</Badge>
							))}
						</div>
						<div className={styles.window}>{windowLabel}</div>

						<HealthSummary
							node={node}
							deltas={getServiceDeltas(services.get(id), yesterday.get(id))}
							hasYesterday={yesterday.has(id)}
						/>

						<Callout
							type="info"
							size="small"
							showIcon
							title={SERVICE_MAP_TEXT.blindSpotTitle}
						>
							<span>{SERVICE_MAP_TEXT.panelBlindSpot}</span>
							<BlindSpotPopover />
						</Callout>

						<NodeLinks links={links} />

						{children}

						<NeighbourList
							direction="callers"
							rows={callers}
							services={services}
							yesterday={yesterday}
							onSelect={onSelect}
						/>
						<NeighbourList
							direction="callees"
							rows={callees}
							services={services}
							yesterday={yesterday}
							onSelect={onSelect}
						/>
						<div className={styles.note}>{SERVICE_MAP_TEXT.panelP99Footnote}</div>
					</>
				) : (
					<>
						<div className={styles.note}>{SERVICE_MAP_TEXT.panelGone(id)}</div>
						<Button
							variant="outlined"
							color="secondary"
							size="sm"
							onClick={onClose}
							testId="service-map-panel-clear"
						>
							{SERVICE_MAP_TEXT.panelClearSelection}
						</Button>
					</>
				)}
			</div>
		</aside>
	);
}

export default ServiceNodePanel;
