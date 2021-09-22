import { DMChannel, GuildMember } from 'discord.js';
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
		if (sub_command?.toLowerCase() === 'list') {
			const hooks = await hook_repository.find({ where: { guild_id: message.guild.id } });
			message.channel.send({
				embed: {
					title: 'Channel Hooks',
					description: hooks.map(h => `\`${h.id}\` - ${bot.channels.resolve(h.textChannel_id)?.toString()} <-> ${h.voiceChannel_id === 'all' ? '\`All VC\`' : bot.channels.resolve(h.voiceChannel_id)?.toString()}`).join('\n'),
					color: ConfigManager.colors.blue
				}
			});
		} else if (sub_command?.toLowerCase() === 'add') {
			const textId = args[1];
			const voiceId = args[2];
			if (!textId || !voiceId) {
				message.channel.send({
					embed: {
						title: 'Not enough arguments',
						description: `Please provide both text and voice channel id. (use "all" for voice channel if you wish to link with all vc)`,
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
		} else if (sub_command?.toLowerCase() === 'remove') {
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
		} else if (sub_command?.toLowerCase() === 'forceupdate') {
			const hooks = await hook_repository.find({ where: { guild_id: message.guild.id } });
			if (!hooks?.length) {
				message.channel.send('No hooks found');
				return;
			}
			const loading = await message.channel.send('<a:loading:845534883396583435> Updating, please wait. This might take about a minute due to rate limit.');

			let n_removed = 0, n_added = 0, n_failed = 0;
			const failed_members: { member: GuildMember, hookID: string; }[] = [];
			for (const hook of hooks) {
				logger.debug(`Checking hook: ${hook.textChannel_id} <-> ${hook.voiceChannel_id}`);
				const text_channel = message.guild.channels.resolve(hook.textChannel_id);
				if (!text_channel) {
					loading.edit(`Error: The following hook has link to an unknown channel: ` + hook.id);
				}
				const voice_channel = hook.voiceChannel_id == 'all' ? null : message.guild.channels.resolve(hook.voiceChannel_id);

				const filter = (m: GuildMember) => !m.hasPermission('ADMINISTRATOR') && !m.user.bot;

				// Remove from text
				for (const m of text_channel.members.filter(filter).array()) {
					// if ((m.voice.channel && hook.voiceChannel_id == 'all') || (m.voice.channel.id == hook.voiceChannel_id)) 
					logger.debug(`Checking if access of ${m.user.tag} should be removed`);
					const present_condition = hook.voiceChannel_id == 'all' ? !!m.voice.channel : m.voice.channel && m.voice.channel.id == hook.voiceChannel_id;
					if (!present_condition) {
						try {
							await text_channel.createOverwrite(m, { VIEW_CHANNEL: false });
							n_removed++;
						} catch (err) {
							logger.debug(`Failed to remove access of ${m.user.tag} from ${text_channel.name}(${text_channel.id})`);
							failed_members.push({ member: m, hookID: hook.id });
							n_failed++;
						}
					}
				}

				// Add to text
				const logic = async (member: GuildMember) => {
					if (!text_channel.permissionsFor(member).has('VIEW_CHANNEL')) {
						try {
							await text_channel.createOverwrite(member, { VIEW_CHANNEL: true });
							n_added++;
						} catch (err) {
							logger.debug(`Failed to add access of ${member.user.tag} to ${text_channel.name}(${text_channel.id})`);
							failed_members.push({ member: member, hookID: hook.id });
							n_failed++;
						}
					}
				};
				if (voice_channel) {
					for (const m of voice_channel.members.filter(filter).array()) {
						logger.debug(`Checking if access of ${m.user.tag} should be added`);
						logic(m);
					}
				} else { // if apply to all vc
					const all_voice_channel = message.guild.channels.cache.filter(c => c.type == 'voice');
					for (const vc of all_voice_channel.array()) for (const m of vc.members.array().filter(filter)) {
						logger.debug(`Checking if access of ${m.user.tag} should be added`);
						logic(m);
					}
				}

			}
			logger.debug('Done checking hooks');
			const n_processed = n_added + n_removed + n_failed;
			if (n_processed > 0)
				loading.edit(`**\`${n_processed}\` misconfigured permission(s) detected.**\nRemoved access from \`${n_removed}\` members.\nAdded access to \`${n_added}\` members.\nFailed to modify access of \`${n_failed}\` members. \`(${failed_members.map(m => `Hook~${m.hookID}:${m.member.user.tag}`).join(', ') || 'None'})\``);
			else
				loading.edit(`<:checkmark:849685283459825714> Everything is already well configured!`);
		} else {
			message.channel.send({
				embed: {
					title: 'Usage',
					description: `\`${prefix}hook list\` - Lists all hooks on this server.\n` +
						`\`${prefix}hook add <text channel id> <voice channel id>/"all"\` - Adds a hook (provide \`all\` to hook with every voice channel.).\n` +
						`\`${prefix}hook remove <id>\` - Removes a hook (get hook id from \`list\` command).\n` +
						`\`${prefix}hook forceupdate\` - Force the bot to recalculate all channel hooks.\n`
				}
			});
		}
	}
});