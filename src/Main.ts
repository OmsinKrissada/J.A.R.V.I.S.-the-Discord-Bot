// Init sequence

// Discord
import { Client, MessageEmbed, Message } from 'discord.js';

// Creates an instance of a Discord client
export const bot = new Client();

import fs from 'fs'
import * as Commando from "./Commando";
import { Util } from "./Util";
import * as DataManager from './DataManager'
import * as Music from './Music';
import registered_commands from '../settings/alias.json'


// Starts discord client
import token from "../token.json"
bot.login(token.discord)
bot.once('ready', async () => {

	console.log('Logged in, ready.');
	bot.user.setActivity('Ultron | !help', { type: "WATCHING" })

	Util.refreshIp();

	logfile.write('# ' + Util.getDateTimeString(new Date()).replace(/:|\//g, '_') + '\n')

	await DataManager.connect()
});
const client_id = `<@!${bot.user.id}>`;


// Checks if file directory exists, if not, creates them.
if (!fs.existsSync('./files')) {
	fs.mkdirSync('./files')
}

if (!fs.existsSync('./files/logs')) {
	fs.mkdirSync('./files/logs');
}

// renames latest.log to its appropriate name
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


// Handles the received messages
bot.on('message', async (message) => {

	const isDMMessage: boolean = message.guild === null;
	const prefix: string = await DataManager.get(isDMMessage ? message.channel.id : message.guild.id, 'prefix');

	if (message.author.bot || !((message.content.startsWith(prefix) && message.content.length > prefix.length) || message.content.startsWith(client_id))) return;

	log(message)

	let command_args: Array<string>;
	if (message.content.startsWith(client_id)) {
		command_args = message.content.slice(client_id.length).trim().split(' ')
	} else {
		command_args = message.content.slice(prefix.length).trim().split(' ')
	}

	try {
		Music.constructData(message.guild.id);
	} catch (err) {
		Music.constructData(message.channel.id);
	}

	let command = command_args[0].toLowerCase();
	for (const aliases in registered_commands) {
		if (registered_commands[aliases].includes(command)) {
			command = aliases;
		}
	}

	if (isDMMessage && Commando.server_restricted_commands.includes(command)) {
		message.channel.send(new MessageEmbed()
			.setTitle('Not a DM Command')
			.setDescription('This command is not available in DM channels')
			.setColor(Util.red))
		return 1;
	}

	Commando.run(command, command_args.slice(1), message);

});


// Personal-use

bot.on('voiceStateUpdate', async (_oldState, newState) => {

	class VoiceHook {
		type: string;
		voiceChannel: string;
		textChannel: string;
	}

	if (newState.member.user.bot) return;
	let hooks: VoiceHook[] = await DataManager.get(newState.guild.id, 'hooks');
	console.log(hooks)
	if (!hooks) {
		hooks = [];
	}
	hooks.forEach((hook: VoiceHook) => {
		if (hook.type == 'hard') {
			if (newState.channel && newState.channel.id == hook.voiceChannel) {
				newState.guild.channels.resolve(hook.textChannel).createOverwrite(newState.member, { VIEW_CHANNEL: true });
			}
			else {
				newState.guild.channels.resolve(hook.textChannel).createOverwrite(newState.member, { VIEW_CHANNEL: null });
			}
		}
		else if (hook.type == 'soft') {
			if (newState.channel && newState.channel.id == hook.voiceChannel) {
				newState.guild.channels.resolve(hook.textChannel).createOverwrite(newState.member, { SEND_MESSAGES: true });
			}
			else {
				newState.guild.channels.resolve(hook.textChannel).createOverwrite(newState.member, { SEND_MESSAGES: null });
			}
		}
	})

})