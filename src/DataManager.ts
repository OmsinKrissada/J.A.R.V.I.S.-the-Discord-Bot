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
export function get(guildID: string, item: string) {
	// if (typeof guildID == 'number') {
	// 	guildID = Number(guildID);
	// }
	var loaded_guild: mongoose.Document;
	function idk(data) {
		loaded_guild = data;
	}
	GuildData.findOne({ id: guildID }).exec().then(function (returned_loaded_guild) {
		if (!returned_loaded_guild) {
			returned_loaded_guild = new GuildData({
				id: guildID,
				prefix: CONFIG['defaultPrefix']
			});
			returned_loaded_guild.save().then(_ => console.log('saved new'))
		}
		idk(returned_loaded_guild)
		console.log(returned_loaded_guild.get(item))
	})
	// console.log(loaded_guild.get('dm'))
	return loaded_guild.get(item);
}

export async function set(guildID: string, item: string, value: any): Promise<void> {
	let loaded_guild = await GuildData.findOne({ id: guildID }).exec();
	loaded_guild.set(item, value);
}

export async function purge(guildID: string) {
	let loaded_guild = await GuildData.findOne({ id: guildID }).exec();
	loaded_guild.deleteOne();
}

// export async function update(guildID: string) {
// 	const 
// }