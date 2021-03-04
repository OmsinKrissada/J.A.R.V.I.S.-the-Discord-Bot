import { Command } from '../CommandManager'; // It was fun
new Command({
	name: 'ping',
	description: 'Simple ping command',
	category: "general",
	examples: ['ping'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: false,
	async exec(message, prefix, args, sourceID) {
		const m = await message.channel.send('Pinging ...')
		m.edit(`Server latency: \`${m.createdTimestamp - message.createdTimestamp}ms\`, API latency: \`${Math.round(Command.bot.ws.ping)}ms\``);
	}
})