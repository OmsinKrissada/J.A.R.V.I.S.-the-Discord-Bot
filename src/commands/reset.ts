import { MessageEmbed } from 'discord.js';
import { Command } from '../CommandManager';
import { Helper } from '../Helper';
import * as DataManager from '../DataManager';
export default new Command({
	name: 'reset',
	category: 'settings',
	description: 'Resets this guild\'s data to default state',
	examples: ['reset'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message) {
		message.channel.send(new MessageEmbed()
			.setTitle('Confirmation Needed')
			.setDescription('This action will reset the current guild\'s data to default value, do you want to continue? (yes/no)')
			.setColor(Helper.yellow)).then(msg => {
				msg.react('✅');
				msg.react('❌');
				msg.awaitReactions((reaction, user) => (reaction.emoji.name == '✅' || reaction.emoji.name == '❌') && user == message.author, { max: 1, time: 10000, errors: ['time'] })
					.then(collected => {
						console.log(collected.first()!.emoji.name)
						if (collected.first()!.emoji.name == '✅') {
							if (message.guild) {
								DataManager.purge(message.guild.id)
							} else {
								DataManager.purge(message.channel.id)
							}

							message.channel.send(new MessageEmbed()
								.setTitle('Done!')
								.setDescription('')
								.setColor(Helper.green))
						}
						else {
							message.channel.send(new MessageEmbed()
								.setTitle('Canceled!')
								.setDescription('')
								.setColor(Helper.red))
						}
					})
					.catch(() => {
						message.channel.send(new MessageEmbed()
							.setTitle('Timeout')
							.setDescription('Timeout, action canceled.')
							.setColor(Helper.red));
					});
			});
	}
}) 