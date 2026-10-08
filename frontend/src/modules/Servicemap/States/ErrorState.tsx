import { Button } from '@signozhq/ui/button';
import { Callout } from '@signozhq/ui/callout';

import { SERVICE_MAP_TEXT } from '../constants';

import styles from './States.module.scss';

interface ErrorStateProps {
	message: string;
	onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps): JSX.Element {
	return (
		<div className={styles.state}>
			<Callout
				className={styles.errorCallout}
				type="error"
				size="medium"
				showIcon
				title={SERVICE_MAP_TEXT.errorTitle}
				testId="service-map-error"
			>
				<div>{message}</div>
				<div>{SERVICE_MAP_TEXT.errorHint}</div>
				<div className={styles.actions}>
					<Button
						variant="outlined"
						color="secondary"
						size="sm"
						onClick={onRetry}
						testId="service-map-retry"
					>
						{SERVICE_MAP_TEXT.retry}
					</Button>
				</div>
			</Callout>
		</div>
	);
}

export default ErrorState;
