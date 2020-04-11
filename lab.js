// // child = exec('cat *.js bad_file | wc -l',
// //     function (error, stdout, stderr) {
// //         console.log('stdout: ' + stdout);
// //         console.log('stderr: ' + stderr);
// //         if (error !== null) {
// //             console.log('exec error: ' + error);
// //         }
// //     });
// // child();

// const { spawn } = require('child_process');
// const bat = spawn('cmd.exe', ['/c', 'python item-ranker.py']);

// bat.stdout.on('data', (data) => {
//     console.log(data.toString());
// });

// bat.stderr.on('data', (data) => {
//     console.error(data.toString());
// });

// bat.on('exit', (code) => {
//     console.log(`Child exited with code ${code}`);
// });

console.log('hellok'.indexOf(' '))






/**
 * Send a user a link to their avatar
 */

// Import the discord.js module
const Discord = require('discord.js');

// Create an instance of a Discord client
const client = new Discord.Client();
var PythonShell = require('python-shell');

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
    console.log('I am ready!');
});


var prefix = '!'

function sendEmbed(channel, title, text, type) {
    const embed = new Discord.MessageEmbed()
        .setTitle(title)
        .setDescription(text)
    if (type == 'error') embed.setColor(0xff0000)
    else if (type == 'success') embed.setColor(0x32a852)
    else if (type == 'info') embed.setColor(0x0000ff)
    channel.send(embed);
}

function ranking(origin_message) {
    var spawn = require('child_process').spawn,
        py = spawn('python', ['item-ranker.py']);

    py.stdout.on('data', function (data) {
        console.log(data)
    });

    client.on('message', message => {
        if (message.content != 'stop') {
            py.stdin.write(JSON.stringify(data));
        }
        else {
            py.stdin.end();

            origin_message.reply('Ended Session')
            console.log('finished');
        }
    });


}


rankflag = false

client.on('message', message => {
    if (message.content.startsWith(prefix)) {
        let command = message.content.substring(prefix.length, message.content.indexOf(' ') != -1 ? message.content.indexOf(' ') : message.content.length)
        let arg = (message.content.indexOf(' ') != -1 ? message.content.substring(message.content.indexOf(' ') + 1) : ' ').trim()
        // message.reply('\nCommand is: ' + command + '\nArgument is: ' + arg)

        switch (command) {
            case 'ping':
                message.reply('Pong!')
                break;
            case 'prefix':
                if (arg != '') {
                    prefix = arg;
                    sendEmbed(message.channel, 'Succeed', 'Prefix has changed to ' + Discord.Util.escapeInlineCode(prefix), 'success')
                    console.log('The prefix has changed to ' + prefix)
                }
                else {
                    sendEmbed(message.channel, 'Error', 'Usage ' + prefix + 'prefix {new prefix}', 'error')
                }
                break;
            case 'rank':
                message.reply('You started a ranking session.')
                ranking(message)

                rankflag = true
                break


            default:
                sendEmbed(message.channel, 'Error', 'Invalid command, try ' + prefix + 'help for list of command.', 'error')
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
