/**
 * AI-owned. Generated and maintained by the `signoz-page-story` skill.
 * Do not hand-edit: regenerate instead.
 */

import { rest } from 'msw';

import {
	countControl,
	choiceControl,
	multiChoiceControl,
	toggleControl,
} from '@/storybook/controls/controls';
import { defineStoryMocks } from '@/storybook/controls/defineStoryMocks';
import {
	buildAlertRules,
	buildServices,
	homeFeatureFlags,
	homeUserPreferences,
	HOME_CHECKLIST_STEPS,
	isSavedViewSignal,
	metricsOnboardingResponse,
	queryRangeV5ScalarResponse,
	recentDashboardsResponse,
	SAVED_VIEW_SIGNALS,
	type SavedViewSignal,
	savedViewsResponse,
	SERVICES_SOURCES,
	type ServicesSource,
	spanMetricsResponse,
	topLevelOperationsResponse,
} from './__story_mockdata__/home';
import {
	ALERT_ENVIRONMENTS,
	type AlertEnvironment,
	alerts as overviewAlerts,
	dependencyGraph,
	FAILING_SOURCES,
	type FailingSource,
	lastTraces,
	rules as overviewRules,
	SCENARIOS,
	type Scenario,
	scalar,
	services as overviewServices,
	telemetry as overviewTelemetry,
} from './__story_mockdata__/overview';

const HEALTH = 'Home · health';
const SIGNALS = 'Home · signals';
const ONBOARDING = 'Home · onboarding';
const LISTS = 'Home · lists';

const INGESTED_COUNT = 4213;

/** Home caps every list at five rows, so the control has to go past that. */
const LIST_MAX = 8;

const CHECKLIST_VISIBILITY = ['visible', 'dismissed'] as const;

type ChecklistVisibility = (typeof CHECKLIST_VISIBILITY)[number];

interface QueryRangeV5Body {
	requestType?: string;
	start?: number;
	compositeQuery?: {
		queries?: {
			spec?: {
				signal?: string;
				stepInterval?: number;
				groupBy?: { name: string }[];
			};
		}[];
	};
}

interface ServicesBody {
	start?: string;
}

const DAY_MS = 86_400_000;

/** The overview's `query_range` calls, told apart by shape. */
const overviewQueryOf = (
	body: QueryRangeV5Body,
):
	| 'telemetry'
	| 'lastTraces'
	| 'environments'
	| 'planes'
	| 'hasTelemetry'
	| undefined => {
	const queries = body.compositeQuery?.queries ?? [];
	const groupBy = queries[0]?.spec?.groupBy?.map((key) => key.name) ?? [];
	if (body.requestType === 'time_series') {
		return queries[0]?.spec?.stepInterval === 300 ? 'lastTraces' : 'telemetry';
	}
	if (groupBy.includes('deployment.environment')) {
		return 'environments';
	}
	if (groupBy.includes('signoz.service_map.layer')) {
		return 'planes';
	}
	return queries.length === 2 ? 'hasTelemetry' : undefined;
};

/**
 * Home detects logs and traces with one `query_range` call each, told apart by
 * the signal on the query spec.
 */
const signalOf = (body: QueryRangeV5Body): string | undefined =>
	body.compositeQuery?.queries?.[0]?.spec?.signal;

