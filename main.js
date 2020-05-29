// Init sequence

// Discord
const { Client, MessageEmbed, MessageCollector, MessageManager, ChannelManager, GuildChannel, GuildManager, MessageAttachment } = require('discord.js');

// Create an instance of a Discord client
const bot = new Client();
// const clientInformation = new Discord.clientInformation();
const embedmsg = new MessageEmbed();

const fs = require('fs');

const Wolfram = require('./wolfram.js');

// Start discord client
bot.login(require("./token.json").discord)
bot.on('ready', () => {

	console.log('I am ready!');
	bot.user.setActivity('Ultron | !help', { type: "WATCHING" })

	refreshIp();

	getDatabase();

	logfile.write('# ' + getDateTimeString(new Date()).replace(/:|\//g, '_') + '\n')

	// Get specific channel object
	mclog_channel = bot.channels.resolve('699045838718238771')


	// console.log(Discord.GuildManager.resolve(client.guilds))
});




/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
var ip_address;
var database;
function refreshIp() {
	// Get IP Address
	let { exec } = require('child_process');
	exec('dig +short myip.opendns.com @resolver1.opendns.com', function (err, stdout, stderr) {
		ip_address = stdout;
	});
	ip_address = ip_address;
}
if (!fs.existsSync('./files/logs')) {
	fs.mkdirSync('./files/logs');
}

// rename latest.log to it's appropriate name
if (fs.existsSync('./files/logs/latest.log')) {
	const linereader = require('n-readlines');
	fs.renameSync('./files/logs/latest.log', './files/logs/' + new linereader('./files/logs/latest.log').next().toString().substr(2) + '.log')
}

function getDateTimeString(date) {
	return `${date.getDate().min2()}/${date.getMonth().min2()}/${date.getFullYear().min2()}-${date.getHours().min2()}:${date.getMinutes().min2()}:${date.getSeconds().min2()}`;
}

var logfile = fs.createWriteStream(`./files/logs/latest.log`, { encoding: 'utf-8' })
function log(message) {
	let lines = message.content.split('\n')
	let meta = '[' + getDateTimeString(new Date()) + '|' + (message.guild === null ? '<DM>' : message.guild.name) + '|' + message.author.username + ']   ';
	let indent = meta;
	for (line of lines) {
		let str = indent + line + '\n';
		logfile.write(str);
		console.log(str);
		indent = '';
		for (i = 1; i <= meta.length; i++) {
			indent += ' ';
		}
	}
}



// Log debug info
// client.on("debug", (e) => console.info(e));

function getDatabase() {

	// Check if file dir exist, if not, create them.
	if (!fs.existsSync('./files')) {
		fs.mkdirSync('./files')
	}
	// Get server data
	fs.readFile('./files/database.json', 'utf-8', (err, filecontent) => {
		// Create ./files/database.json if not exist/error occur
		if (err) {
			let default_data = { guilds: {} };

			fs.writeFile('./files/database.json', JSON.stringify(default_data), (err) => { if (err) throw err; });
			database = default_data;
		}
		else database = JSON.parse(filecontent);

		console.log('read data: ')
		console.log(JSON.stringify(database))
	});
}

function setDatabase(newDataObject) {
	fs.writeFile('./files/database.json', JSON.stringify(newDataObject, null, '	'), (err) => { if (err) throw err; });
}

function addGuildDefaultData(id, name, isDM) {
	database.guilds[id] = {
		name: name,
		prefix: '!',
		dm: isDM
	}
	setDatabase(database)
}


const red = 0xff0000
const green = 0x00ff00
const blue = 0x4287f5
const yellow = 0xebc934

function sendEmbed(title, text, type = 'info', channel = current_message.channel) {
	let embed = new MessageEmbed()
		.setTitle(title)
		.setDescription(text)
	if (type == 'error') embed.setColor(red)
	else if (type == 'success') embed.setColor(green)
	//0x32a852
	else if (type == 'info') embed.setColor(blue)
	channel.send(embed);
};


function rank(origin_message) {

	let stopranking = false;
	const { spawn } = require("child_process");
	const py = spawn("python", ["-u", "item-ranker.py"]);

	py.stdout.on("data", data => {
		sendEmbed('', `${data}\n\n${origin_message.author}`, channel = origin_message.channel)
		console.log(`stdout: ${data}`);
	});

	py.stderr.on("data", data => {
		sendEmbed('Error:', `\n\`\`\`${data}\`\`\``, 'error', origin_message.channnel)
		console.log(`stderr: ${data}`);
		stopranking = true
	});

	py.on('error', (error) => {
		console.log(`error: ${error.message}`);
		stopranking = true
	});

	py.on("close", code => {
		console.log(`child process exited with code ${code}`);
		pass.destroy()
		stopranking = true
	});

	// Create a new stream and pipe to python input stream 
	const { PassThrough } = require('stream')
	const pass = new PassThrough();
	pass.pipe(py.stdin)

	// Log data for the sake of debugging
	pass.on('data', data => {
		console.log(`data: ${data}`)
	})

	// On receive input from discord
	bot.on('message', message => {
		if (stopranking) {
			sendEmbed('Ended Ranking', `Ranking started by ${origin_message.author} has ended.`, 'info', channel = origin_message.channel);
		}
		if (message.content == `${prefix}stop`) stopranking = false;
		if (!message.author.bot && (message.author == origin_message.author)) {
			// Write discord input to 'pass'
			pass.write(message.content + '\r\n')
			console.log(`wrote ${message.content}`)
		}
	})
}

let stopmorse = false
function morseidk() {
	morse: {
		if (stopmorse) {
			console.log('breaking morse')
			break morse;
		}

		const { spawn } = require("child_process");
		const py = spawn("python3", ["morse.py"]);

		py.stdout.on("data", data => {
			sendEmbed('', `${data}\n\n`, channel = current_message.channel)
			console.log(`stdout: ${data}`);
		});

		py.stderr.on("data", data => {
			sendEmbed('Error:', `\n\`\`\`${data}\`\`\``, 'error', current_message.channel)
			console.log(`stderr: ${data}`);
			stopranking = true
		});

		py.on('error', (error) => {
			console.log(`error: ${error.message}`);
			stopranking = true
		});

		py.on("close", code => {
			console.log(`child process exited with code ${code}`);
			pass.destroy()
			stopranking = true
		});

		// Create a new stream and pipe to python input stream 
		const { PassThrough } = require('stream')
		const pass = new PassThrough();
		pass.pipe(py.stdin)

		// Log data for the sake of debugging
		pass.on('data', data => {
			console.log(`data: ${data}`)
		})

		// On receive input from discord
		bot.on('message', message => {
			if (message.content == `${prefix}stop`) stopmorse = true
			if (!current_message.author.bot) {
				// Write discord input to 'pass'
				pass.write(message.content + '\r\n')
				console.log(`wrote ${message.content}`)
			}
		})
	}
}

class RepeatSession {

}
/*
//	----------------------------------------------------------------------
//	Config Section
var pathtoplugin = '../minecraft/missile_wars'
//	----------------------------------------------------------------------


const { spawn } = require("child_process");
const pipein = spawn("sh", ["-c", `cat < ${pathtoplugin}/plugins/Ultron/mctodc.pipe`]);



// client.guilds.resolve('#685493737039593491').channels.resolve('#699045838718238771')

pipein.stdout.on("data", data => {
	input = JSON.parse(data)

	switch (input.type) {
		case 'log':
			if (input.content == 'mcready') {
				embed = new MessageEmbed()
					.setTitle('Server Started')
					.setDescription(`Minecraft server has started, come and join!\nThe server IP is \`${ip_address}\``)
					.setColor(green)
				console.log('ready')
				mclog_channel.send(embed)
			}
			else if (input.content == 'mcbye') {
				embed = new MessageEmbed()
					.setTitle('Server Stopped')
					.setDescription(`Minecraft server has stopped, Bye!`)
					.setColor(red)
				console.log('stopped')
				mclog_channel.send(embed)
			}
			else {
				mclog_channel.send(input.content)
			}
			break
		case 'chat':
			mclog_channel.send(`${input.player}: ${input.message}`)
			break
		default:
			console.log('Unknown type received')
	}
});

pipein.stderr.on("data", data => {
	// sendEmbed('Error:', `\n\`\`\`${data}\`\`\``, 'error', channel = mclog_channel)
	console.log(`stderr: ${data}`);
});

pipein.on('error', (error) => {
	console.log(`error: ${error.message}`);
});

pipein.on("close", code => {
	console.log(`child process (pipe) exited with code ${code}`);
	// pass.destroy()
});

const ws = new fs.createWriteStream(`${pathtoplugin}/plugins/Ultron/dctomc.pipe`)

client.on('message', message => {
	if (!message.author.bot && message.channel == mclog_channel) {
		let content = {
			sender: message.author.username,
			content: message.content
		}
		ws.write(JSON.stringify(content) + '\n')
		console.log(JSON.stringify(content))
	}
})

// // On receive input from discord
// client.on('message', message => {
// 	if (message.content == `${prefix}stop`) stopmorse = true
// 	if (!current_message.author.bot) {
// 		// Write discord input to 'pass'
// 		pass.write(message.content + '\r\n')
// 		console.log(`wrote ${message.content}`)
// 	}
// })

// var net = require('net');

// var server = net.createServer(function (stream) {
// 	stream.on('data', data => {
// 		console.log('data:', data.toString());
// 	});
// 	stream.on('end', () => {
// 		server.close();
// 	});
// });

// server.listen('/home/omsin/Servers/minecraft/lab/mctodiscord');

// var stream = net.connect('/tmp/test.sock');
// stream.write('hello');
// stream.end();
*/

Number.prototype.min2 = function (n) {
	return ('0' + this).slice(-2);
}

function inlineCodeBlock(content) {
	return `\`\`${content.replace(/`/g, '‎`‎')}\`\``;
}

