import fs from 'fs';
import yaml from 'js-yaml';
// import { logger } from './Logger';



/*
 * Please sync structure in IConfig and validator
 * Hope you won't miss it :)
 */


interface ConfigOption {
	lavalink: {
		hostname: string;
		password: string;
		port: number;
	};
	token: {
		discord: string,
		wolfram: string,
		youtube: string,
		spotify_id: string,
		spotify_secret: string,
		openai: string,
	};
	logLevel: {
		console: string,
		file: string,
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
	disableMusic: boolean;
}

let loaded;
try {
	loaded = yaml.load(fs.readFileSync('./config.yml', 'utf8'));
} catch (err) {
	throw (`Unable to load config file, this is probably caused by format error.\n${err}`);
}
export default <ConfigOption>(loaded);
