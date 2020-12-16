import { MessageEmbed } from 'discord.js';
import { Util } from '../Helper';
import { Command, CommandMap } from '../CommandManager';
import * as alias from '../../settings/alias.json';

export default new Command({
	name: 'help',
	category: 'general',
	description: 'Shows this message',
	examples: ['help'],
	requiredCallerPermissions: [],
	serverOnly: false,
	exec(message, prefix, args) {
		let command_name = args[0] ? args[0].toLowerCase() : null;
		for (let full_command in alias) { // check with alias
			if (alias[full_command] instanceof Array && alias[full_command].includes(args[0])) {
				console.log(command_name)
				console.log(full_command)
				command_name = full_command;
			}
		}
		console.log(command_name)
		if (args[0] && CommandMap.has(command_name)) { // specific-command detail
			const command = CommandMap.get(command_name);
			let embed = new MessageEmbed()
				.setTitle('Help | Command: ' + Util.inlineCodeBlock(command.name))
				.setColor(Util.blue)

			embed.addField('Description:', command.description);
			let usagestr = '';
			command.examples.forEach((usage: string) => usagestr += Util.inlineCodeBlock(prefix + usage) + '\n');

			embed.addField('Usages:', usagestr);
			let aliasstr = Util.inlineCodeBlock(command.name) + ', ';
			if (alias[command.name]) {
				alias[command.name].forEach((available: string) => {
					aliasstr += Util.inlineCodeBlock(available) + ', ';
				});
			}
			embed.addField('Aliases', aliasstr.slice(0, -2));

			message.channel.send(embed);
		} else {
			let cmd_by_categories = {
				"general": [],
				"settings": [],
				"features": [],
				"music": [],
				"misc": [],
			}
			CommandMap.forEach(command => {
				if (command.category && command.category != 'hiden') {
					cmd_by_categories[command.category].push(command)
				}
			})

			let header = prefix == '' ? 'Bot currently has no prefix.' : `Current prefix is ${Util.inlineCodeBlock(prefix)}.`;
			let embed = new MessageEmbed()
				.setTitle(header)
				.setDescription(`Use ${Util.inlineCodeBlock(prefix + 'help {command}')} to get usage information.`)
				.setColor(Util.blue)
				.attachFiles([{ attachment: './resources/rainbow.png' }])
				.setAuthor('Help | Available Commands:', 'attachment://rainbow.png');

			for (const category in cmd_by_categories) {
				let displayCategory: string;
				switch (category) {
					case "general": displayCategory = "ℹ  General"; break;
					case "settings": displayCategory = "🛠  Settings"; break;
					case "features": displayCategory = "💡  Features"; break;
					case "music": displayCategory = "🎵  Music"; break;
					case "misc": displayCategory = "😂  Misc"; break;
				}

				let command_list = '';
				cmd_by_categories[category].forEach((command: Command) => {
					command_list += Util.inlineCodeBlock(command.name) + ', ';
				})
				command_list = command_list.slice(0, -2);
				embed.addField(displayCategory, command_list ? command_list : '<none>');
			}
			embed.addField('‏‏‎ ‎', 'For source code, please visit [this repository](https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot "https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot").');

			message.channel.send(embed);
		}
	}
}) 