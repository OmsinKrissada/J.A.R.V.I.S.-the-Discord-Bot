import { MessageEmbed, Message, Collection, User, UserResolvable, EmojiResolvable } from 'discord.js';
import { bot } from '././Main'
import { Util } from './Util';
import { DataManager } from './DataManager'
const alias = require('../settings/alias.json');
import * as fs from 'fs'
import * as Wolfram from './Wolfram';
import { Ranker } from './Ranker';
import * as Morse from './Morse';
import * as Music from './Music';

const red = Util.red
const green = Util.green
const blue = Util.blue
const yellow = Util.yellow;

interface CommandObject {
	[key: string]: Function
}
export const commands: CommandObject = {};

export const non_dm_command = ['nick', 'purge', 'history', 'movevoice'];

export var prefix: string;
export var message: Message;
export var args: Array<string>;

export function setPrefix(_prefix: string) {
	prefix = _prefix;
}

export function setRespondMessage(_message: Message) {
	message = _message;
}

export function setArguments(_args: Array<string>) {
	args = _args.filter(arg => arg != '');
}

export function run(command: string) {
	if (commands.hasOwnProperty(command)) {
		commands[command]();
	} else commands.unknown();
}


function longarg(begin_index = 1) {
	return args.slice(begin_index).join(' ').trim();
}


// -----------------------------------------------------------------------------------
// Main Commands List Starts Here
// -----------------------------------------------------------------------------------

// Setting commands


commands.help = () => {

	function detailedHelp(asked_command: string) {
		let embed = new MessageEmbed()
			.setTitle('Help | Command: ' + Util.inlineCodeBlock(asked_command))
			.setColor(blue)
		for (let category in command_info) {
			if (command_info[category].hasOwnProperty(asked_command)) {
				let command = command_info[category][asked_command];
				embed.addField('Description:', command.description);
				if (typeof command.usage == 'string') embed.addField('Usage:', Util.inlineCodeBlock(command.usage));
				else {
					let usagestr = '';
					command.usage.forEach((usage: string) => usagestr += Util.inlineCodeBlock(usage) + '\n');
					embed.addField('Usages:', usagestr);
				}
				message.channel.send(embed);
				validDetail = true;
			}
		}
	}

	let command_info: { [type: string]: { [command: string]: { [key: string]: string | Array<string> } } } = {
		general: {
			"help": {
				description: "Shows this message.",
				usage: `${prefix}help`
			},
			"invite": {
				description: "Shows bot's invitation link.",
				usage: `${prefix}invite`
			},
			"alias": {
				description: "Shows available command aliases.",
				usage: `${prefix}alias`
			},
			"ping": {
				description: "Pings the bot",
				usage: `${prefix}ping`
			},
			"ip": {
				description: "Shows bot's current IP address.",
				usage: [`${prefix}ip`, `${prefix}ip plain|mobile|m`, `${prefix}ip announce`]
			},
			"uptime": {
				description: "Shows uptime for the bot.",
				usage: `${prefix}uptime`
			},
			"hello": {
				description: "Hi!",
				usage: `${prefix}hello`
			},
			"say": {
				description: "Repeats a text.",
				usage: `${prefix}say {text}`
			},
			"repeat": {
				description: "~~Repeats texts sends by a user.~~ **NOT READY**",
				usage: `${prefix}repeat {user} {text}`
			},
			"whoisironman": {
				description: "Let you know the true Ironman.",
				usage: `${prefix}whoisironman`
			},
		},
		settings: {
			"backup": {
				description: "Creates a backup of all guilds' options.",
				usage: `${prefix}backup`
			},
			"reload": {
				description: "Reloads all guilds' options.",
				usage: `${prefix}reload`
			},
			"reset": {
				description: "Resets all current guild's option to default value.",
				usage: `${prefix}reset`
			},
			"prefix": {
				description: "Changes the prefix of the bot.",
				usage: `${prefix}prefix {prefix}`
			},
			"nick": {
				description: "Changes bot's nickname.",
				usage: [`${prefix} set {nickname}`, `${prefix} clear`]
			}
		},
		features: {
			"info": {
				description: "Shows information about a user or a server.",
				usage: [`${prefix}info user {@mention|username|nickname|user_id}`, `${prefix}info user me`, `${prefix}info server`]
			},
			"history": {
				description: "Shows edit history of a message.",
				usage: `${prefix}history {message_id}`
			},
			"purge": {
				description: "Purges a number of latest message(s).",
				usage: `${prefix}purge {amount}`
			},
			"movevoice": {
				description: "Moves members from voice channels to another channel.",
				usage: `${prefix}movevoice {origin channel} {destination channel}`
			},
			"mvregex": {
				description: "Same as movevoice but chooses using RegEx.",
				usage: `${prefix}mvregex {origin channel regex} {destination channel regex}`
			},
			"muteall": {
				description: "Mutes all every in all voice channels.",
				usage: `${prefix}muteall`
			},
			"unmuteall": {
				description: "Unmutes every members in all voice channels.",
				usage: `${prefix}unmuteall`
			},
			"disconnectall": {
				description: "Disconnects every members from all voice channels.",
				usage: `${prefix}`
			},
			"hook": {
				description: "Hooks a text with a voice channel.",
				usage: [`${prefix}hook list`, `${prefix}hook add .... I AM TOO LAZY TO DO IT NOW K? -.-`]
			},
			"ask": {
				description: "Ask information from WolframAlpha.",
				usage: `${prefix}ask {question}`
			},
			"askimg": {
				description: "Ask information from WolframAlpha as an image.",
				usage: `${prefix}askimg {question}`
			},
			"rank": {
				description: "~~Ranks choices.~~ **NOT READY**",
				usage: `${prefix}rank`
			},
			"morse": {
				description: "Translates between morse code and English.",
				usage: `${prefix}morse {text (morse code or English)}`
			},
		}
	}

	let validDetail = false;

	if (args[1]) {
		detailedHelp(args[1]);
	}
	if (validDetail) return;
	let header = prefix == '' ? 'Bot currently has no prefix.' : `Current prefix is ${Util.inlineCodeBlock(prefix)}.`;

	let embed = new MessageEmbed()
		.setTitle(header)
		.setDescription(`Use ${Util.inlineCodeBlock(prefix + 'help {command}')} to get usage information.`)
		.setColor(blue)
		.attachFiles([{ attachment: './resources/rainbow.png' }])
		.setAuthor('Help | Available Commands:', 'attachment://rainbow.png');

	for (let category in command_info) {
		let commands = '';
		for (let command in command_info[category]) {
			commands += Util.inlineCodeBlock(command) + ', ';
		}
		embed.addField(category.toLocaleUpperCase(), commands.slice(0, -2));
	}
	embed.addField('‏‏‎ ‎', 'For source code, please visit [this repository](https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot "https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot").');

	message.channel.send(embed);

}

