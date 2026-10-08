import { useState } from 'react';
import { Button } from '@signozhq/ui/button';
import { Callout } from '@signozhq/ui/callout';

import { SERVICE_MAP_TEXT } from '../constants';
import type { ServiceMapScope } from '../types';

import styles from './ServiceMapNotice.module.scss';

interface ServiceMapNoticeProps {
	scope: ServiceMapScope;
	hasRefreshFailed: boolean;
	onRetry: () => void;
	onKeepEnvironment: (environment: string) => void;
}

/** One notice at a time, the most pressing first. */
function ServiceMapNotice({
	scope,
	hasRefreshFailed,
	onRetry,
	onKeepEnvironment,
}: ServiceMapNoticeProps): JSX.Element | null {
	const ignoredKey = scope.ignoredFilters.join('|');
	const [dismissedIgnored, setDismissedIgnored] = useState<string>();

	if (hasRefreshFailed) {
		return (
			<Callout
				className={styles.notice}
				type="warning"
				size="small"
				showIcon
				title={SERVICE_MAP_TEXT.refreshFailed}
				testId="service-map-notice-refresh-failed"
			>
				<Button
					variant="link"
					color="secondary"
					size="sm"
					onClick={onRetry}
					testId="service-map-notice-retry"
				>
					{SERVICE_MAP_TEXT.retry}
				</Button>
			</Callout>
		);
	}

	if (scope.isMixedEnvironments) {
		const [firstEnvironment] = scope.environments;

		return (
			<Callout
				className={styles.notice}
				type="warning"
				size="small"
				showIcon
				title={SERVICE_MAP_TEXT.mixedEnvironments(scope.environments)}
				testId="service-map-notice-mixed-environments"
			>
				{firstEnvironment && (
					<Button
						variant="link"
						color="secondary"
						size="sm"
						onClick={(): void => onKeepEnvironment(firstEnvironment)}
						testId="service-map-notice-keep-environment"
					>
						{SERVICE_MAP_TEXT.keepEnvironment(firstEnvironment)}
					</Button>
				)}
			</Callout>
		);
	}

	if (scope.ignoredFilters.length > 0 && dismissedIgnored !== ignoredKey) {
		return (
			<Callout
				className={styles.notice}
				type="info"
				size="small"
				showIcon
				action="dismissible"
				onClick={(): void => setDismissedIgnored(ignoredKey)}
				title={SERVICE_MAP_TEXT.ignoredFilters(scope.ignoredFilters)}
				testId="service-map-notice-ignored-filters"
			/>
		);
	}

	return null;
}

export default ServiceMapNotice;
