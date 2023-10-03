import { logger } from "../Logger";
import { bot } from "../Main";

const joinTime = new Map<string, number>();

bot.on('voiceStateUpdate', (oldState, newState) => {
	// on join
	if (!oldState.channel && newState.channel) {
		joinTime.set(oldState.member.id, new Date().valueOf());
	}
	// on leave
	if (oldState.channel && !newState.channel) {
		const joinAt = joinTime.get(oldState.member.id);
		const leaveAt = new Date().valueOf();
		if (joinAt && leaveAt - joinAt < 5000) {
			oldState.guild.systemChannel.send({
				embed: {
					description: `${oldState.member} peaked in <#${oldState.channel.id}> for **${Math.round((leaveAt - joinAt) / 100) / 10} s**`
				}
			}).catch(err => {
				logger.warn(`Cannot send anti-peak message to channel ${oldState.guild.systemChannel} of ${oldState.guild.id}: ${err}`);

			});
		}
	}
});