commands.backup = () => {
	// Check if file dir exist, if not, create them.
	if (!fs.existsSync('./files/backups')) {
		fs.mkdirSync('./files/backups')
	}
	// Copy database file
	fs.copyFileSync('./files/guild_option.json', `./files/backups/${new Date().toLocaleString().replace(/ |\/|,|:/g, '-')}.json`)
	message.channel.send(new MessageEmbed()
		.setTitle('Backup Complete')
		.setDescription(`Done backing up to ${new Date().toLocaleString().replace(/ |\/|,|:/g, '-')}.json`)
		.setColor(green)
	)
}

commands.reload = () => {
	DataManager.getOption();
	message.channel.send(new MessageEmbed()
		.setTitle('Data Reloaded')
		.setDescription('Server database cache has reloaded from file')
		.setColor(green)
	);
}

commands.reset = () => {
	message.channel.send(new MessageEmbed()
		.setTitle('Confirmation Needed')
		.setDescription('This action will reset the current guild\'s data to default value, do you want to continue? (yes/no)')
		.setColor(yellow)).then(() => {
			bot.user.lastMessage.react('✅');
			bot.user.lastMessage.react('❌');
			bot.user.lastMessage.awaitReactions((reaction, user) => (reaction.emoji.name == '✅' || reaction.emoji.name == '❌') && user == message.author, { max: 1, time: 10000, errors: ['time'] })
				.then(collected => {
					console.log(collected.first().emoji.name)
					if (collected.first().emoji.name == '✅') {
						if (message.guild) {
							DataManager.addGuildDefaultOption(message.guild.id, message.guild.name, false)
						} else {
							DataManager.addGuildDefaultOption(message.channel.id, message.author.username, true)
						}

						message.channel.send(new MessageEmbed()
							.setTitle('Done!')
							.setDescription('')
							.setColor(green))
					}
					else {
						message.channel.send(new MessageEmbed()
							.setTitle('Canceled!')
							.setDescription('')
							.setColor(red))
					}
				})
				.catch(collected => {
					message.channel.send(new MessageEmbed()
						.setTitle('Timeout')
						.setDescription('Timeout, action canceled.')
						.setColor(red));
				});
		});
}

