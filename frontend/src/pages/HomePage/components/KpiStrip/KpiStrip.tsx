import { HOME_TEXT } from '../../text';

import styles from './KpiStrip.module.scss';

interface Kpi {
	id: string;
	label: string;
	/** `undefined` when the source could not be read: shown as a dash, never zero. */
	value?: number;
	detail: string;
}

interface KpiStripProps {
	firing?: number;
	silenced?: number;
	outside?: number;
	services?: number;
	noData?: number;
	rules?: number;
}

function KpiStrip({
	firing,
	silenced,
	outside,
	services,
	noData,
	rules,
}: KpiStripProps): JSX.Element {
	const kpis: Kpi[] = [
		{
			id: 'firing',
			label: HOME_TEXT.firingAlerts,
			value: firing,
			detail: silenced === undefined ? '—' : HOME_TEXT.silenced(silenced),
		},
		{
			id: 'outside',
			label: HOME_TEXT.outsideRange,
			value: outside,
			detail: HOME_TEXT.versus,
		},
		{
			id: 'nodata',
			label: HOME_TEXT.rulesNoData,
			value: noData,
			detail: 'rules evaluating',
		},
	];
	const totals: Record<string, number | undefined> = {
		outside: services,
		nodata: rules,
	};

	return (
		<div className={styles.stats}>
			{kpis.map((kpi) => (
				<div
					key={kpi.id}
					className={styles.stat}
					data-testid={`home-kpi-${kpi.id}`}
				>
					<div className={styles.label}>{kpi.label}</div>
					<div className={styles.value}>
						<span>{kpi.value ?? '—'}</span>
						{totals[kpi.id] !== undefined && (
							<small>{HOME_TEXT.of(totals[kpi.id] as number)}</small>
						)}
					</div>
					<div className={styles.detail}>{kpi.detail}</div>
				</div>
			))}
		</div>
	);
}

export default KpiStrip;
