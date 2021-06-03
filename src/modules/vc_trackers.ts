import { GuildMember, TextChannel } from 'discord.js';
import moment from 'moment';
import { Command } from '../CommandManager';
import { Helper } from '../Helper';
import { bot } from '../Main';
import { lastseen as lastseenManager } from '../DBManager';


const voiceJoinTimestamps = new Map<string, Map<string, Date>>();


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
		if (guild.member(user)) {
			const joinedTime = voiceJoinTimestamps.get(guild.id)?.get(user.id);
			if (joinedTime)
				message.channel.send(`**${user.tag}** has been in the channel for **${Helper.fullDurationString(moment.duration(new Date().getTime() - joinedTime.valueOf()))}**`);
			else message.channel.send(`Cannot find join timestamp of ${user}.`)
		}
		else message.channel.send(' Member not found')
	}
});

new Command({
	name: 'lastseen',
	category: 'misc',
	description: 'Shows the last time a user be in a voice channel.',
	examples: ['lastseen <user>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		const guild = message.guild;
		const user = await Helper.resolveUser(args.join(' '), { memberList: guild.members.cache.array(), askingChannel: <TextChannel>message.channel, caller: message.author });
		if (guild.member(user)) {
			const lastseen = await lastseenManager.getTimestamp(guild.id, user.id);
			if (lastseen) {
				if (lastseen.valueOf() == 0) message.channel.send(`This user is in a voice channel. Use \`${prefix}vctime\` command to see how long they've been in that channel.`)
				else message.channel.send(`**${user.tag}** was last seen at **${moment.utc(lastseen).format('lll z')} (${moment(lastseen).fromNow()})**`);
			}
			else message.channel.send(`Cannot find lastseen timestamp of **${user.tag}**.`)
		}
		else message.channel.send('Member not found')
	}
});


bot.on('voiceStateUpdate', (oldvs, newvs) => {
	const guild = newvs.guild, member = newvs.member;
	const guildJoinTimestamps = voiceJoinTimestamps.get(guild.id) ?? new Map<string, Date>();
	if (newvs.channel) {
		guildJoinTimestamps.set(member.id, new Date());
		lastseenManager.setTimestamp(guild.id, member.id, new Date(0))
	}
	else {
		guildJoinTimestamps.delete(member.id);
		lastseenManager.setTimestamp(guild.id, member.id, new Date());
	}
	voiceJoinTimestamps.set(guild.id, guildJoinTimestamps);
})