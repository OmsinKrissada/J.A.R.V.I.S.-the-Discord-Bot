import DataManager from '../DataManager';
import { logger } from '../Logger';
import { bot } from '../Main';

bot.on('voiceStateUpdate', async (_oldState, newState) => {

	class VoiceHook {
		type: string;
		voiceChannel: string;
		textChannel: string;
	}

	if (newState.member!.user.bot) return;
	let hooks: VoiceHook[] = (await DataManager.get(newState.guild.id)).hooks!;
	// console.log(hooks)
	if (!hooks) {
		hooks = [];
	}
	hooks.forEach((hook: VoiceHook) => {
		const text = newState.guild.channels.resolve(hook.textChannel);
		if (!text) {
			logger.warn(`TextChannel ${hook.textChannel} doesn't exist in ${newState.guild.id}`);
			return;
		}
		if (hook.type == 'hard') {
			if (newState.channel && newState.channel.id == hook.voiceChannel) {
				text.createOverwrite(newState.member!, { VIEW_CHANNEL: true });
			}
			else {
				text.createOverwrite(newState.member!, { VIEW_CHANNEL: null });
			}
		}
		else if (hook.type == 'soft') {
			if (newState.channel && newState.channel.id == hook.voiceChannel) {
				text.createOverwrite(newState.member!, { SEND_MESSAGES: true });
			}
			else {
				text.createOverwrite(newState.member!, { SEND_MESSAGES: null });
			}
		}
	})

})