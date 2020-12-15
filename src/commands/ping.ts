import { Command } from '../CommandManager'; // It was fun
new Command({
	name: 'ping',
	description: 'Simple ping command',
	category: "general",
	examples: ['ping'],
	requiredPermissions: [],
	serverOnly: false,
	async exec(message, prefix, args, sourceID) {
		const m = await message.reply('Pong!')
		message.channel.send(`Latency: ${m.createdTimestamp - message.createdTimestamp}ms`);
		message.channel.send(`API Latency ${Math.round(Command.bot.ws.ping)}ms`);
	}
})

new Command({
	name: 'gnip',
	description: 'Not simple ping command',
	category: "hiden",
	examples: ['gnip'],
	requiredPermissions: [],
	serverOnly: false,
	async exec(message, prefix, args, sourceID) {
		const m = await message.reply('Pong!')
		message.channel.send(`latexy: ${m.createdTimestamp - message.createdTimestamp}ms`);
		message.channel.send(`API Latency ${Math.round(Command.bot.ws.ping)}ms`);
	}
})