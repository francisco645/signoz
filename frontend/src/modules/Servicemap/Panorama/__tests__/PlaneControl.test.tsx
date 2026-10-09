import { render, screen, userEvent } from 'tests/test-utils';

import type { ResolvedPlane } from '../../utils/planes';
import PlaneControl from '../PlaneControl';

const inferredInternal: ResolvedPlane = {
	tier: 'internal',
	source: 'inferred',
	inferred: {
		tier: 'internal',
		reason: { kind: 'calledBy', caller: 'gateway', share: 0.62 },
	},
};

describe('PlaneControl', () => {
	it('explains an inferred plane and moves the service on a choice', async () => {
		const onChange = jest.fn();
		render(
			<PlaneControl id="cart" plane={inferredInternal} onChange={onChange} />,
		);

		expect(screen.getByTestId('service-map-plane-source')).toHaveTextContent(
			'Internal · gateway makes 62% of its calls',
		);
		await userEvent.click(screen.getByTestId('service-map-plane-entry'));
		expect(onChange).toHaveBeenCalledWith('entry');
		expect(
			screen.getByText('cart moved to the Entry plane.'),
		).toBeInTheDocument();
	});

	it('says an adjustment is only yours and Auto goes back', async () => {
		const onChange = jest.fn();
		render(
			<PlaneControl
				id="cart"
				plane={{ ...inferredInternal, tier: 'data', source: 'adjusted' }}
				onChange={onChange}
			/>,
		);
		expect(
			screen.getByText('Only you see this, in this browser.'),
		).toBeInTheDocument();
		await userEvent.click(screen.getByTestId('service-map-plane-auto'));
		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it('shows no choice for databases and queues', () => {
		render(
			<PlaneControl
				id="mysql"
				plane={{
					tier: 'data',
					source: 'inferred',
					inferred: { tier: 'data', reason: { kind: 'dataStore' } },
				}}
				onChange={jest.fn()}
			/>,
		);
		expect(
			screen.queryByTestId('service-map-plane-auto'),
		).not.toBeInTheDocument();
		expect(screen.getByTestId('service-map-plane-source')).toHaveTextContent(
			'databases and queues stay on the data plane',
		);
	});
});