commands.prefix = () => {
	if (args[1] == 'clear') {
		if (message.guild === null) {
			DataManager.data.guilds[message.channel.id].prefix = '';
			DataManager.updateOption();
			message.channel.send(new MessageEmbed()
				.setTitle('Prefix Cleared')
				.setDescription(`Prefix has cleared`)
				.setColor(green)
			)
		}
		else {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription(`Blank prefix is only allowed in DM channels.`)
				.setColor(red)
			);
		}
	}
	else if (args[1] != undefined) {
		let new_prefix = args[1];
		DataManager.data.guilds[message.guild === null ? message.channel.id : message.guild.id].prefix = new_prefix;
		DataManager.setOption(DataManager.data);
		message.channel.send(new MessageEmbed()
			.setTitle('Prefix Changed')
			.setDescription(`Prefix has changed to ${Util.inlineCodeBlock(new_prefix)}`)
			.setColor(green)
		)
	}
	else {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Usage: ${Util.inlineCodeBlock(`${prefix}prefix {new prefix}`)} or ${Util.inlineCodeBlock(`${prefix}prefix clear`)}`)
			.setColor(red)
			.setFooter('Note: Blank prefix is only allowed in DM channels.')
		);
	}
}

commands.nick = () => {
	if (args[1] != undefined) {
		message.guild.member(bot.user).setNickname(args[1])
		message.channel.send(new MessageEmbed()
			.setTitle('Nickname Changed')
			.setDescription(`Nickname has changed to **${args[1]}**`)
			.setColor(green)
		)
	}
	else {
		message.guild.member(bot.user).setNickname('')
		message.channel.send(new MessageEmbed()
			.setTitle('Nickname Reset')
			.setDescription('Nickname has reset to **J.A.R.V.I.S.**')
			.setColor(green)
		)
	}
}

commands.invite = () => {
	bot.generateInvite(8).then(link => {
		message.channel.send(new MessageEmbed()
			.setDescription('You can invite me to your server by clicking this link. ' + link)
			.setColor(blue)
		)
	})
}

commands.alias = () => {
	let embed = new MessageEmbed()
		.setTitle('Available Aliases:')
		.setColor(blue);
	let available_alias = '';
	for (let command in alias) {
		available_alias = '';
		alias[command].forEach(index => {
			available_alias += ` \`${index}\`, `
		})
		embed.addField(`${command}`, available_alias.slice(0, -2), true);
		// available_alias += '\n\n';
	}
	console.log(available_alias)
	message.channel.send(embed);
}



// Utility commands

commands.ping = async () => {
	const m = await message.reply('Pong!')
	message.channel.send(`Latency: ${m.createdTimestamp - message.createdTimestamp}ms`);
	message.channel.send(`API Latency ${Math.round(bot.ws.ping)}ms`);
}

commands.ip = async () => {
	if (args[1] == 'plain' || args[1] == 'mobile' || args[1] == 'm') {
		message.channel.send(await Util.refreshIp());
	}
	else if (args[1] == 'announce') {
		message.channel.send(new MessageEmbed()
			.setTitle('CURRENT IP')
			.setDescription(`**Current IP address is \`${await Util.refreshIp()}\`**`)
			.setColor(blue)
			.addField(` ‎`, `_Last updated: ${new Date().toLocaleString()}_`)
		)
		message.channel.send('@everyone')
	}
	else {
		message.channel.send(new MessageEmbed()
			.setDescription(`Current IP address is **${await Util.refreshIp()}**`)
			.setColor(blue)
			.setFooter('Can\'t connect? Contact Omsin.')
			.setTimestamp()
		);
	}
}

commands.history = () => {
	if (!message.guild.member(message.author).hasPermission('MANAGE_MESSAGES')) {
		message.channel.send('⛔ You don\'t have "Manage Messages" permission. This incident will be reported. ⛔');
		return;
	}
	if (args[1]) {
		message.channel.messages.fetch(args[1]).then(msg => {
			console.log(msg);
			console.log(msg.edits.length)
			let embed = new MessageEmbed()
				.setTitle('Message History: ');
			let description = '';
			let i = 1;
			if (msg.edits.length > 1) {
				msg.edits.reverse().forEach(thismsg => {
					description += `\`[${i}] ->\` ${thismsg.content}\n`;
					i++;
				})
				message.channel.send(embed.setDescription(description).setColor(blue));
			}
			else {
				message.channel.send('Cannot get edit history of that message.')
			}
		}).catch(err => message.channel.send('Cannot find that message.'))
	}
	else {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription('Usage: ' + Util.inlineCodeBlock(`${prefix}history <message id>`))
			.setColor(red)
		)
	}
}

