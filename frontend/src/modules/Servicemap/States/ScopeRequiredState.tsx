import { Layers } from '@signozhq/icons';

import { SERVICE_MAP_TEXT } from '../constants';

import styles from './States.module.scss';

function ScopeRequiredState(): JSX.Element {
	return (
		<div className={styles.state} data-testid="service-map-scope-required">
			<Layers size={32} />
			<div className={styles.title}>{SERVICE_MAP_TEXT.scopeRequiredTitle}</div>
			<div className={styles.body}>{SERVICE_MAP_TEXT.scopeRequiredBody}</div>
			<div className={styles.body}>{SERVICE_MAP_TEXT.scopeRequiredHint}</div>
		</div>
	);
}

export default ScopeRequiredState;
