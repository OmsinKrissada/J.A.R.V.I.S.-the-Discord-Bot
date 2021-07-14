import { Command } from '../CommandManager';
import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';
import { Helper } from '../Helper';


export default new Command({
	name: 'purge',
	category: 'features',
	description: 'Deletes messages by the specified amount',
	examples: ['purge <amount>', 'purge gif <amount>'],
	requiredCallerPermissions: ['MANAGE_MESSAGES'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MANAGE_MESSAGES', "EMBED_LINKS", "VIEW_CHANNEL"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		if (message.channel instanceof DMChannel || !message.channel.isText()) return;
		const channel = message.channel;

		if (!isNaN(+args[0])) {
			let amount = Number.parseInt(args[0]);

			if (amount < 1 || amount > 100) {
				channel.send(new MessageEmbed()
					.setTitle('Error')
					.setDescription(`The amount of messages must not below than 1 nor greater than 100.`)
					.setColor(Helper.RED)
				);
			}
			// Can purge
			else {
				let exceed_three = amount > 3;
				if (exceed_three) {
					Helper.confirm_click('Confirmation Needed', `This action is going to delete the last **${amount}** messages.`, ['849685283459825714', '849685295779545108'], <TextChannel>message.channel, message.author, 10000).then(promise => {
						let response = promise.emoji;
						let confirm_msg = promise.message;
						if (response == 'checkmark') {
							channel.bulkDelete(amount + 2).then(() =>
								channel.send(`<:checkmark:849685283459825714> Deleted ${amount} message${amount > 1 ? 's' : ''}. [${message.author}]`).then(msg => msg.delete({ timeout: 5000, reason: `Issued by ${message.author.username}` }))
							);
						}
						if (response == 'xmark') {
							confirm_msg.edit(new MessageEmbed()
								.setDescription('<:xmark:849685295779545108> Canceled!')
								.setColor(Helper.RED)).then((msg: Message) => msg.delete({ timeout: 5000 }));
							confirm_msg.reactions.removeAll();
						}
					});
				} else channel.bulkDelete(amount + 1).then(() =>
					channel.send(`<:checkmark:849685283459825714> Deleted ${amount} message${amount > 1 ? 's' : ''}. [${message.author}]`).then(msg => msg.delete({ timeout: 5000, reason: `Issued by ${message.author.username}` }))
				);;
			}
		} else if (args[0].toLowerCase() === 'gif') {
			if (!isNaN(+args[1]) && +args[1] <= 100 && +args[1] >= 1) {
				const amount = +args[1];
				channel.messages.fetch({ limit: 500 }).then(msgs => {
					console.log(msgs.size);
					const gif_msgs = msgs.filter(m => m.content.includes('tenor.com')).array();
					console.log(gif_msgs.length);
					const selected = gif_msgs.slice(0, amount);
					console.log(selected.length);
					try {
						channel.bulkDelete(selected);
						channel.send(`<:checkmark:849685283459825714> Found and deleted ${selected.length} message${selected.length > 1 ? 's' : ''}. [${message.author}]`).then(msg => msg.delete({ timeout: 5000, reason: `Issued by ${message.author.username}` }));
						if (message.deletable && !message.deleted) message.delete();
					} catch (err) {
						channel.send({
							embed: {
								title: 'Error occured',
								description: err,
								color: Helper.RED
							}
						});
					}

				});
			} else {
				channel.send({
					embed: {
						title: 'Error',
						description: `The amount must be a number and fall in between 1 - 100.`,
						color: Helper.RED
					}
				});
			}
		}
		else {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription(`Usage: ${Helper.inlineCodeBlock(prefix + 'purge <amount>')}`)
				.setColor(Helper.RED)
			);
		}
	}
});