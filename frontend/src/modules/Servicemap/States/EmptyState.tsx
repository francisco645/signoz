import { SERVICE_MAP_TEXT } from '../constants';

import styles from './States.module.scss';

function EmptyState(): JSX.Element {
	return (
		<div className={styles.state} data-testid="service-map-empty">
			<div className={styles.title}>{SERVICE_MAP_TEXT.emptyTitle}</div>
			<div className={styles.body}>{SERVICE_MAP_TEXT.emptyBody}</div>
		</div>
	);
}

export default EmptyState;
