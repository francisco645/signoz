import styles from './HomeSkeleton.module.scss';

/** Shown while the Home decides between the overview and onboarding. */
function HomeSkeleton(): JSX.Element {
	return (
		<div className={styles.skeleton} data-testid="home-skeleton" aria-busy="true">
			<div className={styles.banner} />
			<div className={styles.columns}>
				<div className={styles.block} />
				<div className={styles.block} />
			</div>
		</div>
	);
}

export default HomeSkeleton;
