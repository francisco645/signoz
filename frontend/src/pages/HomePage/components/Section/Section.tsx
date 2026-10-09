import { ReactNode } from 'react';

import styles from './Section.module.scss';

interface SectionProps {
	title: string;
	count?: number;
	link?: { label: string; onClick: () => void };
	testId: string;
	children: ReactNode;
}

function Section({
	title,
	count,
	link,
	testId,
	children,
}: SectionProps): JSX.Element {
	return (
		<section className={styles.section} data-testid={testId} aria-label={title}>
			<div className={styles.header}>
				<span className={styles.title}>{title}</span>
				{count !== undefined && <span className={styles.count}>{count}</span>}
				{link && (
					<button type="button" className={styles.link} onClick={link.onClick}>
						{link.label}
					</button>
				)}
			</div>
			{children}
		</section>
	);
}

export default Section;
