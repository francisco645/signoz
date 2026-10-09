import type { ServiceComparison } from '../../types/home';
import { HOME_TEXT } from '../../text';
import ServiceRow from './ServiceRow';

import styles from './ServiceTable.module.scss';

interface ServiceTableProps {
	services: ServiceComparison[];
	outside: ReadonlySet<string>;
	critical: ReadonlySet<string>;
	highlighted?: string;
	onHover: (name: string | undefined) => void;
	onOpen: (name: string) => void;
}

/** One row per service: now against the same window a week ago. */
function ServiceTable({
	services,
	outside,
	critical,
	highlighted,
	onHover,
	onOpen,
}: ServiceTableProps): JSX.Element {
	return (
		<div className={styles.table} data-testid="home-service-table">
			<div className={styles.head}>
				<span>Service</span>
				<span>Error rate</span>
				<span>p99</span>
				<span>{HOME_TEXT.versus}</span>
			</div>
			{services.map((service) => (
				<ServiceRow
					key={service.name}
					service={service}
					isCritical={critical.has(service.name)}
					isOutside={outside.has(service.name)}
					isHighlighted={highlighted === service.name}
					onHover={onHover}
					onOpen={onOpen}
				/>
			))}
		</div>
	);
}

export default ServiceTable;
