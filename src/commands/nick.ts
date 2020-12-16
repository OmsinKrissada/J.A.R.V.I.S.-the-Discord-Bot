import { MessageEmbed, Permissions } from 'discord.js';
import { Command } from '../CommandManager';
import { Helper } from '../Helper';

export default new Command({
	name: 'nick',
	category: 'settings',
	description: 'Changes bot\'s nickname',
	examples: ['nick', 'nick <nickname>'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, _prefix, args, _sourceID) {
		if (!message.guild.member(Command.bot.user).hasPermission(Permissions.FLAGS.CHANGE_NICKNAME)) {
			message.channel.send(new MessageEmbed()
				.setTitle('Sorry!')
				.setColor(Helper.red)
				.setDescription('I don\'t have permission to change my nickname')
			);
		}
		if (args[0] != undefined) {
			message.guild.member(Command.bot.user).setNickname(longarg(0, args))
			message.channel.send(new MessageEmbed()
				.setTitle('Nickname Changed')
				.setDescription(`Nickname has changed to **${longarg(0, args)}**`)
				.setColor(Helper.green)
			)
		}
		else {
			message.guild.member(Command.bot.user).setNickname('')
			message.channel.send(new MessageEmbed()
				.setTitle('Nickname Reset')
				.setDescription(`Nickname has reset to **${Command.bot.user.username}**`)
				.setColor(Helper.green)
			)
		}
	}
})

function longarg(begin_index = 1, args: string[]) {
	return args.slice(begin_index).join(' ').trim();
}