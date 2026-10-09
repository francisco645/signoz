import { CircleCheck, EyeOff, TriangleAlert } from '@signozhq/icons';
import cx from 'classnames';

import type { SignalSnapshot, TelemetrySnapshot } from '../../types/home';
import { HOME_TEXT } from '../../text';
import { formatSince } from '../../utils/format';
import { isLow, isSilent } from '../../utils/telemetry';

import styles from './TelemetryList.module.scss';

interface TelemetryListProps {
	telemetry: TelemetrySnapshot;
	nowMs: number;
}

type Status = 'onTime' | 'low' | 'silent' | 'receiving' | 'noData';

const statusOf = (snapshot: SignalSnapshot): Status => {
	if (snapshot.signal === 'metrics') {
		return snapshot.isReceiving ? 'receiving' : 'noData';
	}
	if (isSilent(snapshot)) {
		return 'silent';
	}
	if (isLow(snapshot)) {
		return 'low';
	}
	return snapshot.count ? 'onTime' : 'noData';
};

const STATUS_CLASS: Record<Status, string> = {
	onTime: styles.onTime,
	receiving: styles.receiving,
	low: styles.low,
	silent: styles.silent,
	noData: styles.noData,
};

const ICON: Record<Status, typeof CircleCheck> = {
	onTime: CircleCheck,
	receiving: CircleCheck,
	low: TriangleAlert,
	silent: EyeOff,
	noData: EyeOff,
};

const LABEL: Record<SignalSnapshot['signal'], string> = {
	traces: 'Traces',
	metrics: 'Metrics',
	logs: 'Logs',
};

const detailOf = (snapshot: SignalSnapshot, nowMs: number): string => {
	if (snapshot.signal === 'metrics') {
		return HOME_TEXT.allEnvs;
	}
	const seen = snapshot.lastSeenMs
		? formatSince(snapshot.lastSeenMs, nowMs)
		: '—';
	const share =
		snapshot.ratio === undefined ? '' : ` · ${Math.round(snapshot.ratio * 100)}%`;
	return `${seen}${share}`;
};

function TelemetryList({ telemetry, nowMs }: TelemetryListProps): JSX.Element {
	return (
		<>
			{[telemetry.traces, telemetry.metrics, telemetry.logs].map((snapshot) => {
				const status = statusOf(snapshot);
				const Icon = ICON[status];
				return (
					<div
						key={snapshot.signal}
						className={styles.row}
						data-testid={`home-telemetry-row-${snapshot.signal}`}
					>
						<span className={cx(styles.icon, STATUS_CLASS[status])}>
							<Icon size={14} />
						</span>
						<span className={styles.name}>{LABEL[snapshot.signal]}</span>
						<span className={styles.detail}>{detailOf(snapshot, nowMs)}</span>
						<span className={cx(styles.status, STATUS_CLASS[status])}>
							{HOME_TEXT[status]}
						</span>
					</div>
				);
			})}
		</>
	);
}

export default TelemetryList;
