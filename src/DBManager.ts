import { Connection, createConnection, getConnection, Repository } from "typeorm";
import { GuildSettings } from "./models/GuildSettings";
import { Lastseen } from "./models/Lastseen";



import CONFIG from './ConfigManager';
import { logger } from './Logger';
import chalk from 'chalk';
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
CONFIG.colors.red = 1;




const hostname = CONFIG.mongodb.hostname;
const port = CONFIG.mongodb.port;
const dbname = CONFIG.mongodb.database;

const username = CONFIG.mongodb.username;
const password = CONFIG.mongodb.password;

let settings_repository: Repository<GuildSettings> = null;
let lastseen_repository: Repository<Lastseen> = null;


export async function connectDB() {
	let DBConnection: Connection;
	try {
		logger.info(chalk`{whiteBright MySQL:} Connecting to database ...`);
		DBConnection = await createConnection({
			"type": "mysql",
			"host": hostname,
			"port": port,
			"username": username,
			"password": password,
			"database": dbname,
			"synchronize": true,
			"logging": false,
			"entities": [GuildSettings, Lastseen],
		})
		settings_repository = DBConnection.getRepository(GuildSettings);
		lastseen_repository = DBConnection.getRepository(Lastseen);
		logger.info(chalk`{whiteBright MySQL:} Connected to "${hostname}:${port}" as "${username}"`);
		logger.info(chalk`{whiteBright MySQL:} Guilds found: ` + await settings_repository.count());
	} catch (err) {
		logger.error(chalk`{whiteBright MySQL:} Failed to connect to "${hostname}:${port}" as "${username}": ${err.message}`);
		logger.error('Exiting ...')
		process.exit(1);
	}
}

class SettingsManager {
	async get(sourceID: string, selection: (keyof GuildSettings)[] = []) {
		let loaded: GuildSettings;
		try {
			loaded = await settings_repository.findOne({ select: selection, where: { id: sourceID } })
		} catch (err) {
			logger.error(`Cannot get settings data of ${sourceID}:\n` + err)
		}
		return loaded;
	}

	async set(sourceID: string, newValue: QueryDeepPartialEntity<GuildSettings>): Promise<void> {
		await settings_repository.update({ id: sourceID }, newValue);
		logger.debug('saved new data')
	}

	async checkExist(sourceID: string) {
		return (await settings_repository.findOne({ where: { id: sourceID } })) ? true : false;
	}

	async purge(sourceID: string) {
		await settings_repository.delete({ id: sourceID });
	}

	async create(sourceID: string, name: string, isDM: boolean, prefix: string) {
		await settings_repository.save({
			id: sourceID,
			name: name,
			prefix: prefix,
			isDMChannel: isDM
		})
	}
}

class LastseenManager {

}


export const settings = new SettingsManager();
export const lastseen = new LastseenManager();
// export async function update(guildID: string) {
// 	const 
// }