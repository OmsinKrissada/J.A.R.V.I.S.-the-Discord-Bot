import { Command } from '../CommandManager';


new Command({
	name: 'say',
	category: 'misc',
	description: 'Repeats user\'s text',
	examples: ['say <text>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: false,
	exec(message, prefix, args, sourceID) {
		message.channel.send(args.join(' '));
		if (message.guild && message.deletable) message.delete();
	}
});