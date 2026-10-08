import { useEffect, useMemo, useRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useSelector } from 'react-redux';
import { Button } from '@signozhq/ui/button';
import { Callout } from '@signozhq/ui/callout';
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
import EmptyState from './States/EmptyState';
import ErrorState from './States/ErrorState';
import LoadingState from './States/LoadingState';

import styles from './ServiceMap.module.scss';

function ServiceMap(): JSX.Element {
	const fgRef: ServiceMapGraphRef = useRef();
	const { minTime, maxTime } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);
	const { queries } = useResourceAttribute();

	const supportedQueries = useMemo(
		() => filterServiceMapSupportedQueries(queries),
		[queries],
	);

	const { data, error, isError, isFetching, isLoading, refetch } =
		useDependencyGraph({ minTime, maxTime, queries: supportedQueries });

	useEffect(() => {
		fgRef.current?.d3Force('charge')?.strength(CHARGE_STRENGTH);
	}, [data]);

	const handleRetry = (): void => {
		void refetch();
	};

	const renderBody = (): JSX.Element => {
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

			{isError && data && (
				<Callout
					className={styles.notice}
					type="warning"
					size="small"
					showIcon
					title={SERVICE_MAP_TEXT.refreshFailed}
					testId="service-map-refresh-failed"
				>
					<Button
						variant="link"
						color="secondary"
						size="sm"
						onClick={handleRetry}
						testId="service-map-refresh-retry"
					>
						{SERVICE_MAP_TEXT.retry}
					</Button>
				</Callout>
			)}

			<div className={styles.body}>{renderBody()}</div>
		</div>
	);
}

export default ServiceMap;