export const homeMocks = defineStoryMocks({
	controls: {
		scenario: choiceControl<Scenario>('Health', {
			group: HEALTH,
			description:
				'The four states of the overview: what fires, what moved against last week, what stopped arriving.',
			options: SCENARIOS,
			value: 'normal',
		}),
		failingSources: multiChoiceControl<FailingSource>('Failing sources', {
			group: HEALTH,
			description:
				'These answer 500: the overview must say so, never "No issues".',
			options: FAILING_SOURCES,
			value: [],
		}),
		alertEnvironment: choiceControl<AlertEnvironment>('Alert environment', {
			group: HEALTH,
			description: 'Alerts from another environment must not turn production red.',
			options: ALERT_ENVIRONMENTS,
			value: 'production',
		}),
		logsIngestion: toggleControl('Logs ingestion', {
			group: SIGNALS,
			value: true,
		}),
		tracesIngestion: toggleControl('Traces ingestion', {
			group: SIGNALS,
			value: true,
		}),
		metricsIngestion: toggleControl('Metrics ingestion', {
			group: SIGNALS,
			value: true,
		}),
		welcomeChecklist: choiceControl<ChecklistVisibility>('Welcome checklist', {
			group: ONBOARDING,
			description:
				'Dismissing it moves the checklist behind the header button, as "I\'ll do this later" does.',
			options: CHECKLIST_VISIBILITY,
			value: 'visible',
		}),
		skippedSteps: multiChoiceControl('Skipped steps', {
			group: ONBOARDING,
			description: 'Steps the user chose to skip. Completion follows the data.',
			options: HOME_CHECKLIST_STEPS,
			value: [],
		}),
		alertRules: countControl('Alert rules', {
			group: LISTS,
			value: 5,
			max: LIST_MAX,
		}),
		dashboards: countControl('Recent dashboards', {
			group: LISTS,
			value: 5,
			max: LIST_MAX,
		}),
		savedViews: countControl('Saved views per signal', {
			group: LISTS,
			value: 5,
			max: LIST_MAX,
		}),
		savedViewSignals: multiChoiceControl<SavedViewSignal>('Signals with views', {
			group: LISTS,
			description:
				'Explorer tabs that have views; the rest fall back to their empty state.',
			options: SAVED_VIEW_SIGNALS,
			value: SAVED_VIEW_SIGNALS,
		}),
		services: countControl('Services', {
			group: LISTS,
			value: 6,
			max: LIST_MAX,
		}),
		servicesSource: choiceControl<ServicesSource>('Services source', {
			group: LISTS,
			description:
				'`span-metrics` turns on the feature flag that swaps the services card for the span-metrics one.',
			options: SERVICES_SOURCES,
			value: 'traces',
		}),
	},
	handlers: (values, response) => [
		rest.get('http://localhost/api/v2/metrics/onboarding', (_req, res, ctx) =>
			res(
				ctx.status(200),
				ctx.json(metricsOnboardingResponse(values.metricsIngestion)),
			),
		),

		rest.post('http://localhost/api/v5/query_range', async (req, res, ctx) => {
			const body = (await req.json()) as QueryRangeV5Body;
			const overviewQuery = overviewQueryOf(body);
			const failing = values.failingSources.includes('telemetry');
			if (overviewQuery === 'telemetry') {
				return failing
					? res(ctx.status(500), ctx.json({ status: 'error' }))
					: res(ctx.status(200), ctx.json(overviewTelemetry(values.scenario)));
			}
			if (overviewQuery === 'lastTraces') {
				return res(ctx.status(200), ctx.json(lastTraces()));
			}
			if (overviewQuery === 'environments') {
				return res(
					ctx.status(200),
					ctx.json(
						scalar(
							['deployment.environment', 'count()'],
							[
								['production', 900],
								['staging', 120],
							],
						),
					),
				);
			}
			if (overviewQuery === 'planes') {
				return res(
					ctx.status(200),
					ctx.json(
						scalar(['service.name', 'signoz.service_map.layer', 'count()'], []),
					),
				);
			}
			if (overviewQuery === 'hasTelemetry') {
				const count =
					values.tracesIngestion || values.logsIngestion ? INGESTED_COUNT : 0;
				return res(ctx.status(200), ctx.json(scalar(['count()'], [[count]])));
			}
			const signal = signalOf(body);

			const isActive =
				signal === 'traces' ? values.tracesIngestion : values.logsIngestion;

			return res(
				ctx.status(200),
				ctx.json(queryRangeV5ScalarResponse(isActive ? INGESTED_COUNT : 0)),
			);
		}),

		rest.get('http://localhost/api/v1/user/preferences', (_req, res, ctx) =>
			res(
				ctx.status(200),
				ctx.json({
					status: 'success',
					data: homeUserPreferences({
						checklistDismissed: values.welcomeChecklist === 'dismissed',
						skippedSteps: values.skippedSteps,
					}),
				}),
			),
		),

		rest.get(
			'http://localhost/api/v2/users/me/dashboards',
			response.json(() => recentDashboardsResponse(values.dashboards)),
		),

		rest.get('http://localhost/api/v2/rules', (_req, res, ctx) =>
			values.failingSources.includes('rules')
				? res(ctx.status(500), ctx.json({ status: 'error' }))
				: res(
						ctx.status(200),
						ctx.json({
							status: 'success',
							data: values.tracesIngestion
								? overviewRules(values.scenario)
								: buildAlertRules(values.alertRules),
						}),
					),
		),

		rest.get('http://localhost/api/v1/alerts', (_req, res, ctx) =>
			values.failingSources.includes('alerts')
				? res(ctx.status(500), ctx.json({ status: 'error' }))
				: res(
						ctx.status(200),
						ctx.json({
							status: 'success',
							data: overviewAlerts(values.scenario, values.alertEnvironment),
						}),
					),
		),

		rest.post('http://localhost/api/v1/dependency_graph', (_req, res, ctx) =>
			values.failingSources.includes('map')
				? res(ctx.status(500), ctx.json({ status: 'error' }))
				: res(ctx.status(200), ctx.json(dependencyGraph(values.scenario))),
		),

		rest.get(
			'http://localhost/api/v2/saved_views',
			response.json((req) => {
				const source = req.url.searchParams.get('source') ?? 'logs';
				const signal = isSavedViewSignal(source) ? source : 'logs';

				return savedViewsResponse(
					values.savedViewSignals.includes(signal) ? values.savedViews : 0,
					signal,
				);
			}),
		),

		rest.post('http://localhost/api/v2/services', async (req, res, ctx) => {
			if (values.failingSources.includes('services')) {
				return res(ctx.status(500), ctx.json({ status: 'error' }));
			}
			const body = (await req.json()) as ServicesBody;
			const isWeekAgo = Number(body.start ?? 0) / 1e6 < Date.now() - 3 * DAY_MS;
			return res(
				ctx.status(200),
				ctx.json({
					status: 'success',
					data: values.tracesIngestion
						? overviewServices(values.scenario, isWeekAgo)
						: buildServices(values.services),
				}),
			);
		}),

		rest.post(
			'http://localhost/api/v1/service/top_level_operations',
			response.json(() => topLevelOperationsResponse(values.services)),
		),

		rest.post(
			'http://localhost/api/v4/query_range',
			response.json(() => spanMetricsResponse()),
		),
	],
	config: ({ servicesSource }) => ({
		appContext: { featureFlags: homeFeatureFlags(servicesSource) },
	}),
});
