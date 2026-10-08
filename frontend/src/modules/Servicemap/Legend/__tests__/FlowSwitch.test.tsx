import { render, screen, userEvent } from 'tests/test-utils';

import { SERVICE_MAP_TEXT } from '../../constants';
import FlowSwitch from '../FlowSwitch';

describe('FlowSwitch', () => {
	it('names the switch and describes it with the visible help', async () => {
		const onChange = jest.fn();
		render(
			<FlowSwitch
				isPreferred
				isBlockedByReducedMotion={false}
				onChange={onChange}
			/>,
		);

		const toggle = screen.getByRole('switch', {
			name: SERVICE_MAP_TEXT.flowSwitch,
		});
		expect(toggle).toBeChecked();
		expect(toggle).toHaveAccessibleDescription(SERVICE_MAP_TEXT.flowHelp);

		await userEvent.click(toggle);
		expect(onChange).toHaveBeenCalledWith(false);
	});

	it('turns off and explains itself when the system asks for less motion', () => {
		render(
			<FlowSwitch isPreferred isBlockedByReducedMotion onChange={jest.fn()} />,
		);

		const toggle = screen.getByRole('switch', {
			name: SERVICE_MAP_TEXT.flowSwitch,
		});
		expect(toggle).not.toBeChecked();
		expect(toggle).toBeDisabled();
		expect(toggle).toHaveAccessibleDescription(
			SERVICE_MAP_TEXT.flowReducedMotion,
		);
	});
});
