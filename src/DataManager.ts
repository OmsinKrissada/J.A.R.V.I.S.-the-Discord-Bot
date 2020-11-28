import mongoose from 'mongoose';


import { Guilds, IGuildData } from './model/GuildData';
import { CONFIG } from './ConfigManager';
import { bot } from './Main';
import { Guild } from 'discord.js';



// Connect to database
const hostname = CONFIG.mongodb.hostname;
const port = CONFIG.mongodb.port;
const db = CONFIG.mongodb.database;

const mongodb_username = CONFIG.mongodb.username;
const mongodb_password = CONFIG.mongodb.password;

export async function connect() {
	const mongopath = CONFIG.mongodb.authorizationEnabled ? `mongodb://${mongodb_username}:${mongodb_password}@${hostname}:${port}/${db}?authSource=admin`
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
export async function get(guildID: string, item?: string) {
	let loaded = await Guilds.findOne({ ID: guildID }).exec()
	if (item === undefined) {
		return Guilds.findOne({ ID: guildID });
		loaded.save().then(_ => console.log('saved new'))
	}
	return loaded.get(item);
}

export async function set(guildID: string, item: string, value: any): Promise<void> {
	const loaded_guild = await Guilds.findOne({ id: guildID }).exec();
	loaded_guild.set(item, value);
	loaded_guild.save();
}

export async function update(guildID: string, item: string, value: any): Promise<void> {
	const loaded_guild = await Guilds.findOne({ id: guildID }).exec();
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