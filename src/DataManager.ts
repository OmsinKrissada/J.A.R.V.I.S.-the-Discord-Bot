import mongoose from 'mongoose';
import * as fs from 'fs';
import yaml from 'js-yaml'

import { GuildData } from './model/GuildData'
export var CONFIG = yaml.safeLoad(fs.readFileSync('./settings/config.yml', 'utf8'));

// Connect to database
export async function connect() {
	await mongoose.connect("mongodb://localhost/" + CONFIG['appName'], {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});
}

// Load Data
export async function get(guildID: string, item: string) {
	// if (typeof guildID == 'number') {
	// 	guildID = Number(guildID);
	// }
	let loaded_guild = await GuildData.findOne({ id: guildID }).exec()
	if (!loaded_guild) {
		loaded_guild = new GuildData({
			id: guildID,
			prefix: CONFIG['defaultPrefix']
		});
		loaded_guild.save().then(_ => console.log('saved new'))
	}
	console.log(loaded_guild.get(item))
	return loaded_guild.get(item);
}

export async function set(guildID: string, item: string, value: any): Promise<void> {
	let loaded_guild = await GuildData.findOne({ id: guildID }).exec();
	loaded_guild.set(item, value);
	loaded_guild.save();
}

export async function purge(guildID: string) {
	let loaded_guild = await GuildData.findOne({ id: guildID }).exec();
	loaded_guild.deleteOne();
	loaded_guild.save()
}

// export async function update(guildID: string) {
// 	const 
// }