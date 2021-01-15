import { Command } from '../CommandManager';
import { GuildMember, MessageEmbed, Permissions } from 'discord.js';
import { Helper } from '../Helper';
import * as DataManager from '../DataManager';

let mutedUserID: string[] = [];

Command.bot.on('voiceStateUpdate', (_old, vs) => {
	// console.log(vs.member!.id)
	if (mutedUserID.includes(vs.member!.id) && !vs.mute) {
		// console.log(vs.member!.id)
		vs.setMute(true);
		// console.log(vs.mute)
	}
})

Command.bot.on('message', msg => {
	if (mutedUserID.includes(msg.author.id)) {
		if (msg.deletable) msg.delete();
	}
})

new Command({
	name: 'mute',
	category: 'features',
	description: 'Mutes a user',
	examples: ['mute <user id>/<mention>'],
	requiredCallerPermissions: ['MUTE_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MUTE_MEMBERS'],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const member = message.mentions.members!.size > 0 ? message.mentions.members!.first() : message.guild!.member(args[0]);
		if (member) {
			if (member.voice.channel) {
				if (member.voice.serverMute) {
					message.channel.send(new MessageEmbed({
						description: member.toString() + ' is already server-muted',
						color: Helper.YELLOW
					}))
				} else {
					member.voice.setMute(true);
					message.channel.send(new MessageEmbed({
						description: '🔇 Successfully muted ' + member.toString(),
						color: Helper.GREEN
					}))
				}
			}
			else {
				message.channel.send(new MessageEmbed({
					description: member.toString() + ' isn\'t in a voice channel',
					color: Helper.RED
				}))
			}
		} else {
			message.channel.send(new MessageEmbed({
				description: `User with id \`${args[0]}\` not found`,
				color: Helper.RED
			}))
		}
	}
})

new Command({
	name: 'unmute',
	category: 'features',
	description: 'Unmutes a user',
	examples: ['unmute <user id>'],
	requiredCallerPermissions: ['MUTE_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MUTE_MEMBERS'],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const member = message.mentions.members!.size > 0 ? message.mentions.members!.first() : message.guild!.member(args[0]);
		if (member) {
			if (member.voice.channel) {
				if (!member.voice.serverMute) {
					message.channel.send(new MessageEmbed({
						description: member.toString() + ' is not server-muted',
						color: Helper.YELLOW
					}))
				} else {
					member.voice.setMute(false);
					message.channel.send(new MessageEmbed({
						description: '🔉 Successfully unmuted ' + member.toString(),
						color: Helper.GREEN
					}))
				}
			}
			else {
				message.channel.send(new MessageEmbed({
					description: member.toString() + ' isn\'t in a voice channel',
					color: Helper.RED
				}))
			}
		} else {
			message.channel.send(new MessageEmbed({
				description: `User with id \`${args[0]}\` not found`,
				color: Helper.RED
			}))
		}
	}
})