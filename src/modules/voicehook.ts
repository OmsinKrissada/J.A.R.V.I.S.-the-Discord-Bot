import { DMChannel } from 'discord.js';
import { Command } from '../CommandManager';
import ConfigManager from '../ConfigManager';
import { hook_repository } from '../DBManager';
import { Helper } from '../Helper';
import { logger } from '../Logger';
import { bot } from '../Main';

bot.on('voiceStateUpdate', async (oldState, newState) => {
	if (newState.member.user.bot) return;

	const oldvc = oldState.channel;
	const newvc = newState.channel;

	if (oldvc?.id === newvc?.id) {
		return;
	}

	const hooks = await hook_repository.find({ select: ['textChannel_id', 'voiceChannel_id'], where: { guild_id: newState.guild.id } });
	if (hooks.length < 0) return;

	hooks.forEach((hook) => {
		const text = bot.channels.resolve(hook.textChannel_id);
		// const voice = bot.channels.resolve(hook.voiceChannel_id);
		if (!text.isText() || text instanceof DMChannel) {
			logger.warn(`${text.id} isn't a server text channel (from ${newState.guild.id})`);
			return;
		}

		if (!text) { // text channel not found
			logger.warn(`VoiceHook: TextChannel "${hook.textChannel_id}" doesn't exist in "${newState.guild.id}"`);
			return;
		}

		if (hook.voiceChannel_id === 'all') {
			if (newvc && !oldvc) {
				text.createOverwrite(newState.member.id, { VIEW_CHANNEL: true });
			} else if (!newvc && oldvc) {
				text.createOverwrite(oldState.member.id, { VIEW_CHANNEL: false });
			}
			return;
		}

		if (newvc?.id === hook.voiceChannel_id) {
			text.createOverwrite(newState.member.id, { VIEW_CHANNEL: true });
		} else if (oldvc?.id === hook.voiceChannel_id) {
			text.createOverwrite(oldState.member.id, { VIEW_CHANNEL: false });
		}
	});

});

new Command({
	name: 'hook',
	category: 'features',
	description: 'Hooks text and voice channel, only people in a voice channel can see a text channel.',
	examples: ['hook list', 'hook add 863052266423320928 863052266423939274', 'hook add 863052266423320928 863052266423939274', 'hook add 863052266423320928 all', 'hook remove 15'],
	requiredCallerPermissions: ['MANAGE_CHANNELS'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MANAGE_CHANNELS'],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		const sub_command = args[0];
		if (sub_command.toLowerCase() === 'list') {
			const hooks = await hook_repository.find({ where: { guild_id: message.guild.id } });
			message.channel.send({
				embed: {
					title: 'Channel Hooks',
					description: hooks.map(h => `\`${h.id}\` - ${bot.channels.resolve(h.textChannel_id).toString()} <-> ${h.voiceChannel_id === 'all' ? '\`All VC\`' : bot.channels.resolve(h.voiceChannel_id).toString()}`).join('\n'),
					color: ConfigManager.colors.blue
				}
			});
		} else if (sub_command.toLowerCase() === 'add') {
			const textId = args[1];
			const voiceId = args[2];
			if (!textId || !voiceId) {
				message.channel.send({
					embed: {
						title: 'Not enough arguments',
						description: `Please provide both text and voice channel id.`,
						color: ConfigManager.colors.red
					}
				});
				return;
			}
			const available_texts = message.guild.channels.cache.filter(c => c.type == 'text');
			const available_voices = message.guild.channels.cache.filter(c => c.type == 'voice');
			if (!available_texts.some(c => c.id === textId)) {
				message.channel.send({
					embed: {
						title: 'Text channel not found',
						description: 'Please make sure the id is correct and I can see the channel.',
						color: ConfigManager.colors.red
					}
				});
				return;
			}
			if (args[2].toLowerCase() != 'all' && !available_voices.some(c => c.id === voiceId)) {
				message.channel.send({
					embed: {
						title: 'Voice channel not found',
						description: 'Please make sure the id is correct and I can see the channel.',
						color: ConfigManager.colors.red
					}
				});
				return;
			}

			const isExists = (await hook_repository.find({ where: { textChannel_id: textId, voiceChannel_id: voiceId } })).length > 0;
			if (isExists) {
				message.channel.send({
					embed: {
						title: 'This hook already exists.',
						color: ConfigManager.colors.red
					}
				});
			} else {
				hook_repository.insert({ textChannel_id: textId, voiceChannel_id: voiceId, guild_id: message.guild.id });
				message.channel.send({
					embed: {
						title: 'Hook Created',
						color: ConfigManager.colors.green
					}
				});
			}
		} else if (sub_command.toLowerCase() === 'remove') {
			const id = args[1];
			const gonna_delete = await hook_repository.findOne(id);
			if (gonna_delete) {
				hook_repository.remove(gonna_delete);
				message.channel.send({
					embed: {
						title: 'Hook Deleted',
						color: ConfigManager.colors.green
					}
				});
			} else {
				message.channel.send({
					embed: {
						title: 'Invalid Hook ID',
						description: `Hook with ID ${Helper.inlineCodeBlock(id)} does not exist.`,
						color: ConfigManager.colors.red
					}
				});
			}
		} else {
			message.channel.send({
				embed: {
					title: 'Usage',
					description: `\`${prefix}list\` - Lists all hooks on this server.\n` +
						`\`${prefix}add <text channel id> <voice channel id>/"all"\` - Adds a hook (provide \`all\` to hook with every voice channel.).\n` +
						`\`${prefix}remove <id>\` - Removes a hook (get hook id from \`list\` command).\n`
				}
			});
		}
	}
});