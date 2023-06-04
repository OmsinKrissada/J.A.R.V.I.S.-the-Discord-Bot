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
		if (joinAt && leaveAt - joinAt < 3500) {
			oldState.guild.systemChannel.send({
				embed: {
					description: `${oldState.member} peaked in <#${oldState.channel.id}> for **${Math.round((leaveAt - joinAt) / 100) / 10} s**`
				}
			});
		}
	}
});