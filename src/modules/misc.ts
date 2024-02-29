import axios from 'axios';
import { Command } from '../CommandManager';
import ConfigManager from '../ConfigManager';

new Command({
	name: 'say',
	category: 'misc',
	description: 'Repeats user\'s text',
	examples: ['say <text>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES', "MANAGE_MESSAGES", "VIEW_CHANNEL"],
	serverOnly: false,
	exec(message, prefix, args, sourceID) {
		message.channel.send(args.join(' '));
		if (message.guild && message.deletable) message.delete();
	}
});

new Command({
	name: 'salim',
	category: 'misc',
	description: `Annoys you with salims' quotes`,
	examples: ['salim'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: false,
	async exec(message, prefix, args, sourceID) {

		let quote: string;
		try {
			quote = (await axios.get("https://watasalim.vercel.app/api/quotes/random")).data.quote.body;
		} catch (err) {
			message.channel.send({
				embed: {
					description: `Unable to obtain quote:\n${err}`,
					color: ConfigManager.colors.red
				}
			});
		}
		message.reply(quote);
	}
});

new Command({
	name: 'rate',
	category: 'misc',
	description: 'Rate something out of boredom.',
	examples: ['rate <something>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES', "VIEW_CHANNEL"],
	serverOnly: false,
	exec(message, prefix, args, sourceID) {
		if (args.length > 0)
			message.channel.send(`I'd rate ${args.join(' ')} ${Math.floor(Math.random() * 11)}/10`);
		else
			message.channel.send(`I'd rate you ${Math.floor(Math.random() * 11)}/10`);
	}
});