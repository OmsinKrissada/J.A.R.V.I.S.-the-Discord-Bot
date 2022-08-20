import { MessageEmbed, MessageReaction, ReactionEmoji, ReactionManager } from 'discord.js';
import { Command } from '../CommandManager';
import { prisma } from '../DBManager';
import * as Helper from '../Helper';


export default new Command({
	name: 'reset',
	category: 'settings',
	description: 'Resets this guild\'s data to its default state',
	examples: ['reset'],
	requiredCallerPermissions: ['MANAGE_CHANNELS'],
	requiredSelfPermissions: ['SEND_MESSAGES', "EMBED_LINKS", "VIEW_CHANNEL", "READ_MESSAGE_HISTORY", "ADD_REACTIONS"],
	serverOnly: true,
	exec(message) {
		message.channel.send(new MessageEmbed()
			.setTitle('Confirmation Needed')
			.setDescription('This action will reset the current guild\'s data to default value, do you want to continue? (yes/no)')
			.setColor(Helper.YELLOW)).then(msg => {
				msg.react('849685283459825714');
				msg.react('849685295779545108');
				msg.awaitReactions((reaction: MessageReaction, user) => (reaction.emoji.id == '849685283459825714' || reaction.emoji.id == '849685295779545108') && user == message.author, { max: 1, time: 10000, errors: ['time'] })
					.then(collected => {
						console.log(collected.first()!.emoji.name);
						if (collected.first()!.emoji.id == '849685283459825714') {
							if (message.guild) {
								prisma.guild.delete({
									where: { id: message.guild.id }
								});
							} else {
								prisma.guild.delete({
									where: { id: message.channel.id }
								});
							}

							message.channel.send(new MessageEmbed()
								.setTitle('Done!')
								.setDescription('')
								.setColor(Helper.GREEN));
						}
						else {
							message.channel.send(new MessageEmbed()
								.setTitle('Canceled!')
								.setDescription('')
								.setColor(Helper.RED));
						}
					})
					.catch(() => {
						message.channel.send(new MessageEmbed()
							.setTitle('Timeout')
							.setDescription('Timeout, action canceled.')
							.setColor(Helper.RED));
					});
			});
	}
});