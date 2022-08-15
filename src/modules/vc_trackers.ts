import { TextChannel, User } from 'discord.js';
import { formatDistanceToNow, intlFormat } from 'date-fns';
import { Command } from '../CommandManager';
import { Helper } from '../Helper';
import { bot } from '../Main';
import { lastseen as lastseenManager } from '../DBManager';


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
		let user: User;
		if (args.length > 0)
			user = await Helper.resolveUser(args.join(' '), { memberList: guild.members.cache.array(), askingChannel: <TextChannel>message.channel, caller: message.author });
		else
			user = message.author;
		if (guild.member(user)) {
			const timestamp = await lastseenManager.getTimestamp(guild.id, user.id);
			if (timestamp) {
				if (await lastseenManager.getPresent(guild.id, user.id)) { // if present in a voice channel
					message.channel.send(`**${user.tag}** has been in a voice channel for \`${Helper.fullDurationString((Date.now() - timestamp.valueOf()) / 1000)}\`.`);
				}
				else message.channel.send(`**${user.tag}** was seen in a voice channel \`${formatDistanceToNow(timestamp, { addSuffix: true })}\`. ||(${intlFormat(timestamp, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })})||`);
			}
			else message.channel.send(`Cannot find timestamp of \`${user.tag}\`. The user has to join a voice channel at least once when I'm online in this server.`);
		}
		else message.channel.send('Member not found');
	}
});


bot.on('voiceStateUpdate', (oldvs, newvs) => {
	const guild = newvs.guild, member = newvs.member;
	if (newvs?.channel?.id == oldvs?.channel?.id) return;
	if (newvs.channel) { // if enter
		lastseenManager.setTimestamp(guild.id, member.id, new Date());
		lastseenManager.setPresent(guild.id, member.id, true);
	}
	else { // if leave
		lastseenManager.setTimestamp(guild.id, member.id, new Date());
		lastseenManager.setPresent(guild.id, member.id, false);
	}
});