import { DMChannel, MessageEmbed, MessageReaction, ReactionEmoji, ReactionManager } from 'discord.js';
import { Command } from '../CommandManager';
import { prisma } from '../DBManager';
import { logger } from '../Logger';
import { bot } from '../Main';


export default new Command({
	name: 'reactnoti',
	category: 'features',
	description: 'Sends notification when someone react your message',
	examples: ['reactnoti <on/off/check>'],
	requiredCallerPermissions: ['MANAGE_CHANNELS'],
	requiredSelfPermissions: ['SEND_MESSAGES', "VIEW_CHANNEL"],
	serverOnly: false,
	async exec(message, _prefix, args) {
		const user = message.author;
		let dmChannel: DMChannel;
		if (message.channel.type == 'dm') dmChannel = message.channel;
		else if (user.dmChannel) dmChannel = user.dmChannel;
		else {
			logger.debug('dm not found, requesting one');
			try {
				dmChannel = await user.createDM();
			} catch (e) {
				await message.channel.send('Cannot create DM channel.');
				return;
			}
		}

		if (!args[0]) {
			await message.channel.send('Please supply your option. (on/off/check)');
			return;
		}

		const data = await prisma.reactionNotification.findUnique({
			where: {
				userId: user.id
			}
		});

		if (args[0].toLowerCase() === 'on') {
			if (data?.isEnabled) {
				await message.channel.send('You already have reaction notification enabled. Settings remain unchanged.');
				return;
			}
			await prisma.reactionNotification.upsert({
				where: {
					userId: user.id,
				},
				create: {
					userId: user.id,
					isEnabled: true,
				},
				update: {
					isEnabled: true,
				}
			});
			try {
				await dmChannel.send('`🟢` You have **enabled** reaction notification.\nYou will now receive DM when someone react on your message.');
			} catch (e) {
				message.channel.send('Cannot send to your DM. Please make sure you have at least one common server with the bot that allow direct messages from server members.\nThis is required for this feature to work.');
			}
		} else if (args[0].toLowerCase() === 'off') {
			if (!data?.isEnabled) {
				await message.channel.send('You already have reaction notification disabled. Settings remain unchanged.');
				return;
			}
			await prisma.reactionNotification.upsert({
				where: {
					userId: user.id,
				},
				create: {
					userId: user.id,
					isEnabled: false,
				},
				update: {
					isEnabled: false,
				}
			});
			try {
				await dmChannel.send('`🔴` You have **disabled** reaction notification.');
			} catch (e) {
				message.channel.send('`🔴` You have **disabled** reaction notification.');
			}
		} else if (args[0].toLowerCase() === 'check') {
			const isEnabled = data?.isEnabled;
			message.channel.send(`You have reaction notification set to \`${isEnabled ? '🟢 ON' : '⚫ OFF'}\``);
		} else {
			message.channel.send('Option must be either `on`, `off`, or `check`.');
		}
	}
});

bot.on('messageReactionAdd', async (reaction, reactor) => {
	const message = reaction.message;
	const msg_owner =
		message.partial
			? (await message.channel.messages.fetch(message.id)).author
			: message.author;

	if (msg_owner.bot || reactor.bot) return;

	const data = await prisma.reactionNotification.findUnique({
		where: {
			userId: msg_owner.id
		}
	});

	if (data?.isEnabled) {
		let dmChannel: DMChannel;
		if (msg_owner.dmChannel) dmChannel = msg_owner.dmChannel;
		else {
			logger.debug('dm not found, requesting one');
			try {
				dmChannel = await msg_owner.createDM();
			} catch (e) {
				logger.warn('Cannot create DM channel');
				return;
			}
		}
		try {
			const emoji = reaction.emoji;
			await dmChannel.send({
				embed: {
					description: `${emoji.id == null ? emoji.name : `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`} reacted by ${reactor} in ${message.channel} [**Jump To Message**](${message.url})`
				}
			});
		} catch (e) {
			logger.warn(`Unable to send DM to ${msg_owner.id} (${msg_owner.tag})`);
		}
	}
});