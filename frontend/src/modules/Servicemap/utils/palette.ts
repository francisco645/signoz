import { Color } from '@signozhq/design-tokens';

import type { ServiceMapPalette } from '../types';

/**
 * The primitives behind the semantic tokens the rest of the page uses. The
 * canvas cannot read CSS variables, and reading them from the DOM races the
 * theme class `AppLayout` sets on `body` after children render.
 */
const DARK: ServiceMapPalette = {
	background: Color.BG_NEUTRALDARK_1000, // --l1-background
	surface: Color.BG_NEUTRALDARK_950, // --l2-background
	nodeFill: Color.BG_NEUTRALDARK_800, // --l3-background
	foreground: Color.BG_NEUTRALDARK_50, // --l1-foreground
	secondaryForeground: Color.BG_NEUTRALDARK_100, // --l2-foreground
	mutedForeground: Color.BG_NEUTRALDARK_200, // --l3-foreground
	selection: Color.BG_ROBIN_500, // --accent-primary
	degraded: Color.BG_AMBER_400, // --callout-warning-title
	degradedGlyph: Color.BG_AMBER_400,
	critical: Color.BG_CHERRY_400, // --callout-error-title
};

const LIGHT: ServiceMapPalette = {
	background: Color.BG_NEUTRALLIGHT_1000,
	surface: Color.BG_NEUTRALLIGHT_950,
	nodeFill: Color.BG_NEUTRALLIGHT_800,
	foreground: Color.BG_NEUTRALLIGHT_50,
	secondaryForeground: Color.BG_NEUTRALLIGHT_100,
	mutedForeground: Color.BG_NEUTRALLIGHT_200,
	selection: Color.BG_ROBIN_500,
	degraded: Color.BG_AMBER_700,
	// Amber 700 is too light on the tinted fill (2.4:1); 800 keeps the glyph above 3:1.
	degradedGlyph: Color.BG_AMBER_800,
	critical: Color.BG_CHERRY_600,
};

export const getServiceMapPalette = (isDarkMode: boolean): ServiceMapPalette =>
	isDarkMode ? DARK : LIGHT;
