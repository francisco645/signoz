import { useCallback, useMemo, useRef, useState } from 'react';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@signozhq/ui/resizable';
import cx from 'classnames';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import type { ServicesList } from 'types/api/metrics/getService';

import ServiceMapCanvas, {
	ServiceMapGraphRef,
} from './Canvas/ServiceMapCanvas';
import { CAMERA_DURATION_MS, PANEL_SIZE, SERVICE_MAP_TEXT } from './constants';
import { useContainerSize } from './hooks/useContainerSize';
import { useSelectedService } from './hooks/useSelectedService';
import { useYesterdayServices } from './hooks/useYesterdayServices';
import ServiceMapLegend from './Legend/ServiceMapLegend';
import ServiceNodePanel from './NodePanel/ServiceNodePanel';
import type { ServiceMapGraph } from './types';

import styles from './ServiceMapWorkspace.module.scss';

interface ServiceMapWorkspaceProps {
	graph: ServiceMapGraph;
	services: ReadonlyMap<string, ServicesList>;
	queries: IResourceAttribute[];
	scopeLabels: string[];
	minTime: number;
	maxTime: number;
	isFetching: boolean;
}

/** The graph, its legend and, once a service is picked, the docked panel beside it. */
function ServiceMapWorkspace({
	graph,
	services,
	queries,
	scopeLabels,
	minTime,
	maxTime,
	isFetching,
}: ServiceMapWorkspaceProps): JSX.Element {
	const fgRef: ServiceMapGraphRef = useRef();
	const [canvasArea, setCanvasArea] = useState<HTMLDivElement | null>(null);
	const [legend, setLegend] = useState<HTMLElement | null>(null);
	const { width, height } = useContainerSize(canvasArea);
	const legendSize = useContainerSize(legend);
	const [selected, setSelected] = useSelectedService();
	const yesterday = useYesterdayServices(minTime, maxTime, queries, !!selected);

	const insets = useMemo(
		() => ({ top: 0, right: 0, bottom: legendSize.height, left: 0 }),
		[legendSize.height],
	);

	const selectAndCenter = useCallback(
		(id: string): void => {
			setSelected(id);
			const node = graph.nodes.find((candidate) => candidate.id === id);
			if (node?.x !== undefined && node.y !== undefined) {
				fgRef.current?.centerAt(node.x, node.y, CAMERA_DURATION_MS);
			}
		},
		[graph.nodes, setSelected],
	);

	return (
		<ResizablePanelGroup
			className={styles.workspace}
			orientation="horizontal"
			id="service-map-workspace"
			testId="service-map-workspace"
		>
			<ResizablePanel id="service-map-canvas-slot" minSize="30%">
				<div
					ref={setCanvasArea}
					className={cx(styles.canvasArea, { [styles.isUpdating]: isFetching })}
				>
					{isFetching && (
						<output className={styles.status}>{SERVICE_MAP_TEXT.updating}</output>
					)}
					<ServiceMapCanvas
						fgRef={fgRef}
						graph={graph}
						width={width}
						height={height}
						insets={insets}
						selectedId={selected ?? undefined}
						onNodeClick={setSelected}
					/>
					<ServiceMapLegend ref={setLegend} />
				</div>
			</ResizablePanel>
			{selected && (
				<>
					<ResizableHandle withHandle />
					<ResizablePanel
						id="service-map-panel-slot"
						defaultSize={PANEL_SIZE.default}
						minSize={PANEL_SIZE.min}
						maxSize={PANEL_SIZE.max}
					>
						<ServiceNodePanel
							id={selected}
							graph={graph}
							services={services}
							yesterday={yesterday}
							queries={queries}
							scopeLabels={scopeLabels}
							minTime={minTime}
							maxTime={maxTime}
							onSelect={selectAndCenter}
							onClose={(): void => setSelected(null)}
						/>
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}

export default ServiceMapWorkspace;
