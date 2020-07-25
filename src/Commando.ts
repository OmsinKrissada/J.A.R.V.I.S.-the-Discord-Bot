import { MessageEmbed, Message, User, UserResolvable, EmojiResolvable, GuildMember, TextChannel, ReactionEmoji, MessageReaction, Collection } from 'discord.js';
import { bot } from '././Main'
import { Util } from './Util';
import * as DataManager from './DataManager'
import alias from '../settings/alias.json';
import * as fs from 'fs'
import { Wolfram } from './Wolfram';
// import { Ranker } from '../files/Ranker';
import * as Morse from './Morse';
import * as Music from './Music';

import helpDetail from '../settings/help.json';
import responses from '../files/responses.json';

const red = Util.red
const green = Util.green
const blue = Util.blue
const yellow = Util.yellow;

interface CommandObject {
	[key: string]: Function
}
export const commands: CommandObject = {};

export const non_dm_command: Array<string> = ['nick', 'purge', 'history', 'movevoice', 'play', 'queue', 'skip', 'volume', 'remove', 'pause', 'resume', 'search', 'nowplaying', 'join', 'leave', 'rickroll'];

export var message: Message;
export var args: Array<string>;
export var prefix: string;

/**
 * 
 * @param command Command to run
 * @param args Array of arguments to apply to this command
 */
export async function run(command: string, argument_array: Array<string>, user_message: Message) {
	args = argument_array;
	message = user_message;
	prefix = await DataManager.get(message.guild.id, 'prefix');
	if (commands.hasOwnProperty(command)) {
		commands[command]();
	} else if (DataManager.get(user_message.guild.id, 'warnUnknownCommand')) commands.unknown();
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
				if (typeof command.usage == 'string') embed.addField('Usage:', Util.inlineCodeBlock(prefix + command.usage));
				else {
					let usagestr = '';
					command.usage.forEach((usage: string) => usagestr += Util.inlineCodeBlock(prefix + usage) + '\n');
					embed.addField('Usages:', usagestr);
				}
				let aliasstr = Util.inlineCodeBlock(asked_command) + ', ';
				if (alias[asked_command]) {
					alias[asked_command].forEach((available: string) => {
						aliasstr += Util.inlineCodeBlock(available) + ', ';
					});
				}
				embed.addField('Aliases', aliasstr.slice(0, -2));
				message.channel.send(embed);
				validDetail = true;
			}
		}
	}


	let command_info: {
		[category: string]: {
			[command: string]: {
				[key: string]: string | Array<string>
			}
		}
	} = helpDetail;

	let validDetail = false;
	if (args[0]) {
		let command = args[0].toLowerCase();
		for (let key in alias) {
			if (alias[key].includes(args[0])) {
				command = key;
			}
		}
		detailedHelp(command);
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
		embed.addField(category, commands.slice(0, -2));
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

commands.reload = async () => {
	message.channel.send(new MessageEmbed()
		.setTitle('Data Not Reloaded')
		.setDescription('This function is deprecated since the introduction of database system.')
		.setColor(yellow)
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
							DataManager.purge(message.guild.id)
						} else {
							DataManager.purge(message.channel.id)
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
				.catch(() => {
					message.channel.send(new MessageEmbed()
						.setTitle('Timeout')
						.setDescription('Timeout, action canceled.')
						.setColor(red));
				});
		});
}

