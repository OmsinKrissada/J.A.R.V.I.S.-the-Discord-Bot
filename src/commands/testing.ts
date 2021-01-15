import { Command } from '../CommandManager';
import moment from 'moment';


export default new Command({
	name: 'test',
	category: 'hiden',
	description: 'for testing',
	examples: ['test'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: false,
	exec(message, prefix, args, sourceID) {
		message.reply(new Date(args.join(' ')).toString());
	}
}) 