import { MessageEmbed } from 'discord.js';
import { Command } from '../CommandManager';
import { Helper } from '../Helper';


new Command({
	name: 'kick',
	category: 'moderation',
	description: 'Kicks a user from the server',
	examples: ['kick'],
	requiredCallerPermissions: ['KICK_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		Helper.resolveUser(args[0]).then(usr => {
			const member = message.guild.member(usr);
			const reason = args.slice(1).join(' ');
			if (member.kickable) {
				member.kick(reason).then(() => {
					message.channel.send(new MessageEmbed({
						description: `🙋‍♂️ Kicked ${usr}` + (reason ? ` for "${reason}"` : ''),
						color: Helper.GREEN
					}));
				})
			}
			else {
				message.channel.send(new MessageEmbed({
					description: `⛔ Unable to kick ${member} ⛔`,
					color: Helper.RED
				}));
			}
		})
	}
});

new Command({
	name: 'ban',
	category: 'moderation',
	description: '',
	examples: ['ban', 'ban [days] [reason]'],
	requiredCallerPermissions: ['BAN_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		Helper.resolveUser(args[0]).then(usr => {
			const member = message.guild.member(usr);
			if (member.bannable) {
				if (isNaN(+args[1])) {
					message.channel.send('Invalid day length');
					return;
				}
				member.ban({ days: +args[1], reason: args[2] }).then(() => {
					message.channel.send(new MessageEmbed({
						description: `Banned ${member}`,
						color: Helper.GREEN
					}));
				})
			}
			else {
				message.channel.send(new MessageEmbed({
					description: `⛔ Unable to ban ${member} ⛔`,
					color: Helper.RED
				}));
			}
		})
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