commands.prefix = () => {
	if (args[0] == 'clear') {
		if (message.guild === null) {
			DataManager.set(message.channel.id, 'prefix', '');
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
	else if (args[0] != undefined) {
		let new_prefix = args[0];
		DataManager.set(message.guild === null ? message.channel.id : message.guild.id, 'prefix', new_prefix);
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
	if (args[0] != undefined) {
		message.guild.member(bot.user).setNickname(args[0])
		message.channel.send(new MessageEmbed()
			.setTitle('Nickname Changed')
			.setDescription(`Nickname has changed to **${args[0]}**`)
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

commands.settings = () => {
	DataManager.set(message.guild.id, args[0], args[1])
}



// Utility commands

commands.ping = async () => {
	const m = await message.reply('Pong!')
	message.channel.send(`Latency: ${m.createdTimestamp - message.createdTimestamp}ms`);
	message.channel.send(`API Latency ${Math.round(bot.ws.ping)}ms`);
}

commands.ip = async () => {
	if (args[0] == 'plain' || args[0] == 'mobile' || args[0] == 'm') {
		message.channel.send(await Util.refreshIp());
	}
	else if (args[0] == 'announce') {
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
	if (args[0]) {
		message.channel.messages.fetch(args[0]).then(msg => {
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
		}).catch(() => message.channel.send('Cannot find that message.'))
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
	let amount = Number.parseInt(args[0]);
	if (!isNaN((<any>args[0]))) {
		if (amount < 1 || amount > 100) {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription(`The amount of messages must not below than 1 nor greater than 100.`)
				.setColor(red)
			)
		}
		// Can purge
		else {
			let exceed_three = amount > 3;
			if (exceed_three) {
				confirm_click('Confirmation Needed', `This action is going to delete the last **${amount}** messages.`, ['✅', '❌'], 10000).then((promise) => {
					let response = promise[0];
					let confirm_msg = <Message>promise[1];
					if (response == '✅') {
						deletemsg(exceed_three)
					}
					if (response == '❌') {
						confirm_msg.edit(new MessageEmbed()
							.setDescription('❌ Canceled!')
							.setColor(red)).then((msg: Message) => msg.delete({ timeout: 5000 }));
						confirm_msg.reactions.removeAll();
					}
				})
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

commands.info = async () => {
	if (args[0] == 'user') {
		let user: User;
		console.log(`"${longarg(1)}"`)
		switch (longarg(1)) {
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
						let usernames = [];
						users.forEach(user => usernames.push(`${user}`))
						confirm_type('Please choose the member you refer to. (type in chat)', usernames).then(usr => {
							user = message.guild.member(usr.slice(2, -1)).user;
							printUserInfo(user);
						})
						return;
					}
				}
		}
		if (message.deletable) message.delete();

		// if (!(user == null || user.size == 0)) {
		// 	printUserInfo(user);
		// 	return;
		// }
		if (!isNaN((<any>args[1]))) {
			try {
				let fetcheduser = await bot.users.fetch(args[1]);
				printUserInfo(fetcheduser);
				return;
			} catch (err) { }
		}
		message.channel.send(new MessageEmbed()
			.setTitle('Member Not Found')
			.setDescription(`Cannot find the specified member: "${longarg(1)}"`)
			.setColor(red)
		);
		return;


		function printUserInfo(user: User) {
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
	else if (args[0] == 'server') {
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
		await run('help', ['info'], message);
	}
}

commands.ask = () => {
	const query = longarg(0);
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
	const query = longarg(0);
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
	Music.addQueue(message.member, longarg(0))
}

commands.pause = () => {
	Music.pause(message.guild);
	message.channel.send('Paused! ⏸')
}

commands.resume = () => {
	Music.resume(message.guild);
	message.channel.send('Resumed! ▶')
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

	let secondsPlayed = Math.floor(current_song.getPlayedTime());
	message.channel.send(new MessageEmbed()
		.setTitle('🎧 Now Playing:')
		// .setDescription(content)
		.setColor(blue)
		.setThumbnail(current_song.thumbnail)
		.addField('Song', `${current_song.title}`)
		.addField('Link', current_song.url)
		.addField('Duration', `${Util.prettyTime(secondsPlayed)} / ${Util.prettyTime(current_song.getDuration())}\n${Util.progressBar(Math.round(secondsPlayed / current_song.getDuration() * 100), 45)}`)
		.addField('Text Channel', current_song.textChannel, true)
		.addField('Voice Channel', current_song.voiceChannel, true)
		.addField('Requester', `${current_song.requester}`, true)
	);
}

commands.search = async () => {
	let searchResult = await Music.search(longarg(0));
	let resultstr = [];
	searchResult.slice(0, 10).forEach(result => {
		resultstr.push(`[${result.title}](${result.link})`);
	})
	let song = await confirm_type('Pick your song by typing the number into the chat.', resultstr, false, message.author.avatarURL());
	// setArguments(['play', searchResult[song].link])
	// setPrefix(prefix)
	// setRespondMessage(message)
	// run('play')
	Music.addQueue(message.guild.member(message.author), searchResult[song].link);
}

commands.skip = () => {
	Music.skip(message.guild, <TextChannel>message.channel)
}

commands.loop = () => {
	Music.loop(message.guild);
}

commands.shuffle = () => {
	Music.shuffle(message.guild);
}

commands.volume = () => {
	// try {
	if (args[0]) {
		let volume = isNaN(Number(args[0])) ? -1 : Number(args[0]);
		if (0 > volume || volume > 100) {
			message.channel.send(new MessageEmbed()
				.setTitle('Invalid Argument')
				.setDescription('The number must fall in the range of 0 to 100.')
				.setColor(red)
			);
			return;
		}
		let oldVolume = Music.getVolume(message.guild);
		if (oldVolume == volume) {
			message.channel.send(new MessageEmbed()
				.setTitle('Volume Unchanged')
				.setDescription(`Volume has not changed since it's already at \`${args[0]}%\``)
				.setColor(blue)
			);
			return;
		}
		Music.volume(message.guild, volume);

		// } catch (err) {
		// 	console.log('error occured while changing the volume')
		// }
		message.channel.send(new MessageEmbed()
			.setTitle('Volume Adjusted ' + (oldVolume < volume ? '🔺' : '🔻'))
			.setDescription(`Volume has been ` + (oldVolume < volume ? 'increased' : 'decreased') + ` to \`${args[0]}%\`.\n\n**${Util.progressBar(volume, 31)}**`)
			.setColor(green)
		);
	}
	else {
		let volume = Music.getVolume(message.guild);
		message.channel.send(new MessageEmbed()
			.setTitle('Current Volume')
			.setDescription(`The volume is at \`${volume}%\`\n\n**${Util.progressBar(volume, 31)}**`)
			.setColor(blue)
		);
	}
}

commands.queue = () => {
	let content = '';
	let i = 0;
	Music.getQueue(message.guild).forEach(song => {
		i++;
		content += `${Util.getNumberEmoji(i)} \`${Util.prettyTime(song.getDuration())}\` [${song.title}](${song.url}) [${song.requester}]\n\n`;
	})
	let embed = new MessageEmbed()
		.setTitle('Song Queue 🎶')
		.setColor(blue);

	let currentSong = Music.getCurrentSong(message.guild);
	if (currentSong) {
		let secondsPlayed = Math.floor(currentSong.getPlayedTime());
		embed.addField('​\n🎧 Now Playing', `​\n**[${currentSong.title}](${currentSong.url})** [${currentSong.requester}]\n${Util.prettyTime(secondsPlayed)} / ${Util.prettyTime(currentSong.getDuration())} ${Util.progressBar(Math.round(secondsPlayed / currentSong.getDuration() * 100))}\n​`);
	}
	embed.addField('🔺 Upcoming', (content.length != 0 ? '​\n' + content : 'Empty Queue'));
	message.channel.send(embed)
}

commands.remove = () => {
	let song = Music.removeSong(message.guild, Number(args[0]) - 1);
	if (!song) {
		message.channel.send(new MessageEmbed()
			.setTitle('Song Not Found')
			.setDescription('Please use any number displayed in ' + Util.inlineCodeBlock(prefix + 'queue') + '.')
			.setColor(red)
		);
		return;
	}
	message.channel.send(new MessageEmbed()
		.setTitle('Song Removed')
		.setDescription(`Removed [${song.title}](${song.url}) requested by ${song.requester}`)
		.setColor(green)
	);

}

commands.clearqueue = () => {
	Music.clearQueue(message.guild);
	message.channel.send(new MessageEmbed()
		.setTitle('Queue Cleared')
		.setDescription('Music queue for this server has been reset.')
		.setColor(green)
	);
}

commands.leave = async () => {
	Music.leave(message.guild);
}

// commands.volume = async () => {
// 	// message.member.voice.
// }



// Not so useful commands

commands.hello = () => {
	message.channel.send(`Hi! ${message.author}`)
}

commands.say = () => {
	message.channel.send(longarg(0));
	if (message.deletable) message.delete();
}

commands.repeat = () => {
	if (args[0] == null) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Usage: ${Util.inlineCodeBlock(`${prefix}repeat me`)} or ${Util.inlineCodeBlock(`${prefix}repeat {user}`)}`)
			.setColor(red)
		)
		return 1;
	}
	let current_user: UserResolvable = args[0] == 'me' ? message.author.id : message.mentions.users.first().id;
	if (current_user == bot.user.id) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Repeat to myself? It's boring...`)
			.setColor(red)
		)
		return 1;
	}
	var repeating_user: Array<string> = [];
	if (args[0] == 'stop') {
		if (repeating_user.includes(args[1] == 'me' ? message.author.id : message.guild.member(args[1]).id)) {
			repeating_user = repeating_user.filter(user => user != current_user);
		}
		else {
			message.channel.send('The user is not being repeated.')
		}
		return 1;
	}
	repeating_user.push(current_user);
	message.channel.send(`repeating ${current_user}`)
	const collector = message.channel.createMessageCollector((message: Message) => message.author == current_user);

	collector.on('collect', m => {
		console.log(`Collected ${m.content}`);
		m.channel.send(m.content);
	});

	collector.on('end', collected => {
		console.log(`Collected ${collected.size} items`);
	});
}

// commands.rank = () => {
// 	console.log('Warning: This feature is not ready yet.')
// 	let ranker = new Ranker('1234');
// 	console.log('created')
// 	ranker.python.stdout.on('data', data => {
// 		message.channel.send(data.toString())
// 	})
// }

commands.morse = () => {
	let description = `Please choose your translation option.\n
	1️⃣ - **English** ➡ **Morse**\n
	2️⃣ - **Morse** ➡ **English**`;
	confirm_click('Title here', description, ['1️⃣', '2️⃣']).then(promise => {
		let answer = promise[0];
		console.log(answer)
		if (answer == '1️⃣') {
			message.channel.send(Morse.toMorse(longarg(0)));
		}
		if (answer == '2️⃣') {
			message.channel.send(Morse.toEnglish(longarg(0)));
		}
	})
}

commands.gamemode = () => {
	message.reply('You are fixed with gamemode `survival` in discord. Sorry for inconvenience.')
}

commands.rickroll = async () => {
	await run('play', ['never', 'gonna', 'give', 'you', 'up'], message);
}

commands.duckroll = () => {
	message.channel.send({ files: ['./resources/duckroll.jpg'] });
}



// Personal-use commands

commands.movevoice = async () => {
	if (!(args[0] && args[1])) {
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
	if (args[0] != '*') {
		origins = origins.filter(channel => channel.name.toLowerCase().includes(args[0].toLowerCase()));
		origin_all = false;
	}

	// Gather destination channel
	let dests = message.guild.channels.cache.filter(channel => channel.type == "voice");
	if (args[1] != '*') {
		dests = dests.filter(channel => channel.name.toLowerCase().includes(args[1].toLowerCase()));
	}

	let embed = new MessageEmbed()
		.setTitle('Members Moved:')
		.setColor(green);
	let description = '';

	// Confirm destination channel
	if (origin_all) {
		confirm_type('Choose Destination Channel', Array.from(dests.keys())).then(deststr => {
			console.log(deststr)
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
		confirm_type('Choose Origin Channel', Array.from(origins.keys())).then(originstr => {
			confirm_type('Choose Destination Channel', Array.from(dests.keys())).then(deststr => {
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
	if (!(args[0] && args[1])) {
		message.channel.send(new MessageEmbed()
			.setDescription('Channel Not Specified')
			.setColor(red)
		)
		return;
	}

	let origin_all = true;
	// from
	let origins = message.guild.channels.cache.filter(channel => channel.type == "voice");
	if (args[0] != '*') {
		origins = origins.filter(channel => Boolean(channel.name.match(new RegExp(args[0], 's'))));
		origin_all = false;
	}
	// let origin_promise = new Promise((resolve, reject) => {
	// 	resolve(ask_confirm('Choose your origin voice channel. **(type number in chat)**', origins));
	// })

	let dests = message.guild.channels.cache.filter(channel => channel.type == "voice");
	if (args[1] != '*') {
		dests = dests.filter(channel => Boolean(channel.name.match(new RegExp(args[1], 's'))));
	}

	// let origin_promise = ask_confirm('origin', origins);
	// let dest_promise = ask_confirm('destination', dests);

	if (origin_all) {
		confirm_type('Choose destination channel you are refering to. *(type in chat)*', Array.from(dests.keys())).then(dest => {
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
		confirm_type('Choose origin channel you are refering to. *(type in chat)*', Array.from(origins.keys())).then(origin => {
			confirm_type('destination', Array.from(dests.keys())).then(dest => {
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

commands.hook = async () => {
	// hook(args[2], args[3]);
	// function hook(text, voice) {

	class Hook {
		text: string;
		voice: string;
		type: string;
	}

	let hooks: Hook[] = await DataManager.get(message.guild.id, 'hooks');
	if (!hooks) {
		hooks = [];
	}

	if (args[0] == 'add') {
		hooks.push({
			text: args[1],
			voice: args[2],
			type: (args[3] ? args[3] : 'hard')
		});
		DataManager.set(message.guild.id, 'hooks', hooks);
		message.channel.send(new MessageEmbed()
			.setTitle('Channel Hooks:')
			.setDescription(`Hooked \`${message.guild.channels.resolve(args[1]).name}\` with \`${message.guild.channels.resolve(args[2]).name}\`.`)
			.setColor(green)
		);
	}
	else if (args[0] == 'remove') {
		hooks = hooks.filter((hook: { text: string; voice: string; }) => hook.text != args[1] && hook.voice != args[1]);
		DataManager.set(message.guild.id, 'hooks', hooks);
	}
	else if (args[0] == 'list') {
		if (hooks.length == 0) {
			message.channel.send('No Hooks Created');
			return;
		}
		let content = '';
		let count = 1;
		hooks.forEach(hook => {
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
	if ((message.author.id == '551678168348491786' || message.author.id == '520243714359296011') && args[0] == 'add' && longarg(1) != '') {
		message.channel.send(`Added "${longarg(1)}"`)
		responses.ohm.push(longarg(1))
		fs.writeFileSync('./settings/responses.json', JSON.stringify(responses, null, ' '))
		return;
	}
	let answers = responses.ohm;
	message.reply(answers[Math.floor(Math.random() * answers.length)])
}

commands.kong = () => {
	if ((message.author.id == '551678168348491786' || message.author.id == '520243714359296011') && args[0] == 'add' && longarg(1) != '') {
		message.channel.send(`Added "${longarg(1)}"`)
		responses.kong.push(longarg(1))
		fs.writeFileSync('./settings/responses.json', JSON.stringify(responses, null, ' '))
		return;
	}
	let answer = responses.kong;
	message.reply(answer[Math.floor(Math.random() * answer.length)]);
}

commands.omsin = () => {
	if ((message.author.id == '551678168348491786' || message.author.id == '520243714359296011') && args[0] == 'add' && longarg(1) != '') {
		message.channel.send(`Added "${longarg(1)}"`)
		responses.ohm.push(longarg(1))
		fs.writeFileSync('./settings/responses.json', JSON.stringify(responses, null, ' '))
		return;
	}
	let answer = responses.omsin;
	message.reply(answer[Math.floor(Math.random() * answer.length)]);
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
function confirm_type(title: string, list: Array<string>, is_delete = false, iconURL?: string): Promise<string> {
	let confirm = (resolve: (arg0: any) => void) => {
		console.log(list)
		console.log(list.length)
		if (list.length <= 1) {
			resolve(list[0]);
			return list[0];
		}
		let embeduser = new MessageEmbed()
			.setColor(blue);
		if (iconURL) {
			embeduser.setAuthor(title, iconURL);
		} else {
			embeduser.setTitle(title);
		}

		let str = '';
		let i = 1;
		list.forEach((member) => {
			str += `${Util.getNumberEmoji(i)} - ${member}\n\n`;
			i++;
		})
		embeduser.setDescription(str);
		message.channel.send(embeduser)
			.then((confirm_msg) => {
				message.channel.awaitMessages(response => response.author.id == message.author.id, { max: 1 }).then((collected) => {
					let answer_msg = collected.first();
					if (!(Number(answer_msg.content) >= 1 && Number(answer_msg.content) <= list.length)) {
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
						let result = Array.from(list.keys())[Number(answer_msg.content) - 1];
						if (confirm_msg.deletable) confirm_msg.delete();
						if (answer_msg.deletable) answer_msg.delete();
						console.log(result)
						resolve(list[result]);
						return list[result];
					}
				});
			})
		if (is_delete && message.deletable) message.delete();
	}
	return new Promise(confirm);
}

/**
 * 
 * @param reactions Reaction(s) to use as choice
 * @param timeout Time to wait for answer (ms)
 */
async function confirm_click(title: string, description: string, reactions: Array<EmojiResolvable>, timeout?: number): Promise<Array<string | null | Message>> | null {

	let return_value: Array<string | Message>;
	let embed = new MessageEmbed()
		.setTitle(title)
		.setDescription(description)
		.setColor(yellow);
	if (timeout) {
		embed.setFooter(`You have ${timeout / 1000} seconds to respond.`);
	}

	await message.channel.send(embed).then(async (confirm_msg) => {
		reactions.forEach(reaction => {
			confirm_msg.react(reaction);
		})
		await confirm_msg.awaitReactions((reaction: MessageReaction, user) => reactions.includes(reaction.emoji.name) && user == message.author, { max: 1, time: timeout, errors: ['time'] })
			.then(collected => {
				// console.log(collected.first().emoji.name)
				// console.log(reactions)
				return_value = [collected.first().emoji.name, confirm_msg];
			}).catch(() => {
				if (timeout) {
					confirm_msg.edit(new MessageEmbed()
						.setTitle('Timeout')
						.setDescription('Timeout, action canceled.')
						.setColor(red)).then(msg => msg.delete({ timeout: 5000 }));
					confirm_msg.reactions.removeAll();
				}
				return_value = [null, confirm_msg];
			})
	});
	return return_value;
}

commands.terminate = () => {
	if (message.author.id != '551678168348491786') return;
	message.channel.send('Terminated ' + process.pid).then(
		process.exit()
	);
}
