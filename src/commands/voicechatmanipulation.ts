import { MessageEmbed } from 'discord.js';
import { Command } from '../CommandManager';
import { Helper } from '../Helper';


export default new Command({
	name: 'movevoice',
	category: 'features',
	description: 'Moves',
	examples: ['movevoice'],
	requiredCallerPermissions: ['MOVE_MEMBERS'],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MOVE_MEMBERS'],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const guild = message.guild!
		if (!(args[0] && args[1])) {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription(`Usage: ${prefix}movevoice {origin} {destination}`)
				.setColor(Helper.RED)
			)
			return;
		}

		let origin_all = true;

		// Gather origin channels
		let origins = guild.channels.cache.filter(channel => channel.type == "voice");
		if (args[0] != '*') {
			origins = origins.filter(channel => channel.name.toLowerCase().includes(args[0].toLowerCase()));
			origin_all = false;
		}

		// Gather destination channel
		let dests = guild.channels.cache.filter(channel => channel.type == "voice");
		if (args[1] != '*') {
			dests = dests.filter(channel => channel.name.toLowerCase().includes(args[1].toLowerCase()));
		}

		let embed = new MessageEmbed()
			.setTitle('Members Moved:')
			.setColor(Helper.GREEN);
		let description = '';

		// Confirm destination channel
		if (origin_all) {
			Helper.confirm_type({ title: 'Choose Destination Channel' }, Array.from(dests.keys()), message, prefix).then(deststr => {
				console.log(deststr)
				let dest = guild.channels.resolve(deststr);
				if (origins.size == 0) message.channel.send(new MessageEmbed()
					.setTitle('Error')
					.setDescription('No Voice Channels Found')
					.setColor(Helper.RED))
				if (!dest) {
					message.channel.send(new MessageEmbed()
						.setTitle('Error')
						.setDescription('**Destination Channel** Not Found')
						.setColor(Helper.RED));
					return;
				}
				origins.forEach((origin) => {
					guild.channels.resolve(origin)!.members.forEach((member) => {
						if (origin.id != dest!.id) {
							console.log('all')
							console.log('from ' + origin.name + ' to ' + dest!.name)
							description += ` • ${member.user}: ${origin.name} ➡ ${dest!.name}\n`
							member.voice.setChannel(dest);
						}
					})
				})
				if (description != '')
					message.channel.send(embed.setDescription(description))
				else
					message.channel.send(new MessageEmbed()
						.setTitle('No Users Moved')
						.setColor(Helper.BLUE)
					)
			})
		}
		else { // Confirm origin channel
			Helper.confirm_type({ title: 'Choose Origin Channel' }, Array.from(origins.keys()), message, prefix).then(originstr => {
				Helper.confirm_type({ title: 'Choose Destination Channel' }, Array.from(dests.keys()), message, prefix).then(deststr => {
					let origin = guild.channels.resolve(originstr);
					let dest = guild.channels.resolve(deststr);
					// Tell the errors
					if (!origin) {
						message.channel.send(new MessageEmbed()
							.setTitle('Error')
							.setDescription('**Origin Channel** Not Found')
							.setColor(Helper.RED));
						return;
					}
					if (!dest) {
						message.channel.send(new MessageEmbed()
							.setTitle('Error')
							.setDescription('**Destination Channel** Not Found')
							.setColor(Helper.RED));
						return;
					}
					guild.channels.resolve(origin)!.members.forEach((member) => {
						if (origin!.id != dest!.id) {
							console.log('not all')
							console.log('from ' + origin!.name + ' to ' + dest!.name)
							description += ` • ${member.user}: ${origin!.name} ➡ ${dest!.name}\n`
							member.voice.setChannel(dest);
						}
					})
					if (description != '')
						message.channel.send(embed.setDescription(description))
					else
						message.channel.send(new MessageEmbed()
							.setTitle('No Users Moved')
							.setColor(Helper.BLUE)
						)
				})
			})
		}
	}
})