commands.purge = () => {
	function deletemsg(exceed_three: boolean) {
		message.channel.bulkDelete(amount + (exceed_three ? 2 : 1)).then(() =>
			message.channel.send(`✅ Deleted ${amount} message${amount > 1 ? 's' : ''}. [${message.author}]`).then(msg => msg.delete({ timeout: 5000, reason: `Issued by ${message.author.username}` }))
		)
	}
	if (!message.guild.member(message.author).hasPermission('MANAGE_MESSAGES')) {
		message.channel.send('⛔ You don\'t have "Manage Messages" permission. This incident will be reported. ⛔');
		return;
	}
	let amount = Number.parseInt(args[1]);
	if (!isNaN((<any>args[1]))) {
		if (amount < 1 || amount > 100) {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription(`The amount of messages must not below than 1 nor greater than 100.`)
				.setColor(red)
			)
		}
		// Can purge
		else {
			let confirm_msg;
			let exceed_three = amount > 3;
			if (exceed_three) {
				message.channel.send(new MessageEmbed()
					.setTitle('Confirmation Needed')
					.setDescription(`This action is going to delete the last **${amount}** messages.`)
					.setColor(yellow)
					.setFooter('You have 10 seconds to respond.')).then(() => {
						confirm_msg = bot.user.lastMessage;
						confirm_msg.react('✅');
						console.log('tick')
						confirm_msg.react('❌');
						console.log('nope')
						confirm_msg.awaitReactions((reaction, user) => (reaction.emoji.name == '✅' || reaction.emoji.name == '❌') && user == message.author, { max: 1, time: 10000, errors: ['time'] })
							.then(collected => {
								console.log(collected.first().emoji.name)
								if (collected.first().emoji.name == '✅') {
									deletemsg(exceed_three)
								}
								else {
									confirm_msg.edit(new MessageEmbed()
										.setDescription('❌ Canceled!')
										.setColor(red)).then(msg => msg.delete({ timeout: 5000 }));
									confirm_msg.reactions.removeAll();
								}
							}).catch(collected => {
								confirm_msg.edit(new MessageEmbed()
									.setTitle('Timeout')
									.setDescription('Timeout, action canceled.')
									.setColor(red)).then(msg => msg.delete({ timeout: 5000 }));
								confirm_msg.reactions.removeAll();
							})
					});
			} else deletemsg(exceed_three);
		}
	}
	else {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Usage: ${prefix}purge <amount>`)
			.setColor(red)
		)
	}
}

commands.uptime = () => {
	message.channel.send(new MessageEmbed()
		.setTitle('Uptime')
		.setDescription(`${bot.uptime / 1000}s`)
		.setColor(blue)
	)
}

commands.info = () => {
	if (args[1] == 'user') {
		let user;
		console.log(`"${longarg(2)}"`)
		switch (longarg(2)) {
			case "":
				message.channel.send(new MessageEmbed()
					.setTitle(`Assumed ${Util.inlineCodeBlock(prefix + 'userinfo me')}`)
					.setDescription('Usage: ' + Util.inlineCodeBlock(prefix + 'userinfo') + ' or ' + Util.inlineCodeBlock(prefix + 'userinfo <member>'))
					.setColor(yellow)
				).then(msg => msg.delete({ timeout: 10000 }));
			case 'me':
				user = message.author;
				break;
			default:
				if (message.mentions.members != undefined && message.mentions.members.first() != undefined) {
					user = message.mentions.members.first().user;
				}
				else if (message.guild) {
					try {
						user = message.guild.members.cache.filter(member => member.displayName.toLowerCase().includes(longarg(2).toLowerCase()) || member.user.username.toLowerCase().includes(longarg(2).toLowerCase()));
					} catch (err) { }
					if (user.size != undefined && user.size > 0) {
						console.log(user.size)
						// console.log(JSON.stringify(user.toJSON(), 4))
						if (user.size > 1) {
							confirm_type('Please choose the member you refer to. (type in chat)', user, true).then(usr => {
								user = message.guild.member(usr).user;
								console.log(user)
								printUserInfo(user);
							})
							return;
							break;
						}
						else {
							user = user.first().user
						}
					}
					// if (message.deletable) message.delete();
				}
		}
		if (message.deletable) message.delete();

		if (!(user == null || user.size == 0)) {
			printUserInfo(user);
			return;
		}
		if (bot.users.fetch(args[2]) != undefined) {
			let is_return = true;
			bot.users.fetch(args[2]).then(printUserInfo).catch(() => is_return = false)
			if (is_return) return;
		}
		message.channel.send(new MessageEmbed()
			.setTitle('Member Not Found')
			.setDescription(`Cannot find the specified member: "${longarg()}"`)
			.setColor(red)
		);
		return;


		function printUserInfo(user) {
			let embeduserinfo = new MessageEmbed();
			embeduserinfo
				.setTitle('User Info Card')
				.setColor(blue)
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
					embeduserinfo
						.addField('Roles', rolesOfTheMember)
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
			if (message.deletable) message.delete();
		}

	}
	else if (args[1] == 'server') {
		let guild = message.guild;
		let embed = new MessageEmbed()
			.setTitle('Server Info Card')
			.setColor(blue)
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
		setArguments(['help', 'info'])
		run('help');
	}
}

commands.ask = () => {
	const query = args.slice(1).join(' ');
	if (query == '') {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Usage: ${Util.inlineCodeBlock(`${prefix}ask {question}`)}`)
			.setColor(red)
		);
		return;
	}
	Wolfram.getShort(query, message);
}

