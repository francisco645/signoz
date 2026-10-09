import { TriangleAlert } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';

import type { SourceName } from '../../types/sources';
import { HOME_TEXT } from '../../text';

import styles from './SourceError.module.scss';

interface SourceErrorProps {
	source: SourceName;
	onRetry: () => void;
}

function SourceError({ source, onRetry }: SourceErrorProps): JSX.Element {
	return (
		<div className={styles.error} data-testid={`home-source-error-${source}`}>
			<TriangleAlert size={14} />
			<span>{HOME_TEXT.sourceFailed(source)}</span>
			<Button
				variant="link"
				color="secondary"
				size="sm"
				onClick={onRetry}
				testId={`home-source-retry-${source}`}
			>
				{HOME_TEXT.retry}
			</Button>
		</div>
	);
}

export default SourceError;
