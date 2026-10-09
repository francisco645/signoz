import ROUTES from 'constants/routes';

import type { PinnedDashboard } from '../../hooks/usePinnedDashboards';
import { HOME_TEXT } from '../../text';

import styles from './PinnedDashboards.module.scss';

interface PinnedDashboardsProps {
	pinned: PinnedDashboard[];
	more: number;
	onNavigate: (path: string) => void;
}

function PinnedDashboards({
	pinned,
	more,
	onNavigate,
}: PinnedDashboardsProps): JSX.Element | null {
	if (pinned.length === 0) {
		return null;
	}
	return (
		<nav
			className={styles.pinned}
			aria-label={HOME_TEXT.pinned}
			data-testid="home-pinned"
		>
			<span className={styles.label}>{HOME_TEXT.pinned}</span>
			{pinned.map((dashboard) => (
				<button
					key={dashboard.id}
					type="button"
					className={styles.link}
					onClick={(): void =>
						onNavigate(ROUTES.DASHBOARD.replace(':dashboardId', dashboard.id))
					}
					data-testid="home-pinned-link"
				>
					{dashboard.name}
				</button>
			))}
			{more > 0 && <span className={styles.more}>{HOME_TEXT.more(more)}</span>}
		</nav>
	);
}

export default PinnedDashboards;
