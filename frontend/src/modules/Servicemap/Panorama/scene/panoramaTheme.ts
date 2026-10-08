import { Color } from '@signozhq/design-tokens';

import type { PanoramaTier } from '../../utils/tiers';

export interface PanoramaTheme {
	background: string;
	foreground: string;
	secondaryForeground: string;
	labelHalo: string;
	neutralNode: string;
	edge: string;
	selection: string;
	degraded: string;
	/** Text needs more contrast than a filled shape in the light theme. */
	degradedLabel: string;
	critical: string;
	tiers: Record<PanoramaTier, string>;
	/** Plane label colour; the internal plane is too dim to label in its own colour. */
	tierLabels: Record<PanoramaTier, string>;
}

// Non-token colours (neutral node, edge, internal and data planes) come from the approved prototype.
const DARK: PanoramaTheme = {
	background: Color.BG_NEUTRALDARK_1000,
	foreground: Color.BG_NEUTRALDARK_50,
	secondaryForeground: Color.BG_NEUTRALDARK_100,
	labelHalo: 'rgba(10, 12, 16, 0.85)',
	neutralNode: '#9aa3b5',
	edge: '#6b7386',
	selection: Color.BG_ROBIN_500,
	degraded: Color.BG_AMBER_400,
	degradedLabel: Color.BG_AMBER_400,
	critical: Color.BG_CHERRY_400,
	tiers: { entry: Color.BG_ROBIN_500, internal: '#8b93a7', data: '#a77df0' },
	tierLabels: {
		entry: Color.BG_ROBIN_500,
		internal: '#c3c9d6',
		data: '#a77df0',
	},
};

const LIGHT: PanoramaTheme = {
	background: Color.BG_NEUTRALLIGHT_1000,
	foreground: Color.BG_NEUTRALLIGHT_50,
	secondaryForeground: Color.BG_NEUTRALLIGHT_100,
	labelHalo: Color.BG_NEUTRALLIGHT_1000,
	neutralNode: Color.BG_NEUTRALLIGHT_200,
	edge: Color.BG_NEUTRALLIGHT_300,
	selection: Color.BG_ROBIN_500,
	degraded: Color.BG_AMBER_700,
	degradedLabel: Color.BG_AMBER_800,
	critical: Color.BG_CHERRY_600,
	tiers: {
		entry: Color.BG_ROBIN_500,
		internal: Color.BG_NEUTRALLIGHT_100,
		data: '#7c4dd6',
	},
	tierLabels: {
		entry: Color.BG_ROBIN_500,
		internal: Color.BG_NEUTRALLIGHT_50,
		data: '#7c4dd6',
	},
};

export const getPanoramaTheme = (isDarkMode: boolean): PanoramaTheme =>
	isDarkMode ? DARK : LIGHT;

/** Height of each plane, in scene units. */
export const TIER_HEIGHT: Record<PanoramaTier, number> = {
	entry: 70,
	internal: 0,
	data: -70,
};
