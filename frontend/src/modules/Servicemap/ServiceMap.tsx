import { useMemo } from 'react';
import TextToolTip from 'components/TextToolTip';
import ResourceAttributesFilter from 'container/ResourceAttributesFilter';
import useResourceAttribute from 'hooks/useResourceAttribute';
import { whilelistedKeys } from 'hooks/useResourceAttribute/config';
import { filterServiceMapSupportedQueries } from 'hooks/useResourceAttribute/utils';

import { useServiceMapData } from './hooks/useServiceMapData';
import ServiceMapNotice from './Notices/ServiceMapNotice';
import ServiceMapWorkspace from './ServiceMapWorkspace';
import EmptyState from './States/EmptyState';
import ErrorState from './States/ErrorState';
import LoadingState from './States/LoadingState';
import ScopeRequiredState from './States/ScopeRequiredState';
import { getServiceMapScope } from './utils/scope';

import styles from './ServiceMap.module.scss';

function ServiceMap(): JSX.Element {
	const { queries, handleEnvironmentChange } = useResourceAttribute();

	const scope = useMemo(() => getServiceMapScope(queries), [queries]);
	const supportedQueries = useMemo(
		() => filterServiceMapSupportedQueries(queries),
		[queries],
	);
	const {
		graph,
		services,
		minTime,
		maxTime,
		error,
		isLoading,
		isFetching,
		hasRefreshFailed,
		hasServicesFailed,
		refetch,
	} = useServiceMapData(supportedQueries, scope.hasScope);

	const renderBody = (): JSX.Element => {
		if (!scope.hasScope) {
			return <ScopeRequiredState />;
		}

		if (isLoading) {
			return <LoadingState />;
		}

		if (!graph) {
			return (
				<ErrorState message={error?.getErrorMessage() ?? ''} onRetry={refetch} />
			);
		}

		if (graph.links.length === 0) {
			return <EmptyState />;
		}

		return (
			<ServiceMapWorkspace
				graph={graph}
				services={services}
				queries={supportedQueries}
				scopeLabels={scope.labels}
				minTime={minTime}
				maxTime={maxTime}
				isFetching={isFetching}
			/>
		);
	};

	return (
		<div className={styles.root} data-testid="service-map">
			<ResourceAttributesFilter
				suffixIcon={
					<TextToolTip
						text={`Currently, service map supports filtering of ${whilelistedKeys.join(
							', ',
						)} only, in resource attributes`}
					/>
				}
			/>

			<ServiceMapNotice
				scope={scope}
				hasRefreshFailed={hasRefreshFailed}
				hasServicesFailed={hasServicesFailed}
				onRetry={refetch}
				onKeepEnvironment={(environment): void =>
					handleEnvironmentChange([environment])
				}
			/>

			<div className={styles.body}>{renderBody()}</div>
		</div>
	);
}

export default ServiceMap;
