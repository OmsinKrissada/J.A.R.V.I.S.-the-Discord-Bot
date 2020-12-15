import { MessageEmbed } from 'discord.js';
import { Command } from '../CommandManager';
import { CONFIG } from '../ConfigManager';
import { Util } from '../Util';
import packageinfo from '../../package.json';
export default new Command({
	name: 'about',
	category: 'general',
	description: 'Shows basic information about the bot',
	examples: ['about'],
	requiredPermissions: [],
	serverOnly: false,
	exec(message) {
		message.channel.send(new MessageEmbed()
			.setTitle('About Me')
			.setColor(Util.blue)
			.setThumbnail(Command.bot.user.displayAvatarURL())
			.addField('Name', '**J.A.R.V.I.S.**', true)
			.addField('Current Version', Util.inlineCodeBlock(packageinfo.version), true)
			.addField('License', '[**MIT License**](https://en.wikipedia.org/wiki/MIT_License)', true)
			.addField('Author', '[**OmsinKrissada**](https://github.com/OmsinKrissada)', true)
			.addField('Source Code', '[**GitHub**](https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot)', true)
			.addField('Default Prefix', Util.inlineCodeBlock(CONFIG.defaultPrefix), true)
			.addField('Guild Count', Command.bot.guilds.cache.size, true)
			.addField('Shard Count', Command.bot.ws.shards.size, true)
			.addField('HTTP API Version', Command.bot.options.http.version, true)
		)
	}
}) 