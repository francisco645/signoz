/** Error rate, in percent, from which a service is flagged as failing. */
export const ERROR_RATE_THRESHOLD = 1;

export const MIN_NODE_RADIUS = 10;
export const MAX_NODE_RADIUS = 20;
export const NODE_FONT_SIZE = 6;
export const CHARGE_STRENGTH = -400;

export const SERVICE_MAP_TEXT = {
	loading: 'Loading service map…',
	updating: 'Updating…',
	errorTitle: "Couldn't load the service map",
	errorHint: 'Long time ranges are expensive. Try a shorter range.',
	refreshFailed: 'Refresh failed. Showing the last loaded map.',
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
} as const;
