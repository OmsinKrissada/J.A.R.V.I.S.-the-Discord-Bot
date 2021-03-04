import { GuildMember, TextChannel } from 'discord.js';
import moment from 'moment';
import { Command } from '../CommandManager';
import { Helper } from '../Helper';
import { bot } from '../Main';


const voiceJoinTimestamps = new Map<string, Map<string, number>>();


new Command({
	name: 'vctime',
	category: 'misc',
	description: 'Shows how long a user has been in a voice channel.',
	examples: ['vctime <user>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		const guild = message.guild;
		const user = await Helper.resolveUser(args.join(' '), { memberList: guild.members.cache.array(), askingChannel: <TextChannel>message.channel, caller: message.author });
		const member = guild.member(user);
		if (member) {
			const joinedTime = voiceJoinTimestamps.get(guild.id)?.get(member.id);
			if (joinedTime)
				message.channel.send(`**${member.user.tag}** has been in the channel for **${Helper.fullDurationString(moment.duration(new Date().getTime() - joinedTime))}**`);
			else message.channel.send(`Cannot find join timestamp of ${member}.`)
		}
		else message.channel.send('Member not found')
	}
});


bot.on('voiceStateUpdate', (oldvs, newvs) => {
	const guildTimestamps = voiceJoinTimestamps.get(newvs.guild.id) ?? new Map<string, number>();
	if (newvs.channel) guildTimestamps.set(newvs.member.id, new Date().getTime());
	else guildTimestamps.delete(newvs.member.id);
	voiceJoinTimestamps.set(newvs.guild.id, guildTimestamps);
})