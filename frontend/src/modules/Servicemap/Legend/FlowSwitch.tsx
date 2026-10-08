import { useId } from 'react';
import { Switch } from '@signozhq/ui/switch';

import { SERVICE_MAP_TEXT } from '../constants';

import styles from './ServiceMapLegend.module.scss';

interface FlowSwitchProps {
	isPreferred: boolean;
	isBlockedByReducedMotion: boolean;
	onChange: (value: boolean) => void;
}

/** The help text is visible and wired with aria-describedby; reduced motion turns the switch off and says why. */
function FlowSwitch({
	isPreferred,
	isBlockedByReducedMotion,
	onChange,
}: FlowSwitchProps): JSX.Element {
	const helpId = useId();
	// `Switch` types leave aria attributes out, but forward them to the button.
	const describedBy = { 'aria-describedby': helpId } as Record<string, string>;

	return (
		<div className={styles.flow}>
			<Switch
				{...describedBy}
				value={isPreferred && !isBlockedByReducedMotion}
				disabled={isBlockedByReducedMotion}
				onChange={onChange}
				testId="service-map-flow-switch"
			>
				{SERVICE_MAP_TEXT.flowSwitch}
			</Switch>
			<span id={helpId} className={styles.flowHelp}>
				{isBlockedByReducedMotion
					? SERVICE_MAP_TEXT.flowReducedMotion
					: SERVICE_MAP_TEXT.flowHelp}
			</span>
		</div>
	);
}

export default FlowSwitch;