var client_id = '<@!696973725806886963>';
var current_message;
bot.on('message', message => {


	current_message = message;

	// If guild not exist in database, add them. 
	let store_id;
	if (message.guild === null) {
		store_id = message.channel.id;
		store_name = message.author.username;
	}
	else {
		store_id = message.guild.id;
		store_name = message.guild.name;
	}

	if (database.guilds[store_id] === undefined) {
		addGuildDefaultData(store_id, store_name, message.guild === null);
	}
	let prefix = database.guilds[store_id].prefix;

	if (!message.author.bot && ((message.content.startsWith(prefix) && message.content.length > prefix.length) || message.content.startsWith(client_id))) {


		log(message)
		let args;
		if (message.content.startsWith(client_id)) {
			args = message.content.substr(client_id.length).trim().split(' ')

		}
		else {
			args = message.content.substr(prefix.length).trim().split(' ')
		}
		let longarg = args.slice(1).join(' ');
		// message.reply('\nCommand is: ' + args.shift() + '\nArgument is: ' + args)

		let non_dm_command = ['ipannounce', 'nick', 'purge'];
		if (non_dm_command.includes(args[0]) && message.guild === null) {
			message.channel.send(new MessageEmbed()
				.setTitle('Not DM Command')
				.setDescription('This command is not available in DM channels')
				.setColor(red))
			return 1;
		}


		switch (args[0]) {
			// case 'terminal':
			// 	terminal(message)
			// 	break


			case 'help':
				let prefixmsg = prefix == '' ? 'Bot currently has no prefix.' : `Current bot's prefix is ${inlineCodeBlock(prefix)}.`;

				// .addField('‏‏‎ ‎', 'For source code, please visit https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot')
				message.channel.send(new MessageEmbed()
					.setAuthor(`Available Commands`, bot.user.displayAvatarURL())
					.setDescription(prefixmsg)
					.setColor(blue)
					.addField(`General`, '`help` : Shows this message\n`ping` : Pong!\n`hello` : Hi!\n`ip` : Get my current public IP address\n`ipannounce` : Get my current public IP address and mention @everyone\n`morse` : Translate between morse code and English\n`myid` : Show your user ID\n`rank` : Start a ranking session\n`uptime` : Shows bot\'s uptime\n')
					.addField('Settings', '`backup` : Backup the database file\n`nick` : Change bot\'s nickname\n`prefix` : Change bot\'s prefix\n`reload` : Reload all server data from disk\n`reset` : Reset current server\'s data')
					.addField('Misc', '`repeat` : Repeat your messsages\n`say` : Say your provided text once')
				)
				break

			case 'backup':
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
				break;

			case 'ping':
				message.reply('Pong!')
				break

			case 'hello':
				message.channel.send(`Hi! ${message.author}`)
				break

			case 'ip':
				refreshIp();
				message.channel.send(new MessageEmbed()
					.setDescription(`Current IP address is **${ip_address}**`)
					.setColor(blue)
					.setFooter('Can\'t connect? Contact Omsin.')
					.setTimestamp()
				)
				break

			case 'channel':
				console.log(`${message.channel} with id: ${message.channel.id}`)
				break

			// case 'ignore': // Maybe in the future
			// 	fs.writeFileSync(ignorelist.txt, arg)

			// 	message.channel.send()
			// 	break

			case 'ipannounce':
				refreshIp();
				message.channel.send(new MessageEmbed()
					.setTitle('CURRENT IP')
					.setDescription(`**Current IP address is \`${ip_address}\`**`)
					.setColor(blue)
					.addField(` ‎`, `_Last updated: ${new Date().toLocaleString()}_`)
				)
				message.channel.send('@everyone')

				// console.log(client.user.lastMessage.editable)
				// client.channels.resolve.edit(embed)
				// client.guilds.resolve('685493737039593491').channels.resolve('685938007223566371').fetch()
				// async function edit() {
				// 	let fetched;
				// 	// do {
				// 	fetched = await message.channel.fetchMessages({ limit: 1 });
				// 	fetched.edit('Edited')
				// 	// message.channel.bulkDelete(fetched);
				// 	// }
				// 	// while (fetched.size >= 2);
				// edit()

				// client.guilds.resolve('685493737039593491').channels.resolve('700679547888205874')
				// if (client.user.lastMessage == null) {
				// 	const collector = new MessageCollector(message.channel, m => m.author.id === client.user.id);
				// 	collector.on('collect', message => {
				// 		console.log(message.content);
				// 		message.edit(embed)
				// 		collector.stop("Got the message");
				// 		// message.channel.messages.resolve('700651576209047653').edit(embed)
				// 	});
				// }
				// else {
				// 	client.user.lastMessage.edit('edited')
				// }

				// message.channel.send(`**Current IP address is \`${stdout}\`**_Last updated: ${new Date().toLocaleString()}_\n${message.channel.type == 'text' ? '@everyone' : ''}`)
				/*	if (message.channel.type == 'text') {
						message.delete(500)
					}*/
				break

			case 'kong':
				message.reply('typerace?');
				break;

			case 'morse':
				morseidk()
				break

			case 'myid':
				message.channel.send(new MessageEmbed()
					.setAuthor(`Your ID is "${message.author.id}"`, message.author.displayAvatarURL())
					.setColor(blue)
				)
				break

			case 'nick':
				if (message.guild.dm)
					message.channel.send('Nickname is not available on DM channels.')
				else if (args[1] != undefined) {
					message.guild.member(bot.user).setNickname(args[1])
					sendEmbed('Nickname Changed', `Nickname has changed to **${args[1]}**`, 'success')
				}
				else {
					message.guild.member(bot.user).setNickname('')
					sendEmbed('Nickname Reset', 'Nickname has reset to **J.A.R.V.I.S.**', 'success')
				}
				break

			case 'ohm':
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
				break;

			case 'prefix':
				if (args[1] == 'clear') {
					if (message.guild === null) {
						let new_prefix = '';
						database.guilds[message.channel.id].prefix = new_prefix;
						setDatabase(database);
						sendEmbed('Prefix Cleared', `Prefix has cleared`, 'success')
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
					// if (arg == '/') {
					// 	sendEmbed('Prefix Not Recommended', 'The prefix `/` is not recommended because it is also used for discord commands.\nType `confirm` to comfirm the change. Otherwise, the change will be reversed.')
					// 	client.on('message', message => {
					// 		console.log('in')
					// 	})
					// }
					// else {
					let new_prefix = args[1];
					database.guilds[message.guild === null ? message.channel.id : message.guild.id].prefix = new_prefix;
					setDatabase(database);
					sendEmbed('Prefix Changed', `Prefix has changed to ${inlineCodeBlock(new_prefix)}`, 'success')
					// }
				}
				else {
					message.channel.send(new MessageEmbed()
						.setTitle('Error')
						.setDescription(`Usage: ${inlineCodeBlock(`${prefix}prefix {new prefix}`)} or ${inlineCodeBlock(`${prefix}prefix clear`)}`)
						.setColor(red)
						.setFooter('Note: Blank prefix is only allowed in DM channels.')
					);
				}
				break

			case 'purge':
				if (!isNaN(args[1])) {
					if (Number.parseInt(args[1]) < 1 || Number.parseInt(args[1]) > 100) {
						message.channel.send(new MessageEmbed()
							.setTitle('Error')
							.setDescription(`The amount of messages must not below than 1 nor greater than 100`)
							.setColor(red)
						)
					}
					else {
						message.channel.bulkDelete(Number.parseInt(args[1]) + 1);
					}
				}
				else {
					message.channel.send(new MessageEmbed()
						.setTitle('Error')
						.setDescription(`Usage: ${prefix}purge <amount>`)
						.setColor(red)
					)
				}

				break;

			case 'rank':
				// message.channel.send(Discord.MessageEmbed('Now Ranking', `${ message.author } started a ranking session.\n\nType your answer into the chat. (without prefix) \nType!stopranking to end the session.`))
				// const embed = new MessageEmbed().setTitle('Now Ranking').setColor
				rank(message)
				break

			case 'repeat':
				if (args[1] == null) {
					message.channel.send(new MessageEmbed()
						.setTitle('Error')
						.setDescription(`Usage: ${inlineCodeBlock(`${prefix}repeat me`)} or ${inlineCodeBlock(`${prefix}repeat {user}`)}`)
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
				// if (args[1] != '') {
				// 	current_author = message.mentions.users.first()
				// }
				// else {
				// 	current_author = message.author
				// }

				// sendEmbed('Start Repeating', `Okay, now repeating ${current_author}'s messages.`);
				// idk = function (current_author) {
				// 	stoprepeat = false
				// 	client.on('message', current_message => {
				// 		if (stoprepeat) {
				// 			return;
				// 		}
				// 		if (current_message.author == current_author) {
				// 			if (current_message.content.toLowerCase() == `${prefix}stop`) {
				// 				sendEmbed('Stopped Repeating', `Okay, stopped repeating ${current_author}`)
				// 				stoprepeat = true
				// 			}
				// 			else { current_message.channel.send(current_message.content) }
				// 		}
				// 	})
				// }
				break

			case 'reload':
				getDatabase();
				message.channel.send(new MessageEmbed()
					.setTitle('Data Reloaded')
					.setDescription('Server database cache has reloaded from file')
					.setColor(green)
				);
				break;

			case 'reset':
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
									addGuildDefaultData(message.guild)
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
				break;

			case 'say':
				let result = '';
				args.shift()
				for (word in args) { result += args[word] + ' ' }
				message.channel.send(longarg)
				if (message.deletable) message.delete()
				break

			case 'stop':
				break

			case 'uptime':
				sendEmbed('Uptime', `${bot.uptime / 1000}s`)
				break

			case 'userinfo':
				let user;
				console.log(`"${longarg}"`)
				switch (longarg) {
					case "":
						message.channel.send(new MessageEmbed()
							.setTitle(`Assumed ${inlineCodeBlock(prefix + 'userinfo me')}`)
							.setDescription('Usage: ' + inlineCodeBlock(prefix + 'userinfo') + ' or ' + inlineCodeBlock(prefix + 'userinfo <member>'))
							.setColor(yellow)
						).then(msg => msg.delete({ timeout: 10000 }));
					case 'me':
						user = message.author;
						break;
					default:
						if (message.mentions.members.first() != undefined) {
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
									let embeduser = new MessageEmbed()
										.setTitle('Please choose the member you refer to. (type in chat)')
										.setColor(blue);

									let str = '';
									let i = 1;
									user.forEach((member) => {
										str += `[${i}] - ${member}\n\n`;
										i++;
									})
									embeduser.setDescription(str);
									console.log('sending')
									message.channel.send(embeduser)
										.then((confirm_msg) => {
											message.channel.awaitMessages(response => response.author.id == message.author.id, { max: 1 }).then((collected) => {
												let answer_msg = collected.first();
												if (!(answer_msg.content >= 1 && answer_msg.content <= user.size)) {
													message.channel.send(new MessageEmbed()
														.setDescription('Invalid answer, aborted.')
														.setColor(red)
													).then(msg => { if (msg.deletable) msg.delete({ timeout: 10000 }) })
													if (answer_msg.deletable) answer_msg.delete();
												}
												else {
													user = message.guild.member(Array.from(user.keys())[answer_msg.content - 1]).user;
													console.log(user)
													printUserInfo();
													if (answer_msg.deletable) answer_msg.delete();
												}
												if (confirm_msg.deletable) confirm_msg.delete();
											});
										})
									if (message.deletable) message.delete();
									return;
									break;
								}
								else {
									user = user.first().user
								}
							}
							if (message.deletable) message.delete();
						}
				}
				// console.log(user)

				if (!(user == null || user.size == 0)) {
					printUserInfo();
					return;
				}
				message.channel.send(new MessageEmbed()
					.setTitle('Member Not Found')
					.setDescription(`Cannot find the specified member: "${longarg}"`)
					.setColor(red)
				);




				function printUserInfo() {
					let embeduserinfo = new MessageEmbed();
					embeduserinfo
						.setTitle('User Info')
						.setThumbnail(user.displayAvatarURL())
						.addField('« Username »', `${user.username}`, true)
						.addField('« Discriminator »', '#' + user.discriminator, true)
						.addField('« Display Name »', user, true)
						.addField('« Current Status »', user.presence.status.toUpperCase(), true)
						.addField('« Bot? »', user.bot ? 'Yes' : 'No', true)
						.addField('« User ID »', user.id, true)
					if (message.guild != undefined) {
						const rolesOfTheMember = message.guild.member(user).roles.cache.filter(r => r.name !== '@everyone').map(role => role).join(', ');
						embeduserinfo
							.addField('« Roles »', rolesOfTheMember)
							.setColor(message.guild.member(user).displayHexColor)
							.addField('« Joined Server At »', new Date(message.guild.member(user).joinedTimestamp).toLocaleString(), true)
							.setFooter(`Requested by ${message.author.username}`);
					}
					embeduserinfo
						.addField('« Created Account At »', user.createdAt.toLocaleString(), true)
						.setTimestamp()
					message.channel.send(embeduserinfo);
				}

				if (message.deletable) message.delete();

				break;

			case 'test':
				const value = new Date(message.guild.member(message.author).displayHexColor);
				// message.channel.send(`${value}`);
				message.channel.send();
				break;

			case 'whoisironman':
				sendEmbed('Real Ironman', 'The real ironman is Omsin.')
				break

			case 'ask':
				{

					// const timeout_time = 10000;
					const query = args.slice(1).join(' ');
					if (query == '') {
						message.channel.send(new MessageEmbed()
							.setTitle('Error')
							.setDescription(`Usage: ${inlineCodeBlock(`${prefix}ask {question}`)}`)
							.setColor(red)
						);
						return;
					}
					Wolfram.getShort(query, message);
					// if (query.trim() == '') {
					// 	message.channel.send(embedmsg
					// 		.setTitle('Error')
					// 		.setDescription('Cannot query an empty message.')
					// 		.setColor(red));
					// 	return;
					// }
					// message.channel.send(embedmsg
					// 	.setTitle('Please choose result type ...')
					// 	.setDescription('Valid answers are: [1] "Short", "Full", "Simple", "Spoken"')
					// 	.setColor(yellow)
					// ).then(() => {
					// 	bot.user.lastMessage.delete({ timeout: timeout_time })
					// }
					// ).then(() => {
					// 	bot.user.lastMessage.react('1️⃣');
					// 	bot.user.lastMessage.react('2️⃣');
					// 	bot.user.lastMessage.react('3️⃣');
					// 	bot.user.lastMessage.react('4️⃣');
					// 	bot.user.lastMessage.react('❌');

					// 	let filter = (reaction, user) => {
					// 		if (user == message.author) {
					// 			switch (reaction.emoji.name) {
					// 				case '1️⃣':
					// 				case '2️⃣':
					// 				case '3️⃣':
					// 				case '4️⃣':
					// 				case '❌':
					// 					return true;
					// 			}
					// 		}
					// 		return false;
					// 	};

					// 	bot.user.lastMessage.awaitReactions(filter, { max: 1, time: timeout_time, errors: ['time'] })
					// 		.then(collected => {
					// 			console.log(collected.first().emoji.name)
					// 			switch (collected.first().emoji.name) {
					// 				case '1️⃣':
					// 					Wolfram.getShort(query, message);
					// 					break;
					// 				case '2️⃣':
					// 					Wolfram.getFull(query, message);
					// 					break;
					// 				case '3️⃣':
					// 					Wolfram.getSimple(query, message);
					// 					break;
					// 				case '4️⃣':
					// 					Wolfram.getSpoken(query, message);
					// 					break;
					// 					message.channel.send()
					// 				case '❌':
					// 					message.channel.send(embedmsg
					// 						.setTitle('Query Aborted')
					// 						.setDescription('Aborted by user, action canceled.')
					// 						.setColor(red)).then((sent_msg) => sent_msg.delete(100))
					// 			}
					// 		})
					// 		.catch(collected => {
					// 			message.channel.send(embedmsg
					// 				.setTitle('Timed out')
					// 				.setDescription('Timeout, action canceled.')
					// 				.setColor(red));
					// 			confirm_msg.delete()
					// 		});
					// });
				}
				break;
			case 'askimg':
				const query = args.slice(1).join(' ');
				if (query == '') {
					message.channel.send(new MessageEmbed()
						.setTitle('Error')
						.setDescription(`Usage: ${inlineCodeBlock(`${prefix}askimg {question}`)}`)
						.setColor(red)
					);
					return;
				}
				Wolfram.getSimple(query, message);
				break;



			default:
				message.channel.send(new MessageEmbed()
					.setTitle('Error')
					.setDescription(`Invalid command, type ${inlineCodeBlock(`${prefix}help`)} for list of commands.`)
					.setColor(red))
		}

	}
});

// client.on('message', message => {
// 	// If the message is "what is my avatar"
// 	if (message.content === prefix + 'rank') {
// 		// Send the user's avatar URL
// 		message.reply(message.author.displayAvatarURL());
// 	}
// });
