import { useEffect, useMemo, useRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useSelector } from 'react-redux';
import cx from 'classnames';
import TextToolTip from 'components/TextToolTip';
import ResourceAttributesFilter from 'container/ResourceAttributesFilter';
import useResourceAttribute from 'hooks/useResourceAttribute';
import { whilelistedKeys } from 'hooks/useResourceAttribute/config';
import { filterServiceMapSupportedQueries } from 'hooks/useResourceAttribute/utils';
import { AppState } from 'store/reducers';
import { GlobalReducer } from 'types/reducer/globalTime';

import { CHARGE_STRENGTH, SERVICE_MAP_TEXT } from './constants';
import { useDependencyGraph } from './hooks/useDependencyGraph';
import Map, { ServiceMapGraphRef } from './Map';
import ServiceMapNotice from './Notices/ServiceMapNotice';
import EmptyState from './States/EmptyState';
import ErrorState from './States/ErrorState';
import LoadingState from './States/LoadingState';
import ScopeRequiredState from './States/ScopeRequiredState';
import { getServiceMapScope } from './utils/scope';

import styles from './ServiceMap.module.scss';

function ServiceMap(): JSX.Element {
	const fgRef: ServiceMapGraphRef = useRef();
	const { minTime, maxTime } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);
	const { queries, handleEnvironmentChange } = useResourceAttribute();

	const scope = useMemo(() => getServiceMapScope(queries), [queries]);
	const supportedQueries = useMemo(
		() => filterServiceMapSupportedQueries(queries),
		[queries],
	);

	const { data, error, isError, isFetching, isLoading, refetch } =
		useDependencyGraph({
			minTime,
			maxTime,
			queries: supportedQueries,
			enabled: scope.hasScope,
		});

	useEffect(() => {
		fgRef.current?.d3Force('charge')?.strength(CHARGE_STRENGTH);
	}, [data]);

	const handleRetry = (): void => {
		void refetch();
	};

	const renderBody = (): JSX.Element => {
		if (!scope.hasScope) {
			return <ScopeRequiredState />;
		}

		if (isLoading) {
			return <LoadingState />;
		}

		if (!data) {
			return (
				<ErrorState
					message={error?.getErrorMessage() ?? ''}
					onRetry={handleRetry}
				/>
			);
		}

		if (data.length === 0) {
			return <EmptyState />;
		}

		return (
			<div className={cx(styles.graph, { [styles.isUpdating]: isFetching })}>
				{isFetching && (
					<output className={styles.status}>{SERVICE_MAP_TEXT.updating}</output>
				)}
				<Map fgRef={fgRef} dependencies={data} />
			</div>
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
				hasRefreshFailed={isError && !!data}
				onRetry={handleRetry}
				onKeepEnvironment={(environment): void =>
					handleEnvironmentChange([environment])
				}
			/>

			<div className={styles.body}>{renderBody()}</div>
		</div>
	);
}

export default ServiceMap;
