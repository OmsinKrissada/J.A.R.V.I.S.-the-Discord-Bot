import { Command } from '../CommandManager';
import { DiscordAPIError, GuildMember, Message, MessageEmbed, User } from 'discord.js';
import { Helper } from '../Helper';
import * as CommandManager from '../CommandManager';
import * as DataManager from '../DataManager';
import moment from 'moment';
export default new Command({
	name: 'info',
	category: 'features',
	description: 'Shows information about a user or server',
	examples: [
		"info user {@mention|username|nickname|user id}",
		"info server"
	],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: false,
	async exec(message, prefix, args, sourceID) {
		if (!args[0]) {
			await CommandManager.run('help', ['info'], { message, prefix, sourceID });
			return;
		}
		if (args[0].toLowerCase() == 'user') {

			const printUserInfo = (user: User) => {
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
					.setTitle('User Information Card')
					.setColor(Helper.BLUE)
					.setThumbnail(user.displayAvatarURL())
					.addField('Username', `${user.username}`, true)
					.addField('Discriminator', user.discriminator, true)
				if (message.guild && message.guild.member(user)) {
					embeduserinfo
						.addField('Display Name', user, true)
						.addField('Current Status', statusstr, true)
				}
				embeduserinfo
					.addField('Account Type', user.bot ? 'Bot' : 'User', true)
					.addField('User ID', user.id, true)
				if (message.guild && message.guild.member(user)) {
					const rolesOfTheMember = message.guild.member(user)!.roles.cache.filter(r => r.name !== '@everyone').map(role => role).join(', ');
					if (rolesOfTheMember)
						embeduserinfo
							.addField('Roles', rolesOfTheMember)
					embeduserinfo
						.setColor(message.guild.member(user)!.displayHexColor)
						.addField('Server Joined', moment.utc(message.guild.member(user)!.joinedTimestamp!).format('lll z'), true);
				}
				embeduserinfo
					.addField('Account Created Since', moment.utc(user.createdAt).format('lll z'), true)
					.setTimestamp()
				message.channel.send(embeduserinfo);
			}

			let user: User;
			if (longarg(1)) {
				if (message.mentions.members && message.mentions.members.first()) {
					user = message.mentions.members.first()!.user;
					printUserInfo(user);
					return;
				}
				else if (!isNaN((<any>args[1]))) { // if user id
					try {
						let fetcheduser = await Command.bot.users.fetch(args[1]);
						printUserInfo(fetcheduser);
					} catch (err) { }
				}
				else if (message.guild) {

					let users: Array<GuildMember> = [];
					try {
						let userscollection = message.guild.members.cache.filter(member => member.displayName.toLowerCase().includes(longarg(1).toLowerCase()) || member.user.username.toLowerCase().includes(longarg(1).toLowerCase()));
						users = userscollection.array();
					} catch (err) { }

					if (users.length > 0) {
						Helper.confirm_type({ title: 'Please choose the member you refer to. (type in chat)' }, users, message).then((usr: GuildMember) => {
							if (usr) printUserInfo(usr.user);
						})
					} else {
						message.channel.send(new MessageEmbed({
							title: 'Member Not Found',
							description: `Cannot find the specified member: "${longarg(1)}"`,
							color: Helper.RED
						}));
					}
				}
				else {
					message.channel.send(new MessageEmbed({
						title: 'Member Not Found',
						description: `Cannot find the specified member: "${longarg(1)}"`,
						color: Helper.RED
					}));
				}
			}
			else CommandManager.run('help', ['info'], { message, prefix, sourceID });


		}
		else if (args[0].toLowerCase() == 'server') {
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
					if (!fetchedGuild) return;
					guild = fetchedGuild;
				}
			}
			let embed = new MessageEmbed()
				.setTitle('Server Information Card')
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

