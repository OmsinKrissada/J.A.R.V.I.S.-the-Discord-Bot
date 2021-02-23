import { Emoji, GuildEmoji, Message, MessageEmbed, PartialMessage, ReactionEmoji, TextChannel } from 'discord.js';
import { Command } from '../CommandManager';
import DataManager from '../DataManager';
import { Helper } from '../Helper';
import { bot } from '../Main';


new Command({
	name: 'roleselector',
	category: 'features',
	description: 'Manages role selectors',
	examples: [],
	requiredCallerPermissions: ['MANAGE_ROLES', 'MANAGE_GUILD'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MANAGE_ROLES'],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		const action = args[0];
		switch (action) {
			case 'create': {
				const channel = message.channel;
				const issuer = message.author;
				let title: string;
				const embed = new MessageEmbed({
					title: 'Role Selector Creation',
					description: 'Enter category for this role selector',
					// description: 'Enter your description',
					color: Helper.AQUA,
					footer: { text: 'Delete this message to cancel the creation progress' }
				});
				const editor = await message.channel.send(embed)

				// cancel operation on delete
				// const listener = (msg: Message | PartialMessage) => {
				// 	console.log('checking deleted msg')
				// 	if (msg.id == panel.id) {
				// 		bot.removeListener('messageDelete', listener)
				// 	}
				// }
				// 
				// bot.on('messageDelete', listener)

				await channel.awaitMessages(msg => msg.author.id == issuer.id, { maxProcessed: 1 }).then(collected => {
					const msg = collected.first();
					title = msg.content;
					msg.delete();
				});

				embed.setDescription('React this message with reactions you want for roles, type "done" to mark as finish.')
				editor.edit(embed)
				await channel.awaitMessages(msg => msg.author.id == issuer.id && msg.content.toLowerCase() == 'done', { maxProcessed: 1 }).then(collected => { collected.first().delete() });

				let rolestr = '';
				const roles: { emoji: GuildEmoji | ReactionEmoji; roleId: string; }[] = [];
				for (const reaction of editor.reactions.cache.values()) {
					embed.setDescription(`Enter role id for "${reaction.emoji}"`);
					editor.edit(embed);
					await channel.awaitMessages(msg => msg.author.id == issuer.id, { maxProcessed: 1 }).then(collected => {
						// console.log(collected)
						const msg = collected.first();
						const resolvedRole = message.guild.roles.resolve(msg.content);
						if (resolvedRole) {
							roles.push({ emoji: reaction.emoji, roleId: msg.content });
							rolestr += `${reaction.emoji}  :  ${resolvedRole}\n\n`;
						}

						msg.delete();
					})
				}

				embed.setDescription('Enter channel id to send the selector into.')
				editor.edit(embed)
				await channel.awaitMessages(msg => msg.author.id == issuer.id, { maxProcessed: 1 }).then(async (collected) => {
					const msg = collected.first();

					const targetChannel = message.guild.channels.resolve(msg.content);
					if (targetChannel instanceof TextChannel) {
						const panel = await targetChannel.send(new MessageEmbed({
							title: `Category: ${title}`,
							description: 'React icons below to give yourself a role.\n\n\n' + rolestr,
							color: Helper.AQUA,
						}));
						roles.forEach(role => {
							panel.react(role.emoji)
						})
					}

					msg.delete();
				});

				embed.setDescription('Done.')
				editor.edit(embed)


				// (await DataManager.get(sourceID)).rolePanels.push



			}


				break;
		}
	}
}
);