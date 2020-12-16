import { MessageEmbed } from 'discord.js';
import { Command } from '../CommandManager';
import * as DataManager from '../DataManager';
import { Util } from '../Helper';
export default new Command({
	name: 'prefix',
	category: 'settings',
	description: 'Changes bot\'s prefix',
	examples: [
		"prefix set {prefix}",
		"prefix clear"
	],
	requiredCallerPermissions: [],
	serverOnly: false,
	exec(message, prefix, args, sourceID) {
		if (args[0] === 'clear') {
			if (message.guild === null) {
				DataManager.set(message.channel.id, 'prefix', '');
				message.channel.send(new MessageEmbed()
					.setTitle('Prefix Cleared')
					.setDescription(`Prefix has cleared`)
					.setColor(Util.green)
				)
			}
			else {
				message.channel.send(new MessageEmbed()
					.setTitle('Error')
					.setDescription(`Blank prefix is only allowed in DM channels.`)
					.setColor(Util.red)
				);
			}
		}
		else if (args[0] === 'set') {
			let new_prefix = args[1];
			DataManager.set(message.guild === null ? message.channel.id : message.guild.id, 'prefix', new_prefix);
			message.channel.send(new MessageEmbed()
				.setTitle('Prefix Changed')
				.setDescription(`Prefix has changed to ${Util.inlineCodeBlock(new_prefix)}`)
				.setColor(Util.green)
			)
		}
		else {
			message.channel.send(new MessageEmbed()
				.setTitle('Current prefix is ' + Util.inlineCodeBlock(prefix) + '.')
				.setDescription(`Usage: ${Util.inlineCodeBlock(`${prefix}prefix set {new prefix}`)} or ${Util.inlineCodeBlock(`${prefix}prefix clear`)}`)
				.setColor(Util.blue)
				.setFooter('Note: Blank prefix is only allowed in DM channels.')
			);
		}
	}
}) 