import { Guild, VoiceConnection, VoiceChannel, GuildMember, TextChannel, MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import youtube, { Youtube } from 'scrape-youtube';

import { Util } from './Util';
import { message } from './Commando';
import * as DataManager from './DataManager';

class Song {
	title: string;
	url: string;
	thumbnail: string;
	duration: number;
	requester: GuildMember;
	textChannel: TextChannel;
	voiceChannel: VoiceChannel;
	getDuration() {
		return this.duration;
	}
	getPlayedTime() {
		return getPlayedTime(this.requester.guild) / 1000;
	}
}

class GuildMusicData {
	voiceChannelID = '';
	connection: VoiceConnection;
	nowplaying: Song;
	isLooping = false;
	queue: Array<Song> = [];
	volume: number = 5;
	leaveTimeout: NodeJS.Timeout;
}
var music_data: { [guild: string]: GuildMusicData } = {};



function getGuildData(guild_id: string) {
	return music_data[guild_id];
}

export function constructData(guild_id: string) {
	if (!music_data.hasOwnProperty(guild_id)) {
		music_data[guild_id] = new GuildMusicData();
	}
}

export async function join(voiceChannel: VoiceChannel) {
	getGuildData(voiceChannel.guild.id).connection = await voiceChannel.join();
	getGuildData(voiceChannel.guild.id).voiceChannelID = voiceChannel.id;
	// console.log(music_data)
}

export function leave(guild: Guild) {
	if (!getGuildData(guild.id).connection) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription('I am **not** in a voice channel.')
			.setColor(Util.red)
		);
		return;
	}
	pause(guild);
	getGuildData(guild.id).nowplaying = null;
	getGuildData(guild.id).connection.disconnect();
	getGuildData(guild.id).connection = null;
	music_data[guild.id].isLooping = false;
}



export async function play(guild: Guild) {

	clearTimeout(music_data[guild.id].leaveTimeout);

	if (getGuildData(guild.id).connection && getGuildData(guild.id).connection.dispatcher && getGuildData(guild.id).connection.dispatcher.paused) {
		resume(guild);
	}
	if (getGuildData(guild.id).queue.length <= 0) return;

	let song = getGuildData(guild.id).queue.shift();

	let requester = song.requester;
	if (!getGuildData(guild.id).connection) {
		await join(requester.voice.channel);
	}

	const dispatcher = getGuildData(guild.id).connection.play(ytdl(song.url, { filter: "audioonly" }))
	getGuildData(guild.id).nowplaying = song;
	dispatcher.on('finish', () => {
		if (getGuildData(guild.id).isLooping) {
			music_data[guild.id].queue.unshift(music_data[guild.id].nowplaying);
			play(guild);
		}
		else if (getGuildData(guild.id).queue.length >= 1) play(guild); // Have next song
		else { // Doesn't have next song
			if (DataManager.get(guild.id, 'announceQueueEnd')) {
				song.textChannel.send('Queue Ended.');
			}
			music_data[guild.id].leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
			getGuildData(guild.id).nowplaying = null;
		}
	})
	dispatcher.setVolume(music_data[requester.guild.id].volume / 100);

	if (DataManager.get(guild.id, 'announceSong')) {
		song.textChannel.send(new MessageEmbed()
			.setDescription(`🎧 Now playing ` + ` **[${song.title}](${song.url})** \`${Util.prettyTime(song.getDuration())}\` ` + `[${song.requester.user}]`)
			.setColor(Util.blue)
		)
	}
}

