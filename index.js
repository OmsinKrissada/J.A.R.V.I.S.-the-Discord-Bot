const fs = require('fs');
const highlight = require('highlight.js')

// Import the discord.js module
const { Discord, Client, MessageEmbed } = require('discord.js');

// Create an instance of a Discord client
const client = new Client();
// const clientInformation = new Discord.clientInformation();

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
	console.log('I am ready!');
	client.user.setActivity('Ultron', { type: "WATCHING" })

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
}


class Ranker {
	user_id;

}

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

client.on('message', message => {
	current_channel = message.channel
	current_message = message
	if (message.content.startsWith(prefix) && !message.author.bot) {
		let command = message.content.substring(prefix.length, message.content.indexOf(' ') != -1 ? message.content.indexOf(' ') : message.content.length)
		let arg = (message.content.indexOf(' ') != -1 ? message.content.substring(message.content.indexOf(' ') + 1) : ' ').trim()
		// message.reply('\nCommand is: ' + command + '\nArgument is: ' + arg)

		switch (command) {
			// case 'terminal':
			// 	terminal(message)
			// 	break


			case 'help':
				embed = new MessageEmbed()
					.setTitle(`Available Commands:`)
					.setDescription(`Current bot's prefix is \`${prefix == '`' ? '\`' : prefix}\``)
					.setColor(blue)
					.addField(`General`, '`help` : Shows this message\n`ping` : Pong!\n`hello` : Hi!\n`morse` : Translate between morse code and English\n`myid` : Show your user ID\n`help` : Shows this message\n`rank` : Start a ranking session\n`uptime` : Shows bot\'s uptime\n')
					.addField('Settings', '`nick` : Change bot\'s nickname\n`prefix` : Change bot\'s prefix')
					.addField('Misc', '`repeat` : Repeat your messsages\n`say` : Say your provided text once')
				message.channel.send(embed)
				break

			case 'ping':
				message.reply('Pong!')
				break

			case 'hello':
				message.channel.send(`Hi! ${message.author}`)
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
					message.guild.member(client.user).setNickname(arg)
				if (arg != '') {
					sendEmbed('Nickname Changed', `Nickname has changed to ${arg}`, 'success')
				}
				else {
					sendEmbed('Nickname Reset', 'Nickname has reset to **J.A.R.V.I.S.**', 'success')
				}
				break

			case 'prefix':
				if (arg != '') {
					// if (arg == '/') {
					// 	sendEmbed('Prefix Not Recommended', 'The prefix `/` is not recommended because it is also used for discord commands.\nType `confirm` to comfirm the change. Otherwise, the change will be reversed.')
					// 	client.on('message', message => {
					// 		console.log('in')
					// 	})
					// }
					// else {
					prefix = arg;
					fs.writeFile('prefix.txt', prefix, (err) => {
						if (err) throw err
					})
					sendEmbed('Prefix Changed', `Prefix has changed to ${prefix}`, 'success')
					console.log(`The prefix has changed to \`${prefix}\``)
					// }
				}
				else {
					sendEmbed('Error', `Usage ${prefix}prefix { new prefix }`, 'error')
				}
				break

			case 'rank':
				// message.channel.send(Discord.MessageEmbed('Now Ranking', `${ message.author } started a ranking session.\n\nType your answer into the chat. (without prefix) \nType!stopranking to end the session.`))
				// const embed = new MessageEmbed().setTitle('Now Ranking').setColor
				rank(message)
				break

			case 'repeat':
				if (arg != '') {
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
				message.channel.send(arg)
				break

			case 'stop':
				break

			case 'stopallrepeat':
				if (arg != '') {
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