commands.askimg = () => {
	const query = args.slice(1).join(' ');
	if (query == '') {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Usage: ${Util.inlineCodeBlock(`${prefix}askimg {question}`)}`)
			.setColor(red)
		);
		return;
	}
	Wolfram.getSimple(query, message);
}



// MUSIC !!!

commands.join = () => {
	if (!message.member.voice.channel) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription('**You must be in a voice channel** to use this command.')
			.setColor(red)
		);
		return;
	}
	Music.join(message.member.voice.channel)
}

commands.play = async () => { // Some part of code is from discord.js
	if (!message.member.voice.channel) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription('**You must be in a voice channel** to use this command.')
			.setColor(red)
		);
		return;
	}
	Music.addQueue(message.member, longarg())
}

commands.pause = () => {
	Music.pause(message.guild);
	message.channel.send('paused')
}

commands.resume = () => {
	Music.resume(message.guild);
	message.channel.send('resumed')
}

commands.nowplaying = () => {
	let current_song = Music.getCurrentSong(message.guild);
	if (!current_song) {
		message.channel.send(new MessageEmbed()
			.setTitle('No Playing Song')
			.setColor(blue)
		);
		return;
	}

	let playedTime = Math.floor(current_song.getPlayedTime(message.guild) / 1000);
	message.channel.send(new MessageEmbed()
		.setTitle('Now Playing:')
		// .setDescription(content)
		.setColor(blue)
		.setThumbnail(current_song.thumbnail)
		.addField('Song', `${current_song.title}`)
		.addField('Link', current_song.url)
		.addField('Duration', `${Util.min2(Math.floor(playedTime / 60))}:${Util.min2(playedTime % 60)}` + ' / ' + current_song.getDuration())
		.addField('Text Channel', current_song.textChannel, true)
		.addField('Voice Channel', current_song.voiceChannel, true)
		.addField('Requester', `${current_song.requester}`, true)
	);
}

commands.skip = () => {
	Music.skip(message.guild);
}

commands.volume = () => {
	// try {
	Music.volume(message.guild, Number(args[1]));

	// } catch (err) {
	// 	console.log('error occured while changing the volume')
	// }
	message.channel.send(new MessageEmbed()
		.setTitle('Volume Adjusted')
		.setDescription(`Volume has adjusted to \`${Number(args[1])}\`.`)
		.setColor(green)
	);
}

commands.queue = () => {
	let content = '';
	let i = 0;
	Music.getQueue(message.guild).forEach(song => {
		i++;
		content += `${Util.getNumberEmoji(i)} **__[${song.title}](${song.url})__** requested by ${song.requester}\n\n`;
	})
	message.channel.send(new MessageEmbed()
		.setTitle(content.length == 0 ? 'Queue is empty.' : 'Song Queue:')
		.setDescription(content)
		.setColor(blue)
	)
}

commands.clearqueue = () => {
	Music.clearQueue(message.guild);
	message.channel.send(new MessageEmbed()
		.setTitle('Queue Cleared')
		.setDescription('Music queue for this server has been resetted.')
		.setColor(green)
	);
}

commands.leave = async () => {
	Music.leave(message.guild);
}

commands.volume = async () => {
	// message.member.voice.
}



// Not so useful commands

commands.hello = () => {
	message.channel.send(`Hi! ${message.author}`)
}

commands.say = () => {
	message.channel.send(longarg());
	if (message.deletable) message.delete();
}

commands.repeat = () => {
	if (args[1] == null) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Usage: ${Util.inlineCodeBlock(`${prefix}repeat me`)} or ${Util.inlineCodeBlock(`${prefix}repeat {user}`)}`)
			.setColor(red)
		)
		return 1;
	}
	let current_user: UserResolvable = args[1] == 'me' ? message.author.id : message.mentions.users.first().id;
	if (current_user == bot.user.id) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Repeat to myself? It's boring...`)
			.setColor(red)
		)
		return 1;
	}
	var repeating_user: Array<string> = [];
	if (args[1] == 'stop') {
		if (repeating_user.includes(args[2] == 'me' ? message.author.id : message.guild.member(args[2]).id)) {
			repeating_user = repeating_user.filter(user => user != current_user);
		}
		else {
			message.channel.send('The user is not being repeated.')
		}
		return 1;
	}
	repeating_user.push(current_user);
	message.channel.send(`repeating ${current_user}`)
	const filter = message => message.author == current_user;
	const collector = message.channel.createMessageCollector(filter);

	collector.on('collect', m => {
		console.log(`Collected ${m.content}`);
		m.channel.send(m.content);
	});

	collector.on('end', collected => {
		console.log(`Collected ${collected.size} items`);
	});
}

