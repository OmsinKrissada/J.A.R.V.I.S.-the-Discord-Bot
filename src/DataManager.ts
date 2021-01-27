import mongoose from 'mongoose';


import { Guilds } from './model/GuildData';
import CONFIG from './ConfigManager';
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

		console.log('MongoDB connecting to database ...');
		await mongoose.connect(mongopath, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		}).catch(err => {
			console.error('ERROR: MongoDB failed to connect to ' + mongopath + ': ' + err.message);
			process.exit(1);
		});
		console.log('MongoDB connected to ' + mongopath);

		console.log('MongoDB Guilds found: ' + await Guilds.countDocuments());
	}

	// Load Data
	async get(sourceID: string) {
		let loaded = await Guilds.findOne({ ID: sourceID }).exec()
		return loaded!;
	}

	async set(sourceID: string, item: string, value: any): Promise<void> {
		const loaded_guild = await Guilds.findOne({ ID: sourceID }).exec();
		loaded_guild!.set(item, value);
		loaded_guild!.save();
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