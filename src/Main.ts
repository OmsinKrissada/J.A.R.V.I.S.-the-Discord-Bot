// Init sequence

// Discord
import { Client, MessageEmbed, Message } from 'discord.js';

// Create an instance of a Discord client
export const bot = new Client();
// const clientInformation = new Discord.clientInformation();

import fs from 'fs'
import * as Commando from "./Commando";
import { Util } from "./Util";
import { DataManager } from './DataManager';
import * as Music from './Music';
import alias from '../settings/alias.json'



// Log debug info
// bot.on("debug", (e) => console.info(e));


var client_id = '';
// Start discord client
import token from "../token.json"
bot.login(token.discord)
bot.on('ready', () => {

	console.log('I am ready!');
	bot.user.setActivity('Ultron | !help', { type: "WATCHING" })

	Util.refreshIp();

	DataManager.getOption();

	logfile.write('# ' + Util.getDateTimeString(new Date()).replace(/:|\//g, '_') + '\n')

	client_id = `<@!${bot.user.id}>`;

	// Get specific channel object
	// let mclog_channel = bot.channels.resolve('699045838718238771')


	// console.log(Discord.GuildManager.resolve(client.guilds))
});




/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */

// Check if file dir exist, if not, create them.
if (!fs.existsSync('./files')) {
	fs.mkdirSync('./files')
}

if (!fs.existsSync('./files/logs')) {
	fs.mkdirSync('./files/logs');
}

// rename latest.log to it's appropriate name
if (fs.existsSync('./files/logs/latest.log')) {
	const linereader = require('n-readlines');
	fs.renameSync('./files/logs/latest.log', './files/logs/' + new linereader('./files/logs/latest.log').next().toString().substr(2) + '.log')
}


var logfile = fs.createWriteStream(`./files/logs/latest.log`, { encoding: 'utf-8' })
function log(message: Message): void {
	let lines = message.content.split('\n')
	let meta = '[' + Util.getDateTimeString(new Date()) + '|' + (message.guild === null ? '<DM>' : message.guild.name) + '|' + message.author.username + '] ';
	let indent = meta;
	for (let line of lines) {
		let str = indent + line + '\n';
		logfile.write(str);
		// console.log(str);
		indent = '';
		for (let i = 1; i <= meta.length; i++) {
			indent += ' ';
		}
	}
}



bot.on('message', message => {


	// If guild not exist in database, add them. 
	let store_id: string, store_name: string;
	if (message.guild === null) {
		store_id = message.channel.id;
		store_name = message.author.username;
	}
	else {
		store_id = message.guild.id;
		store_name = message.guild.name;
	}

	if (DataManager.data.guilds[store_id] === undefined) {
		DataManager.addGuildDefaultOption(store_id, store_name, message.guild === null);
	}
	let prefix = DataManager.data.guilds[store_id].prefix;

	if (!message.author.bot && ((message.content.startsWith(prefix) && message.content.length > prefix.length) || message.content.startsWith(client_id))) {


		log(message)
		let args: Array<string>;
		if (message.content.startsWith(client_id)) {
			args = message.content.substr(client_id.length).trim().split(' ')
		}
		else {
			args = message.content.substr(prefix.length).trim().split(' ')
		}

		try {
			Music.constructData(message.guild.id);
		} catch (err) {
			Music.constructData(message.channel.id);
		}


		Commando.setPrefix(prefix);
		Commando.setRespondMessage(message);
		Commando.setArguments(args);

		let answer = args[0].toLowerCase();
		for (let key in alias) {
			if (alias[key].includes(answer)) {
				answer = key;
			}
		}

		if (message.guild === null && Commando.non_dm_command.includes(answer)) {
			message.channel.send(new MessageEmbed()
				.setTitle('Not DM Command')
				.setDescription('This command is not available in DM channels')
				.setColor(Util.red))
			return 1;
		}

		Commando.run(answer);


	}
});

// commando.commands.rank()

// Personal-use

bot.on('voiceStateUpdate', (_oldState, newState) => {
	if (newState.member.user.bot) return;
	if (!DataManager.data.guilds[newState.guild.id].hooks) {
		DataManager.data.guilds[newState.guild.id].hooks = [];
	}
	DataManager.data.guilds[newState.guild.id].hooks.forEach(hook => {
		if (hook.type == 'hard') {
			if (newState.channel && newState.channel.id == hook.voice) {
				newState.guild.channels.resolve(hook.text).createOverwrite(newState.member, { VIEW_CHANNEL: true });
			}
			else {
				newState.guild.channels.resolve(hook.text).createOverwrite(newState.member, { VIEW_CHANNEL: null });
			}
		}
		else if (hook.type == 'soft') {
			if (newState.channel && newState.channel.id == hook.voice) {
				newState.guild.channels.resolve(hook.text).createOverwrite(newState.member, { SEND_MESSAGES: true });
			}
			else {
				newState.guild.channels.resolve(hook.text).createOverwrite(newState.member, { SEND_MESSAGES: null });
			}
		}
	})

})




// process.on('exit', unhookall())