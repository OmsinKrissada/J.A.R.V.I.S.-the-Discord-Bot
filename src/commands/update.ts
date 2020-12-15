import { Command } from '../CommandManager';
import { EmojiResolvable, Message, MessageEmbed, TextChannel } from 'discord.js';
import { Util } from '../Util';
import * as DataManager from '../DataManager';
import { exec } from 'child_process';
import path from 'path';



export default new Command({
	name: 'update',
	category: 'hiden',
	description: 'Updates the bot with code from GitHub.',
	examples: ['update'],
	requiredPermissions: [],
	serverOnly: false,
	exec(message, prefix, args, sourceID) {
		// const jarvisChannel = (<TextChannel>Command.bot.guilds.resolve('709824110229979278').channels.resolve('709824110229979282'));
		message.channel.send('Pulling from GitHub . . .');
		exec('git pull', async (_err, stdout, _stderr) => {
			message.channel.send(`\`git pull\` executed, please confirm your action.\nOutput:\n\`\`\`${stdout}\`\`\``);
			Util.confirm_click('Apply updates and restart?', 'This will apply updates from \`git pull\`, run \`npm ci\` and restart the bot.', ['✅', '❌'],
				<TextChannel>message.channel, message.author, 60000).then(returnval => {
					let msg = returnval.message;
					let emoji = returnval.emoji;
					msg.reactions.removeAll();
					if (emoji == '✅') {
						message.channel.send('Running clean install . . .').then(() => {
							exec((path.join(path.dirname(require.main.filename), 'scripts', 'updateandrestart.sh')), (_err, stdout, _stderr) => {
								message.channel.send(stdout).then(process.exit());
							});
						})
						// shell.exec('../../scripts/updateandrestart.sh');
					} else if (emoji == '❌') {
						message.channel.send('Canceled.');
					}
				})
		});
	}
}) 