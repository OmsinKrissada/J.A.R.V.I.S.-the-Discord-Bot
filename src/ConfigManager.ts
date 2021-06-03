import * as fs from 'fs';
import yaml from 'js-yaml';
import YamlValidator from 'yaml-validator';



/*
 * Please sync structure in IConfig and validator
 * Hope you won't miss it :)
 */


interface ConfigOption {
	mysql: {
		hostname: string;
		port: number;
		database: string;
		authorizationEnabled: boolean;
		username: string;
		password: string;
	};
	lavalink: {
		hostname: string;
		password: string;
		port: number;
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
		aqua: number;
	};
	loggingChannel: string;
	maxCPUPercent: number;
}

const validator = new YamlValidator({
	log: false,
	structure: {
		mydql: {
			hostname: 'string',
			port: 'number',
			authorizationEnabled: 'boolean',
			username: 'string',
			password: 'string',
		},
		lavalink: {
			hostname: 'string',
			password: 'string',
			port: 'number',
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
		},
		loggingChannel: 'string',
		maxCPUPercent: 'number',
	},
	onWarning: undefined,
	writeJson: false
});
validator.validate(['./config.yml']);
if (validator.report()) {
	console.error('ERROR: Bad Configuration Format');
	process.exit();
}

export default <ConfigOption>(yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8')));
