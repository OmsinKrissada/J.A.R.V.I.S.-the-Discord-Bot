import * as fs from 'fs';
import yaml from 'js-yaml';
import YamlValidator from 'yaml-validator';


interface IMongoDBConfig {
	hostname: string;
	port: number;
	database: string;
	authorizationEnabled: boolean;
	username: string;
	password: string;
};
interface IColor {
	red: number;
	green: number;
	blue: number;
	yellow: number;
}
interface IConfig {
	mongodb: IMongoDBConfig;
	defaultPrefix: string;
	defaultDMPrefix: string;
	defaultVolume: number;
	colors: IColor;
}

const validator = new YamlValidator({
	log: false,
	structure: {
		mongodb: {
			hostname: 'string',
			port: 'number',
			authorizationEnabled: 'boolean',
			username: 'string',
			password: 'string'
		},
		defaultPrefix: 'string',
		defaultDMPrefix: 'string',
		defaultVolume: 'number',
		colors: {
			red: 'number',
			green: 'number',
			blue: 'number',
			yellow: 'number'
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

export const CONFIG: IConfig = <IConfig>(yaml.safeLoad(fs.readFileSync('./settings/config.yml', 'utf8')));
