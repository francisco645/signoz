export type SourceName = 'alerts' | 'rules' | 'services' | 'telemetry';

/** One data source of the Home: a failed refresh keeps the last value, marked stale. */
export type Source<T> =
	| { status: 'loading' }
	| { status: 'ready'; value: T; updatedAt: number }
	| { status: 'stale'; value: T; updatedAt: number; error: unknown }
	| { status: 'failed'; error: unknown };

export const hasValue = <T>(
	source: Source<T>,
): source is Extract<Source<T>, { value: T }> =>
	source.status === 'ready' || source.status === 'stale';
