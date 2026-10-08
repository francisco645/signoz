export type HealthBand =
	| 'healthy'
	| 'degraded'
	| 'critical'
	| 'lowTraffic'
	| 'noData';

export interface ServiceMetrics {
	callCount: number;
	errorCount: number;
	/** Calls per second. */
	callRate: number;
	/** Percentage of calls that failed. */
	errorRate: number;
	/** Nanoseconds. */
	p99: number;
}

export interface ServiceMapNode {
	id: string;
	/** RED of the service's own spans; absent for databases, queues and client-only services. */
	metrics?: ServiceMetrics;
	/** Calls on the incoming edges, weighted by call count. */
	incoming: Omit<ServiceMetrics, 'p99'>;
	band: HealthBand;
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
}

export interface ServiceMapLink {
	source: string;
	target: string;
	callCount: number;
	callRate: number;
	errorRate: number;
	/** Nanoseconds. */
	p99: number;
	band: HealthBand;
	/** Another link runs the opposite way between the same services. */
	isBidirectional: boolean;
}

export interface ServiceMapGraph {
	nodes: ServiceMapNode[];
	links: ServiceMapLink[];
}

export interface ServiceMapScope {
	/** Environments the filters keep, when they name them. */
	environments: string[];
	/** An environment or a cluster narrows the map. */
	hasScope: boolean;
	isMixedEnvironments: boolean;
	/** Filters the service map API drops, formatted for display. */
	ignoredFilters: string[];
}

export interface ServiceMapPalette {
	background: string;
	nodeFill: string;
	foreground: string;
	secondaryForeground: string;
	mutedForeground: string;
	selection: string;
	degraded: string;
	critical: string;
}
