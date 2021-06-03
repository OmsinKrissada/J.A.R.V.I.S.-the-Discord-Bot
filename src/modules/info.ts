import { Command } from '../CommandManager';
import { DiscordAPIError, GuildMember, Message, MessageEmbed, TextChannel, User } from 'discord.js';
import { Helper } from '../Helper';
import * as CommandManager from '../CommandManager';
import * as DataManager from '../DataManager';
import moment from 'moment';
import { bot } from '../Main';
export default new Command({
	name: 'info',
	category: 'features',
	description: 'Shows information about a user or server',
	examples: [
		"info user {@mention|username|nickname|user id}",
		"info server"
	],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES', "EMBED_LINKS", "VIEW_CHANNEL"],
	serverOnly: false,
	async exec(message, prefix, args, sourceID) {
		if (!args[0]) {
			await CommandManager.run('help', ['info'], { message, prefix, sourceID });
			return;
		}
		if (args[0].toLowerCase() == 'user') {

			const printUserInfo = (user: User) => {
				let embeduserinfo = new MessageEmbed({
					title: 'User Information Card',
					color: Helper.BLUE,
					thumbnail: { url: user.displayAvatarURL({ size: 1024, format: 'png', dynamic: true }) },
				});
				let statusstr = '';

				const userstatus = user.presence.status;
				switch (userstatus) {
					case 'offline': statusstr = '<:offline:845520758230876172> Offline'; break;
					case 'dnd': statusstr = '<:dnd:845520750399324201> DnD'; break;
					case 'idle': statusstr = '<:idle:845520741315510284> Idle'; break;
					case 'online': statusstr = '<:online:845520732745498634> Online'; break;
				}

				// add fields
				embeduserinfo
					.addField('Tag', user.tag, true)
				if (message.guild && message.guild.member(user)) {
					embeduserinfo
						.addField('Status', statusstr, true)
				}
				embeduserinfo
					.addField('Race', user.bot ? '🤖 Bot' : '👤 User', true)
					.addField('ID', `\`${user.id}\``, true)
				if (message.guild && message.guild.member(user)) {
					const rolesOfTheMember = message.guild.member(user)!.roles.cache.filter(r => r.name !== '@everyone').array().join(', ');
					if (rolesOfTheMember)
						embeduserinfo
							.addField('<:role:845532456072249355> Roles', rolesOfTheMember)
					embeduserinfo
						.setColor(message.guild.member(user)!.displayHexColor)
						.addField('<:join_arrow:845520716715917314> Server Joined', `${moment.utc(message.guild.member(user).joinedAt).format('lll z')} (${moment(message.guild.member(user).joinedAt).fromNow()})`);
				}
				embeduserinfo
					.addField('🎂 Account Created', `${moment.utc(user.createdAt).format('lll z')} (${moment(user.createdAt).fromNow()})`)
					.setTimestamp()
				message.channel.send(embeduserinfo);
			}

			if (longarg(1)) {
				const user = await Helper.resolveUser(longarg(1), message.guild ? { askingChannel: <TextChannel>message.channel, caller: message.author, memberList: message.guild.members.cache.array() } : undefined);
				if (user) {
					printUserInfo(user);
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
					const fetchedGuild = await bot.guilds.fetch(args[1]).catch((err: DiscordAPIError) => {
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