export async function addQueue(member: GuildMember, field: string) {
	let music = music_data[member.guild.id];
	await join(member.voice.channel);
	if (field == '') return;
	let song = new Song();
	if (ytdl.validateURL(field)) {
		// song.title = ytdl.getInfo;
		let info = await ytdl.getInfo(field);
		song.title = info.title;
		song.url = field;
		song.duration = Number(info.length_seconds);
		song.thumbnail = info.player_response.videoDetails.thumbnail.thumbnails[0].url;

	} else {
		let youtube = new Youtube();
		let searchResult = await youtube.searchOne(field);
		if (searchResult == null) {
			message.channel.send('Sorry, we experienced difficulties finding your song. Try with other phrases.');
			return;
		}
		song.title = searchResult.title;
		song.url = searchResult.link;
		song.duration = searchResult.duration;
		song.thumbnail = searchResult.thumbnail;
	}
	song.requester = member;
	song.textChannel = (<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID));
	song.voiceChannel = member.voice.channel;

	let totaltime = 0;
	music.queue.forEach(song => {
		totaltime += song.duration;
	});
	if (music.nowplaying) totaltime += music.nowplaying.duration - music.nowplaying.getPlayedTime();

	(<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID)).send(new MessageEmbed()
		.setAuthor('Song Queued', member.user.displayAvatarURL())
		.setDescription('Added ' + `**[${song.title}](${song.url})**` + ' to the queue.\n')
		.setColor(Util.green)
		.addField('Song Duration', `\`${Util.prettyTime(song.getDuration())}\``, true)
		.addField('Position in Queue', `\`${music.nowplaying ? music.queue.length + 1 : 0}\``, true)
		.addField('Time Before Playing', `\`${Util.prettyTime(totaltime)}\``, true)
		.setThumbnail(song.thumbnail)
	);

	if (!getGuildData(member.guild.id)) constructData(member.guild.id);
	getGuildData(member.guild.id).queue.push(song);

	if (!getGuildData(member.guild.id).nowplaying && getGuildData(member.guild.id).queue.length >= 1) play(member.guild);
}

export function pause(guild: Guild) {
	if (getGuildData(guild.id).connection && getGuildData(guild.id).connection.dispatcher) {
		music_data[guild.id].connection.dispatcher.pause();
	}
}

export function resume(guild: Guild) {
	if (getGuildData(guild.id).connection && getGuildData(guild.id).connection.dispatcher) {
		music_data[guild.id].connection.dispatcher.resume();
	}
}

export function volume(guild: Guild, volume: number) {
	if (music_data[guild.id] && music_data[guild.id].connection && music_data[guild.id].connection.dispatcher) music_data[guild.id].connection.dispatcher.setVolume(volume / 100)
	music_data[guild.id].volume = volume;
}

export function skip(guild: Guild, respond_in: TextChannel) {
	if (music_data[guild.id].queue.length > 0) {
		play(guild);
		respond_in.send('Skipped! ⏩')
	}
	else if (music_data[guild.id].connection && music_data[guild.id].connection.dispatcher) {
		music_data[guild.id].connection.dispatcher.destroy();
		music_data[guild.id].nowplaying = null;
		music_data[guild.id].leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
		respond_in.send('Skipped! ⏩')
	}
}

export function loop(guild: Guild) {
	music_data[guild.id].isLooping = !music_data[guild.id].isLooping;
	if (music_data[guild.id].isLooping) message.channel.send('Looping! 🔂');
	else message.channel.send('Stopped Looping! ➡');
}

export function shuffle(guild: Guild) {
	music_data[guild.id].queue = Util.shuffle(music_data[guild.id].queue);
	message.channel.send('Shuffled! 🔀')
}

export async function search(field: string) {
	return youtube.search(field);
}

export function getPlayedTime(guild: Guild) {
	return music_data[guild.id].connection.dispatcher.streamTime;
}

export function getCurrentSong(guild: Guild) {
	return music_data[guild.id].nowplaying;
}

export function getQueue(guild: Guild) {
	return music_data[guild.id].queue;
}

export function getVolume(guild: Guild) {
	return music_data[guild.id].volume;
}

export function removeSong(guild: Guild, index: number) {
	return music_data[guild.id].queue.splice(index, 1)[0];
}

export function clearQueue(guild: Guild) {
	if (!getGuildData(guild.id)) constructData(guild.id);
	if (music_data[guild.id]) music_data[guild.id].queue = [];
}
