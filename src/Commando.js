const { MessageEmbed, Message } = require('discord.js')
const { bot } = require('./Main');
const Util = require('./Util');
const Wolfram = require('./Wolfram');
const DataManager = require('./Database')
const Morse = require('./Morse')
const alias = require('./alias.json')
const fs = require('fs');

const red = Util.red
const green = Util.green
const blue = Util.blue
const yellow = Util.yellow;

const commands = {};
var prefix;
var message = new Message();
var args, longarg;


exports.commands = commands;
exports.non_dm_command = ['ipannounce', 'nick', 'purge', 'history', 'movevoice'];

exports.setPrefix = function (_prefix) {
	prefix = _prefix;
}

exports.setRespondMessage = function (_message) {
	message = _message;
}

exports.setArguments = function (_args) {
	longarg = _args.slice(1).join(' ').trim();
	args = _args.filter(arg => arg != '');
}


// -----------------------------------------------------------------------------------
// Main Commands List Starts Here
// -----------------------------------------------------------------------------------

// Setting commands

commands.help = () => {
	let prefixmsg = prefix == '' ? 'Bot currently has no prefix.' : `Current bot's prefix is ${Util.inlineCodeBlock(prefix)}.`;

	// .addField('‏‏‎ ‎', 'For source code, please visit https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot')
	message.channel.send(new MessageEmbed()
		.setAuthor(`Available Commands`, bot.user.displayAvatarURL())
		.setDescription(prefixmsg)
		.setColor(blue)
		.addField(`General`, '`help` : Shows this message\n`ping` : Pong!\n`hello` : Hi!\n`ip` : Get my current public IP address\n`ipannounce` : Get my current public IP address and mention @everyone\n`morse` : Translate between morse code and English\n`myid` : Show your user ID\n`rank` : Start a ranking session\n`uptime` : Shows bot\'s uptime\n')
		.addField('Settings', '`backup` : Backup the database file\n`nick` : Change bot\'s nickname\n`prefix` : Change bot\'s prefix\n`reload` : Reload all server data from disk\n`reset` : Reset current server\'s data')
		.addField('Misc', '`repeat` : Repeat your messsages\n`say` : Say your provided text once')
	)
}

