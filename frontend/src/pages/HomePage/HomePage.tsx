import Home from 'container/Home/Home';

import HomeSkeleton from './components/HomeSkeleton/HomeSkeleton';
import Overview from './components/Overview/Overview';
import { useHomeMode } from './hooks/useHomeMode';

/** The health overview once the install has data; onboarding until then. */
function HomePage(): JSX.Element {
	const mode = useHomeMode();
	if (mode === 'pending') {
		return <HomeSkeleton />;
	}
	return mode === 'overview' ? <Overview /> : <Home />;
}

export default HomePage;
