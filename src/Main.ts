import { Client, MessageEmbed, Message, TextChannel, DMChannel, NewsChannel } from 'discord.js';

import * as Helper from "./Helper";
import * as CommandManager from './CommandManager';
import { logger } from './Logger';
import registered_commands from '../settings/alias.json';
import CONFIG from './ConfigManager';
import { getGuildSettings, prisma } from './DBManager';

logger.info('Initiating ...');
logger.info(`Running on Node ${process.version}`);

// Creates an instance of a Discord client
// export const bot = new Client({ intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILDS', 'GUILD_EMOJIS', 'GUILD_INTEGRATIONS', 'GUILD_INVITES', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_PRESENCES', 'GUILD_VOICE_STATES'] });
export const bot = new Client({ partials: ['REACTION', 'MESSAGE'] });

var client_id: string;
var loggingChannel: TextChannel | DMChannel | NewsChannel;

bot.once('ready', async () => {
	process.on('SIGTERM', gracefulExit);
	process.on('SIGINT', gracefulExit);

	logger.info(`Logged-in to Discord as >> '${bot.user!.tag}' [${bot.user!.id}]`);
	// bot.user!.setActivity('Ultron | !help', { type: "WATCHING" });
	client_id = `<@!${bot.user!.id}>`;

	const lchannel = await bot.channels.fetch(CONFIG.loggingChannel);
	if (lchannel.isText()) loggingChannel = lchannel;
	if (loggingChannel) {
		loggingChannel.send(new MessageEmbed({
			title: '👋 Logged in!',
			color: Helper.GREEN,
			timestamp: new Date()
		}));
	}

});

function log(message: Message): void {
	const lines = message.content.split('\n');
	const meta = `Received a command from <@${message.author.id}>(${message.guild ? 'SERVER' : 'DM'}) `;
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


// Handles received messages
bot.on('message', async (message) => {
	message = Object.create(message);
	if (message.author.id == bot.user!.id) return;

	const isDMMessage = message.channel instanceof DMChannel;
	const sourceID = isDMMessage ? message.channel.id : message.guild!.id;

	// const prefix: string = (await settings.get(sourceID, ['prefix'])).prefix;
	const prefix = (await getGuildSettings(sourceID)).prefix;

	if (!((message.content.startsWith(prefix) && message.content.length > prefix.length) || message.content.startsWith(client_id))) return;

	log(message);

	const command_args = message.content.slice(message.content.startsWith(client_id) ? client_id.length : prefix.length).trim().split(' ');

	let command = command_args[0].toLowerCase();
	for (const aliases in registered_commands) {
		if (registered_commands[aliases].includes(command)) {
			command = aliases;
		}
	}

	// if (message.author.id === '714364134342262875') {
	// 	message.channel.send('You are not allowed to use the command.');
	// 	return;
	// }
	CommandManager.run(command, command_args.slice(1), { message, prefix, sourceID });
});

export function gracefulExit(signal: NodeJS.Signals | 'LAVALINK' | 'ERROR') {
	logger.warn(`Graceful shutdown triggered by "${signal}".`);
	loggingChannel.send({
		embed: {
			title: '👋 Logged out!',
			description: `JARVIS is gracefully shutting down by "${signal}"`,
			color: CONFIG.colors.yellow,
			timestamp: new Date()
		}
	}).finally(async () => {
		bot.destroy();
		await prisma.$disconnect();
		logger.info('Disconnected from database.', 'prisma');
		logger.info('Successfully destroyed the bot instance.');
		process.exit(signal === 'LAVALINK' || signal === 'ERROR' ? 1 : 0);
	});
}

CommandManager.loadModules();
bot.login(CONFIG.token.discord);
logger.info('Logging in to Discord ...');