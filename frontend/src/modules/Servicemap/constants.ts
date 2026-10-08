import type { HealthBand } from './types';

/** Error rate, in percent, from which a service or a call is degraded. */
export const DEGRADED_ERROR_RATE = 1;
/** Error rate, in percent, from which a service or a call is critical. */
export const CRITICAL_ERROR_RATE = 5;
/** Below this many calls in the window, an error rate is not classified. */
export const MIN_CALLS = 20;

export const CHARGE_STRENGTH = -400;
export const WARMUP_TICKS = 50;
export const COOLDOWN_TICKS = 100;
export const REDUCED_MOTION_WARMUP_TICKS = 300;
export const CAMERA_DURATION_MS = 400;
export const FIT_PADDING_PX = 48;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 8;
export const ZOOM_STEP = 1.4;

/** Canvas sizes, in screen pixels: they are divided by the zoom to stay constant. */
export const CANVAS = {
	nodeRadius: 8,
	nodeHitRadius: 12,
	ringGap: 3,
	glyphSize: 4,
	arrowLength: 6,
	linkHitWidth: 8,
	labelFontSize: 11,
	selectedLabelFontSize: 13,
	labelGap: 4,
	labelHalo: 3,
	labelMinZoom: 0.7,
	linkLabelMinZoom: 1.2,
	maxLabelLength: 24,
	curvature: 0.15,
} as const;

export const ALPHA = {
	tint: 0.16,
	dimmed: 0.25,
	dimmedLink: 0.12,
	hoverRing: 0.5,
} as const;

export const BORDER_WIDTH: Record<HealthBand, number> = {
	healthy: 1,
	degraded: 2,
	critical: 3,
	lowTraffic: 1,
	noData: 1,
};

export const BORDER_DASH: Record<HealthBand, number[]> = {
	healthy: [],
	degraded: [],
	critical: [],
	lowTraffic: [3, 2],
	noData: [1, 2],
};

export const HEALTH_LABEL: Record<HealthBand, string> = {
	healthy: 'Healthy',
	degraded: 'Degraded',
	critical: 'Critical',
	lowTraffic: 'Low traffic',
	noData: 'No server-side data',
};

export const SERVICE_MAP_TEXT = {
	loading: 'Loading service map…',
	updating: 'Updating…',
	errorTitle: "Couldn't load the service map",
	errorHint: 'Long time ranges are expensive. Try a shorter range.',
	refreshFailed: 'Refresh failed. Showing the last loaded map.',
	servicesUnavailable:
		"Service metrics are unavailable, so node health isn't shown. Edges are still accurate.",
	retry: 'Retry',
	scopeRequiredTitle: 'Choose an environment or a cluster to draw the map',
	scopeRequiredBody:
		'Calls from different environments are summed together, so the map needs one.',
	scopeRequiredHint:
		'Service missing? The map filters on deployment.environment, not on deployment.environment.name.',
	mixedEnvironments: (environments: string[]): string =>
		environments.length > 0
			? `Mixed environments: ${environments.join(' + ')} are summed in this map. Pick one for accurate numbers.`
			: 'Mixed environments: excluding an environment still sums all the others. Pick one for accurate numbers.',
	keepEnvironment: (environment: string): string => `Keep ${environment} only`,
	ignoredFilters: (filters: string[]): string =>
		`Ignored filters: ${filters.join('; ')}. The service map can only filter by environment, cluster and namespace.`,
	emptyTitle: 'No calls between services in this time range',
	emptyBody:
		"Common causes: services don't propagate trace context (traceparent), the callee isn't instrumented, or calls failed before reaching it.",
	legendTitle: 'Error rate (server side)',
	legendColorNote: 'Color = errors only. Latency is in the panel.',
	legendLowTraffic: `Low traffic (< ${MIN_CALLS} calls)`,
	legendNoData: 'No server data',
	legendEdges: 'Width = req/s (log) · arrow = caller → callee',
	legendMissingEdges: 'Missing edges can mean failed calls.',
	why: 'Why?',
	blindSpotTitle: 'What the map cannot see',
	blindSpotBody: [
		'The map is built from spans recorded by the service that received each call. A call never shows up when the connection was refused or timed out, the caller does not propagate trace context, or the callee is not instrumented.',
		'A service that is down appears as low traffic or disappears, and the services calling it turn red.',
		'Calls to databases and queues are measured by the caller, so they stay on the map and turn red when the database fails. "postgresql" is the technology, not a specific instance.',
	],
	zoomIn: 'Zoom in',
	zoomOut: 'Zoom out',
	zoomFit: 'Fit to screen',
	tooltipServerSide: (service: string): string =>
		`Measured on ${service} spans. Failed connections and client timeouts aren't counted.`,
	tooltipClientSide: (caller: string, target: string): string =>
		`Measured on ${caller} client spans. "${target}" is the technology, not a specific instance.`,
} as const;
