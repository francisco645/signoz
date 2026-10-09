import { CircleX, TriangleAlert } from '@signozhq/icons';
import cx from 'classnames';
import { formatDuration, formatPercent } from 'modules/Servicemap/utils/format';

import type { ServiceComparison } from '../../types/home';
import { HOME_TEXT } from '../../text';

import styles from './ServiceTable.module.scss';

interface ServiceRowProps {
	service: ServiceComparison;
	isCritical: boolean;
	isOutside: boolean;
	isHighlighted: boolean;
	onHover: (name: string | undefined) => void;
	onOpen: (name: string) => void;
}

const signed = (value: number): string =>
	`${value > 0 ? '+' : ''}${value.toFixed(1)}`;

function ServiceRow({
	service,
	isCritical,
	isOutside,
	isHighlighted,
	onHover,
	onOpen,
}: ServiceRowProps): JSX.Element {
	const { now, weekAgo } = service;
	const errorsUp = service.reasons.includes('errors');
	const latencyUp = service.reasons.includes('latency');
	const tone = isCritical ? styles.critical : styles.warning;

	return (
		<button
			type="button"
			className={cx(styles.row, { [styles.highlighted]: isHighlighted })}
			onMouseEnter={(): void => onHover(service.name)}
			onMouseLeave={(): void => onHover(undefined)}
			onFocus={(): void => onHover(service.name)}
			onBlur={(): void => onHover(undefined)}
			onClick={(): void => onOpen(service.name)}
			data-testid="home-service-row"
		>
			<span className={styles.name}>
				<span className={cx(styles.icon, tone)}>
					{isCritical && <CircleX size={14} />}
					{!isCritical && isOutside && <TriangleAlert size={14} />}
				</span>
				<span className={styles.text}>{service.name}</span>
			</span>
			<span className={cx(styles.cell, { [tone]: errorsUp })}>
				<span>{formatPercent(now.errorRate)}</span>
				{weekAgo && (
					<small>
						{HOME_TEXT.weekAgo} {formatPercent(weekAgo.errorRate)}
					</small>
				)}
			</span>
			<span className={cx(styles.cell, { [tone]: latencyUp })}>
				<span>{now.p99Ns > 0 ? formatDuration(now.p99Ns) : '—'}</span>
				{weekAgo && weekAgo.p99Ns > 0 && (
					<small>
						{HOME_TEXT.weekAgo} {formatDuration(weekAgo.p99Ns)}
					</small>
				)}
			</span>
			<span className={styles.cell}>
				<span>{signed(service.deltaErrorsPerSec)}</span>
				<small>err/s</small>
			</span>
		</button>
	);
}

export default ServiceRow;
