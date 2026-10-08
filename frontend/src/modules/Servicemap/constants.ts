import type { HealthBand } from './types';

/** Error rate, in percent, from which a service or a call is degraded. */
export const DEGRADED_ERROR_RATE = 1;
/** Error rate, in percent, from which a service or a call is critical. */
export const CRITICAL_ERROR_RATE = 5;
/** Below this many calls in the window, an error rate is not classified. */
export const MIN_CALLS = 20;

export const URL_PARAMS = {
	selected: 'selected',
	focus: 'focus',
	focusDirection: 'focusDir',
} as const;

export const PANEL_SIZE = {
	default: '400px',
	min: '340px',
	max: '50%',
} as const;

export const MAX_NEIGHBOUR_ROWS = 8;
export const MAX_SEARCH_RESULTS = 8;
export const SEARCH_ZOOM = 2;
/** Search bar over the canvas, kept clear when fitting the graph. */
export const TOOLBAR_HEIGHT_PX = 48;

/**
 * Particles running along every edge, caller to callee, as the map always had.
 * More calls mean more and faster particles, on a log scale of req/s.
 */
export const PARTICLES = {
	maxPerEdge: 4,
	/** Canvas units per frame, at no traffic and at `fastRate` or more. */
	minSpeed: 1,
	maxSpeed: 4,
	/** req/s that reaches `maxSpeed`. */
	fastRate: 1_000,
	/** Wider than the edge, so they read on top of it. */
	extraWidth: 3,
	/** Past this many edges only the highlighted ones move, to keep the map responsive. */
	maxEdges: 300,
} as const;

export const CHARGE_STRENGTH = -400;
/** Pull towards the centre that keeps unconnected groups of services in view. */
export const GRAVITY_STRENGTH = 0.06;
/** Room below the lowest node for its label, in screen pixels. */
export const LABEL_ALLOWANCE_PX = 23;
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
	nodeRadius: 11,
	/** Below `pictogramMinZoom` nodes shrink to plain shapes. */
	compactNodeRadius: 6,
	nodeHitRadius: 14,
	pictogramSize: 12,
	pictogramStroke: 1.25,
	pictogramMinZoom: 0.6,
	badgeRadius: 5,
	badgeCut: 1.5,
	compactGlyphSize: 2.5,
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
	scopeRequiredHow:
		'Pick an environment in the selector above, or add a k8s.cluster.name filter next to it.',
	scopeRequiredAction: 'Pick an environment',
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
	legendService: 'Service',
	legendDatabase: 'Database (seen by callers)',
	legendQueue: 'Queue (seen by callers)',
	legendZoomedOut: 'Zoomed out: round = service, square = database or queue',
	legendEdges: 'Width = req/s (log) · arrow = caller → callee',
	legendCallGlyphs:
		'Calls take the worse of their own errors (◆ 1–5%, × ≥ 5%) and the health of what they call; the label keeps the call’s own numbers. Databases and queues take the worst of the calls into them.',
	legendShow: 'Show legend',
	legendHide: 'Hide legend',
	legendMissingEdges: 'Missing edges can mean failed calls.',
	why: 'Why?',
	blindSpotTitle: 'What the map cannot see',
	blindSpotBody: [
		'The map is built from spans recorded by the service that received each call. A call never shows up when the connection was refused or timed out, the caller does not propagate trace context, or the callee is not instrumented.',
		'A service that is down appears as low traffic or disappears, and the services calling it turn red.',
		'Calls to databases and queues are measured by the caller, so they stay on the map and turn red when the database fails. "postgresql" is the technology, not a specific instance.',
	],
	panelRequests: 'Requests',
	panelErrorRate: 'Error rate',
	panelP99: 'p99 (server side)',
	panelVsYesterday: 'vs same window yesterday',
	panelNoYesterday: 'No data yesterday',
	panelTooFewCalls: 'Too few calls to classify.',
	panelNoServerData:
		'No server-side data. This node has no spans of its own in the window, like a database or a client-only service.',
	panelBlindSpot: "Calls that never reached a server span aren't shown here.",
	panelCallers: 'Callers',
	panelCallees: 'Callees',
	panelNoCallers: 'No callers in this time range.',
	panelNoCallees: 'No callees in this time range.',
	panelP99Footnote:
		'* Calls to services are measured on the callee (server side); calls to databases and queues on the caller.',
	panelCall: 'Call',
	panelVsYesterdayShort: 'Service vs yesterday',
	panelShowAll: (count: number): string => `Show all (${count})`,
	panelOpenService: 'Open service',
	panelTraces: 'Traces',
	panelErrorTraces: 'Error traces',
	panelLogs: 'Logs',
	panelNotAService: 'This node is a technology, not an instrumented service.',
	panelGone: (service: string): string =>
		`${service} has no calls in this time range.`,
	panelClearSelection: 'Clear selection',
	panelKind: {
		service: 'Service',
		database: 'Database',
		queue: 'Queue',
		external: 'External',
	},
	panelSeenByCallers: (errorRate: string): string =>
		`${errorRate} errors seen by callers`,
	panelDataStoreNote:
		'Measured on the callers. The node stands for the technology, not one instance.',
	searchPlaceholder: 'Search services…',
	searchNoResults: (query: string): string => `No service matches "${query}".`,
	searchFooter: '↑↓ to move · Enter to select · Esc to close',
	focus: 'Focus',
	exitFocus: 'Exit focus',
	focusUp: 'Upstream',
	focusDown: 'Downstream',
	focusBoth: 'Both',
	focusBanner: (root: string, connected: number): string =>
		`Focused on ${root} · ${connected} connected ${connected === 1 ? 'service' : 'services'}`,
	focusDepthAll: 'All hops',
	focusDepth: (hops: number): string => `${hops} hop${hops > 1 ? 's' : ''}`,
	focusDirectionLabel: 'Direction',
	focusDepthLabel: 'Hops',
	cursorHint: 'Press Enter to inspect.',
	focusDataStore: (root: string): string =>
		`All instances of ${root} are summed in one node.`,
	focusShowList: 'Show list',
	focusHideList: 'Hide list',
	focusCopyNames: 'Copy names',
	focusCopied: 'Names copied.',
	canvasLabel:
		'Service map. Arrow keys move between services, worst health first. Enter inspects, F focuses, / searches, Esc steps back.',
	searchLabel: 'Search services',
	announceSelection: (
		id: string,
		health: string,
		callers: number,
		callees: number,
	): string => `${id}, ${health}, ${callers} callers, ${callees} callees`,
	copyLink: 'Copy link',
	copyLinkHint:
		'Copy a link with the absolute time range, the selected service and the focus.',
	copyLinkDone: (window: string): string =>
		`Link copied with absolute time (${window}).`,
	flowSwitch: 'Animate call direction',
	flowHelp:
		'Particles run caller → callee; more calls, more and faster particles. Averaged over the time range.',
	flowReducedMotion:
		'Off because your system is set to reduce motion. Arrows still show caller → callee.',
	zoomIn: 'Zoom in',
	zoomOut: 'Zoom out',
	zoomFit: 'Fit to screen',
	tooltipServerSide: (service: string): string =>
		`Measured on ${service} spans. Failed connections and client timeouts aren't counted.`,
	tooltipClientSide: (caller: string, target: string): string =>
		`Measured on ${caller} client spans. "${target}" is the technology, not a specific instance.`,
} as const;
