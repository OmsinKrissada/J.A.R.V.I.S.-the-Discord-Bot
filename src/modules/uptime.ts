import moment from 'moment';
import { Command } from '../CommandManager';
import { Helper } from '../Helper';
import { bot } from '../Main';


new Command({
	name: 'uptime',
	category: 'settings',
	description: 'Shows how long the bot has been online',
	examples: ['uptime'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: false,
	exec(message, prefix, args, sourceID) {
		message.channel.send(`I have been online for **${Helper.fullDurationString(moment.duration(bot.uptime))}**`)
	}
});