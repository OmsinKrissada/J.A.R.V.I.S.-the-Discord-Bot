import { MessageEmbed } from 'discord.js';
import { Command } from '../CommandManager';
import CONFIG from '../ConfigManager';
import * as Helper from '../Helper';
// import packageinfo from '../../package.json';
import { bot } from '../Main';
export default new Command({
	name: 'about',
	category: 'general',
	description: 'Shows basic information about the bot',
	examples: ['about'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES', "EMBED_LINKS", "VIEW_CHANNEL"],
	serverOnly: false,
	exec(message) {
		message.channel.send(new MessageEmbed()
			.setTitle('About Me')
			.setColor(Helper.BLUE)
			.setThumbnail(bot.user!.displayAvatarURL({ dynamic: true, size: 4096 }))
			.addField('Name', '**J.A.R.V.I.S.**', true)
			// .addField('Current Version', Helper.inlineCodeBlock(packageinfo.version), true)
			.addField('Node version', Helper.inlineCodeBlock(process.version), true)
			.addField('License', '[**MIT License**](https://en.wikipedia.org/wiki/MIT_License)', true)
			.addField('Author', '[**OmsinKrissada**](https://github.com/OmsinKrissada)', true)
			.addField('Source Code', '[**GitHub**](https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot)', true)
			.addField('Default Prefix', Helper.inlineCodeBlock(CONFIG.defaultPrefix), true)
			.addField('Guild Count', bot.guilds.cache.size, true)
			.addField('Shard Count', bot.ws.shards.size, true)
			.addField('HTTP API Version', bot.options.http!.version, true)
		);
	}
});