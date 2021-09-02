import { CategoryChannel, GuildChannel } from 'discord.js';
import { Command } from '../CommandManager';


const guild_id = '705043685888360548';
const category_id = '705043685888360550';

const channelList = ['----- 2003 Building -----', 'G', 'ห้องพยาบาล', 'ลิฟต์', 'M', 'F.2', 'Canteen (on floor)', 'F.3', 'F.4', 'F.5', 'F.6 หอประชุมชั้น 6', 'F.7', 'M.4/1 (on floor)', 'F.8', 'F.9 semi-auditorium', 'F.10', 'F.11', 'ห้องนอนบราเดอร์', '----- 2003 Building -----'];
channelList.reverse();
let originalChannels: string[] = [];

new Command({
	name: 'summonbuilding',
	category: 'hidden',
	description: '',
	examples: [],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MANAGE_CHANNELS'],
	serverOnly: false,
	exec(message) {
		const guild = message.guild!;
		if (message.guild!.id == guild_id) {
			const category = guild.channels.resolve(category_id)! as CategoryChannel;
			category.children.filter(channel => channel.type == 'voice').forEach(channel => {
				originalChannels.push(channel.name);
				channel.delete();
			});

			channelList.forEach((channel: string) => {
				guild.channels.create(channel, { type: 'voice' }).then(created => created.setParent(category_id));
			});
		}
	}
});

new Command({
	name: 'deletebuilding',
	category: 'hidden',
	description: '',
	examples: [],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES', 'MANAGE_CHANNELS'],
	serverOnly: false,
	exec(message) {
		const guild = message.guild!;
		if (message.guild!.id == guild_id) {
			channelList.forEach(channel => {
				guild.channels.cache.filter(realchannel => realchannel.name == channel && !realchannel.deleted && realchannel.deletable).forEach(channel => channel.delete());
			});
			// const gonnadelete = guild.channels.cache.filter(channel => channelList.includes(channel.name));
			// gonnadelete.forEach(channel => channel.delete());

			originalChannels.forEach(channel => {
				guild.channels.create(channel, { type: 'voice' }).then(created => created.setParent(category_id));
			});
			originalChannels = [];
		}
	}
});