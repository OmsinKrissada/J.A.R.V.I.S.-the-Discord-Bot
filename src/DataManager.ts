import mongoose from 'mongoose';


import { Guilds, IGuildData } from './model/GuildData';
import CONFIG from './ConfigManager';
import { logger } from './Logger';
import chalk from 'chalk';
CONFIG.colors.red = 1;


class DataManager {

	readonly hostname = CONFIG.mongodb.hostname;
	readonly port = CONFIG.mongodb.port;
	readonly db = CONFIG.mongodb.database;

	private readonly username = CONFIG.mongodb.username;
	private readonly password = CONFIG.mongodb.password;

	async connect() {
		const mongopath = CONFIG.mongodb.authorizationEnabled ? `mongodb://${this.username}:${this.password}@${this.hostname}:${this.port}/${this.db}?authSource=admin`
			: `mongodb://${this.hostname}:${this.port}/${this.db}`

		logger.info(chalk`{whiteBright MongoDB:} Connecting to database ...`);
		try {
			await mongoose.connect(mongopath, {
				useNewUrlParser: true,
				useUnifiedTopology: true
			})
			logger.info(chalk`{whiteBright MongoDB:} Connected to ${CONFIG.mongodb.authorizationEnabled ? `mongodb://${this.username}:${this.password.replace(/./g, '*')}@${this.hostname}:${this.port}/${this.db}?authSource=admin`
				: `mongodb://${this.hostname}:${this.port}/${this.db}`}`);

			logger.info(chalk`{whiteBright MongoDB:} Guilds found: ` + await Guilds.countDocuments());
		} catch (err) {
			logger.error(chalk`{whiteBright MongoDB:} Failed to connect to ${CONFIG.mongodb.authorizationEnabled ? `mongodb://${this.username}:${this.password.replace(/./g, '*')}@${this.hostname}:${this.port}/${this.db}?authSource=admin`
				: `mongodb://${this.hostname}:${this.port}/${this.db}` + ': ' + err.message}`);
			logger.error('Exiting ...')
			process.exit(1);
		}
	}

	// Load Data
	async get(sourceID: string) {
		let loaded: IGuildData;
		try {
			loaded = await Guilds.findOne({ ID: sourceID }).exec()
		} catch (err) {
			logger.error('Cannot get data:\n' + err)
		}
		return loaded!;
	}

	async set(sourceID: string, item: string, value: any): Promise<void> {
		const loaded_guild = await Guilds.findOne({ ID: sourceID }).exec();
		if (!loaded_guild) throw "Guild not found";
		loaded_guild.set(item, value);
		loaded_guild.save();
		logger.debug('saved new data')
	}

	async create(sourceID: string, name: string, prefix: string) {
		const guild_template = {
			ID: sourceID,
			name: name,
			prefix: prefix,
		}
		await Guilds.updateOne({ ID: sourceID }, guild_template, { upsert: true, setDefaultsOnInsert: true }).exec();
	}

	async purge(sourceID: string) {
		let loaded_guild = await Guilds.findOne({ id: sourceID }).exec();
		if (loaded_guild) {
			loaded_guild.deleteOne();
			loaded_guild.save()
		}

	}

	async checkExist(sourceID: string) {
		if (await this.get(sourceID)) return true;
		else false;
		return false;
	}
}

export default new DataManager();
// export async function update(guildID: string) {
// 	const 
// }