import { Layers } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';

import { SERVICE_MAP_TEXT } from '../constants';

import styles from './States.module.scss';

/** The environment selector lives in the shared filter bar above the map. */
const ENVIRONMENT_SELECT = '[data-testid="resource-environment-filter"] input';

const openEnvironmentSelect = (): void => {
	const input = document.querySelector<HTMLInputElement>(ENVIRONMENT_SELECT);
	input?.focus();
	input?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
};

function ScopeRequiredState(): JSX.Element {
	return (
		<div className={styles.state} data-testid="service-map-scope-required">
			<Layers size={32} />
			<div className={styles.title}>{SERVICE_MAP_TEXT.scopeRequiredTitle}</div>
			<div className={styles.body}>{SERVICE_MAP_TEXT.scopeRequiredBody}</div>
			<div className={styles.body}>{SERVICE_MAP_TEXT.scopeRequiredHow}</div>
			<div className={styles.actions}>
				<Button
					variant="solid"
					color="primary"
					size="sm"
					onClick={openEnvironmentSelect}
					testId="service-map-scope-pick-environment"
				>
					{SERVICE_MAP_TEXT.scopeRequiredAction}
				</Button>
			</div>
			<div className={styles.body}>{SERVICE_MAP_TEXT.scopeRequiredHint}</div>
		</div>
	);
}

export default ScopeRequiredState;
