import { Connection, createConnection, getConnection, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

import { GuildSettings } from "./models/GuildSettings";
import { Lastseen } from "./models/Lastseen";
import { ChannelHooks } from "./models/ChannelHooks";
import CONFIG from './ConfigManager';
import { logger } from './Logger';
import chalk from 'chalk';

let settings_repository: Repository<GuildSettings> = null;
let lastseen_repository: Repository<Lastseen> = null;
export let hook_repository: Repository<ChannelHooks> = null;


async function connectMySQL() {

	const { database, hostname, password, port, username } = CONFIG.mysql;

	let DBConnection: Connection;
	try {
		logger.info(chalk`{whiteBright MySQL:} Connecting to MySQL database ...`);
		DBConnection = await createConnection({
			"type": "mysql",
			"host": hostname,
			"port": port,
			"username": username,
			"password": password,
			"database": database,
			"synchronize": true,
			"logging": false,
			"entities": [GuildSettings, Lastseen, ChannelHooks],
		});
		settings_repository = DBConnection.getRepository(GuildSettings);
		lastseen_repository = DBConnection.getRepository(Lastseen);
		hook_repository = DBConnection.getRepository(ChannelHooks);
		logger.info(chalk`{whiteBright MySQL:} Connected to "${hostname}:${port}" as "${username}"`);
		logger.info(chalk`{whiteBright MySQL:} Guilds found: ` + await settings_repository.count());
	} catch (err) {
		logger.error(chalk`{whiteBright MySQL:} Failed to connect to "${hostname}:${port}" as "${username}": ${err.message}`);
		logger.error('Exiting ...');
		process.exit(1);
	}
}

async function connectSQLite() {
	const path = CONFIG.sqlite.path;
	let DBConnection: Connection;
	try {
		logger.info(chalk`{whiteBright SQLite:} Connecting to SQLite database ...`);
		DBConnection = await createConnection({
			"type": "sqlite",
			"database": path,
			"synchronize": true,
			"logging": false,
			"entities": [GuildSettings, Lastseen, ChannelHooks],
		});
		settings_repository = DBConnection.getRepository(GuildSettings);
		lastseen_repository = DBConnection.getRepository(Lastseen);
		hook_repository = DBConnection.getRepository(ChannelHooks);
		logger.info(chalk`{whiteBright SQLite:} Connected to ${path}`);
		logger.info(chalk`{whiteBright SQLite:} Guilds found: ` + await settings_repository.count());
	} catch (err) {
		logger.error(chalk`{whiteBright SQLite:} Failed to connect to ${path}: ${err.message}`);
		logger.error('Exiting ...');
		process.exit(1);
	}
}

export async function connectDB() {
	if (CONFIG.database == 'mysql') await connectMySQL();
	else if (CONFIG.database == 'sqlite') await connectSQLite();
}

class SettingsManager {
	async get(sourceID: string, selection: (keyof GuildSettings)[] = []) {
		let loaded: GuildSettings;
		try {
			loaded = await settings_repository.findOne({ select: selection, where: { id: sourceID } });
		} catch (err) {
			logger.error(`Cannot get settings data of ${sourceID}:\n` + err);
		}
		return loaded;
	}

	async set(sourceID: string, newValue: QueryDeepPartialEntity<GuildSettings>): Promise<void> {
		await settings_repository.update({ id: sourceID }, newValue);
		logger.debug(`Updated data in ${sourceID}`);
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
		});
	}
}

class LastseenManager {
	async getTimestamp(guildID: string, memberID: string) {
		return (await lastseen_repository.findOne({ select: ['timestamp'], where: { guild_id: guildID, member_id: memberID } }))?.timestamp;
	}

	async setTimestamp(guildID: string, memberID: string, timestamp: Date) {
		const id = (await lastseen_repository.findOne({ where: { guild_id: guildID, member_id: memberID } }))?.id;
		await lastseen_repository.save({ id: id, guild_id: guildID, member_id: memberID, timestamp: timestamp });
	}

	async getPresent(guildID: string, memberID: string) {
		return (await lastseen_repository.findOne({ select: ["isPresent"], where: { guild_id: guildID, member_id: memberID } }))?.isPresent;
	}

	async setPresent(guildID: string, memberID: string, x: boolean) {
		const id = (await lastseen_repository.findOne({ where: { guild_id: guildID, member_id: memberID } }))?.id;
		await lastseen_repository.save({ id: id, guild_id: guildID, member_id: memberID, isPresent: x });
	}

}


export const settings = new SettingsManager();
export const lastseen = new LastseenManager();