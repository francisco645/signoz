import { IResourceAttribute } from 'hooks/useResourceAttribute/types';

import { getServiceMapScope } from '../scope';

const query = (
	tagKey: string,
	tagValue: string[],
	operator = 'IN',
): IResourceAttribute => ({ id: tagKey, tagKey, operator, tagValue });

describe('getServiceMapScope', () => {
	it('has no scope without filters', () => {
		expect(getServiceMapScope([])).toStrictEqual({
			environments: [],
			hasScope: false,
			isMixedEnvironments: false,
			ignoredFilters: [],
			labels: [],
		});
	});

	it('is scoped by one environment from the environment selector', () => {
		const scope = getServiceMapScope([
			query('resource_deployment.environment', ['prod']),
		]);

		expect(scope).toMatchObject({
			environments: ['prod'],
			hasScope: true,
			isMixedEnvironments: false,
		});
	});

	it('is scoped by a cluster alone', () => {
		expect(
			getServiceMapScope([query('resource_k8s_cluster_name', ['prod-1'])])
				.hasScope,
		).toBe(true);
	});

	it('is not scoped by a namespace alone', () => {
		expect(
			getServiceMapScope([query('resource_k8s_namespace_name', ['core'])])
				.hasScope,
		).toBe(false);
	});

	it('flags more than one environment as mixed', () => {
		const scope = getServiceMapScope([
			query('resource_deployment.environment', ['prod', 'staging']),
		]);

		expect(scope).toMatchObject({ hasScope: true, isMixedEnvironments: true });
	});

	it('flags an environment exclusion without an inclusion as mixed', () => {
		const scope = getServiceMapScope([
			query('resource_deployment_environment', ['dev'], 'Not IN'),
			query('resource_k8s_cluster_name', ['prod-1']),
		]);

		expect(scope).toMatchObject({ hasScope: true, isMixedEnvironments: true });
	});

	it('lists the filters the service map cannot apply', () => {
		const scope = getServiceMapScope([
			query('resource_deployment.environment', ['prod']),
			query('resource_service_name', ['cart', 'checkout']),
		]);

		expect(scope.ignoredFilters).toStrictEqual([
			'service.name IN cart, checkout',
		]);
	});
});
