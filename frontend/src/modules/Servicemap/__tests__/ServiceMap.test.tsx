import { rest, server } from 'mocks-server/server';
import { render, screen, userEvent } from 'tests/test-utils';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

import ServiceMap from '../ServiceMap';

jest.mock('react-force-graph-2d', () => ({
	__esModule: true,
	default: ({
		graphData,
	}: {
		graphData: { nodes: { id: string }[] };
	}): JSX.Element => (
		<div data-testid="force-graph">
			{graphData.nodes.map((node) => node.id).join(',')}
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

describe('ServiceMap', () => {
	it('draws the graph once the dependencies load', async () => {
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) =>
				res(ctx.status(200), ctx.json(dependencies)),
			),
		);

		render(<ServiceMap />);

		expect(screen.getByTestId('service-map-loading')).toBeInTheDocument();
		await expect(screen.findByTestId('force-graph')).resolves.toHaveTextContent(
			'cart,frontend',
		);
	});

	it('shows the empty state when no service calls another', async () => {
		server.use(
			rest.post(DEPENDENCY_GRAPH_URL, (_req, res, ctx) =>
				res(ctx.status(200), ctx.json([])),
			),
		);

		render(<ServiceMap />);

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

		render(<ServiceMap />);

		await expect(
			screen.findByTestId('service-map-error'),
		).resolves.toBeInTheDocument();
		expect(screen.queryByTestId('service-map-loading')).not.toBeInTheDocument();

		await user.click(screen.getByTestId('service-map-retry'));

		await expect(screen.findByTestId('force-graph')).resolves.toBeInTheDocument();
		expect(calls).toBe(2);
	});
});
