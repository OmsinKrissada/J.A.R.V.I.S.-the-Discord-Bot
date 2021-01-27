import { MessageEmbed } from 'discord.js';
import { Helper } from '../Helper';
import { Command, CommandMap } from '../CommandManager';
import * as alias from '../../settings/alias.json';

export default new Command({
	name: 'help',
	category: 'general',
	description: 'Shows this message',
	examples: ['help'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: false,
	exec(message, prefix, args) {
		let command_name = args[0] ? args[0].toLowerCase() : '';
		for (let full_command in alias) { // check with alias
			if (alias[full_command] instanceof Array && alias[full_command].includes(command_name)) {
				console.log(command_name)
				console.log(full_command)
				command_name = full_command;
			}
		}
		console.log(command_name)
		const command = CommandMap.get(command_name);
		if (command_name && command) { // specific-command detail
			let embed = new MessageEmbed()
				.setTitle('Help | Command: ' + Helper.inlineCodeBlock(command.name))
				.setColor(Helper.BLUE)

			embed.addField('Description:', command.description);
			let usagestr = '';
			command.examples.forEach((usage: string) => usagestr += Helper.inlineCodeBlock(prefix + usage) + '\n');

			embed.addField('Usages:', usagestr);
			let aliasstr = Helper.inlineCodeBlock(command.name) + ', ';
			if (alias[command.name]) {
				alias[command.name].forEach((available: string) => {
					aliasstr += Helper.inlineCodeBlock(available) + ', ';
				});
			}
			embed.addField('Aliases', aliasstr.slice(0, -2));

			message.channel.send(embed);
		} else {
			let cmd_by_categories: { general: Command[], settings: Command[], features: Command[], music: Command[], moderation: Command[], misc: Command[] } = {
				"general": [],
				"settings": [],
				"features": [],
				"music": [],
				"moderation": [],
				"misc": [],
			}
			CommandMap.forEach(command => {
				if (command.category && command.category != 'hiden') {
					cmd_by_categories[command.category].push(command)
				}
			})

			let header = prefix == '' ? 'Bot currently has no prefix.' : `Current prefix is ${Helper.inlineCodeBlock(prefix)}.`;
			let embed = new MessageEmbed()
				.setTitle(header)
				.setDescription(`Use ${Helper.inlineCodeBlock(prefix + 'help [command]')} to get usage information.\n\`<...>\` indicates **required** field.\n\`[...]\` indicates **optional** field.`)
				.setColor(Helper.BLUE)
				.attachFiles([{ attachment: './resources/rainbow.png' }])
				.setAuthor('Help | Available Commands:', 'attachment://rainbow.png');

			for (const category in cmd_by_categories) {
				let displayCategory = '';
				switch (category) {
					case "general": displayCategory = "ℹ  General"; break;
					case "settings": displayCategory = "🛠  Settings"; break;
					case "features": displayCategory = "💡  Features"; break;
					case "music": displayCategory = "🎵  Music"; break;
					case "misc": displayCategory = "👑  Moderation"; break;
					case "misc": displayCategory = "🙄  Misc"; break;
				}

				let command_list = '';
				cmd_by_categories[category].forEach((command: Command) => {
					command_list += Helper.inlineCodeBlock(command.name) + ', ';
				})
				command_list = command_list.slice(0, -2);
				embed.addField(displayCategory, command_list ? command_list : '<none>');
			}
			embed.addField('‏‏‎ ‎', 'For source code, please visit [this repository](https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot "https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot").');

			message.channel.send(embed);
		}
	}
}) 