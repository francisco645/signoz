import { House, RotateCw } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
import { SelectSimple } from '@signozhq/ui/select';

import { HOME_WINDOWS, HomeWindowKey } from '../../constants';
import { HOME_TEXT } from '../../text';

import styles from './HomeToolbar.module.scss';

interface HomeToolbarProps {
	environment?: string;
	environments: string[];
	windowKey: HomeWindowKey;
	updatedAtMs: number;
	refreshMs: number;
	onEnvironmentChange: (environment: string) => void;
	onWindowChange: (key: HomeWindowKey) => void;
	onRefresh: () => void;
}

const clock = (ms: number): string =>
	new Date(ms).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});

function HomeToolbar({
	environment,
	environments,
	windowKey,
	updatedAtMs,
	refreshMs,
	onEnvironmentChange,
	onWindowChange,
	onRefresh,
}: HomeToolbarProps): JSX.Element {
	const options = Array.from(
		new Set([environment, ...environments].filter(Boolean)),
	);
	return (
		<header className={styles.toolbar}>
			<h1 className={styles.title}>
				<House size={15} />
				{HOME_TEXT.title}
			</h1>
			<span className={styles.label}>env</span>
			<SelectSimple
				className={styles.select}
				testId="home-env-select"
				placeholder={HOME_TEXT.allEnvironments}
				items={options.map((value) => ({
					label: value as string,
					value: value as string,
				}))}
				value={environment}
				onChange={(value): void => onEnvironmentChange(value as string)}
			/>
			<SelectSimple
				className={styles.select}
				testId="home-window-select"
				items={HOME_WINDOWS.map(({ key, label }) => ({ label, value: key }))}
				value={windowKey}
				onChange={(value): void => onWindowChange(value as HomeWindowKey)}
			/>
			<span className={styles.versus}>{HOME_TEXT.versus}</span>
			<span className={styles.stamp} data-testid="home-refresh-stamp">
				{clock(updatedAtMs)} · {HOME_TEXT.every(refreshMs / 1000)}
			</span>
			<Button
				variant="ghost"
				color="secondary"
				size="icon"
				prefix={<RotateCw size={13} />}
				aria-label={HOME_TEXT.refresh}
				onClick={onRefresh}
				testId="home-refresh"
			/>
		</header>
	);
}

export default HomeToolbar;
