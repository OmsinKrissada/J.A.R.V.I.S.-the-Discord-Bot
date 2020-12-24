import { Command } from '../CommandManager';
import DataManager from '../DataManager';

Command.bot.on('voiceStateUpdate', async (_oldState, newState) => {

	class VoiceHook {
		type: string;
		voiceChannel: string;
		textChannel: string;
	}

	if (newState.member!.user.bot) return;
	let hooks: VoiceHook[] = (await DataManager.get(newState.guild.id)).hooks!;
	console.log(hooks)
	if (!hooks) {
		hooks = [];
	}
	hooks.forEach((hook: VoiceHook) => {
		if (hook.type == 'hard') {
			if (newState.channel && newState.channel.id == hook.voiceChannel) {
				newState.guild.channels.resolve(hook.textChannel)!.createOverwrite(newState.member!, { VIEW_CHANNEL: true });
			}
			else {
				newState.guild.channels.resolve(hook.textChannel)!.createOverwrite(newState.member!, { VIEW_CHANNEL: null });
			}
		}
		else if (hook.type == 'soft') {
			if (newState.channel && newState.channel.id == hook.voiceChannel) {
				newState.guild.channels.resolve(hook.textChannel)!.createOverwrite(newState.member!, { SEND_MESSAGES: true });
			}
			else {
				newState.guild.channels.resolve(hook.textChannel)!.createOverwrite(newState.member!, { SEND_MESSAGES: null });
			}
		}
	})

})