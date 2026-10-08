import {
	BufferGeometry,
	Group,
	Material,
	Mesh,
	Object3D,
	Sprite,
	Texture,
} from 'three';

import type { PanoramaTier } from '../../utils/tiers';
import { createLinkObject, LinkObject } from './linkMesh';
import { createNodeObject, NodeObject } from './nodeMesh';
import type { PanoramaModel } from './panoramaModel';
import { PanoramaTheme, TIER_HEIGHT } from './panoramaTheme';
import { createSharedGeometries } from './sharedGeometries';
import {
	createTierPlanes,
	placeTierPlanes,
	TierPlane,
	TierText,
} from './tierPlanes';

export interface WorldNode extends NodeObject {
	x: number;
	y: number;
	tier: PanoramaTier;
}

export interface World {
	root: Group;
	nodes: Map<string, WorldNode>;
	links: LinkObject[];
	planes: TierPlane[];
	/** Every mesh the pointer can hit, collected once. */
	hitTargets: Mesh[];
	extent: { width: number; depth: number; cx: number; cz: number };
}

const PLANE_MARGIN = { x: 34, y: 30 };

/** Planes sized to the layout, then the nodes and the links on them. */
export const buildWorld = (
	model: PanoramaModel,
	theme: PanoramaTheme,
	tierText: Record<PanoramaTier, TierText>,
): World => {
	const root = new Group();
	const geometries = createSharedGeometries();
	const xs = model.nodes.map((node) => node.x);
	const ys = model.nodes.map((node) => node.y);
	const bounds = {
		minX: Math.min(0, ...xs) - PLANE_MARGIN.x,
		maxX: Math.max(0, ...xs) + PLANE_MARGIN.x,
		minY: Math.min(0, ...ys) - PLANE_MARGIN.y,
		maxY: Math.max(0, ...ys) + PLANE_MARGIN.y,
	};
	const planes = createTierPlanes(bounds, theme, tierText);
	planes.forEach((plane) => root.add(plane.group));

	const nodes = new Map<string, WorldNode>();
	const hitTargets: Mesh[] = [];
	model.nodes.forEach((node) => {
		const object = createNodeObject(node, theme, geometries);
		nodes.set(node.id, { ...object, x: node.x, y: node.y, tier: node.tier });
		hitTargets.push(...object.hitTargets);
		root.add(object.group);
	});
	const links = model.links.map((link) =>
		createLinkObject(link, theme, geometries),
	);
	links.forEach((link) => {
		hitTargets.push(link.tube);
		root.add(link.tube, link.head, ...link.particles);
	});

	return {
		root,
		nodes,
		links,
		planes,
		hitTargets,
		extent: {
			width: bounds.maxX - bounds.minX,
			depth: bounds.maxY - bounds.minY,
			cx: (bounds.minX + bounds.maxX) / 2,
			cz: (bounds.minY + bounds.maxY) / 2,
		},
	};
};

/** `flat` runs from 0 (planes apart) to 1 (every node on one plane). */
export const placeWorld = (
	world: World,
	flat: number,
	elapsedS: number,
): void => {
	world.nodes.forEach((node) =>
		node.group.position.set(node.x, TIER_HEIGHT[node.tier] * (1 - flat), node.y),
	);
	placeTierPlanes(world.planes, flat);
	world.links.forEach((link) => {
		const from = world.nodes.get(link.link.source);
		const to = world.nodes.get(link.link.target);
		if (from && to) {
			link.place(
				from.group.position,
				to.group.position,
				from.radius,
				to.radius,
				elapsedS,
			);
		}
	});
};

type Drawable = Object3D & {
	geometry?: BufferGeometry;
	material?: Material | Material[];
};

/** Frees everything the world uploaded: geometries, materials (clones included) and label textures. */
export const disposeWorld = (world: World): void => {
	const geometries = new Set<BufferGeometry>();
	const materials = new Set<Material>();
	world.root.traverse((object: Drawable) => {
		// three.js shares one quad across every Sprite: it is not ours to free.
		if (object.geometry && !(object instanceof Sprite)) {
			geometries.add(object.geometry);
		}
		[object.material ?? []].flat().forEach((material) => materials.add(material));
	});
	const textures = new Set<Texture>();
	materials.forEach((material) => {
		Object.values(material).forEach((value) => {
			if (value instanceof Texture) {
				textures.add(value);
			}
		});
		material.dispose();
	});
	geometries.forEach((geometry) => geometry.dispose());
	textures.forEach((texture) => texture.dispose());
	world.root.clear();
};
