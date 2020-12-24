import { Command } from '../CommandManager';
import { DiscordAPIError, GuildMember, Message, MessageEmbed, User } from 'discord.js';
import { Helper } from '../Helper';
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
						.setTitle(`Assumed ${Helper.inlineCodeBlock(prefix + 'userinfo me')}`)
						.setDescription('Usage: ' + Helper.inlineCodeBlock(prefix + 'userinfo') + ' or ' + Helper.inlineCodeBlock(prefix + 'userinfo <member>'))
						.setColor(Helper.YELLOW)
					).then(msg => msg.delete({ timeout: 10000 }));
				case 'me':
					user = message.author;
					printUserInfo(user);
					return;
				default:
					if (message.mentions.members && message.mentions.members.first()) {
						user = message.mentions.members.first()!.user;
						printUserInfo(user);
						return;
					}
					else if (message.guild) { // If not mention

						let users: Array<GuildMember> = [];
						try {
							let userscollection = message.guild.members.cache.filter(member => member.displayName.toLowerCase().includes(longarg(1).toLowerCase()) || member.user.username.toLowerCase().includes(longarg(1).toLowerCase()));
							users = userscollection.array();
						} catch (err) { }

						if (users.length > 0) {
							Helper.confirm_type({ title: 'Please choose the member you refer to. (type in chat)' }, users, message, prefix).then((usr: GuildMember) => {
								console.log(usr.user)
								printUserInfo(usr.user);
							})
							return;
						}
					}
			}
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
				.setColor(Helper.RED)
			);
			return;


			function printUserInfo(user: User) {
				let embeduserinfo = new MessageEmbed();
				let statusstr = '';
				const userstatus = user.presence.status;
				switch (userstatus) {
					case 'offline': statusstr = '⚫ Offline'; break;
					case 'dnd': statusstr = '🔴 DnD'; break;
					case 'idle': statusstr = '🟡 Idle'; break;
					case 'online': statusstr = '🟢 Online'; break;
				}
				embeduserinfo
					.setTitle('User Info Card')
					.setColor(Helper.BLUE)
					.setThumbnail(user.displayAvatarURL())
					.addField('Username', `${user.username}`, true)
					.addField('Discriminator', '#' + user.discriminator, true)
					.addField('Display Name', user, true)
					.addField('Current Status', statusstr, true)
					.addField('Account Type', user.bot ? 'Bot' : 'User', true)
					.addField('User ID', user.id, true)
				if (message.guild != undefined) { // if in a guild
					if (message.guild.member(user)) {
						const rolesOfTheMember = message.guild.member(user)!.roles.cache.filter(r => r.name !== '@everyone').map(role => role).join(', ');
						if (rolesOfTheMember)
							embeduserinfo
								.addField('Roles', rolesOfTheMember)
						embeduserinfo
							.setColor(message.guild.member(user)!.displayHexColor)
							.addField('Joined Server Since', new Date(message.guild.member(user)!.joinedTimestamp!).toUTCString(), true);
					}
					embeduserinfo
						.setFooter(`Requested by ${message.author.tag}`);
				}
				embeduserinfo
					.addField('Created Account Since', user.createdAt.toUTCString(), true)
					.setTimestamp()
				message.channel.send(embeduserinfo);
			}

		}
		else if (args[0] == 'server') {
			let guild = message.guild!;
			if (args[1]) {
				if (!isNaN((<any>args[1]))) {
					const fetchedGuild = await Command.bot.guilds.fetch(args[1]).catch((err: DiscordAPIError) => {
						if (err.code == 50001)
							message.channel.send(new MessageEmbed({
								title: 'No Access',
								description: "I don't have permission to view content of this server.",
								color: Helper.RED
							}))
						return;
					});
					console.log(fetchedGuild)
					if (!fetchedGuild) return;
					guild = fetchedGuild;
				}
			}
			let embed = new MessageEmbed()
				.setTitle('Server Info Card')
				.setColor(Helper.BLUE)
				.setThumbnail(guild.iconURL()!)
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

