import type { Meta, StoryObj } from '@storybook/react-vite';
import { screen, userEvent, within } from 'storybook/test';

import { storyMocks } from '@/storybook/controls/defineStoryMocks';
import type { PageStoryArgs } from '@/storybook/runtime/resolveStory';

import { serviceMapMocks } from './ServiceMap.stories.mocks';

import ServiceMapContainer from '../index';

type ServiceMapArgs = PageStoryArgs<typeof serviceMapMocks>;

const pageStory = storyMocks(serviceMapMocks, { layout: 'app' });

/**
 * Service to service calls as a force graph over `/api/v1/dependency_graph`,
 * scoped to an environment or a cluster. Nodes take their health from the
 * service's own spans (`/api/v2/services`), in error bands that also differ by
 * border and glyph; links are as wide as their traffic and point at the callee.
 *
 * Route: `/service-map`.
 */
const meta = {
	title: 'Pages/Services/Service Map',
	tags: ['beta', 'play'],
	component: ServiceMapContainer,
	...pageStory,
	parameters: { ...pageStory.parameters },
} satisfies Meta<ServiceMapArgs>;

export default meta;

type Story = StoryObj<ServiceMapArgs>;

/** The keys are only fetched once the select opens, past the 1s default. */
const untilLoaded = { timeout: 15_000 };

/**
 * The whole topology: one node per service, neutral while healthy, amber and red
 * past 1% and 5% errors, hollow for databases with no spans of their own, and a
 * link per dependency carrying the latency and error rate its tooltip reports.
 */
export const Default: Story = {};

/** A topology without service errors: every node neutral, nothing asks for attention. */
export const HealthyTopology: Story = {
	args: { health: 'healthy' },
};

/** Every call failing somewhere: the critical and degraded bands side by side. */
export const FailingTopology: Story = {
	args: { health: 'failing' },
};

/** 500 services and 1,500 calls: the acceptance check for pan, zoom and first draw. */
export const LargeTopology: Story = {
	args: { topology: 'large' },
};

/**
 * The map narrowed to one environment and one cluster: the environment selector
 * carries the first, a chip carries the second, and the graph is what is left.
 */
export const Filtered: Story = {
	args: { filters: ['environment', 'cluster'] },
};

/**
 * No environment or cluster picked: the map would sum every environment, so it
 * asks for one instead of querying.
 */
export const ScopeRequired: Story = {
	args: { filters: [] },
};

/** Two environments picked: the graph sums them, and a warning says so. */
export const MixedEnvironments: Story = {
	args: { filters: ['mixed-environments'] },
};

/** A service filter from the Services page: shown as a chip, dropped by the API. */
export const IgnoredFilters: Story = {
	args: { filters: ['environment', 'service'] },
};

/** First load in flight: the spinner, with the filters already usable. */
export const Loading: Story = {
	args: { dataState: 'loading' },
};

/** The dependency graph request failed before anything was drawn. */
export const LoadError: Story = {
	args: { dataState: 'error' },
};

/** The graph loaded but `/services` failed: edges stay, node health is unknown. */
export const ServiceMetricsUnavailable: Story = {
	args: { serviceMetrics: false },
};

/** A workspace with no dependencies recorded in the selected time range. */
export const NoServices: Story = {
	args: { services: 0 },
};

/** The filter's real empty branch when no resource attributes have been ingested. */
export const NoResourceAttributes: Story = {
	args: { resourceAttributes: false, filters: [] },
	play: async ({ canvasElement }): Promise<void> => {
		const filter = await within(canvasElement).findByTestId(
			'resource-attributes-filter',
			undefined,
			untilLoaded,
		);

		await userEvent.click(within(filter).getByRole('combobox'));
		await screen.findByText(
			/No resource attributes available to filter/i,
			undefined,
			untilLoaded,
		);
	},
};

/**
 * The attribute filter open: of everything the endpoint returns, the map only
 * offers the three keys it can send to `/dependency_graph`.
 */
export const FilterAttributes: Story = {
	play: async ({ canvasElement }): Promise<void> => {
		const canvas = within(canvasElement);
		const filter = await canvas.findByTestId(
			'resource-attributes-filter',
			undefined,
			untilLoaded,
		);

		// The select opens on a press inside it: a click on the wrapper the test id
		// sits on never reaches the handler that opens the list.
		await userEvent.click(within(filter).getByRole('combobox'));
		await screen.findByText('k8s.cluster.name', undefined, untilLoaded);
	},
};
