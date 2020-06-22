// Init sequence

// Discord
const { Client, MessageEmbed, MessageCollector, MessageManager, ChannelManager, GuildChannel, GuildManager, MessageAttachment } = require('discord.js');

// Create an instance of a Discord client
const bot = new Client();
exports.bot = bot;
// const clientInformation = new Discord.clientInformation();
const embedmsg = new MessageEmbed();

const fs = require('fs');
const Util = require('./Util');
const Commando = require('./commands');
const DataManager = require('./database');
const alias = require('./alias.json')



// Log debug info
// bot.on("debug", (e) => console.info(e));



// Start discord client
bot.login(require("./token.json").discord)
bot.on('ready', () => {

	console.log('I am ready!');
	bot.user.setActivity('Ultron | !help', { type: "WATCHING" })

	Util.refreshIp();

	DataManager.getDatabase();

	logfile.write('# ' + Util.getDateTimeString(new Date()).replace(/:|\//g, '_') + '\n')
	chatlogfile.write('# ' + Util.getDateTimeString(new Date()).replace(/:|\//g, '_') + '\n')

	// Get specific channel object
	mclog_channel = bot.channels.resolve('699045838718238771')


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

if (!fs.existsSync('./files/chatlogs')) {
	fs.mkdirSync('./files/chatlogs');
}

// rename latest.log to it's appropriate name
if (fs.existsSync('./files/logs/latest.log')) {
	const linereader = require('n-readlines');
	fs.renameSync('./files/logs/latest.log', './files/logs/' + new linereader('./files/logs/latest.log').next().toString().substr(2) + '.log')
}

// rename latest.log to it's appropriate name
if (fs.existsSync('./files/chatlogs/latest.log')) {
	const linereader = require('n-readlines');
	fs.renameSync('./files/chatlogs/latest.log', './files/chatlogs/' + new linereader('./files/chatlogs/latest.log').next().toString().substr(2) + '.log')
}



var logfile = fs.createWriteStream(`./files/logs/latest.log`, { encoding: 'utf-8' })
function log(message) {
	let lines = message.content.split('\n')
	let meta = '[' + Util.getDateTimeString(new Date()) + '|' + (message.guild === null ? '<DM>' : message.guild.name) + '|' + message.author.username + '] ';
	let indent = meta;
	for (line of lines) {
		let str = indent + line + '\n';
		logfile.write(str);
		// console.log(str);
		indent = '';
		for (i = 1; i <= meta.length; i++) {
			indent += ' ';
		}
	}
}

var chatlogfile = fs.createWriteStream(`./files/chatlogs/latest.log`, { encoding: 'utf-8' })
function chatlog(message) {

	let lines = [];
	if (message.content != '')
		message.content.split('\n').forEach(contentline => {
			lines.push(contentline);
		})
	message.attachments.forEach(attachment => {
		lines.push('{ Attachment URL: ' + attachment.url + ' }');
		const { exec } = require('child_process');
		exec('curl ' + attachment.url)
	})
	message.embeds.forEach(embed => {
		JSON.stringify(embed.toJSON(), null, '  ').split('\n').forEach(embedline => {
			lines.push(embedline);
		})
	})

	let meta = '[' + Util.getDateTimeString(new Date()) + '|' + (message.guild === null ? '<DM>' : message.guild.name) + (message.guild === null ? '' : ('|' + message.channel.name)) + '|' + message.author.username + '] ';
	let indent = meta;
	lines.forEach(line => {
		let str = indent + line + '\n';
		chatlogfile.write(str);
		// console.log(str);
		indent = '';
		for (let i = 1; i <= meta.length; i++) {
			indent += ' ';
		}
	})
}



Number.prototype.min2 = Util.min2;


var client_id = '<@!696973725806886963>';
var current_message;
bot.on('message', message => {

	// if (message.author.id != bot.user.id)
	chatlog(message)

	current_message = message;

	// If guild not exist in database, add them. 
	let store_id;
	if (message.guild === null) {
		store_id = message.channel.id;
		store_name = message.author.username;
	}
	else {
		store_id = message.guild.id;
		store_name = message.guild.name;
	}

	if (DataManager.data.guilds[store_id] === undefined) {
		DataManager.addGuildDefaultData(store_id, store_name, message.guild === null);
	}
	let prefix = DataManager.data.guilds[store_id].prefix;

	if (!message.author.bot && ((message.content.startsWith(prefix) && message.content.length > prefix.length) || message.content.startsWith(client_id))) {


		log(message)
		let args;
		if (message.content.startsWith(client_id)) {
			args = message.content.substr(client_id.length).trim().split(' ')

		}
		else {
			args = message.content.substr(prefix.length).trim().split(' ')
		}



		Commando.setPrefix(prefix);
		Commando.setRespondMessage(message);
		Commando.setArguments(args);

		let answer = alias.hasOwnProperty(args[0].toLowerCase()) ? alias[args[0].toLowerCase()] : args[0].toLowerCase();

		if (message.guild === null && Commando.non_dm_command.includes(answer)) {
			message.channel.send(new MessageEmbed()
				.setTitle('Not DM Command')
				.setDescription('This command is not available in DM channels')
				.setColor(Util.red))
			return 1;
		}

		if (Commando.commands.hasOwnProperty(answer)) {
			Commando.commands[answer].call();
		} else Commando.commands.unknown();


	}
});



// Personal-use

bot.on('voiceStateUpdate', (oldState, newState) => {
	DataManager.data.guilds[newState.guild.id].hooks.forEach(hook => {
		if (newState.channel && newState.channel.id == hook.voice) {
			newState.guild.channels.resolve(hook.text).createOverwrite(newState.member, { VIEW_CHANNEL: true });
		}
		else {
			newState.guild.channels.resolve(hook.text).createOverwrite(newState.member, { VIEW_CHANNEL: null });
		}
	})

})