import { Command } from '../CommandManager';
import { MessageEmbed, TextChannel } from 'discord.js';
import { Helper } from '../Helper';
import { bot } from '../Main';

let mutedUserID: string[] = [];

bot.on('voiceStateUpdate', (_old, vs) => {
	// console.log(vs.member!.id)
	if (mutedUserID.includes(vs.member!.id) && !vs.mute) {
		// console.log(vs.member!.id)
		vs.setMute(true);
		// console.log(vs.mute)
	}
})

bot.on('message', msg => {
	if (mutedUserID.includes(msg.author.id)) {
		if (msg.deletable) msg.delete();
	}
})

new Command({
	name: 'voicemute',
	category: 'moderation',
	description: 'Mutes a user',
	examples: ['mute <user id>/<mention>'],
	requiredCallerPermissions: ['MUTE_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MUTE_MEMBERS'],
	serverOnly: true,
	async exec(message, args) {
		const member = message.guild.member(await Helper.resolveUser(args[0], { askingChannel: <TextChannel>message.channel, caller: message.author, memberList: message.guild.members.cache.array() }));
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
	name: 'voiceunmute',
	category: 'moderation',
	description: 'Unmutes a user',
	examples: ['unmute <user id>'],
	requiredCallerPermissions: ['MUTE_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MUTE_MEMBERS'],
	serverOnly: true,
	async exec(message, args) {
		const member = message.guild.member(await Helper.resolveUser(args[0], { askingChannel: <TextChannel>message.channel, caller: message.author, memberList: message.guild.members.cache.array() }));
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

new Command({
	name: 'mutein',
	category: 'moderation',
	description: 'Mutes all users in a voice channel',
	examples: ['mute <channelid>'],
	requiredCallerPermissions: ['MUTE_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MUTE_MEMBERS'],
	serverOnly: true,
	exec(message, args) {
		const channel = message.guild!.channels.resolve(args[0]);

		if (channel && channel.type == 'voice') {

			const users: string[] = [];

			channel.members.forEach(user => {
				if (!user.voice.serverMute) {
					user.voice.setMute(true);
					users.push(user.user.toString());
				}
			})

			message.channel.send(new MessageEmbed({
				title: `🔇 Muted users in ${Helper.inlineCodeBlock(channel.name)}`,
				description: users.join('\n'),
				color: Helper.GREEN
			}));

		} else {
			message.channel.send(new MessageEmbed({
				description: `Channel with id ${Helper.inlineCodeBlock(args[0])} is either not a voice channel or not exist`,
				color: Helper.RED
			}));
		}

	}
})

new Command({
	name: 'unmutein',
	category: 'moderation',
	description: 'Unmutes all users in a voice channel',
	examples: ['mute <channelid>'],
	requiredCallerPermissions: ['MUTE_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MUTE_MEMBERS'],
	serverOnly: true,
	exec(message, args) {
		const channel = message.guild!.channels.resolve(args[0]);

		if (channel && channel.type == 'voice') {

			const users: string[] = [];

			channel.members.forEach(user => {
				if (user.voice.serverMute) {
					user.voice.setMute(false);
					users.push(user.user.toString());
				}
			})

			message.channel.send(new MessageEmbed({
				title: `🔉 Unmuted users in ${Helper.inlineCodeBlock(channel.name)}`,
				description: users.join('\n'),
				color: Helper.GREEN
			}));

		} else {
			message.channel.send(new MessageEmbed({
				description: `Channel with id ${Helper.inlineCodeBlock(args[0])} is either not a voice channel or not exist`,
				color: Helper.RED
			}));
		}

	}
})