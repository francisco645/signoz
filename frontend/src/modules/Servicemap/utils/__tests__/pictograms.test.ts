import { readFileSync } from 'fs';
import { join } from 'path';

import { PICTOGRAM_PATHS } from '../pictograms';

/** Jest mocks @signozhq/icons, so the shipped sources are read from disk. */
const iconSource = (name: string): string =>
	readFileSync(
		join(
			process.cwd(),
			'node_modules/@signozhq/icons/dist/lib/icons',
			`${name}.js`,
		),
		'utf8',
	);

describe('PICTOGRAM_PATHS', () => {
	it.each([
		['service', 'Box'],
		['database', 'Database'],
		['queue', 'Layers'],
		['external', 'Globe'],
	] as const)('draws %s with the %s icon the legend shows', (kind, icon) => {
		expect(iconSource(icon)).toContain(`d: "${PICTOGRAM_PATHS[kind]}"`);
	});
});
