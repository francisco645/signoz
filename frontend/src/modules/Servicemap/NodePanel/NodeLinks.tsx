import { ExternalLink } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
import { openInNewTab } from 'utils/navigation';

import { SERVICE_MAP_TEXT } from '../constants';

import styles from './ServiceNodePanel.module.scss';

export interface NodeLinkTargets {
	service?: string;
	traces: string;
	errorTraces: string;
	logs?: string;
}

interface NodeLinksProps {
	links: NodeLinkTargets;
}

function NodeLinks({ links }: NodeLinksProps): JSX.Element {
	const items = [
		{
			key: 'service',
			label: SERVICE_MAP_TEXT.panelOpenService,
			href: links.service,
		},
		{ key: 'traces', label: SERVICE_MAP_TEXT.panelTraces, href: links.traces },
		{
			key: 'error-traces',
			label: SERVICE_MAP_TEXT.panelErrorTraces,
			href: links.errorTraces,
		},
		{ key: 'logs', label: SERVICE_MAP_TEXT.panelLogs, href: links.logs },
	];

	return (
		<div className={styles.links}>
			{items.map(({ key, label, href }) => (
				<Button
					key={key}
					variant="outlined"
					color="secondary"
					size="sm"
					suffix={<ExternalLink />}
					disabled={!href}
					title={href ? undefined : SERVICE_MAP_TEXT.panelNotAService}
					onClick={(): void => {
						if (href) {
							openInNewTab(href);
						}
					}}
					testId={`service-map-panel-link-${key}`}
				>
					{label}
				</Button>
			))}
		</div>
	);
}

export default NodeLinks;
