const fs = require('fs');

// Import the discord.js module
const { Client, MessageEmbed, MessageCollector, MessageManager, ChannelManager } = require('discord.js');
// const Discord = require('discord.js')

// Create an instance of a Discord client
const client = new Client();
// const clientInformation = new Discord.clientInformation();

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
var ip_address;
client.on('ready', () => {
	console.log('I am ready!');
	client.user.setActivity('Ultron', { type: "WATCHING" })
	let { exec } = require('child_process');
	exec('dig +short myip.opendns.com @resolver1.opendns.com', function (err, stdout, stderr) {
		ip_address = stdout;
	});
	ip_address = ip_address;
	mclog_channel = client.channels.resolve('699045838718238771')

	// console.log(Discord.GuildManager.resolve(client.guilds))
});

// Read files
fs.readFile('prefix.txt', 'utf-8', (err, data) => {
	if (err) throw err;
	prefix = data;
	console.log(`Prefix has set to "${prefix}"`)
});

fs.readFile('token', 'utf-8', (err, data) => {
	if (err) throw err;
	let mytoken = data;
	client.login(mytoken)
});

const red = 0xff0000
const green = 0x00ff00
const blue = 0x4287f5
const yellow = 0xebc934

function sendEmbed(title, text, type = 'info', channel = current_channel) {
	const embed = new MessageEmbed()
		.setTitle(title)
		.setDescription(text)
	if (type == 'error') embed.setColor(red)
	else if (type == 'success') embed.setColor(green)
	//0x32a852
	else if (type == 'info') embed.setColor(blue)
	channel.send(embed);
};


// class Ranker {
// 	user_id;
// 	begin() {

// 	}

