import { bot } from '../Main';

bot.on('voiceStateUpdate', (oldvs, newvs) => {
	if (newvs.channel && newvs.channel.userLimit > 0 && newvs.channel.members.size > newvs.channel.userLimit) {
		console.log(newvs.channel.userLimit)
		if (oldvs.channel) newvs.member.voice.setChannel(oldvs.channel);
		else newvs.member.voice.kick();
	}
})