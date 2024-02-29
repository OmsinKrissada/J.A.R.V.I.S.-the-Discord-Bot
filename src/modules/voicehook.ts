import { DMChannel, GuildMember } from 'discord.js';
import { Command } from '../CommandManager';
import ConfigManager from '../ConfigManager';
import { prisma } from '../DBManager';
import * as Helper from '../Helper';
import { logger } from '../Logger';
import { bot } from '../Main';

bot.on('voiceStateUpdate', async (oldState, newState) => {
	if (newState.member.user.bot) return;

	const guild = newState.guild;
	const oldvc = oldState.channel;
	const newvc = newState.channel;

	if (oldvc?.id === newvc?.id) {
		return;
	}

	const hooks = await prisma.channelHook.findMany({
		select: { id: true, textChannelId: true, voiceChannelId: true },
		where: { guildId: guild.id }
	});
	if (!hooks.length) return;


	hooks.forEach(async (hook) => {
		const text = bot.channels.resolve(hook.textChannelId);
		const voice = bot.channels.resolve(hook.voiceChannelId);
		if (!text) {
			logger.warn(`Text channel ${hook.textChannelId} not found in ${guild.id}, removing hook.`);
			prisma.channelHook.delete({ where: { id: hook.id } });
			return;
		}
		if (hook.voiceChannelId != 'all' && !voice) {
			logger.warn(`Voice channel ${hook.textChannelId} not found in ${guild.id}, removing hook.`);
			prisma.channelHook.delete({ where: { id: hook.id } });
			return;
		}
		if (!text.isText() || text instanceof DMChannel) {
			logger.warn(`${text.id} isn't a server text channel (from ${guild.id})`);
			return;
		}

		if (!text) { // text channel not found
			logger.warn(`VoiceHook: TextChannel "${hook.textChannelId}" doesn't exist in "${guild.id}"`);
			return;
		}

		try {
			if (newState.member.hasPermission('ADMINISTRATOR')) {
				logger.debug(`${newState.member.id} has admin permissions, skipping voicehook checks.`);
				return;
			}

			if (hook.voiceChannelId === 'all') {
				if (newvc && !oldvc) { // on join
					logger.debug(`Updating voicehook for ${newState.member.id} [add all]`);
					await text.updateOverwrite(newState.member.id, { VIEW_CHANNEL: true });
				} else if (!newvc && oldvc) { // on leave
					logger.debug(`Updating voicehook for ${newState.member.id} [remove all]`);
					await text.updateOverwrite(oldState.member.id, { VIEW_CHANNEL: false });
				}
				return;
			}

			if (newvc?.id === hook.voiceChannelId) {
				logger.debug(`Updating voicehook for ${newState.member.id} [add ${hook.voiceChannelId}]`);
				await text.updateOverwrite(newState.member.id, { VIEW_CHANNEL: true });
			} else if (oldvc?.id === hook.voiceChannelId) {
				logger.debug(`Updating voicehook for ${newState.member.id} [remove ${hook.voiceChannelId}]`);
				await text.updateOverwrite(oldState.member.id, { VIEW_CHANNEL: false });
			}
		} catch (e) {
			logger.warn(`Unable to update voicehook of ${newState.member.id}: ${e}`);
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
			const hooks = await prisma.channelHook.findMany({ where: { guildId: message.guild.id } });
			message.channel.send({
				embed: {
					title: 'Channel Hooks',
					description: hooks.map(h => `\`${h.id}\` - ${bot.channels.resolve(h.textChannelId)?.toString()} <-> ${h.voiceChannelId === 'all' ? '\`All VC\`' : bot.channels.resolve(h.voiceChannelId)?.toString()}`).join('\n'),
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

			const isExists = (await prisma.channelHook.findMany({ where: { textChannelId: textId, voiceChannelId: voiceId } })).length > 0;
			if (isExists) {
				message.channel.send({
					embed: {
						title: 'This hook already exists.',
						color: ConfigManager.colors.red
					}
				});
			} else {
				prisma.channelHook.create({
					data: {
						textChannelId: textId,
						voiceChannelId: voiceId,
						guildId: message.guild.id
					}
				}).then(() => {
					message.channel.send({
						embed: {
							title: 'Hook Created',
							color: ConfigManager.colors.green
						}
					});

				});
			}
		} else if (sub_command?.toLowerCase() === 'remove') {
			const id = +args[1];
			if (isNaN(id)) {
				message.channel.send({
					embed: {
						title: 'Invalid Hook ID',
						description: 'Hook ID must be a number',
						color: ConfigManager.colors.red
					}
				});
				return;
			}
			const deleted = await prisma.channelHook.delete({ where: { id } });
			if (deleted) {
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
						description: `Hook with ID ${Helper.inlineCodeBlock(String(id))} does not exist.`,
						color: ConfigManager.colors.red
					}
				});
			}
		} else if (sub_command?.toLowerCase() === 'forceupdate') {

			const loading = await message.channel.send('<a:loading:845534883396583435> Updating, please wait. This might take about a minute due to discord rate limit.');
			const updateResult = await updateHooks(message.guild.id);
			if (!updateResult) {
				loading.edit(`<:checkmark:849685283459825714> No hooks found, no need to update.`);
				return;
			}
			const { added, failed, removed, failed_members } = updateResult;
			logger.debug('Done checking hooks');
			const n_processed = added + removed + failed;
			if (n_processed > 0)
				loading.edit(`**\`${n_processed}\` misconfigured permission(s) detected.**\nRemoved access from \`${removed}\` members.\nAdded access to \`${added}\` members.\nFailed to modify access of \`${failed}\` members. \`(${failed_members.map(m => `Hook~${m.hookID}:${m.member.user.tag}`).join(', ') || 'None'})\``);
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

async function updateHooks(guild_id: string): Promise<{ added: number; removed: number; failed: number; failed_members: { member: GuildMember, hookID: string; }[]; }> {
	let n_removed = 0, n_added = 0, n_failed = 0;
	let guild;
	try {
		guild = await bot.guilds.fetch(guild_id);
	} catch (e) {
		logger.error(`Cannot access guild ${guild_id}`);
		return;
	}

	const hooks = await prisma.channelHook.findMany({ where: { guildId: guild_id } });
	if (!hooks?.length) {
		logger.debug('No hooks found');
		return;
	}

	const failed_members: { member: GuildMember, hookID: string; }[] = [];
	for (const hook of hooks) {
		logger.debug(`Checking hook: ${hook.textChannelId}(text) to ${hook.voiceChannelId}(voice)`);
		const text_channel = guild.channels.resolve(hook.textChannelId);

		if (!text_channel) {
			logger.warn(`Error: The following hook has link to an unknown channel: ${hook.id}, skipping.`);
			continue;
		}

		const voice_channel = hook.voiceChannelId == 'all' ? null : guild.channels.resolve(hook.voiceChannelId);

		const filter = (m: GuildMember) => !m.hasPermission('ADMINISTRATOR') && !m.user.bot;

		// Remove from text
		for (const m of text_channel.members.filter(filter).array()) {
			// if ((m.voice.channel && hook.voiceChannel_id == 'all') || (m.voice.channel.id == hook.voiceChannel_id)) 
			logger.debug(`Checking if access of ${m.user.tag} should be removed`);
			const isUserPresent = hook.voiceChannelId == 'all' ? !!m.voice.channel : m.voice.channel && m.voice.channel.id == hook.voiceChannelId;
			if (!isUserPresent) {
				try {
					logger.debug(`Removing access of ${m.user.tag} to ${text_channel.name}(${text_channel.id})`);
					await text_channel.updateOverwrite(m, { VIEW_CHANNEL: false });
					n_removed++;
				} catch (err) {
					logger.warn(`Failed to remove access of ${m.user.tag} from ${text_channel.name}(${text_channel.id})`);
					failed_members.push({ member: m, hookID: hook.id + '' });
					n_failed++;
				}
			}
		}

		// Add to text
		const logic = async (member: GuildMember) => {
			if (!text_channel.permissionsFor(member).has('VIEW_CHANNEL')) {
				try {
					logger.debug(`Adding access of ${member.user.tag} to ${text_channel.name}(${text_channel.id})`);
					await text_channel.updateOverwrite(member, { VIEW_CHANNEL: true });
					n_added++;
				} catch (err) {
					logger.warn(`Failed to add access of ${member.user.tag} to ${text_channel.name}(${text_channel.id})`);
					failed_members.push({ member: member, hookID: String(hook.id) });
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
			const all_voice_channel = guild.channels.cache.filter(c => c.type == 'voice');
			for (const vc of all_voice_channel.array()) for (const m of vc.members.array().filter(filter)) {
				logger.debug(`Checking if access of ${m.user.tag} should be added`);
				logic(m);
			}
		}
	}
	// logger.info('');
	logger.info(`Done checking hooks for ${guild_id} aka ${guild.name}:`);
	if (n_added > 0) logger.info(`  Added: ${n_added}`);
	if (n_removed > 0) logger.info(`  Removed: ${n_removed}`);
	if (n_failed > 0) logger.info(`  Failed: ${n_failed}`);
	if (failed_members.length > 0) logger.info(`  Failed members: ${failed_members.map(m => `Hook~${m.hookID}:${m.member.user.tag}`).join(', ')}`);
	return { added: n_added, removed: n_removed, failed: n_failed, failed_members };
}

bot.once('ready', async () => {
	logger.info('Probe updating voicehooks...');
	const hooks = await prisma.channelHook.findMany({ select: { guildId: true } });
	const guildIds = new Set<string>();
	hooks.forEach(h => guildIds.add(h.guildId));
	for (const guildId of guildIds.values()) {
		logger.debug(`Updating hooks for ${guildId}`);
		await updateHooks(guildId);
	}
});