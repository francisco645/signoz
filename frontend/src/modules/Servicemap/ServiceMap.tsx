import { useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import TextToolTip from 'components/TextToolTip';
import ResourceAttributesFilter from 'container/ResourceAttributesFilter';
import useResourceAttribute from 'hooks/useResourceAttribute';
import { whilelistedKeys } from 'hooks/useResourceAttribute/config';

import ServiceMapCanvas, {
	ServiceMapGraphRef,
} from './Canvas/ServiceMapCanvas';
import { SERVICE_MAP_TEXT } from './constants';
import { useContainerSize } from './hooks/useContainerSize';
import { useServiceMapData } from './hooks/useServiceMapData';
import ServiceMapLegend from './Legend/ServiceMapLegend';
import ServiceMapNotice from './Notices/ServiceMapNotice';
import EmptyState from './States/EmptyState';
import ErrorState from './States/ErrorState';
import LoadingState from './States/LoadingState';
import ScopeRequiredState from './States/ScopeRequiredState';
import { getServiceMapScope } from './utils/scope';

import styles from './ServiceMap.module.scss';

function ServiceMap(): JSX.Element {
	const fgRef: ServiceMapGraphRef = useRef();
	const [body, setBody] = useState<HTMLDivElement | null>(null);
	const [legend, setLegend] = useState<HTMLElement | null>(null);
	const { width, height } = useContainerSize(body);
	const legendSize = useContainerSize(legend);
	const insets = useMemo(
		() => ({ top: 0, right: 0, bottom: legendSize.height, left: 0 }),
		[legendSize.height],
	);
	const { queries, handleEnvironmentChange } = useResourceAttribute();

	const scope = useMemo(() => getServiceMapScope(queries), [queries]);
	const {
		graph,
		error,
		isLoading,
		isFetching,
		hasRefreshFailed,
		hasServicesFailed,
		refetch,
	} = useServiceMapData(queries, scope.hasScope);

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
			<div className={cx(styles.graph, { [styles.isUpdating]: isFetching })}>
				{isFetching && (
					<output className={styles.status}>{SERVICE_MAP_TEXT.updating}</output>
				)}
				<ServiceMapCanvas
					fgRef={fgRef}
					graph={graph}
					width={width}
					height={height}
					insets={insets}
				/>
				<ServiceMapLegend ref={setLegend} />
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
				hasRefreshFailed={hasRefreshFailed}
				hasServicesFailed={hasServicesFailed}
				onRetry={refetch}
				onKeepEnvironment={(environment): void =>
					handleEnvironmentChange([environment])
				}
			/>

			<div className={styles.body} ref={setBody}>
				{renderBody()}
			</div>
		</div>
	);
}

export default ServiceMap;
