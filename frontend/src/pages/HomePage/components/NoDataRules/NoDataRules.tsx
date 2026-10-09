import { TriangleAlert } from '@signozhq/icons';

import type { RuleSummary } from '../../types/home';
import { formatAge } from '../../utils/format';

import styles from '../Section/Section.module.scss';

interface NoDataRulesProps {
	rules: RuleSummary[];
	nowMs: number;
}

function NoDataRules({ rules, nowMs }: NoDataRulesProps): JSX.Element {
	return (
		<>
			{rules.map((rule) => (
				<div key={rule.id} className={styles.row} data-testid="home-no-data-rule">
					<span className={styles.warning}>
						<TriangleAlert size={14} />
					</span>
					<span className={styles.name}>
						{rule.name}
						{rule.service && <small>{rule.service}</small>}
					</span>
					<span className={styles.mono}>
						{rule.updatedAtMs ? formatAge(rule.updatedAtMs, nowMs) : ''}
					</span>
					<span className={styles.mono}>–</span>
				</div>
			))}
		</>
	);
}

export default NoDataRules;
