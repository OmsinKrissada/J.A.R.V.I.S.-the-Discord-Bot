import { Guild, TextChannel, User } from 'discord.js';
import { formatDistanceToNow, intlFormat } from 'date-fns';
import { Command } from '../CommandManager';
import * as Helper from '../Helper';
import { bot } from '../Main';
import { prisma } from '../DBManager';


new Command({
	name: 'seen',
	category: 'misc',
	description: "Shows a user's presence status.",
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
			try {
				const { isPresent, timestamp } = await prisma.voicePresence.findFirstOrThrow({ where: { guildId: guild.id, memberId: user.id } });
				if (isPresent) { // if present in a voice channel
					message.channel.send(`**${user.tag}** has been in current voice channel for \`${Helper.fullDurationString((Date.now() - timestamp.valueOf()) / 1000)}\`.`);
				}
				else message.channel.send(`**${user.tag}** was seen in a voice channel __<t:${Math.round(timestamp.getTime()/1000)}:R>__.`);
			} catch {
				message.channel.send(`Cannot find timestamp of \`${user.tag}\`. The user has to join a voice channel at least once when I'm online in this server.`);
			}
		}
		else message.channel.send('Member not found');
	}
});


bot.on('voiceStateUpdate', async (oldvs, newvs) => {
	const guild = newvs.guild, member = newvs.member;
	if (newvs?.channel?.id == oldvs?.channel?.id) return; // ignore mute and deafen events
	// on enter
	if (newvs.channel) {
		const updated = await prisma.voicePresence.updateMany({
			where: {
				guildId: guild.id,
				memberId: member.id
			},
			data: {
				isPresent: true,
				timestamp: new Date()
			},
		});
		if (!updated.count) {
			await prisma.voicePresence.create({
				data: {
					guildId: guild.id,
					memberId: member.id,
					isPresent: true,
					timestamp: new Date()
				}
			});
		}
	}
	// on leave
	else {
		const updated = await prisma.voicePresence.updateMany({
			where: {
				guildId: guild.id,
				memberId: member.id
			},
			data: {
				isPresent: false,
				timestamp: new Date()
			},
		});
		if (!updated.count) {
			await prisma.voicePresence.create({
				data: {
					guildId: guild.id,
					memberId: member.id,
					isPresent: false,
					timestamp: new Date()

				}
			});
		}
	}
});