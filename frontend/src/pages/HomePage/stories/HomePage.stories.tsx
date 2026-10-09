import type { Meta, StoryObj } from '@storybook/react-vite';
import ROUTES from 'constants/routes';
import { screen, userEvent, within } from 'storybook/test';

import { storyMocks } from '@/storybook/controls/defineStoryMocks';
import type { PageStoryArgs } from '@/storybook/runtime/resolveStory';
import { homeMocks } from './HomePage.stories.mocks';

import HomePage from '../HomePage';

type HomeArgs = PageStoryArgs<typeof homeMocks>;

const pageStory = storyMocks(homeMocks, { route: ROUTES.HOME, layout: 'app' });

/**
 * The workspace landing page. With data it answers "is everything fine, and if
 * not, how far does it reach?": a verdict, firing alerts, services against a
 * week ago, the service map and telemetry. Without data, the welcome checklist.
 *
 * Route: `/home`.
 */
const meta = {
	title: 'Pages/Home',
	tags: ['role-gated', 'play'],
	component: HomePage,
	...pageStory,
	parameters: { ...pageStory.parameters },
} satisfies Meta<HomeArgs>;

export default meta;

type Story = StoryObj<HomeArgs>;

/**
 * Every widget carrying data: all three signals ingesting, alert rules across
 * severities, recent dashboards, saved views on each explorer tab and a
 * services table with failing services.
 */
export const Default: Story = {};

/** Health overview, nothing wrong: three counts at zero, the whole map. */
export const Normal: Story = {
	args: { scenario: 'normal' },
};

/** A warning firing and one service above its usual errors: amber, not red. */
export const Degraded: Story = {
	args: { scenario: 'degraded' },
};

/**
 * Two critical alerts, three services outside their usual range and logs at
 * half of last week: the map focuses on the affected services and neighbours.
 */
export const Incident: Story = {
	args: { scenario: 'incident' },
};

/** No traces for 14 minutes: health can't be confirmed; the map is the last known one, dashed. */
export const Blind: Story = {
	args: { scenario: 'blind' },
};

/** Alerts could not be read: the overview says so instead of "No issues". */
export const AlertsUnavailable: Story = {
	args: { scenario: 'normal', failingSources: ['alerts'] },
};

/** Critical alerts in staging leave production green. */
export const OtherEnvironmentAlert: Story = {
	args: { scenario: 'incident', alertEnvironment: 'staging' },
};

/** Fresh workspace: nothing ingested yet, so the welcome checklist takes over. */
export const NoIngestion: Story = {
	args: {
		logsIngestion: false,
		tracesIngestion: false,
		metricsIngestion: false,
		alertRules: 0,
		dashboards: 0,
		savedViews: 0,
		services: 0,
	},
};

/**
 * Telemetry reads only: no permission to manage anything, so the create actions
 * and the legacy editor role are both gone.
 */
export const ViewerAccess: Story = {
	args: { access: 'viewer' },
};

/** Widgets stuck in their loading state, shell included. */
export const Loading: Story = {
	args: { dataState: 'loading' },
};

/**
 * The sidebar's Help & Support menu, open. The nav is part of the app shell, so
 * this menu is the same on every page; Home is where it is shot.
 */
export const NavHelpMenu: Story = {
	play: async ({ canvasElement }): Promise<void> => {
		await userEvent.click(
			await within(canvasElement).findByTestId(
				'help-support-nav-item',
				{},
				{ timeout: 10000 },
			),
		);
		await screen.findByRole('menu');
	},
};

/**
 * The sidebar's Settings menu, open: the workspace and account sections the nav
 * reaches without leaving the page.
 */
export const NavSettingsMenu: Story = {
	play: async ({ canvasElement }): Promise<void> => {
		await userEvent.click(
			await within(canvasElement).findByTestId(
				'settings-nav-item',
				{},
				{ timeout: 10000 },
			),
		);
		await screen.findByRole('menu');
	},
};

/**
 * The firing alert count in the bottom strip, in place of the build version. It
 * counts firing instances, so it does not match the alert rules widget above.
 */
export const BottomStrip: Story = {
	args: { bottomStrip: true },
};