commands.rank = () => {
	console.log('Warning: This feature is not ready yet.')
	let ranker = new Ranker('1234');
	console.log('created')
	ranker.python.stdout.on('data', data => {
		message.channel.send(data.toString())
	})
}

commands.morse = () => {
	let description = `Please choose your translation option.\n
	1️⃣ - **English** ➡ **Morse**\n
	2️⃣ - **Morse** ➡ **English**`;
	confirm_click('Title here', description, ['1️⃣', '2️⃣']).then(answer => {
		console.log(answer)
		if (answer == '1️⃣') {
			message.channel.send(Morse.toMorse(longarg()));
		}
		if (answer == '2️⃣') {
			message.channel.send(Morse.toEnglish(longarg()));
		}
	})
}



// Personal-use commands

commands.movevoice = async () => {
	if (!(args[1] && args[2])) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Usage: ${prefix}movevoice {origin} {destination}`)
			.setColor(red)
		)
		return;
	}

	let origin_all = true;

	// Gather origin channels
	let origins = message.guild.channels.cache.filter(channel => channel.type == "voice");
	if (args[1] != '*') {
		origins = origins.filter(channel => channel.name.toLowerCase().includes(args[1].toLowerCase()));
		origin_all = false;
	}

	// Gather destination channel
	let dests = message.guild.channels.cache.filter(channel => channel.type == "voice");
	if (args[2] != '*') {
		dests = dests.filter(channel => channel.name.toLowerCase().includes(args[2].toLowerCase()));
	}

	let embed = new MessageEmbed()
		.setTitle('Members Moved:')
		.setColor(green);
	let description = '';

	// Confirm destination channel
	if (origin_all) {
		confirm_type('Choose Destination Channel', dests).then(deststr => {
			let dest = message.guild.channels.resolve(deststr);
			if (origins.size == 0) message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription('No Voice Channels Found')
				.setColor(red))
			if (!dest) {
				message.channel.send(new MessageEmbed()
					.setTitle('Error')
					.setDescription('**Destination Channel** Not Found')
					.setColor(red));
				return;
			}
			origins.forEach((origin) => {
				message.guild.channels.resolve(origin).members.forEach((member) => {
					if (origin.id != dest.id) {
						console.log('all')
						console.log('from ' + origin.name + ' to ' + dest.name)
						description += ` • ${member.user}: ${origin.name} ➡ ${dest.name}\n`
						member.voice.setChannel(dest);
					}
				})
			})
			if (description != '')
				message.channel.send(embed.setDescription(description))
			else
				message.channel.send(new MessageEmbed()
					.setTitle('No Users Moved')
					.setColor(blue)
				)
		})
	}
	else { // Confirm origin channel
		confirm_type('Choose Origin Channel', origins).then(originstr => {
			confirm_type('Choose Destination Channel', dests).then(deststr => {
				let origin = message.guild.channels.resolve(originstr);
				let dest = message.guild.channels.resolve(deststr);
				// Tell the errors
				if (!origin) {
					message.channel.send(new MessageEmbed()
						.setTitle('Error')
						.setDescription('**Origin Channel** Not Found')
						.setColor(red));
					return;
				}
				if (!dest) {
					message.channel.send(new MessageEmbed()
						.setTitle('Error')
						.setDescription('**Destination Channel** Not Found')
						.setColor(red));
					return;
				}
				message.guild.channels.resolve(origin).members.forEach((member) => {
					if (origin.id != dest.id) {
						console.log('not all')
						console.log('from ' + origin.name + ' to ' + dest.name)
						description += ` • ${member.user}: ${origin.name} ➡ ${dest.name}\n`
						member.voice.setChannel(dest);
					}
				})
				if (description != '')
					message.channel.send(embed.setDescription(description))
				else
					message.channel.send(new MessageEmbed()
						.setTitle('No Users Moved')
						.setColor(blue)
					)
			})
		})
	}
}

commands.muteall = () => {
	message.guild.members.cache.forEach(member => {
		if (member.voice.channel) {
			member.voice.setMute(true).catch()
		}
	})
}

commands.unmuteall = () => {
	message.guild.members.cache.forEach(member => {
		if (member.voice.channel) {
			member.voice.setMute(false).catch()
		}
	})
}

commands.disconnectall = () => {
	message.guild.members.cache.forEach(member => {
		if (member.voice.channel) {
			member.voice.kick().catch();
		}
	})
}



commands.mvregex = async () => {
	if (!(args[1] && args[2])) {
		message.channel.send(new MessageEmbed()
			.setDescription('Channel Not Specified')
			.setColor(red)
		)
		return;
	}

	let origin_all = true;
	// from
	let origins = message.guild.channels.cache.filter(channel => channel.type == "voice");
	if (args[1] != '*') {
		origins = origins.filter(channel => Boolean(channel.name.match(new RegExp(args[1], 's'))));
		origin_all = false;
	}
	// let origin_promise = new Promise((resolve, reject) => {
	// 	resolve(ask_confirm('Choose your origin voice channel. **(type number in chat)**', origins));
	// })

	let dests = message.guild.channels.cache.filter(channel => channel.type == "voice");
	if (args[2] != '*') {
		dests = dests.filter(channel => Boolean(channel.name.match(new RegExp(args[2], 's'))));
	}

	// let origin_promise = ask_confirm('origin', origins);
	// let dest_promise = ask_confirm('destination', dests);

	if (origin_all) {
		confirm_type('Choose destination channel you are refering to. *(type in chat)*', dests).then(dest => {
			origins.forEach((origin) => {
				message.guild.channels.resolve(origin).members.forEach((member) => {
					console.log('all')
					console.log('from ' + message.guild.channels.resolve(origin).name + ' to ' + message.guild.channels.resolve(dest).name)
					member.voice.setChannel(dest);
				})
			})
		})
	}
	else {
		confirm_type('Choose origin channel you are refering to. *(type in chat)*', origins).then(origin => {
			confirm_type('destination', dests).then(dest => {
				message.guild.channels.resolve(origin).members.forEach((member) => {
					console.log('not all')
					console.log('from ' + message.guild.channels.resolve(origin).name + ' to ' + message.guild.channels.resolve(dest).name)
					member.voice.setChannel(dest);
				})
			})
		})
	}
	// let dest_promise = new Promise((resolve, reject) => {
	// 	resolve(ask_confirm('Choose your destination voice channel. **(type number in chat)**', dests));
	// })

	// origin_promise.then((origin) => {
	// 	dest_promise.then((dest) => {
	// 		console.log('run')
	// 		origin.members.forEach((member) => {
	// 			console.log('going to move from ' + origin.name + ' to ' + dest.name)
	// 			member.voice.setChannel(dest);
	// 		})
	// 	})
	// })



	// message.guild.members.cache.filter(member => member.voice.channel ? member.voice.channel.id == args[1] : false).forEach(member => {
	// 	member.voice.setChannel(args[2]);
	// })
}

commands.hook = () => {
	// hook(args[2], args[3]);
	// function hook(text, voice) {
	if (!DataManager.data.guilds[message.guild.id].hooks) {
		DataManager.data.guilds[message.guild.id].hooks = [];
	}

	if (args[1] == 'add') {
		DataManager.data.guilds[message.guild.id].hooks.push({ text: args[2], voice: args[3], type: args[4] ? args[4] : 'hard' });
		DataManager.updateOption();
		message.channel.send(new MessageEmbed()
			.setTitle('Channel Hooks:')
			.setDescription(`Hooked \`${message.guild.channels.resolve(args[2]).name}\` with \`${message.guild.channels.resolve(args[3]).name}\`.`)
			.setColor(green)
		);
	}
	else if (args[1] == 'remove') {
		DataManager.data.guilds[message.guild.id].hooks = DataManager.data.guilds[message.guild.id].hooks.filter(hook => hook.text != args[2] && hook.voice != args[2]);
		DataManager.updateOption();

	}
	else if (args[1] == 'list') {
		if (DataManager.data.guilds[message.guild.id].hooks.length == 0) {
			message.channel.send('No Hooks Created');
			return;
		}
		let content = '';
		let count = 1;
		DataManager.data.guilds[message.guild.id].hooks.forEach(hook => {
			content += `  ${Util.getNumberEmoji(count)} - :speech_balloon: **${message.guild.channels.resolve(hook.text)}**  :left_right_arrow:  :loud_sound: **${message.guild.channels.resolve(hook.voice).name}**\n\n`;
			count++;
		})
		message.channel.send(new MessageEmbed()
			.setTitle('Channel Hooks:')
			.setDescription(content)
			.setColor(blue)
			.setFooter(`You can add or remove a hook with ${prefix}hook command.`)
		)
	}
	else {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription('Usage: ' + Util.inlineCodeBlock(`${prefix}hook add/remove/list <text channel id> <voice channel id>`))
			.setColor(red)
		);
	}
	// }
}



