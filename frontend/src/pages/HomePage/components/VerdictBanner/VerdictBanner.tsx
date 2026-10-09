import { CircleCheck, CircleX, EyeOff, TriangleAlert } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
import cx from 'classnames';
import ROUTES from 'constants/routes';
import { AlertListTabs } from 'pages/AlertList/types';

import { HOME_TEXT } from '../../text';
import type { Verdict } from '../../utils/verdict';
import VerdictFacts, { VerdictFactsProps } from './VerdictFacts';

import styles from './VerdictBanner.module.scss';

interface VerdictBannerProps extends VerdictFactsProps {
	verdict: Verdict;
	environmentLabel: string;
	onNavigate: (path: string) => void;
}

const ICON = {
	incident: CircleX,
	degraded: TriangleAlert,
	unknown: TriangleAlert,
	blind: EyeOff,
	normal: CircleCheck,
	loading: CircleCheck,
};

const LEVEL_CLASS = {
	incident: styles.incident,
	degraded: styles.degraded,
	unknown: styles.unknown,
	blind: styles.blind,
	normal: styles.normal,
	loading: undefined,
};

const titleOf = (verdict: Verdict, environmentLabel: string): JSX.Element => {
	switch (verdict.level) {
		case 'incident':
			return (
				<>
					<em>Incident</em> · {HOME_TEXT.incidentTitle(verdict.critical)}
				</>
			);
		case 'degraded':
			return <em>{HOME_TEXT.degradedTitle}</em>;
		case 'blind':
			return <>{HOME_TEXT.blindTitle}</>;
		case 'unknown':
			return <em>{HOME_TEXT.unknownTitle}</em>;
		case 'loading':
			return <>{HOME_TEXT.loading}</>;
		default:
			return (
				<>
					<em>{HOME_TEXT.normalTitle}</em> in {environmentLabel}
				</>
			);
	}
};

const detailOf = (verdict: Verdict): string | undefined => {
	const { checked } = verdict;
	if (verdict.level === 'normal') {
		return HOME_TEXT.normalDetail(
			checked.services,
			checked.rules,
			checked.signals,
		);
	}
	if (verdict.level === 'blind') {
		return HOME_TEXT.blindDetail;
	}
	if (verdict.level === 'unknown') {
		return HOME_TEXT.unknownDetail(verdict.gaps);
	}
	return undefined;
};

/** The one-line answer to "is everything fine, and if not, how far does it reach?". */
function VerdictBanner({
	verdict,
	environmentLabel,
	onNavigate,
	...facts
}: VerdictBannerProps): JSX.Element {
	const Icon = ICON[verdict.level];
	const detail = detailOf(verdict);
	const hasFacts = verdict.level === 'incident' || verdict.level === 'degraded';

	return (
		<section
			className={cx(styles.verdict, LEVEL_CLASS[verdict.level])}
			data-testid="home-verdict"
			data-level={verdict.level}
			aria-live="polite"
		>
			<div className={styles.row}>
				<span className={styles.icon}>
					<Icon size={16} />
				</span>
				<div className={styles.text}>
					<div className={styles.title}>{titleOf(verdict, environmentLabel)}</div>
					{detail && <div className={styles.detail}>{detail}</div>}
				</div>
				{(verdict.level === 'incident' || verdict.level === 'degraded') &&
					verdict.critical + verdict.warnings > 0 && (
						<Button
							variant="solid"
							color="primary"
							size="sm"
							onClick={(): void =>
								onNavigate(
									`${ROUTES.LIST_ALL_ALERT}?tab=${AlertListTabs.TRIGGERED_ALERTS}`,
								)
							}
							testId="home-verdict-action"
						>
							{HOME_TEXT.openFiring}
						</Button>
					)}
				{verdict.level === 'blind' && (
					<Button
						variant="outlined"
						color="secondary"
						size="sm"
						onClick={(): void => onNavigate(ROUTES.INGESTION_SETTINGS)}
						testId="home-verdict-action"
					>
						{HOME_TEXT.troubleshoot}
					</Button>
				)}
			</div>
			{(hasFacts || verdict.level === 'blind') && (
				<VerdictFacts verdict={verdict} {...facts} />
			)}
			{verdict.lowSignals.length > 0 && verdict.level !== 'blind' && (
				<div className={styles.blindSpot}>
					<TriangleAlert size={13} />
					{HOME_TEXT.lowSignal(verdict.lowSignals)}
				</div>
			)}
		</section>
	);
}

export default VerdictBanner;
