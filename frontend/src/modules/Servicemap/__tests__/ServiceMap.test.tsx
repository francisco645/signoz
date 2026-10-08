import ROUTES from 'constants/routes';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import { encode } from 'js-base64';
import history from 'lib/history';
import { rest, server } from 'mocks-server/server';
import { render, screen, userEvent } from 'tests/test-utils';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

import ServiceMap from '../ServiceMap';

jest.mock('react-force-graph-2d', () => ({
	__esModule: true,
	default: ({
		graphData,
		onNodeClick,
	}: {
		graphData: { nodes: { id: string }[] };
		onNodeClick?: (node: { id: string }) => void;
	}): JSX.Element => (
		<div data-testid="force-graph">
			{graphData.nodes.map((node) => (
				<button
					key={node.id}
					type="button"
					data-testid={`node-${node.id}`}
					onClick={(): void => onNodeClick?.(node)}
				>
					{node.id}
				</button>
			))}
		</div>
	),
}));

const DEPENDENCY_GRAPH_URL = '*/api/v1/dependency_graph';

const dependencies: ServiceMapDependency[] = [
	{
		parent: 'frontend',
		child: 'cart',
		callCount: 100,
		callRate: 1,
		errorRate: 0,
		p99: 1_000_000,
	},
];

const environmentFilter = (environments: string[]): IResourceAttribute => ({
	id: 'env',
	tagKey: 'resource_deployment.environment',
	operator: 'IN',
	tagValue: environments,
});

const openWithFilters = (filters: IResourceAttribute[]): void => {
	const search = new URLSearchParams({
		resourceAttribute: encode(JSON.stringify(filters)),
	});
	history.push(`${ROUTES.SERVICE_MAP}?${search.toString()}`);
	render(<ServiceMap />, undefined, {
		initialRoute: `${ROUTES.SERVICE_MAP}?${search.toString()}`,
	});
};

describe('ServiceMap', () => {
	afterEach(() => {
		history.push(ROUTES.SERVICE_MAP);
	});

	it('asks for an environment or a cluster before querying', async () => {
		const requested = jest.fn();
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) => {
				requested();
				return res(ctx.status(200), ctx.json(dependencies));
			}),
		);

		openWithFilters([]);

		await expect(
			screen.findByTestId('service-map-scope-required'),
		).resolves.toBeInTheDocument();
		expect(requested).not.toHaveBeenCalled();
	});

	it('warns when the map sums several environments', async () => {
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) =>
				res(ctx.status(200), ctx.json(dependencies)),
			),
		);

		openWithFilters([environmentFilter(['prod', 'staging'])]);

		await expect(
			screen.findByTestId('service-map-notice-mixed-environments'),
		).resolves.toHaveTextContent('prod + staging');
	});

	it('lists the filters the map ignores', async () => {
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) =>
				res(ctx.status(200), ctx.json(dependencies)),
			),
		);

		openWithFilters([
			environmentFilter(['prod']),
			{
				id: 'svc',
				tagKey: 'resource_service_name',
				operator: 'IN',
				tagValue: ['cart'],
			},
		]);

		await expect(
			screen.findByTestId('service-map-notice-ignored-filters'),
		).resolves.toHaveTextContent('service.name IN cart');
	});
	it('draws the graph once the dependencies load', async () => {
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) =>
				res(ctx.status(200), ctx.json(dependencies)),
			),
		);

		openWithFilters([environmentFilter(['prod'])]);

		expect(screen.getByTestId('service-map-loading')).toBeInTheDocument();
		await expect(screen.findByTestId('force-graph')).resolves.toHaveTextContent(
			'cartfrontend',
		);
	});

	it('inspects a service in the side panel', async () => {
		const user = userEvent.setup({ pointerEventsCheck: 0 });
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) =>
				res(ctx.status(200), ctx.json(dependencies)),
			),
			rest.post('*/api/v2/services', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						status: 'success',
						data: [
							{
								serviceName: 'cart',
								numCalls: 1000,
								numErrors: 70,
								errorRate: 7,
								callRate: 1,
								p99: 2_400_000_000,
								avgDuration: 1,
							},
						],
					}),
				),
			),
		);

		openWithFilters([environmentFilter(['prod'])]);
		await user.click(await screen.findByTestId('node-cart'));

		const panel = await screen.findByTestId('service-map-panel');
		expect(panel).toHaveTextContent('cart');
		await expect(
			screen.findByTestId('service-map-panel-health'),
		).resolves.toHaveTextContent('Critical · 7.0% errors');
		expect(
			screen.getByTestId('service-map-neighbour-callers-frontend'),
		).toBeInTheDocument();
		expect(screen.getByTestId('service-map-panel-link-traces')).toBeEnabled();

		await user.click(
			screen.getByTestId('service-map-neighbour-callers-frontend'),
		);
		await expect(
			screen.findByTestId('service-map-panel-health'),
		).resolves.toHaveTextContent('No server-side data');
		expect(screen.getByTestId('service-map-panel-link-service')).toBeDisabled();
	});

	it('searches a service, focuses its dependencies and lists them', async () => {
		const user = userEvent.setup({ pointerEventsCheck: 0 });
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json([
						...dependencies,
						{ ...dependencies[0], parent: 'gateway', child: 'frontend' },
						{ ...dependencies[0], parent: 'cart', child: 'redis' },
					]),
				),
			),
		);

		openWithFilters([environmentFilter(['prod'])]);
		await screen.findByTestId('force-graph');

		await user.type(screen.getByTestId('service-map-search'), 'car');
		await user.click(await screen.findByTestId('service-map-search-option-cart'));
		await expect(
			screen.findByTestId('service-map-panel'),
		).resolves.toHaveTextContent('cart');

		await user.click(screen.getByTestId('service-map-panel-focus'));
		await expect(
			screen.findByTestId('service-map-focus-banner'),
		).resolves.toHaveTextContent('Focused on cart · 3 connected services');

		await user.click(screen.getByTestId('service-map-focus-up'));
		await expect(
			screen.findByTestId('service-map-focus-banner'),
		).resolves.toHaveTextContent('2 connected services');

		await user.click(screen.getByTestId('service-map-focus-list-toggle'));
		expect(screen.getByTestId('service-map-focus-list')).toHaveTextContent(
			'Services that depend on cart (2): 1 hop: frontend 2 hops: gateway',
		);

		await user.click(screen.getByTestId('service-map-focus-exit'));
		expect(
			screen.queryByTestId('service-map-focus-banner'),
		).not.toBeInTheDocument();
	});

	it('shows the empty state when no service calls another', async () => {
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) =>
				res(ctx.status(200), ctx.json([])),
			),
		);

		openWithFilters([environmentFilter(['prod'])]);

		await expect(
			screen.findByTestId('service-map-empty'),
		).resolves.toBeInTheDocument();
	});

	it('stops loading and offers a retry when the request fails', async () => {
		const user = userEvent.setup({ pointerEventsCheck: 0 });
		let calls = 0;
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) => {
				calls += 1;
				return calls === 1
					? res(ctx.status(500), ctx.json({}))
					: res(ctx.status(200), ctx.json(dependencies));
			}),
		);

		openWithFilters([environmentFilter(['prod'])]);

		await expect(
			screen.findByTestId('service-map-error'),
		).resolves.toBeInTheDocument();
		expect(screen.queryByTestId('service-map-loading')).not.toBeInTheDocument();

		await user.click(screen.getByTestId('service-map-retry'));

		await expect(screen.findByTestId('force-graph')).resolves.toBeInTheDocument();
		expect(calls).toBe(2);
	});
});
