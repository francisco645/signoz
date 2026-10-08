import Spinner from 'components/Spinner';

import { SERVICE_MAP_TEXT } from '../constants';

import styles from './States.module.scss';

function LoadingState(): JSX.Element {
	return (
		<div className={styles.state} data-testid="service-map-loading">
			<Spinner size="large" height="auto" />
			<div className={styles.body}>{SERVICE_MAP_TEXT.loading}</div>
		</div>
	);
}

export default LoadingState;
