import { getGuildSettings } from '../DBManager';
import { bot } from '../Main';

bot.on('voiceStateUpdate', async (oldvs, newvs) => {
	const condition = newvs.channel && (await getGuildSettings(newvs.guild.id)).enforceUserLimit && newvs.channel.userLimit > 0 && newvs.channel.members.size > newvs.channel.userLimit;
	if (condition) {
		console.log(newvs.channel.userLimit);
		if (oldvs.channel && !(oldvs.channel.userLimit > 0 && newvs.channel.members.size >= oldvs.channel.userLimit)) newvs.member.voice.setChannel(oldvs.channel);
		else newvs.member.voice.kick();
	}
});