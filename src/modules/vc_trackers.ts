import { TextChannel } from 'discord.js';
import moment from 'moment';
import { Command } from '../CommandManager';
import { Helper } from '../Helper';
import { bot } from '../Main';
import { lastseen as lastseenManager } from '../DBManager';


const voiceJoinTimestamps = new Map<string, Map<string, Date>>();


new Command({
	name: 'vctime',
	category: 'hidden',
	description: 'Shows how long a user has been in a voice channel. (Deprecated)',
	examples: ['vctime <user>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		message.channel.send(`I've merged this command with \`${prefix}seen\`, please use that command instead.`);
	}
});

new Command({
	name: 'seen',
	category: 'misc',
	description: 'Shows how long a user hasn\'t been in a voice channel.',
	examples: ['seen <user>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		const guild = message.guild;
		const user = await Helper.resolveUser(args.join(' '), { memberList: guild.members.cache.array(), askingChannel: <TextChannel>message.channel, caller: message.author });
		if (guild.member(user)) {
			const lastseen = await lastseenManager.getTimestamp(guild.id, user.id);
			if (lastseen) {
				if (lastseen.valueOf() == 0) {
					const joinedTime = voiceJoinTimestamps.get(guild.id)?.get(user.id);
					if (joinedTime)
						message.channel.send(`\`${user.tag}\` has been in voice channel for **${Helper.fullDurationString(moment.duration(new Date().getTime() - joinedTime.valueOf()))}**`);
					else message.channel.send(`Cannot find join timestamp of \`${user.tag}\`. The user has to join a vc at least once when I'm online in this server.`);
				}
				else message.channel.send(`\`${user.tag}\` was last seen in a voice channel at **${moment.utc(lastseen).format('lll z')} (${moment(lastseen).fromNow()})**`);
			}
			else message.channel.send(`Cannot find lastseen timestamp of \`${user.tag}\`. The user has to join a vc at least once when I'm online in this server.`);
		}
		else message.channel.send('Member not found');
	}
});


bot.on('voiceStateUpdate', (oldvs, newvs) => {
	const guild = newvs.guild, member = newvs.member;
	const guildJoinTimestamps = voiceJoinTimestamps.get(guild.id) ?? new Map<string, Date>();
	if (newvs?.channel?.id == oldvs?.channel?.id) return;
	if (newvs.channel) { // if enter
		guildJoinTimestamps.set(member.id, new Date());
		lastseenManager.setTimestamp(guild.id, member.id, new Date(0));
	}
	else { // if leave
		guildJoinTimestamps.delete(member.id);
		lastseenManager.setTimestamp(guild.id, member.id, new Date());
	}
	voiceJoinTimestamps.set(guild.id, guildJoinTimestamps);
});