// }

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
	client.on('message', message => {
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

// document.write("Entering the loop!<br /> ");

// outerloop: // This is the label name
// for (var i = 0; i < 5; i++) {
// 	document.write("Outerloop: " + i + "<br />");

// 	innerloop:
// 	for (var j = 0; j < 5; j++) {
// 		if (j > 3) break; // Quit the innermost loop
// 		if (i == 2) break innerloop; // Do the same thing
// 		if (i == 4) break outerloop; // Quit the outer loop
// 		document.write("Innerloop: " + j + " <br />");
// 	}
// }
// document.write("Exiting the loop!<br /> ");
let stopmorse = false
function morseidk() {
	morse: {
		if (stopmorse) {
			console.log('breaking morse')
			break morse;
		}

		const { spawn } = require("child_process");
		const py = spawn("python", ["morse.py"]);

		py.stdout.on("data", data => {
			sendEmbed('', `${data}\n\n`, channel = current_channel)
			console.log(`stdout: ${data}`);
		});

		py.stderr.on("data", data => {
			sendEmbed('Error:', `\n\`\`\`${data}\`\`\``, 'error', current_channnel)
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
		client.on('message', message => {
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
					.setTitle('Server Started')
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

client.on('message', message => {
	current_channel = message.channel
	current_message = message
	if (message.content.startsWith(prefix) && !message.author.bot) {
		let args = message.content.trim().split(' ')
		// message.reply('\nCommand is: ' + args.shift() + '\nArgument is: ' + args)

		switch (args[0]) {
			// case 'terminal':
			// 	terminal(message)
			// 	break


			case 'help':
				embed = new MessageEmbed()
					.setTitle(`Available Commands:`)
					.setDescription(`Current bot's prefix is \`${prefix == '`' ? '\`' : prefix}\``)
					.setColor(blue)
					.addField(`General`, '`help` : Shows this message\n`ping` : Pong!\n`hello` : Hi!\n`ip` : Get my current public IP address\n`ip` : Get my current public IP address and mention @everyone\n`morse` : Translate between morse code and English\n`myid` : Show your user ID\n`help` : Shows this message\n`rank` : Start a ranking session\n`uptime` : Shows bot\'s uptime\n')
					.addField('Settings', '`nick` : Change bot\'s nickname\n`prefix` : Change bot\'s prefix')
					.addField('Misc', '`repeat` : Repeat your messsages\n`say` : Say your provided text once')
					.addField('‏‏‎ ‎', 'For source code, please visit https://github.com/OmsinKrissada/J.A.R.V.I.S.-the-Discord-Bot')
				message.channel.send(embed)
				break

			case 'ping':
				message.reply('Pong!')
				break

			case 'hello':
				message.channel.send(`Hi! ${message.author}`)
				break

			case 'ip':
				message.channel.send(`Current IP address is **${ip_address}**`)
				break

			case 'channel':
				console.log(`${message.channel} with id: ${message.channel.id}`)
				break

			// case 'ignore':
			// 	fs.writeFileSync(ignorelist.txt, arg)

			// 	message.channel.send()
			// 	break

			case 'ipannounce':
				embed = new MessageEmbed()
					.setTitle('CURRENT IP')
					.setDescription(`**Current IP address is \`${ip_address}\`**`)
					.setColor(blue)
					.addField(` ‎`, `_Last updated: ${new Date().toLocaleString()}_`)
				message.channel.send(embed)
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

			case 'morse':
				morseidk()
				break

			case 'myid':
				embed = new MessageEmbed()
					.setAuthor(`Your ID is "${message.author.id}"`, message.author.avatarURL())
					.setColor(blue)
				message.channel.send(embed)
				break

			case 'nick':
				if (message.guild.dm)
					message.guild.member(client.user).setNickname(args[1])
				if (args[1] != '') {
					sendEmbed('Nickname Changed', `Nickname has changed to ${args[1]}`, 'success')
				}
				else {
					sendEmbed('Nickname Reset', 'Nickname has reset to **J.A.R.V.I.S.**', 'success')
				}
				break

			case 'prefix':
				if (args[1] != '') {
					// if (arg == '/') {
					// 	sendEmbed('Prefix Not Recommended', 'The prefix `/` is not recommended because it is also used for discord commands.\nType `confirm` to comfirm the change. Otherwise, the change will be reversed.')
					// 	client.on('message', message => {
					// 		console.log('in')
					// 	})
					// }
					// else {
					prefix = args[1];
					fs.writeFile('prefix.txt', prefix, (err) => {
						if (err) throw err
					})
					sendEmbed('Prefix Changed', `Prefix has changed to ${prefix}`, 'success')
					console.log(`The prefix has changed to \`${prefix}\``)
					// }
				}
				else {
					sendEmbed('Error', `Usage \`${prefix}prefix { new prefix }\``, 'error')
				}
				break

			case 'rank':
				// message.channel.send(Discord.MessageEmbed('Now Ranking', `${ message.author } started a ranking session.\n\nType your answer into the chat. (without prefix) \nType!stopranking to end the session.`))
				// const embed = new MessageEmbed().setTitle('Now Ranking').setColor
				rank(message)
				break

			case 'repeat':
				if (args[1] != '') {
					current_author = message.mentions.users.first()
				}
				else {
					current_author = message.author
				}

				sendEmbed('Start Repeating', `Okay, now repeating ${current_author}'s messages.`);
				idk = function (current_author) {
					stoprepeat = false
					client.on('message', current_message => {
						if (stoprepeat) {
							return;
						}
						if (current_message.author == current_author) {
							if (current_message.content.toLowerCase() == `${prefix}stop`) {
								sendEmbed('Stopped Repeating', `Okay, stopped repeating ${current_author}`)
								stoprepeat = true
							}
							else { current_message.channel.send(current_message.content) }
						}
					})
				}
				break

			case 'say':
				message.channel.send(args[1])
				break

			case 'stop':
				break

			case 'stopallrepeat':
				if (args[1] != '') {
					stoprepeat = true
				}
				break

			case 'test':
				const exampleEmbed = new MessageEmbed()
					.setColor('#0099ff')
					.setTitle('Some title')
					.setURL('https://discord.js.org/')
					.setAuthor('Some name', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
					.setDescription('Some description here')
					.setThumbnail('https://i.imgur.com/wSTFkRM.png')
					.addField('Regular field title', 'Some value here')
					.addField('Inline field title', 'Some value here')
					.addField('Inline field title', 'Some value here')
					.addField('Inline field title', 'Some value here')
					.setImage('https://i.imgur.com/wSTFkRM.png')
					.setTimestamp()
					.setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png');

				message.channel.send(exampleEmbed);
			// const embed = new Discord.MessageEmbed()
			// 	.setTitle("title")
			// 	.setDescription("description")
			// 	.setAuthor(message.author)
			// 	.setColor('0x00ff00')
			// 	.setFooter('footer')
			// .addField
			// message.channel.send(embed)
			// break

			case 'uptime':
				sendEmbed('Uptime', `${client.uptime / 1000}s`)
				break

			case 'whoisironman':
				sendEmbed('Real Ironman', 'The real ironman is Omsin.')
				break


			default:
				sendEmbed('Error', `Invalid command, try ${prefix}help for list of commands.`, 'error')
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