// Easter Eggs commands

commands.whoisironman = () => {
	message.channel.send(new MessageEmbed()
		.setTitle('Real Ironman')
		.setDescription('The real ironman is Omsin.')
		.setColor(blue)
	)
}

commands.ohm = () => {
	switch (Math.floor(Math.random() * 10)) {
		case 0:
			message.reply('หอยหลอด')
			break;
		case 1:
			message.reply('I got 2060 super!')
			break;
		case 2:
			message.reply('จ๊ะะะ')
			break;
		case 3:
			message.reply('!!!')
			break;
		case 4:
			message.reply('เอาเถอะ!!!')
			break;
		case 5:
			message.reply('ทำไมรึ')
			break;
		case 6:
			message.reply('ห๊ะะ')
			break;
		case 7:
			message.reply('TU CLD')
			break;
		case 8:
			message.reply('แช่คอมในตู้เย็นสิ')
			break;
		case 9:
			message.reply('เขรื่องปริ้น')
			break;
	}
}

commands.kong = () => {
	message.reply('typerace?');
}



// Unknown command!?

commands.unknown = () => {
	message.channel.send(new MessageEmbed()
		.setTitle('Error')
		.setDescription(`Invalid command, type ${Util.inlineCodeBlock(`${prefix}help`)} for list of commands.`)
		.setColor(red));
}

