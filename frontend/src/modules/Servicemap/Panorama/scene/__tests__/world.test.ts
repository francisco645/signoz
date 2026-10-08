import { BufferGeometry, Material, Texture } from 'three';

import { PANORAMA_TIER_TEXT } from '../../panoramaText';
import type { PanoramaModel } from '../panoramaModel';
import { getPanoramaTheme } from '../panoramaTheme';
import { buildWorld, disposeWorld } from '../world';

const model: PanoramaModel = {
	nodes: [
		{
			id: 'gateway',
			kind: 'service',
			tier: 'entry',
			band: 'healthy',
			callRate: 10,
			x: 0,
			y: 0,
		},
		{
			id: 'mysql',
			kind: 'database',
			tier: 'data',
			band: 'critical',
			callRate: 5,
			x: 40,
			y: 10,
		},
		{
			id: 'kafka',
			kind: 'queue',
			tier: 'data',
			band: 'degraded',
			callRate: 2,
			x: -40,
			y: 10,
		},
	],
	links: [
		{ source: 'gateway', target: 'mysql', callRate: 5, colorBand: 'critical' },
		{ source: 'gateway', target: 'kafka', callRate: 2, colorBand: 'degraded' },
	],
};

describe('disposeWorld', () => {
	it('frees every geometry, material and label texture the world created', () => {
		const geometries = new Set<BufferGeometry>();
		const materials = new Set<Material>();
		const textures = new Set<Texture>();
		const world = buildWorld(model, getPanoramaTheme(true), PANORAMA_TIER_TEXT);
		world.root.traverse((object) => {
			const drawable = object as {
				geometry?: BufferGeometry;
				material?: Material;
			};
			if (drawable.geometry && object.type !== 'Sprite') {
				geometries.add(drawable.geometry);
			}
			if (drawable.material) {
				materials.add(drawable.material);
				const map = (drawable.material as { map?: Texture }).map;
				if (map) {
					textures.add(map);
				}
			}
		});
		const disposed = new Set<unknown>();
		const track = (item: { dispose: () => void }): void => {
			jest.spyOn(item, 'dispose').mockImplementation(() => {
				disposed.add(item);
			});
		};
		[...geometries, ...materials, ...textures].forEach(track);

		disposeWorld(world);

		expect(textures.size).toBe(model.nodes.length + 6);
		[...geometries, ...materials, ...textures].forEach((item) => {
			expect(disposed.has(item)).toBe(true);
		});
		expect(world.root.children).toHaveLength(0);
	});
});
