import { Command } from '../CommandManager';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { Helper } from '../Helper';


export default new Command({
	name: 'purge',
	category: 'features',
	description: 'Deletes messages by the specified amount',
	examples: ['purge <amount>'],
	requiredCallerPermissions: ['MANAGE_MESSAGES'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MANAGE_MESSAGES', "EMBED_LINKS", "VIEW_CHANNEL"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		let amount = Number.parseInt(args[0]);
		function deletemsg(exceed_three: boolean) {
			(<TextChannel>message.channel).bulkDelete(amount + (exceed_three ? 2 : 1)).then(() =>
				message.channel.send(`<:checkmark:849685283459825714> Deleted ${amount} message${amount > 1 ? 's' : ''}. [${message.author}]`).then(msg => msg.delete({ timeout: 5000, reason: `Issued by ${message.author.username}` }))
			)
		}
		if (!isNaN((<any>args[0]))) {
			if (amount < 1 || amount > 100) {
				message.channel.send(new MessageEmbed()
					.setTitle('Error')
					.setDescription(`The amount of messages must not below than 1 nor greater than 100.`)
					.setColor(Helper.RED)
				)
			}
			// Can purge
			else {
				let exceed_three = amount > 3;
				if (exceed_three) {
					Helper.confirm_click('Confirmation Needed', `This action is going to delete the last **${amount}** messages.`, ['849685283459825714', '849685295779545108'], <TextChannel>message.channel, message.author, 10000).then(promise => {
						let response = promise.emoji;
						let confirm_msg = promise.message;
						if (response == 'checkmark') {
							deletemsg(exceed_three)
						}
						if (response == 'xmark') {
							confirm_msg.edit(new MessageEmbed()
								.setDescription('<:xmark:849685295779545108> Canceled!')
								.setColor(Helper.RED)).then((msg: Message) => msg.delete({ timeout: 5000 }));
							confirm_msg.reactions.removeAll();
						}
					})
				} else deletemsg(exceed_three);
			}
		}
		else {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription(`Usage: ${Helper.inlineCodeBlock(prefix + 'purge <amount>')}`)
				.setColor(Helper.RED)
			)
		}
	}
})