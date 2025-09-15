import squatter from 'squatter';
import {npmNameMany} from 'npm-name';
import thesaurus from 'thesaurus';
import slugify from '@sindresorhus/slugify';

const npmOrganizationRegex = /^@[a-z\d][\w-.]+\/?$/i;

async function createPackageInfo(name, isAvailable) {
	const packageInfo = {
		name,
		isAvailable,
		isOrganization: npmOrganizationRegex.test(name),
	};

	if (!isAvailable && !packageInfo.isOrganization) {
		try {
			packageInfo.isSquatter = await squatter(name);
		} catch {
			packageInfo.isSquatter = false;
		}
	}

	return packageInfo;
}

export async function checkNames(names) {
	return Promise.all(names.map(async name => {
		try {
			const result = await npmNameMany([name]);
			const [, isAvailable] = [...result][0];
			return createPackageInfo(name, isAvailable);
		} catch (error) {
			return {
				name,
				isAvailable: false,
				isOrganization: npmOrganizationRegex.test(name),
				error: error.message || 'Failed to check name availability',
			};
		}
	}));
}

export async function getSimilarPackages({name, isOrganization}) {
	const similarNames = thesaurus.find(name.replace(/@/, ''));
	if (!similarNames) {
		return [];
	}

	const slugNames = similarNames.map(similarName => `${isOrganization ? '@' : ''}${slugify(similarName.toLowerCase())}`);
	const similarPackages = await checkNames(slugNames);

	return similarPackages.filter(package_ => package_.isAvailable);
}
