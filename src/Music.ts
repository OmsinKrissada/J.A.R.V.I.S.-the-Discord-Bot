import { Guild, VoiceConnection, VoiceChannel, GuildMember, TextChannel, MessageEmbed } from 'discord.js';
import ytdl from 'discord-ytdl-core';
import yts from 'yt-search';

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
	volume: number = DataManager.CONFIG['defaultVolume'];
	leaveTimeout: NodeJS.Timeout;
}
var music_data: { [guild: string]: GuildMusicData } = {};



function getGuildData(guild_id: string) {
	return music_data[guild_id];
}

export function getTotalTime(guild: Guild) {
	const music = music_data[guild.id];
	let totaltime = 0;
	music.queue.forEach(song => {
		totaltime += song.duration;
	});
	if (music.nowplaying) totaltime += music.nowplaying.duration - music.nowplaying.getPlayedTime();
	return totaltime;
}

export function constructData(guild_id: string) {
	if (!music_data.hasOwnProperty(guild_id)) {
		music_data[guild_id] = new GuildMusicData();
	}
}

export async function join(voiceChannel: VoiceChannel) {
	let guild = voiceChannel.guild;

	getGuildData(guild.id).connection = await voiceChannel.join();
	getGuildData(guild.id).voiceChannelID = voiceChannel.id;

	music_data[guild.id].connection.on('disconnect', () => {
		pause(guild);
		getGuildData(guild.id).nowplaying = null;
		getGuildData(guild.id).connection = null;
		music_data[guild.id].isLooping = false;
	})
	// console.log(music_data)
}

export function leave(guild: Guild, announceChannel?: TextChannel) {
	if (!getGuildData(guild.id).connection) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription('I am **NOT** in a voice channel.')
			.setColor(Util.red)
		);
		return;
	}
	getGuildData(guild.id).connection.disconnect();
	if (announceChannel)
		announceChannel.send('👋 Successfully Disconnected!');
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

	const dispatcher = getGuildData(guild.id).connection.play(ytdl(song.url, { filter: "audioonly", quality: "highestaudio", opusEncoded: true }), { type: "opus" })
	getGuildData(guild.id).nowplaying = song;
	dispatcher.on('close', () => { console.log('closed') })
	dispatcher.on('unpipe', () => { console.log('unpiped') })
	dispatcher.on('finish', async () => {
		console.log('finished')
		if (getGuildData(guild.id).isLooping && music_data[guild.id].nowplaying != null) {
			music_data[guild.id].queue.unshift(music_data[guild.id].nowplaying);
			play(guild);
		}
		else if (getGuildData(guild.id).queue.length >= 1) play(guild); // Have next song
		else { // Doesn't have next song
			if (await DataManager.get(guild.id, 'settings.announceQueueEnd')) {
				song.textChannel.send('Queue Ended.');
			}
			music_data[guild.id].leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
			getGuildData(guild.id).nowplaying = null;
		}
	})
	dispatcher.setVolume(music_data[requester.guild.id].volume / 100);

	if (await DataManager.get(guild.id, 'settings.announceSong')) {
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
		const searchResult = await yts({ query: field, pageStart: 1, pageEnd: 1 });
		const video = searchResult.videos[0];
		if (searchResult == null) {
			message.channel.send('Sorry, we experienced difficulties finding your song. Try with other phrases.');
			return;
		}
		song.title = video.title;
		song.url = video.url;
		song.duration = video.duration.seconds;
		song.thumbnail = video.thumbnail;
	}
	song.requester = member;
	song.textChannel = (<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID));
	song.voiceChannel = member.voice.channel;

	(<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID)).send(new MessageEmbed()
		.setAuthor('Song Queued', member.user.displayAvatarURL())
		.setDescription('Queued ' + `**[${song.title}](${song.url})**` + '.\n')
		.setColor(Util.green)
		.addField('Song Duration', `\`${Util.prettyTime(song.getDuration())}\``, true)
		.addField('Position in Queue', `\`${music.nowplaying ? music.queue.length + 1 : 0}\``, true)
		.addField('Time Before Playing', `\`${Util.prettyTime(getTotalTime(member.guild))}\``, true)
		.setThumbnail(song.thumbnail)
	);
	music_data[member.guild.id].queue.push(song);

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

export function move(guild: Guild, oldPosition: number, newPosition: number) {
	let queue = music_data[guild.id].queue;
	let transferingSong = queue.splice(oldPosition - 1, 1)[0];
	queue.splice(newPosition - 1, 0, transferingSong);
}

export function seek(guild: Guild, startsec: number) {
	let currentSong = music_data[guild.id].nowplaying;
	console.log(startsec)
	music_data[guild.id].connection.dispatcher.destroy();
	const dispatcher = music_data[guild.id].connection.play(ytdl(currentSong.url, { filter: "audioonly", quality: "highestaudio", seek: startsec, opusEncoded: true }), { type: "opus" });
	dispatcher.setVolume(music_data[guild.id].volume / 100);
	dispatcher.on('finish', async () => {
		console.log('finished')
		if (getGuildData(guild.id).isLooping && music_data[guild.id].nowplaying != null) {
			music_data[guild.id].queue.unshift(music_data[guild.id].nowplaying);
			play(guild);
		}
		else if (getGuildData(guild.id).queue.length >= 1) play(guild); // Have next song
		else { // Doesn't have next song
			if (await DataManager.get(guild.id, 'settings.announceQueueEnd')) {
				currentSong.textChannel.send('Queue Ended.');
			}
			music_data[guild.id].leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
			getGuildData(guild.id).nowplaying = null;
		}
	})
	currentSong.getPlayedTime = () => {
		return (music_data[guild.id].connection.dispatcher.streamTime + startsec * 1000) / 1000;
	}
}

export async function search(field: string) {
	return await yts({ query: field, pageStart: 1, pageEnd: 3 });
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
	if (music_data[guild.id]) music_data[guild.id].queue = [];
}

export function isLooping(guild: Guild) {
	return music_data[guild.id].isLooping;
}
