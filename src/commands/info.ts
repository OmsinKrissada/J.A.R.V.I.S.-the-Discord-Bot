import { Command } from '../CommandManager';
import { GuildMember, MessageEmbed, User } from 'discord.js';
import { Util } from '../Helper';
import * as CommandManager from '../CommandManager';
import * as DataManager from '../DataManager';
export default new Command({
	name: 'info',
	category: 'features',
	description: 'Shows information about a user or server',
	examples: [
		"info user {@mention|username|nickname|user_id}",
		"info user me",
		"info server"
	],
	requiredCallerPermissions: [],
	serverOnly: false,
	async exec(message, prefix, args, sourceID) {
		if (args[0] == 'user') {
			let user: User;
			console.log(`"${longarg(1)}"`)
			switch (longarg(1)) {
				case "":
					message.channel.send(new MessageEmbed()
						.setTitle(`Assumed ${Util.inlineCodeBlock(prefix + 'userinfo me')}`)
						.setDescription('Usage: ' + Util.inlineCodeBlock(prefix + 'userinfo') + ' or ' + Util.inlineCodeBlock(prefix + 'userinfo <member>'))
						.setColor(Util.yellow)
					).then(msg => msg.delete({ timeout: 10000 }));
				case 'me':
					user = message.author;
					printUserInfo(user);
					return;
				default:
					if (message.mentions.members != undefined && message.mentions.members.first() != undefined) {
						user = message.mentions.members.first().user;
						printUserInfo(user);
						return;
					}
					else if (message.guild) { // If not mention

						let users: Array<GuildMember>;
						try {
							let userscollection = message.guild.members.cache.filter(member => member.displayName.toLowerCase().includes(longarg(1).toLowerCase()) || member.user.username.toLowerCase().includes(longarg(1).toLowerCase()));
							users = userscollection.array();
						} catch (err) { }

						if (users.length && users.length > 0) {
							Util.confirm_type({ title: 'Please choose the member you refer to. (type in chat)' }, users, message, prefix).then((usr: GuildMember) => {
								console.log(usr.user)
								printUserInfo(usr.user);
							})
							return;
						}
					}
			}
			console.log('passed here')
			// if (message.deletable) message.delete();

			// if (!(user == null || user.size == 0)) {
			// 	printUserInfo(user);
			// 	return;
			// }
			if (!isNaN((<any>args[1]))) {
				try {
					let fetcheduser = await Command.bot.users.fetch(args[1]);
					printUserInfo(fetcheduser);
					return;
				} catch (err) { }
			}
			message.channel.send(new MessageEmbed()
				.setTitle('Member Not Found')
				.setDescription(`Cannot find the specified member: "${longarg(1)}"`)
				.setColor(Util.red)
			);
			return;


			function printUserInfo(user: User) {
				let embeduserinfo = new MessageEmbed();
				embeduserinfo
					.setTitle('User Info Card')
					.setColor(Util.blue)
					.setThumbnail(user.displayAvatarURL())
					.addField('Username', `${user.username}`, true)
					.addField('Discriminator', '#' + user.discriminator, true)
					.addField('Display Name', user, true)
					.addField('Current Status', user.presence.status.toUpperCase(), true)
					.addField('Bot?', user.bot ? 'Yes' : 'No', true)
					.addField('User ID', user.id, true)
				if (message.guild != undefined) { // if in a guild
					if (message.guild.member(user)) {
						const rolesOfTheMember = message.guild.member(user).roles.cache.filter(r => r.name !== '@everyone').map(role => role).join(', ');
						if (rolesOfTheMember)
							embeduserinfo
								.addField('Roles', rolesOfTheMember)
						embeduserinfo
							.setColor(message.guild.member(user).displayHexColor)
							.addField('Joined Server At', new Date(message.guild.member(user).joinedTimestamp).toLocaleString(), true);
					}
					embeduserinfo
						.setFooter(`Requested by ${message.author.tag}`);
				}
				embeduserinfo
					.addField('Created Account At', user.createdAt.toLocaleString(), true)
					.setTimestamp()
				message.channel.send(embeduserinfo);
				// if (message.deletable) message.delete();
			}

		}
		else if (args[0] == 'server') {
			let guild = message.guild;
			let embed = new MessageEmbed()
				.setTitle('Server Info Card')
				.setColor(Util.blue)
				.setThumbnail(guild.iconURL())
				.addField('Name', guild.name, true)
				.addField('ID', guild.id, true)
				.addField('Owner', guild.owner, true)
				.addField('Text Channels', guild.channels.cache.filter(channel => channel.type == "text").size, true)
				.addField('Voice Channels', guild.channels.cache.filter(channel => channel.type == "voice").size, true)
				.addField('Roles', guild.roles.cache.size, true)
				.setFooter(`Requested by ${message.author.tag}`)
				.setTimestamp();
			message.channel.send(embed);
		}
		else {
			await CommandManager.run('help', ['info'], { message, prefix, sourceID });
		}
		function longarg(begin_index = 1) {
			return args.slice(begin_index).join(' ').trim();
		}
	}
})

