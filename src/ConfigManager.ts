import * as fs from 'fs';
import yaml from 'js-yaml';
import YamlValidator from 'yaml-validator';



/*
 * Please sync structure in IConfig and validator
 * Hope you won't miss it :)
 */


interface IConfig {
	mongodb: {
		hostname: string;
		port: number;
		database: string;
		authorizationEnabled: boolean;
		username: string;
		password: string;
	};
	token: {
		discord: string,
		wolfram: string,
		youtube: string,
	};
	defaultPrefix: string;
	defaultDMPrefix: string;
	defaultVolume: number;
	colors: {
		red: number;
		green: number;
		blue: number;
		yellow: number;
	};
}

const validator = new YamlValidator({
	log: false,
	structure: {
		mongodb: {
			hostname: 'string',
			port: 'number',
			authorizationEnabled: 'boolean',
			username: 'string',
			password: 'string',
		},
		token: {
			discord: 'string',
			wolfram: 'string',
			youtube: 'string',
		},
		defaultPrefix: 'string',
		defaultDMPrefix: 'string',
		defaultVolume: 'number',
		colors: {
			red: 'number',
			green: 'number',
			blue: 'number',
			yellow: 'number',
		}

	},
	onWarning: undefined,
	writeJson: false
});
validator.validate(['./settings/config.yml']);
if (validator.report()) {
	console.error('ERROR: Bad Configuration Format');
	process.exit();
}

export default <IConfig>(yaml.safeLoad(fs.readFileSync('./settings/config.yml', 'utf8')));
