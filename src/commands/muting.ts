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
	description: 'Spam mute a user',
	examples: ['mute <user id>'],
	requiredCallerPermissions: ['MUTE_MEMBERS'],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		mutedUserID.push(args[0]);
	}
})

new Command({
	name: 'unmute',
	category: 'features',
	description: 'Unmutes a user',
	examples: ['unmute <user id>'],
	requiredCallerPermissions: ['MUTE_MEMBERS'],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		mutedUserID = mutedUserID.filter(id => id != args[0]);
	}
})