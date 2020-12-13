import mongoose from 'mongoose';


import { Guilds, IGuildData } from './model/GuildData';
import { CONFIG } from './ConfigManager';



// Connect to database
const hostname = CONFIG.mongodb.hostname;
const port = CONFIG.mongodb.port;
const db = CONFIG.mongodb.database;

const username = CONFIG.mongodb.username;
const password = CONFIG.mongodb.password;

export async function connect() {
	const mongopath = CONFIG.mongodb.authorizationEnabled ? `mongodb://${username}:${password}@${hostname}:${port}/${db}?authSource=admin`
		: `mongodb://${hostname}:${port}/${db}`

	await mongoose.connect(mongopath, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	}).catch(err => {
		console.error('MongoDB failed to connect to ' + mongopath);
		console.error(err);
		process.exit(1);
	});
	console.log('MongoDB connected to ' + mongopath);

	console.log('Guilds found: ' + await Guilds.countDocuments());
}

// Load Data
export async function get(guildID: string, returnsData = true) {
	let loaded = await Guilds.findOne({ ID: guildID }).exec()
	if (!returnsData) {
		return Guilds.findOne({ ID: guildID });
	}
	return loaded;
}

export async function set(guildID: string, item: string, value: any): Promise<void> {
	const loaded_guild = await Guilds.findOne({ ID: guildID }).exec();
	loaded_guild.set(item, value);
	loaded_guild.save();
}

export async function create(guild_id: string, name: string, prefix: string) {
	const guild_template = {
		ID: guild_id,
		name: name,
		prefix: prefix,
	}
	await Guilds.updateOne({ ID: guild_id }, guild_template, { upsert: true, setDefaultsOnInsert: true }).exec();
}

export async function purge(guildID: string) {
	let loaded_guild = await Guilds.findOne({ id: guildID }).exec();
	loaded_guild.deleteOne();
	loaded_guild.save()
}

// export async function update(guildID: string) {
// 	const 
// }