const fs = require('fs');

// Import the discord.js module
const Discord = require('discord.js');

// Create an instance of a Discord client
const client = new Discord.Client();
// const clientInformation = new Discord.clientInformation();
var PythonShell = require('python-shell');

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

function sendEmbed(title, text, type = 'info', channel = current_channel) {
	const embed = new Discord.MessageEmbed()
		.setTitle(title)
		.setDescription(text)
	if (type == 'error') embed.setColor(0xff0000)
	else if (type == 'success') embed.setColor(0x00ff00)
	//0x32a852
	else if (type == 'info') embed.setColor(0x4287f5)
	channel.send(embed);
}

function ranking(origin_message) {
	stopranking = false

	const { spawn } = require("child_process");
	const py = spawn("python", ["-u", "item-ranker.py"]);

	py.stdout.on('data', data => {
		origin_message.channel.send(data)
		console.log(data)
	});

	client.on('message', message => {
		if (stop) return;
		if (!message.author.bot && message.author == origin_message.author) {
			if (message.content != 'stop') {
				console.log('[\'' + message.content + '\']');
				console.log(stop)
			}
			else {
				py.stdin.end();

				origin_message.reply('Ended Session')
				console.log('finished');
				console.log(stop)
				stop = true
			}
		}
	});
}

const readline = require("readline");
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function terminal(message) {
	const { spawn } = require("child_process");

	const py = spawn("python", ["item-ranker.py"]);

	py.stdout.on("data", data => {
		sendEmbed('stdout: ', `${data}`)
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
	});

	// process.stdin.pipe(py.stdin)
	const { Readable } = require('stream')
	const readable = Readable.from(message.content)

	// console.log(`going to pipe as ${process.stdin.read()}`)
	readable.pipe(process.stdin)
	process.stdin.pipe(py.stdin)
	// console.log(`piped as ${process.stdin.read()}`)
	// console.log('piped')


	// rl.question("input: ", function (ans) {
	// 	process.stdin.pipe(ls.stdin)
	// 	// ls.stdin.write(ans)
	// });
	client.on('message', message => {

		console.log('before add')
		console.log(`going to add "${message.content}" to "readable" stream`)
		readable.

			console.log('after add')
	})
}


// process.stdin.pipe(py.stdin)

// rl.question("input: ", function (ans) {
// 	process.stdin.pipe(ls.stdin)
// 	// ls.stdin.write(ans)
// });



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
			case 'terminal':
				terminal(message)
				break

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
				message.reply('You started a ranking session.')
				ranking(message)

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
				message.channel.send(arg)
				break

			case 'stopallrepeat':
				if (arg != '') {
					stoprepeat = true
				}
				break

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
client.login("Njk2OTczNzI1ODA2ODg2OTYz.XowjuA.gsDCNyOUTDF_07KAA3ihQ_i7hoM")
