import {
	BufferGeometry,
	Group,
	InstancedMesh,
	Material,
	Mesh,
	Object3D,
	Sprite,
	Texture,
} from 'three';

import type { PanoramaTier } from '../../utils/tiers';
import { createLinkBatch, LinkBatch } from './linkBatch';
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
	/** Current plane height; it eases to the tier's when the plane changes. */
	height: number;
}

export interface World {
	root: Group;
	nodes: Map<string, WorldNode>;
	links: LinkBatch;
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
	/** Heights from the world this one replaces, so a moved node slides. */
	previousHeights: ReadonlyMap<string, number> = new Map(),
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
		nodes.set(node.id, {
			...object,
			x: node.x,
			y: node.y,
			tier: node.tier,
			height: previousHeights.get(node.id) ?? TIER_HEIGHT[node.tier],
		});
		hitTargets.push(...object.hitTargets);
		root.add(object.group);
	});
	const links = createLinkBatch(model.links, theme, geometries);
	hitTargets.push(links.tubes);
	root.add(links.tubes, links.heads, links.particles);

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

/** Plane heights a moved node covers per second, as a share of the gap left. */
const SLIDE_RATE = 6;

/** `flat` runs from 0 (planes apart) to 1 (every node on one plane). */
export const placeWorld = (
	world: World,
	flat: number,
	elapsedS: number,
	isInstant: boolean,
): void => {
	world.nodes.forEach((node) => {
		const target = TIER_HEIGHT[node.tier];
		// eslint-disable-next-line no-param-reassign
		node.height = isInstant
			? target
			: node.height + (target - node.height) * Math.min(1, elapsedS * SLIDE_RATE);
		node.group.position.set(node.x, node.height * (1 - flat), node.y);
	});
	placeTierPlanes(world.planes, flat);
	world.links.place((link) => {
		const from = world.nodes.get(link.source);
		const to = world.nodes.get(link.target);
		return from && to
			? {
					from: from.group.position,
					to: to.group.position,
					fromRadius: from.radius,
					toRadius: to.radius,
				}
			: undefined;
	}, elapsedS);
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
		if (object instanceof InstancedMesh) {
			object.dispose();
		}
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
