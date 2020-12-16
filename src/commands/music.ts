// import { Command } from '../CommandManager';
// import { MessageEmbed } from 'discord.js';
// import { Util } from '../Helper';
// import * as DataManager from '../DataManager';
// new Command({
// 	name: 'join',
// 	category: '',
// 	description: '',
// 	examples: [],
// 	requiredPermissions: [],
// 	serverOnly: ,
// 	exec(message, prefix, args, sourceID) {
// 		if (args[0]) {
// 			const channel = message.guild.channels.resolve(args[0]);
// 			if (channel && channel.type == 'voice') {
// 				Music.join(<VoiceChannel>channel);
// 			}
// 			else {
// 				message.channel.send('Channel with ID ' + args[0] + ' is not a voice channel.')
// 			}
// 		}
// 		else {
// 			if (!message.member.voice.channel) {
// 				message.channel.send(new MessageEmbed()
// 					.setTitle('Error')
// 					.setDescription('**You must be in a voice channel** to use this command.')
// 					.setColor(Util.red)
// 				);
// 				return;
// 			}
// 			Music.join(message.member.voice.channel)
// 		}
// 	}
// })


// new Command({
// 	name: 'play',
// 	category: '',
// 	description: '',
// 	examples: [],
// 	requiredPermissions: [],
// 	serverOnly: ,
// 	async exec(message, prefix, args, sourceID) { // Some part of code is from discord.js
// 		if (!message.member.voice.channel) {
// 			message.channel.send(new MessageEmbed()
// 				.setTitle('Error')
// 				.setDescription('**You must be in a voice channel** to use this command.')
// 				.setColor(red)
// 			);
// 			return;
// 		}
// 		await Music.addQueue(message.member, longarg(0));
// 	}
// })


// new Command({
// 	name: '',
// 	category: '',
// 	description: '',
// 	examples: [],
// 	requiredPermissions: [],
// 	serverOnly: ,
// 	exec(message, prefix, args, sourceID) { }
// })


// new Command({
// 	name: '',
// 	category: '',
// 	description: '',
// 	examples: [],
// 	requiredPermissions: [],
// 	serverOnly: ,
// 	exec(message, prefix, args, sourceID) { }
// }) 