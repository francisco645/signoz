import { KeyboardEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Focus } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@signozhq/ui/resizable';
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
import { useAnimateDirection } from './hooks/useAnimateDirection';
import { useContainerSize } from './hooks/useContainerSize';
import { useMapView } from './hooks/useMapView';
import { usePanoramaPlanes } from './hooks/usePanoramaPlanes';
import { useServiceMapInteractions } from './hooks/useServiceMapInteractions';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { useWindowLabel } from './hooks/useWindowLabel';
import { useYesterdayServices } from './hooks/useYesterdayServices';
import ServiceMapLegend from './Legend/ServiceMapLegend';
import ServiceNodePanel from './NodePanel/ServiceNodePanel';
import PanoramaSlot from './Panorama/PanoramaSlot';
import PlaneControl from './Panorama/PlaneControl';
import CopyLinkButton from './Toolbar/CopyLinkButton';
import MapViewToggle from './Toolbar/MapViewToggle';
import ServiceSearch from './Toolbar/ServiceSearch';
import type { ServiceMapGraph } from './types';
import { isWebGLAvailable } from './utils/webgl';

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
	const canvasRef = useRef<HTMLDivElement>(null);
	const prefersReducedMotion = usePrefersReducedMotion();
	const [canvasArea, setCanvasArea] = useState<HTMLDivElement | null>(null);
	const [legend, setLegend] = useState<HTMLElement | null>(null);
	const { width, height } = useContainerSize(canvasArea);
	const legendSize = useContainerSize(legend);
	const [banner, setBanner] = useState<HTMLElement | null>(null);
	const bannerSize = useContainerSize(banner);
	const {
		selected,
		cursorId,
		focusRoot,
		focusDirection,
		focusDepth,
		focusSet,
		announcement,
		select,
		clickNode,
		toggleFocus,
		setFocusDirection,
		setFocusDepth,
		exitFocus,
		closePanel,
		handleKeyDown,
	} = useServiceMapInteractions(graph, searchRef, canvasRef);
	const animateDirection = useAnimateDirection();
	const [hasWebGL] = useState(isWebGLAvailable);
	const [is3dBroken, setIs3dBroken] = useState(false);
	const is3dAvailable = hasWebGL && !is3dBroken;
	const [mapView, setMapView] = useMapView();
	const is3d = mapView === '3d' && is3dAvailable;
	const windowLabel = useWindowLabel(minTime, maxTime);
	const panoramaPlanes = usePanoramaPlanes(graph, minTime, maxTime, is3d);
	const selectedPlane = panoramaPlanes.planes.get(selected ?? '');
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
				if (zoom) {
					fgRef.current?.zoom(zoom, 0);
				}
				fgRef.current?.centerAt(
					node.x,
					node.y,
					prefersReducedMotion ? 0 : CAMERA_DURATION_MS,
				);
			}
		},
		[graph.nodes, prefersReducedMotion, select],
	);

	// The 2D shortcuts drive the cursor, search and focus mode, none of which the 3D view has.
	const handlePanoramaKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
		if (event.key === 'Escape' && selected) {
			closePanel();
		}
	};

	return (
		// Shortcuts cover the canvas and the panel; the handler ignores typing in inputs.
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={styles.workspace}
			onKeyDown={is3d ? handlePanoramaKeyDown : handleKeyDown}
		>
			<ResizablePanelGroup
				orientation="horizontal"
				id="service-map-workspace"
				testId="service-map-workspace"
			>
				<ResizablePanel id="service-map-canvas-slot" minSize="30%">
					<div ref={setCanvasArea} className={styles.canvasArea}>
						<div className={styles.toolbar}>
							<MapViewToggle
								view={is3d ? '3d' : '2d'}
								is3dAvailable={is3dAvailable}
								onChange={(view): void => {
									// Focus mode has no 3D rendering: leave it rather than hide it.
									if (view === '3d' && focusRoot) {
										exitFocus();
									}
									setMapView(view);
								}}
							/>
							{!is3d && (
								<ServiceSearch
									ref={searchRef}
									nodes={graph.nodes}
									onSelect={(id): void => {
										selectAndCenter(id, SEARCH_ZOOM);
										canvasRef.current?.focus({ preventScroll: true });
									}}
									onDismiss={(): void =>
										canvasRef.current?.focus({ preventScroll: true })
									}
								/>
							)}
							<CopyLinkButton minTime={minTime} maxTime={maxTime} />
							{isFetching && (
								<output className={styles.status}>{SERVICE_MAP_TEXT.updating}</output>
							)}
						</div>
						{is3d && (
							<PanoramaSlot
								graph={graph}
								width={width}
								height={height}
								windowLabel={windowLabel}
								selectedId={selected ?? undefined}
								planes={panoramaPlanes.planes}
								adjustedCount={panoramaPlanes.adjustedCount}
								onResetPlanes={panoramaPlanes.reset}
								onNodeClick={select}
								onError={(): void => {
									setIs3dBroken(true);
									setMapView('2d');
								}}
							/>
						)}
						{!is3d && focusRoot && focusSet && (
							<FocusBanner
								ref={setBanner}
								root={focusRoot}
								direction={focusDirection}
								focusSet={focusSet}
								depth={focusDepth}
								isDataStore={
									!graph.nodes.find((node) => node.id === focusRoot)?.metrics
								}
								onDirectionChange={setFocusDirection}
								onDepthChange={setFocusDepth}
								onExit={exitFocus}
							/>
						)}
						{!is3d && (
							<ServiceMapCanvas
								ref={canvasRef}
								fgRef={fgRef}
								isUpdating={isFetching}
								isFlowEnabled={animateDirection.isEnabled}
								cursorId={cursorId}
								graph={graph}
								width={width}
								height={height}
								insets={insets}
								selectedId={selected ?? undefined}
								highlighted={highlighted}
								onNodeClick={clickNode}
							/>
						)}
						{!is3d && (
							<ServiceMapLegend ref={setLegend} animateDirection={animateDirection} />
						)}
						<div className={styles.srOnly} aria-live="polite">
							{announcement}
						</div>
					</div>
				</ResizablePanel>
				{selected && (
					<>
						<ResizableHandle withHandle className={styles.handle} />
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
								actions={
									is3d
										? []
										: [
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
											]
								}
								onSelect={(id): void => selectAndCenter(id)}
								onClose={closePanel}
							>
								{is3d && selectedPlane && (
									<PlaneControl
										id={selected}
										plane={selectedPlane}
										onChange={(tier): void => panoramaPlanes.setPlane(selected, tier)}
									/>
								)}
							</ServiceNodePanel>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
}

export default ServiceMapWorkspace;
