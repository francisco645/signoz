import {
	DoubleSide,
	EdgesGeometry,
	GridHelper,
	Group,
	LineBasicMaterial,
	LineSegments,
	Material,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
} from 'three';

import { PANORAMA_TIERS, PanoramaTier } from '../../utils/tiers';
import type { PanoramaTheme } from './panoramaTheme';
import { TIER_HEIGHT } from './panoramaTheme';
import { createTextSprite } from './textSprite';

export interface PlaneBounds {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

export interface TierPlane {
	tier: PanoramaTier;
	group: Group;
	/** Fill, border, grid, then the two labels. */
	materials: Material[];
	baseOpacity: number[];
}

export interface TierText {
	name: string;
	description: string;
}

const PLANE_OFFSET = -6;

const createPlane = (
	tier: PanoramaTier,
	bounds: PlaneBounds,
	theme: PanoramaTheme,
	text: TierText,
): TierPlane => {
	const width = bounds.maxX - bounds.minX;
	const depth = bounds.maxY - bounds.minY;
	const cx = (bounds.minX + bounds.maxX) / 2;
	const cz = (bounds.minY + bounds.maxY) / 2;
	const color = theme.tiers[tier];
	const group = new Group();
	group.position.y = TIER_HEIGHT[tier];

	const fill = new Mesh(
		new PlaneGeometry(width, depth),
		new MeshBasicMaterial({
			color,
			transparent: true,
			opacity: 0.075,
			side: DoubleSide,
			depthWrite: false,
		}),
	);
	const border = new LineSegments(
		new EdgesGeometry(new PlaneGeometry(width, depth)),
		new LineBasicMaterial({ color, transparent: true, opacity: 0.55 }),
	);
	[fill, border].forEach((object) => {
		object.rotation.x = -Math.PI / 2;
		object.position.set(cx, PLANE_OFFSET, cz);
		group.add(object);
	});

	const side = Math.max(width, depth);
	const grid = new GridHelper(side, 12, color, color);
	const gridMaterial = grid.material as Material;
	gridMaterial.transparent = true;
	gridMaterial.opacity = 0.05;
	grid.scale.set(width / side, 1, depth / side);
	grid.position.set(cx, PLANE_OFFSET, cz);
	group.add(grid);

	const name = createTextSprite(text.name, {
		size: 24,
		weight: 600,
		color: theme.tierLabels[tier],
		halo: theme.labelHalo,
		scale: 0.3,
	});
	name.renderOrder = 10;
	name.position.set(bounds.minX + 4, 2, bounds.maxY - 2);
	name.center.set(0, 0.5);
	const description = createTextSprite(text.description, {
		size: 18,
		weight: 400,
		color: theme.secondaryForeground,
		halo: theme.labelHalo,
		scale: 0.26,
	});
	description.renderOrder = 10;
	description.position.set(bounds.minX + 4, -8, bounds.maxY - 2);
	description.center.set(0, 0.5);
	group.add(name, description);

	const materials = [
		fill.material,
		border.material,
		gridMaterial,
		name.material,
		description.material,
	];
	return {
		tier,
		group,
		materials,
		baseOpacity: materials.map((material) => material.opacity),
	};
};

/** One translucent plane per tier, labelled, sized to the layout. */
export const createTierPlanes = (
	bounds: PlaneBounds,
	theme: PanoramaTheme,
	text: Record<PanoramaTier, TierText>,
): TierPlane[] =>
	PANORAMA_TIERS.map((tier) => createPlane(tier, bounds, theme, text[tier]));

/** Flattening sinks the planes to one and fades all but the middle one's outline. */
export const placeTierPlanes = (planes: TierPlane[], flat: number): void => {
	planes.forEach((plane, index) => {
		plane.group.position.y =
			TIER_HEIGHT[plane.tier] * (1 - flat) - flat * (index - 1) * 0.4;
		plane.materials.forEach((material, slot) => {
			const keep =
				plane.tier === 'internal' && slot < 3 ? 1 - flat * 0.6 : 1 - flat;
			// eslint-disable-next-line no-param-reassign
			material.opacity = plane.baseOpacity[slot] * keep;
		});
	});
};