commands.test = () => {
	message.channel.send(new MessageEmbed()
		.setTitle('test')
		.addField('command', "`!info`\n`!...`\n`...`")
	)
}

// Functions
function confirm_type(title: string, collection: Collection<string, any>, is_delete = false): Promise<string> {
	let confirm = (resolve: (arg0: any) => void) => {
		if (collection.size <= 1) {
			resolve(collection.first());
			return collection.first();
		}
		let embeduser = new MessageEmbed()
			.setTitle(title)
			.setColor(blue);

		let str = '';
		let i = 1;
		collection.forEach((member) => {
			str += `${Util.getNumberEmoji(i)} - ${member}\n\n`;
			i++;
		})
		embeduser.setDescription(str);
		message.channel.send(embeduser)
			.then((confirm_msg) => {
				message.channel.awaitMessages(response => response.author.id == message.author.id, { max: 1 }).then((collected) => {
					let answer_msg = collected.first();
					if (!(Number(answer_msg.content) >= 1 && Number(answer_msg.content) <= collection.size)) {
						message.channel.send(new MessageEmbed()
							.setDescription('Invalid answer, aborted.')
							.setColor(red)
						).then(msg => { if (msg.deletable) msg.delete({ timeout: 10000 }) })
						if (answer_msg.deletable) answer_msg.delete();
						if (confirm_msg.deletable) confirm_msg.delete();
						resolve(undefined);
						return undefined;
					}
					else {
						let result = Array.from(collection.keys())[Number(answer_msg.content) - 1];
						if (confirm_msg.deletable) confirm_msg.delete();
						if (answer_msg.deletable) answer_msg.delete();
						console.log(result)
						resolve(result);
						return result;
					}
				});
			})
		if (is_delete && message.deletable) message.delete();
	}
	return new Promise(confirm);
}

function confirm_click(title: string, description: string, reactions: Array<EmojiResolvable>, timeout?: number): Promise<EmojiResolvable | null> {
	let confirm = (resolve: (arg0: string | null) => void) => {

		let embed = new MessageEmbed()
			.setTitle(title)
			.setDescription(description)
			.setColor(yellow);
		if (timeout) {
			embed.setFooter(`You have ${timeout} seconds to respond.`);
		}

		message.channel.send(embed).then((confirm_msg) => {
			reactions.forEach(reaction => {
				confirm_msg.react(reaction);
			})
			confirm_msg.awaitReactions((reaction, user) => reactions.includes(reaction.emoji.name) && user == message.author, { max: 1, time: timeout, errors: ['time'] })
				.then(collected => {
					console.log(collected.first().emoji.name)
					console.log(reactions)
					resolve(collected.first().emoji.name);
				}).catch(() => {
					if (timeout) {
						confirm_msg.edit(new MessageEmbed()
							.setTitle('Timeout')
							.setDescription('Timeout, action canceled.')
							.setColor(red)).then(msg => msg.delete({ timeout: 5000 }));
						confirm_msg.reactions.removeAll();
					}
					resolve(null);
				})
		});
	}
	return new Promise(confirm);
}

commands.terminate = () => {
	if (message.author.id != '551678168348491786') return;
	message.channel.send('Terminated ' + process.pid).then(
		process.exit()
	);
}
