import type { TelemetrySnapshot } from '../../types/home';
import type { Verdict } from '../../utils/verdict';

import styles from './VerdictBanner.module.scss';

export interface VerdictFactsProps {
	servicesTotal?: number;
	noDataRules?: number;
	telemetry?: TelemetrySnapshot;
	/** When traces stopped, for the blind state. */
	tracesSilentSince?: string;
}

const percent = (ratio?: number): string | undefined =>
	ratio === undefined ? undefined : `${Math.round(ratio * 100)}%`;

/** The counts behind the verdict, in one mono line. */
function VerdictFacts({
	verdict,
	servicesTotal,
	noDataRules,
	telemetry,
	tracesSilentSince,
}: VerdictFactsProps & { verdict: Verdict }): JSX.Element {
	const logs = percent(telemetry?.logs.ratio);
	if (verdict.level === 'blind') {
		return (
			<div className={styles.facts}>
				<span>
					traces{' '}
					<b>
						<span>
							{tracesSilentSince ? `silent since ${tracesSilentSince}` : 'silent'}
						</span>
					</b>
				</span>
				{noDataRules !== undefined && (
					<span>
						<b>{noDataRules}</b> rules with no data
					</span>
				)}
			</div>
		);
	}
	return (
		<div className={styles.facts}>
			<span>
				<b>{verdict.critical}</b> critical · <b>{verdict.warnings}</b> warning
			</span>
			{servicesTotal !== undefined && (
				<span>
					<b>{verdict.outside}</b> of {servicesTotal} services outside usual range
				</span>
			)}
			{verdict.lowSignals.includes('logs') && logs && (
				<span className={styles.warn}>logs at {logs} of last week</span>
			)}
		</div>
	);
}

export default VerdictFacts;