commands.backup = () => {
	// Check if file dir exist, if not, create them.
	if (!fs.existsSync('./files/backups')) {
		fs.mkdirSync('./files/backups')
	}
	// Copy database file
	fs.copyFileSync('./files/database.json', `./files/backups/${new Date().toLocaleString().replace(/ |\/|,|:/g, '-')}.json`)
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
						DataManager.addGuildDefaultOption(message.guild)
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
	if (message.guild.dm)
		message.channel.send('Nickname is not available on DM channels.')
	else if (args[1] != undefined) {
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
	for (command in alias) {
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
	else {
		message.channel.send(new MessageEmbed()
			.setDescription(`Current IP address is **${await Util.refreshIp()}**`)
			.setColor(blue)
			.setFooter('Can\'t connect? Contact Omsin.')
			.setTimestamp()
		);
	}
}

commands.channel = () => {
	console.log(`${message.channel} with id: ${message.channel.id}`)
}

commands.ipannounce = async () => {
	message.channel.send(new MessageEmbed()
		.setTitle('CURRENT IP')
		.setDescription(`**Current IP address is \`${await Util.refreshIp()}\`**`)
		.setColor(blue)
		.addField(` ‎`, `_Last updated: ${new Date().toLocaleString()}_`)
	)
	message.channel.send('@everyone')
}

commands.myid = () => {
	message.channel.send(new MessageEmbed()
		.setAuthor(`Your ID is "${message.author.id}"`, message.author.displayAvatarURL())
		.setColor(blue)
	)
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
	if (!message.guild.member(message.author).hasPermission('MANAGE_MESSAGES')) {
		message.channel.send('⛔ You don\'t have "Manage Messages" permission. This incident will be reported. ⛔');
		return;
	}
	let amount = Number.parseInt(args[1]);
	if (!isNaN(args[1])) {
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
									deletemsg()
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
			} else deletemsg();
			function deletemsg() {
				message.channel.bulkDelete(amount + (exceed_three ? 2 : 1)).then(
					message.channel.send(`✅ Deleted ${amount} message${amount > 1 ? 's' : ''}. [${message.author}]`).then(msg => msg.delete({ timeout: 5000, reason: `Issued by ${message.author.username}` }))
				)
			}
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

commands.userinfo = () => {
	let user;
	console.log(`"${longarg}"`)
	switch (longarg) {
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
					user = message.guild.members.cache.filter(member => member.displayName.toLowerCase().includes(longarg.toLowerCase()) || member.user.username.toLowerCase().includes(longarg.toLowerCase()));
				} catch (err) { }
				if (user.size != undefined && user.size > 0) {
					console.log(user.size)
					// console.log(JSON.stringify(user.toJSON(), 4))
					if (user.size > 1) {
						ask_confirm('Please choose the member you refer to. (type in chat)', user, true).then(usr => {
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
	if (bot.users.fetch(args[1]) != undefined) {
		let is_return = true;
		bot.users.fetch(args[1]).then(printUserInfo).catch(is_return = false)
		if (is_return) return;
	}
	message.channel.send(new MessageEmbed()
		.setTitle('Member Not Found')
		.setDescription(`Cannot find the specified member: "${longarg}"`)
		.setColor(red)
	);
	return;


	function printUserInfo(user) {
		let embeduserinfo = new MessageEmbed();
		embeduserinfo
			.setTitle('User Info Card')
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
				.setFooter(`Requested by ${message.author.username}`);
		}
		embeduserinfo
			.addField('Created Account At', user.createdAt.toLocaleString(), true)
			.setTimestamp()
		message.channel.send(embeduserinfo);
		if (message.deletable) message.delete();
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



// Not so useful commands

commands.hello = () => {
	message.channel.send(`Hi! ${message.author}`)
}

commands.say = () => {
	let result = '';
	args.shift()
	for (word in args) { result += args[word] + ' ' }
	message.channel.send(longarg)
	if (message.deletable) message.delete()
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
	let current_user = args[1] == 'me' ? message.author : message.mentions.users.first();
	if (current_user == bot.user) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Repeat to myself? It's boring...`)
			.setColor(red)
		)
		return 1;
	}
	var repeating_user = [];
	if (args[1] == 'stop') {
		if (repeating_user.includes(args[2] == 'me' ? message.author.id : args[2].id)) {
			repeating_user -= current_user;
		}
		else {
			message.channel.send('The user is not being repeated.')
		}
		return 1;
	}
	repeating_user += (current_user);
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


commands.morse = () => {
	let description = `Please choose your translation option.\n
	1️⃣ - **English** ➡ **Morse**\n
	2️⃣ - **Morse** ➡ **English**`;
	confirm_click('Title here', description, ['1️⃣', '2️⃣']).then(answer => {
		console.log(answer)
		if (answer == 0) {
			message.channel.send(Morse.toMorse(longarg)).catch('Result Empty');
		}
		else {
			message.channel.send(Morse.toEnglish(longarg)).catch('Result Empty');
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
		origins = origins.filter(channel => channel.name.match(new RegExp(args[1], 's')));
		origin_all = false;
	}
	// let origin_promise = new Promise((resolve, reject) => {
	// 	resolve(ask_confirm('Choose your origin voice channel. **(type number in chat)**', origins));
	// })

	let dests = message.guild.channels.cache.filter(channel => channel.type == "voice");
	if (args[2] != '*') {
		dests = dests.filter(channel => channel.name.match(new RegExp(args[2], 's')));
	}

	// let origin_promise = ask_confirm('origin', origins);
	// let dest_promise = ask_confirm('destination', dests);

	if (origin_all) {
		confirm_type('Choose destination channel you are refering to. *(type in chat)*', dests).then(dest => {
			origins.forEach((origin) => {
				message.guild.channels.resolve(origin).members.forEach((member) => {
					console.log('all')
					console.log('from ' + origin.name + ' to ' + dest.name)
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
					console.log('from ' + origin.name + ' to ' + dest.name)
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
			message.reply('||%$#%@||ตลอดไป')
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
			message.reply('คิดถึง||%$@||')
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
	for (let i = 1; i <= 20; i++) {
		message.channel.send(Util.getNumberEmoji(i))
	}
}

// Functions
function confirm_type(title, collection, is_delete = false) {
	let confirm = (resolve, reject) => {
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
					if (!(answer_msg.content >= 1 && answer_msg.content <= collection.size)) {
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
						let result = Array.from(collection.keys())[answer_msg.content - 1];
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

function confirm_click(title, description, reactions = [], timeout) {
	let confirm = (resolve, reject) => {

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
					resolve(reactions.indexOf(collected.first().emoji.name));
				}).catch(collected => {
					if (timeout) {
						confirm_msg.edit(new MessageEmbed()
							.setTitle('Timeout')
							.setDescription('Timeout, action canceled.')
							.setColor(red)).then(msg => msg.delete({ timeout: 5000 }));
						confirm_msg.reactions.removeAll();
					}
					resolve(undefined);
				})
		});
	}
	return new Promise(confirm);
}

commands.terminate = () => {
	message.channel.send('Terminated ' + process.pid).then(
		process.exit()
	);
}