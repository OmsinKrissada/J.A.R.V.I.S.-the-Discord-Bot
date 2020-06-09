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
		console.log(str);
		indent = '';
		for (i = 1; i <= meta.length; i++) {
			indent += ' ';
		}
	}
}

var chatlogfile = fs.createWriteStream(`./files/chatlogs/latest.log`, { encoding: 'utf-8' })
function chatlog(message) {
	let lines = message.content.split('\n')
	let meta = '[' + Util.getDateTimeString(new Date()) + '|' + (message.guild === null ? '<DM>' : message.guild.name) + message.guild === null ? '' : ('|' + message.channel.name) + '|' + message.author.username + '] ';
	let indent = meta;
	for (line of lines) {
		let str = indent + line + '\n';
		chatlogfile.write(str);
		console.log(str);
		indent = '';
		for (i = 1; i <= meta.length; i++) {
			indent += ' ';
		}
	}
}







var sendEmbed = Util.sendEmbed;


function rank(origin_message) {

	let stopranking = false;
	const { spawn } = require("child_process");
	const py = spawn("python", ["-u", "item-ranker.py"]);

	py.stdout.on("data", data => {
		sendEmbed('', `${data}\n\n${origin_message.author}`, channel = origin_message.channel)
		console.log(`stdout: ${data}`);
	});

	py.stderr.on("data", data => {
		sendEmbed('Error:', `\n\`\`\`${data}\`\`\``, 'error', origin_message.channnel)
		console.log(`stderr: ${data}`);
		stopranking = true
	});

	py.on('error', (error) => {
		console.log(`error: ${error.message}`);
		stopranking = true
	});

	py.on("close", code => {
		console.log(`child process exited with code ${code}`);
		pass.destroy()
		stopranking = true
	});

	// Create a new stream and pipe to python input stream 
	const { PassThrough } = require('stream')
	const pass = new PassThrough();
	pass.pipe(py.stdin)

	// Log data for the sake of debugging
	pass.on('data', data => {
		console.log(`data: ${data}`)
	})

	// On receive input from discord
	bot.on('message', message => {
		if (stopranking) {
			sendEmbed('Ended Ranking', `Ranking started by ${origin_message.author} has ended.`, 'info', channel = origin_message.channel);
		}
		if (message.content == `${prefix}stop`) stopranking = false;
		if (!message.author.bot && (message.author == origin_message.author)) {
			// Write discord input to 'pass'
			pass.write(message.content + '\r\n')
			console.log(`wrote ${message.content}`)
		}
	})
}

let stopmorse = false
function morseidk() {
	morse: {
		if (stopmorse) {
			console.log('breaking morse')
			break morse;
		}

		const { spawn } = require("child_process");
		const py = spawn("python3", ["morse.py"]);

		py.stdout.on("data", data => {
			sendEmbed('', `${data}\n\n`, channel = current_message.channel)
			console.log(`stdout: ${data}`);
		});

		py.stderr.on("data", data => {
			sendEmbed('Error:', `\n\`\`\`${data}\`\`\``, 'error', current_message.channel)
			console.log(`stderr: ${data}`);
			stopranking = true
		});

		py.on('error', (error) => {
			console.log(`error: ${error.message}`);
			stopranking = true
		});

		py.on("close", code => {
			console.log(`child process exited with code ${code}`);
			pass.destroy()
			stopranking = true
		});

		// Create a new stream and pipe to python input stream 
		const { PassThrough } = require('stream')
		const pass = new PassThrough();
		pass.pipe(py.stdin)

		// Log data for the sake of debugging
		pass.on('data', data => {
			console.log(`data: ${data}`)
		})

		// On receive input from discord
		bot.on('message', message => {
			if (message.content == `${prefix}stop`) stopmorse = true
			if (!current_message.author.bot) {
				// Write discord input to 'pass'
				pass.write(message.content + '\r\n')
				console.log(`wrote ${message.content}`)
			}
		})
	}
}

class RepeatSession {

}
/*
//	----------------------------------------------------------------------
//	Config Section
var pathtoplugin = '../minecraft/missile_wars'
//	----------------------------------------------------------------------


const { spawn } = require("child_process");
const pipein = spawn("sh", ["-c", `cat < ${pathtoplugin}/plugins/Ultron/mctodc.pipe`]);



// client.guilds.resolve('#685493737039593491').channels.resolve('#699045838718238771')

pipein.stdout.on("data", data => {
	input = JSON.parse(data)

	switch (input.type) {
		case 'log':
			if (input.content == 'mcready') {
				embed = new MessageEmbed()
					.setTitle('Server Started')
					.setDescription(`Minecraft server has started, come and join!\nThe server IP is \`${ip_address}\``)
					.setColor(green)
				console.log('ready')
				mclog_channel.send(embed)
			}
			else if (input.content == 'mcbye') {
				embed = new MessageEmbed()
					.setTitle('Server Stopped')
					.setDescription(`Minecraft server has stopped, Bye!`)
					.setColor(red)
				console.log('stopped')
				mclog_channel.send(embed)
			}
			else {
				mclog_channel.send(input.content)
			}
			break
		case 'chat':
			mclog_channel.send(`${input.player}: ${input.message}`)
			break
		default:
			console.log('Unknown type received')
	}
});

pipein.stderr.on("data", data => {
	// sendEmbed('Error:', `\n\`\`\`${data}\`\`\``, 'error', channel = mclog_channel)
	console.log(`stderr: ${data}`);
});

pipein.on('error', (error) => {
	console.log(`error: ${error.message}`);
});

pipein.on("close", code => {
	console.log(`child process (pipe) exited with code ${code}`);
	// pass.destroy()
});

const ws = new fs.createWriteStream(`${pathtoplugin}/plugins/Ultron/dctomc.pipe`)

client.on('message', message => {
	if (!message.author.bot && message.channel == mclog_channel) {
		let content = {
			sender: message.author.username,
			content: message.content
		}
		ws.write(JSON.stringify(content) + '\n')
		console.log(JSON.stringify(content))
	}
})

// // On receive input from discord
// client.on('message', message => {
// 	if (message.content == `${prefix}stop`) stopmorse = true
// 	if (!current_message.author.bot) {
// 		// Write discord input to 'pass'
// 		pass.write(message.content + '\r\n')
// 		console.log(`wrote ${message.content}`)
// 	}
// })

// var net = require('net');

// var server = net.createServer(function (stream) {
// 	stream.on('data', data => {
// 		console.log('data:', data.toString());
// 	});
// 	stream.on('end', () => {
// 		server.close();
// 	});
// });

// server.listen('/home/omsin/Servers/minecraft/lab/mctodiscord');

// var stream = net.connect('/tmp/test.sock');
// stream.write('hello');
// stream.end();
*/

Number.prototype.min2 = Util.min2;


var client_id = '<@!696973725806886963>';
var current_message;
bot.on('message', message => {

	if (message.author.id != bot.user.id)
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