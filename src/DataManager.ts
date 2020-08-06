import mongoose from 'mongoose';
import * as fs from 'fs';
import yaml from 'js-yaml'

import { GuildData } from './model/GuildData'
import { bot } from './Main';
export var CONFIG = yaml.safeLoad(fs.readFileSync('./settings/config.yml', 'utf8'));

// Connect to database
let appname = fs.readFileSync('./settings/appname').toString();
export async function connect() {
	await mongoose.connect("mongodb://localhost/" + appname, {
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
		if (bot.guilds.resolve(guildID)) {
			loaded_guild = new GuildData({
				id: guildID,
				prefix: CONFIG['defaultPrefix']
			});
		} else {
			loaded_guild = new GuildData({
				id: guildID,
				prefix: CONFIG['defaultDMPrefix']
			});
		}
		loaded_guild.save().then(_ => console.log('saved new'))
	}
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