import { useCallback, useMemo, useRef, useState } from 'react';
import { Focus } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
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
import {
	CAMERA_DURATION_MS,
	PANEL_SIZE,
	SEARCH_ZOOM,
	SERVICE_MAP_TEXT,
	TOOLBAR_HEIGHT_PX,
} from './constants';
import FocusBanner from './Focus/FocusBanner';
import { useContainerSize } from './hooks/useContainerSize';
import { useServiceMapInteractions } from './hooks/useServiceMapInteractions';
import { useYesterdayServices } from './hooks/useYesterdayServices';
import ServiceMapLegend from './Legend/ServiceMapLegend';
import ServiceNodePanel from './NodePanel/ServiceNodePanel';
import ServiceSearch from './Toolbar/ServiceSearch';
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
	const searchRef = useRef<HTMLInputElement>(null);
	const [canvasArea, setCanvasArea] = useState<HTMLDivElement | null>(null);
	const [legend, setLegend] = useState<HTMLElement | null>(null);
	const { width, height } = useContainerSize(canvasArea);
	const legendSize = useContainerSize(legend);
	const [banner, setBanner] = useState<HTMLElement | null>(null);
	const bannerSize = useContainerSize(banner);
	const {
		selected,
		focusRoot,
		focusDirection,
		focusSet,
		announcement,
		select,
		clickNode,
		toggleFocus,
		setFocusDirection,
		exitFocus,
		handleKeyDown,
	} = useServiceMapInteractions(graph, searchRef);
	const yesterday = useYesterdayServices(minTime, maxTime, queries, !!selected);

	const insets = useMemo(
		() => ({
			top: TOOLBAR_HEIGHT_PX + bannerSize.height,
			right: 0,
			bottom: legendSize.height,
			left: 0,
		}),
		[bannerSize.height, legendSize.height],
	);
	const highlighted = useMemo(
		() => (focusSet ? new Set(focusSet.keys()) : undefined),
		[focusSet],
	);

	const selectAndCenter = useCallback(
		(id: string, zoom?: number): void => {
			select(id);
			const node = graph.nodes.find((candidate) => candidate.id === id);
			if (node?.x !== undefined && node.y !== undefined) {
				fgRef.current?.centerAt(node.x, node.y, CAMERA_DURATION_MS);
				if (zoom) {
					fgRef.current?.zoom(zoom, CAMERA_DURATION_MS);
				}
			}
		},
		[graph.nodes, select],
	);

	return (
		<ResizablePanelGroup
			className={styles.workspace}
			orientation="horizontal"
			id="service-map-workspace"
			testId="service-map-workspace"
		>
			<ResizablePanel id="service-map-canvas-slot" minSize="30%">
				{/* Shortcuts are scoped to the map; the handler ignores typing in inputs. */}
				{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
				<div
					ref={setCanvasArea}
					className={cx(styles.canvasArea, { [styles.isUpdating]: isFetching })}
					onKeyDown={handleKeyDown}
				>
					<div className={styles.toolbar}>
						<ServiceSearch
							ref={searchRef}
							nodes={graph.nodes}
							onSelect={(id): void => selectAndCenter(id, SEARCH_ZOOM)}
						/>
						{isFetching && (
							<output className={styles.status}>{SERVICE_MAP_TEXT.updating}</output>
						)}
					</div>
					{focusRoot && focusSet && (
						<FocusBanner
							ref={setBanner}
							root={focusRoot}
							direction={focusDirection}
							focusSet={focusSet}
							total={graph.nodes.length}
							isDataStore={!graph.nodes.find((node) => node.id === focusRoot)?.metrics}
							onDirectionChange={setFocusDirection}
							onExit={exitFocus}
						/>
					)}
					<ServiceMapCanvas
						fgRef={fgRef}
						graph={graph}
						width={width}
						height={height}
						insets={insets}
						selectedId={selected ?? undefined}
						highlighted={highlighted}
						onNodeClick={clickNode}
					/>
					<ServiceMapLegend ref={setLegend} />
					<div className={styles.srOnly} aria-live="polite">
						{announcement}
					</div>
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
							actions={[
								{
									key: 'focus',
									component: (
										<Button
											variant={focusRoot === selected ? 'solid' : 'ghost'}
											color="secondary"
											size="sm"
											prefix={<Focus />}
											onClick={toggleFocus}
											aria-pressed={focusRoot === selected}
											testId="service-map-panel-focus"
										>
											{`${SERVICE_MAP_TEXT.focus} (F)`}
										</Button>
									),
								},
							]}
							onSelect={(id): void => selectAndCenter(id)}
							onClose={(): void => select(null)}
						/>
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}

export default ServiceMapWorkspace;
