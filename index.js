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



function rank(origin_message) {
	let stopranking = false;
	const { spawn } = require("child_process");

	const py = spawn("python", ["-u", "item-ranker.py"]);

	py.stdout.on("data", data => {
		sendEmbed('', `${data}\n${origin_message.author}`, channel = origin_message.channel)
		console.log(`stdout: ${data}`);
	});

	py.stderr.on("data", data => {
		console.log(`stderr: ${data}`);
	});

	py.on('error', (error) => {
		console.log(`error: ${error.message}`);
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

	client.on('message', message => {
		if (stopranking) return;
		if (!message.author.bot && (message.author == origin_message.author)) {
			// Write discord input to 'pass'
			pass.write(message.content + '\r\n')
			console.log(`wrote ${message.content}`)
		}
	})
}


class RepeatSession {

}

rankflag = false

client.on('message', message => {
	current_channel = message.channel
	if (message.content.startsWith(prefix) && !message.author.bot) {
		let command = message.content.substring(prefix.length, message.content.indexOf(' ') != -1 ? message.content.indexOf(' ') : message.content.length)
		let arg = (message.content.indexOf(' ') != -1 ? message.content.substring(message.content.indexOf(' ') + 1) : ' ').trim()
		// message.reply('\nCommand is: ' + command + '\nArgument is: ' + arg)

		switch (command) {
			// case 'terminal':
			// 	terminal(message)
			// 	break

			case 'help':
				sendEmbed('Commands',
					`Available commands:\n
${prefix}hello : Hi!
${prefix}ping : Pong!
${prefix}prefix : Change bot's prefix
${prefix}rank : Start a ranking session ()`)
				break

			case 'ping':
				message.reply('Pong!')
				break

			case 'hello':
				message.channel.send(`Hi! ${message.author}`)
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
					prefix = arg;
					fs.writeFile('prefix.txt', prefix, (err) => {
						if (err) throw err
					})
					sendEmbed('Prefix Changed', `Prefix has changed to ${prefix}`, 'success')
					console.log(`The prefix has changed to ${prefix}`)
				}
				else {
					sendEmbed('Error', `Usage ${prefix}prefix {new prefix}`, 'error')
				}
				break

			case 'rank':
				// message.channel.send(Discord.MessageEmbed('Now Ranking', `${message.author} started a ranking session.\n\nType your answer into the chat. (without prefix)\nType !stopranking to end the session.`))
				// const embed = new MessageEmbed().setTitle('Now Ranking').setColor
				rank(message)

				rankflag = true
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
				highlight.
					message.channel.send(arg)
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