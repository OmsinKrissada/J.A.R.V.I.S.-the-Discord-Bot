import { MessageEmbed, Permissions } from 'discord.js';
import { Command } from '../CommandManager';
import * as Helper from '../Helper';
import { bot } from '../Main';

export default new Command({
	name: 'nick',
	category: 'settings',
	description: 'Changes bot\'s nickname',
	examples: ['nick', 'nick <nickname>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES', 'CHANGE_NICKNAME'],
	serverOnly: true,
	async exec(message, _prefix, args, _sourceID) {
		if (!message.guild!.member(bot.user!)!.hasPermission(Permissions.FLAGS.CHANGE_NICKNAME)) {
			message.channel.send(new MessageEmbed()
				.setTitle('Sorry!')
				.setColor(Helper.RED)
				.setDescription('I don\'t have permission to change my nickname')
			);
		}
		if (args[0] != undefined) {
			try {
				await message.guild!.member(bot.user!)!.setNickname(longarg(0, args));
				message.channel.send(new MessageEmbed()
					.setTitle('Nickname Changed')
					.setDescription(`Nickname has changed to **${longarg(0, args)}**`)
					.setColor(Helper.GREEN)
				);
			} catch (err) {
				message.channel.send(new MessageEmbed()
					.setTitle('Nickname Unchanged')
					.setDescription(`I have trouble changing my nickname, try with a different name.`)
					.setColor(Helper.RED)
				);
			}
		}
		else {
			message.guild!.member(bot.user!)!.setNickname('');
			message.channel.send(new MessageEmbed()
				.setTitle('Nickname Reset')
				.setDescription(`Nickname has reset to **${bot.user!.username}**`)
				.setColor(Helper.GREEN)
			);
		}
	}
});

function longarg(begin_index = 1, args: string[]) {
	return args.slice(begin_index).join(' ').trim();
}