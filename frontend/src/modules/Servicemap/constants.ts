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
	emptyTitle: 'No calls between services in this time range',
	emptyBody:
		"Common causes: services don't propagate trace context (traceparent), the callee isn't instrumented, or calls failed before reaching it.",
} as const;
