import { Command } from '../CommandManager';
import moment from 'moment';
import { Helper } from '../Helper';
import { TextChannel } from 'discord.js';
import ms from 'ms';


export default new Command({
	name: 'test',
	category: 'hiden',
	description: 'for testing',
	examples: ['test'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: false,
	async exec(message, prefix, args, sourceID) {
		// Helper.resolveUser(args[0], { caller: message.author, memberList: message.guild.members.cache.array(), askingChannel: <TextChannel>message.channel }).then(usr => message.channel.send(usr.displayAvatarURL()))
		message.channel.send(ms(ms(args.join(' ').trim()), { long: true }) || "No Output")
	}
});