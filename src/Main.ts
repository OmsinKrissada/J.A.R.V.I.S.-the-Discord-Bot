import { Client, MessageEmbed, Message, TextChannel, DMChannel } from 'discord.js';

import fs from 'fs'
import express from 'express';
import { exec } from 'child_process';

import { Helper } from "./Helper";
import * as CommandManager from './CommandManager';
import DataManager from './DataManager'
import { logger } from './Logger';
import registered_commands from '../settings/alias.json'
import CONFIG from './ConfigManager';

logger.info('Initiating ...');
logger.info(`Running on Node ${process.version}`);

// Creates an instance of a Discord client
export const bot = new Client();

DataManager.connect().then(() => {
	CommandManager.loadModules();
	bot.login(CONFIG.token.discord).catch(err => {
		logger.error('Failed to log-in to Discord.')
		logger.error(err)
	})
	logger.info('Logging in to Discord ...')
})

var client_id: string;
var loggingChannel: TextChannel;

bot.once('ready', async () => {

	logger.info(`Logged-in to Discord as >> '${bot.user!.tag}' [${bot.user!.id}]`);
	// bot.user!.setActivity('Ultron | !help', { type: "WATCHING" });
	client_id = `<@!${bot.user!.id}>`;

	const lchannel = await bot.channels.fetch(CONFIG.loggingChannel);
	if (lchannel instanceof TextChannel) loggingChannel = lchannel;
	if (loggingChannel) {
		loggingChannel.send(new MessageEmbed({
			title: 'Logged in.',
			color: Helper.GREEN
		}).setTimestamp());
	}

	bot.guilds.cache.forEach(async (guild) => {
		if (await DataManager.get(guild.id) === null) {
			logger.info('Guild data not found, creating default data for this guild. ' + `[${guild.id}]`);
			await DataManager.create(guild.id, guild.name, CONFIG.defaultPrefix);
		}
	})
});

function log(message: Message): void {
	const lines = message.content.split('\n')
	const meta = `Received a command from <@${message.author.id}>(${message.guild ? 'SERVER' : 'DM'}) `
	let indent = meta;
	let str = indent + lines.shift();
	for (const line of lines) {
		indent = '';
		for (let i = 1; i <= meta.length; i++) {
			indent += ' ';
		}
		str += '\n' + indent + line;
	}
	logger.debug(str);
}

// handle exceptions

// if (loggingChannel)
// 	process.on('unhandledRejection', (reason, promise) => {
// 		// if (!reason) return;
// 		console.error(reason);
// 		loggingChannel.send('Error produced:\n```json\n' + JSON.stringify(reason, null, '   ') + '```').catch(() => console.error('ERROR: Cannot send unhandled promise rejection to logging channel'));
// 	})

// process.on('uncaughtException', function (err) {
// 	console.log('Caught exception: ' + err);
// 	console.log(err.stack)
// 	if (loggingChannel) loggingChannel.send('Caught exception: ' + err);
// 	process.exit(1);
// });

// Handles received messages
bot.on('message', async (message) => {
	message = Object.create(message)
	if (message.author.id == bot.user!.id) return;

	const isDMMessage = message.channel instanceof DMChannel;
	const sourceID = isDMMessage ? message.channel.id : message.guild!.id;
	const sourceName = isDMMessage ? message.author.username : message.guild!.name;

	if (await DataManager.get(sourceID) === null) {
		logger.info('Guild data not found, creating default data for this guild. ' + `[${sourceID}]`);
		await DataManager.create(sourceID, sourceName, isDMMessage ? CONFIG.defaultDMPrefix : CONFIG.defaultPrefix);
	}
	// if (bot.guilds.resolve(guildID)) {
	// 	loaded = new GuildData({
	// 		id: guildID,
	// 		prefix: CONFIG.defaultPrefix
	// 	});
	// } else {
	// 	loaded = new GuildData({
	// 		id: guildID,
	// 		prefix: CONFIG.defaultDMPrefix
	// 	});
	// }
	const prefix: string = (await DataManager.get(sourceID)).prefix;

	if (!((message.content.startsWith(prefix) && message.content.length > prefix.length) || message.content.startsWith(client_id))) return;

	log(message)

	let command_args: Array<string>;
	if (message.content.startsWith(client_id)) {
		command_args = message.content.slice(client_id.length).trim().split(' ')
	} else {
		command_args = message.content.slice(prefix.length).trim().split(' ')
	}

	// try {
	// 	Music.constructData(message.guild.id);
	// } catch (err) {
	// 	Music.constructData(message.channel.id);
	// }

	let command = command_args[0].toLowerCase();
	for (const aliases in registered_commands) {
		if (registered_commands[aliases].includes(command)) {
			command = aliases;
		}
	}

	// if (isDMMessage && Commando.server_restricted_commands.includes(command)) {
	// 	message.channel.send(new MessageEmbed()
	// 		.setTitle('Not a DM Command')
	// 		.setDescription('This command is not available in DM channels')
	// 		.setColor(Util.red))
	// 	return 1;
	// }

	CommandManager.run(command, command_args.slice(1), { message, prefix, sourceID });

});



const app = express();
const port = 8081;

app.use(express.json());

app.post('/api/github', (req, res) => {
	res.sendStatus(200);
	return;

	const sender = req.body.sender;
	const jarvisChannel = (<TextChannel>bot.guilds.resolve('709824110229979278')!.channels.resolve('709824110229979282'));

	if (req.body.pusher) {
		if (req.body.repository.id === 254853181) {
			jarvisChannel.send(new MessageEmbed({
				author: {
					iconURL: sender.avatar_url,
					name: `${sender.login} pushed to GitHub`
				},
				description: `\`push\` action was initiated by **${sender.login}**.\n\nPulling from GitHub.`,
				color: Helper.BLUE
			}));

			exec('git pull', async (_err, _stdout, stderr) => {
				if (stderr) {
					jarvisChannel.send(`\`git pull\` produced errors, restarting process aborted.\n\`\`\`${stderr}\`\`\``)
				} else {
					console.log(`Received request from GitHub, restarting. (Pusher: ${sender.login})`);
					await jarvisChannel.send('`git pull` ran without errors. Restarting client . . .')
					exec('npm i', (_err, _stdout, stderr) => {
						process.exit();
					});
				}
			});

		} else {
			console.log(`Received request from wrong repo on GitHub, ignoring request. (Pusher: ${sender.login})`);
			jarvisChannel.send(new MessageEmbed({
				author: {
					iconURL: sender.avatar_url,
					name: `${sender.login} pushed to GitHub`
				},
				description: `\`push\` action was received from a wrong repository, ignoring request.`,
				color: Helper.RED
			}))
		}

	} else {
		console.log('Received from GitHub but there\'s no pusher in it, ignoring request.')
	}
})

// app.listen(port, () => logger.info(`Listening for AJAX calls on port ${port}`))
