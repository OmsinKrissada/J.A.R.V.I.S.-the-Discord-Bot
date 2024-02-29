import { MessageEmbed, TextChannel } from 'discord.js';
import { Command } from '../CommandManager';
import * as Helper from '../Helper';


new Command({
	name: 'kick',
	category: 'moderation',
	description: 'Kicks a user from the server',
	examples: ['kick'],
	requiredCallerPermissions: ['KICK_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES', "KICK_MEMBERS", "EMBED_LINKS", "VIEW_CHANNEL"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		Helper.resolveUser(args[0], { askingChannel: <TextChannel>message.channel, caller: message.author, memberList: message.guild.members.cache.array() }).then(usr => {
			const member = message.guild.member(usr);
			const reason = args.slice(1).join(' ');
			if (!member) {
				message.channel.send(new MessageEmbed({
					description: 'User not found, please use mention or user id.',
					color: Helper.RED
				}));
				return;
			}
			if (member.kickable) {
				member.kick(reason).then(() => {
					message.channel.send(new MessageEmbed({
						description: `🙋‍♂️ Kicked ${usr}` + (reason ? ` for "${reason}"` : ''),
						color: Helper.GREEN
					}));
				});
			}
			else {
				message.channel.send(new MessageEmbed({
					description: `⛔ Unable to kick ${member} ⛔`,
					color: Helper.RED
				}));
			}
		});
	}
});

new Command({
	name: 'ban',
	category: 'moderation',
	description: '',
	examples: ['ban', 'ban [days] [reason]'],
	requiredCallerPermissions: ['BAN_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES', "BAN_MEMBERS", "EMBED_LINKS", "VIEW_CHANNEL"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		Helper.resolveUser(args[0], { askingChannel: <TextChannel>message.channel, caller: message.author, memberList: message.guild.members.cache.array() }).then(usr => {
			const member = message.guild.member(usr);
			const reason = args.slice(2).join(' ');
			if (!member) {
				message.channel.send(new MessageEmbed({
					description: 'User not found, please use mention or user id.',
					color: Helper.RED
				}));
				return;
			}
			if (member.bannable) {
				if (isNaN(+args[1])) {
					message.channel.send('Invalid day length');
					return;
				}
				member.ban({ days: +args[1], reason: reason }).then(() => {
					message.channel.send(new MessageEmbed({
						description: `Banned ${member}` + (reason ? ` for "${reason}"` : ''),
						color: Helper.GREEN
					}));
				});
			}
			else {
				message.channel.send(new MessageEmbed({
					description: `⛔ Unable to ban ${member} ⛔`,
					color: Helper.RED
				}));
			}
		});
	}
});

new Command({
	name: 'mute',
	category: 'moderation',
	description: '',
	examples: [],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	exec(message, prefix, args, sourceID) { }
});

new Command({
	name: 'unmute',
	category: 'moderation',
	description: '',
	examples: [],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	exec(message, prefix, args, sourceID) { }
});