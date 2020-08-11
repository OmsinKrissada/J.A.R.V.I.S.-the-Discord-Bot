import { Guild, VoiceConnection, VoiceChannel, GuildMember, TextChannel, MessageEmbed, GuildResolvable } from 'discord.js';
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
const MusicData = new Map<GuildResolvable, GuildMusicData>();


export function getTotalTime(guild: Guild) {
	const music = MusicData.get(guild.id);
	let totaltime = 0;
	music.queue.forEach(song => {
		totaltime += song.duration;
	});
	if (music.nowplaying) totaltime += music.nowplaying.duration - music.nowplaying.getPlayedTime();
	return totaltime;
}

export function constructData(guild_id: string) {
	if (!MusicData.has(guild_id)) {
		MusicData.set(guild_id, new GuildMusicData());
	}
}

export async function join(voiceChannel: VoiceChannel) {
	let guild = voiceChannel.guild;

	MusicData.get(guild.id).connection = await voiceChannel.join();
	MusicData.get(guild.id).voiceChannelID = voiceChannel.id;

	MusicData.get(guild.id).connection.on('disconnect', () => {
		pause(guild);
		MusicData.get(guild.id).nowplaying = null;
		MusicData.get(guild.id).connection = null;
		MusicData.get(guild.id).isLooping = false;
	})
	// console.log(music_data)
}

export function leave(guild: Guild, announceChannel?: TextChannel) {
	if (!MusicData.get(guild.id).connection) {
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription('I am **NOT** in a voice channel.')
			.setColor(Util.red)
		);
		return;
	}
	MusicData.get(guild.id).connection.disconnect();
	if (announceChannel)
		announceChannel.send('👋 Successfully Disconnected!');
}



export async function play(guild: Guild) {
	const guild_music = MusicData.get(guild.id);

	clearTimeout(guild_music.leaveTimeout);

	if (guild_music.connection && guild_music.connection.dispatcher && guild_music.connection.dispatcher.paused) {
		resume(guild);
	}
	if (guild_music.queue.length <= 0) return;

	let song = guild_music.queue.shift();

	let requester = song.requester;
	if (!guild_music.connection) {
		await join(requester.voice.channel);
	}

	const dispatcher = guild_music.connection.play(ytdl(song.url, { filter: "audioonly", quality: "highestaudio", opusEncoded: true }), { type: "opus" })
	guild_music.nowplaying = song;
	dispatcher.on('close', () => { console.log('closed') })
	dispatcher.on('unpipe', () => { console.log('unpiped') })
	dispatcher.on('finish', async () => {
		console.log('finished')
		if (guild_music.isLooping && guild_music.nowplaying != null) {
			guild_music.queue.unshift(guild_music.nowplaying);
			play(guild);
		}
		else if (guild_music.queue.length >= 1) play(guild); // Have next song
		else { // Doesn't have next song
			if (await DataManager.get(guild.id, 'settings.announceQueueEnd')) {
				song.textChannel.send('Queue Ended.');
			}
			guild_music.leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
			guild_music.nowplaying = null;
		}
	})
	dispatcher.setVolume(MusicData.get(requester.guild.id).volume / 100);

	if (await DataManager.get(guild.id, 'settings.announceSong')) {
		song.textChannel.send(new MessageEmbed()
			.setDescription(`🎧 Now playing ` + ` **[${song.title}](${song.url})** \`${Util.prettyTime(song.getDuration())}\` ` + `[${song.requester.user}]`)
			.setColor(Util.blue)
		)
	}
}

export async function addQueue(member: GuildMember, field: string) {
	let guild_music = MusicData.get(member.guild.id);
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
		.addField('Position in Queue', `\`${guild_music.nowplaying ? guild_music.queue.length + 1 : 0}\``, true)
		.addField('Time Before Playing', `\`${Util.prettyTime(getTotalTime(member.guild))}\``, true)
		.setThumbnail(song.thumbnail)
	);
	MusicData.get(member.guild.id).queue.push(song);

	if (!MusicData.get(member.guild.id).nowplaying && MusicData.get(member.guild.id).queue.length >= 1) play(member.guild);
}

export function pause(guild: Guild) {
	if (MusicData.get(guild.id).connection && MusicData.get(guild.id).connection.dispatcher) {
		MusicData.get(guild.id).connection.dispatcher.pause();
	}
}

export function resume(guild: Guild) {
	if (MusicData.get(guild.id).connection && MusicData.get(guild.id).connection.dispatcher) {
		MusicData.get(guild.id).connection.dispatcher.resume();
	}
}

export function volume(guild: Guild, volume: number) {
	if (MusicData.get(guild.id) && MusicData.get(guild.id).connection && MusicData.get(guild.id).connection.dispatcher) MusicData.get(guild.id).connection.dispatcher.setVolume(volume / 100)
	MusicData.get(guild.id).volume = volume;
}

export function skip(guild: Guild, respond_in: TextChannel) {
	if (MusicData.get(guild.id).queue.length > 0) {
		play(guild);
		respond_in.send('Skipped! ⏩')
	}
	else if (MusicData.get(guild.id).connection && MusicData.get(guild.id).connection.dispatcher) {
		const guild_music = MusicData.get(guild.id);
		guild_music.connection.dispatcher.destroy();
		guild_music.nowplaying = null;
		guild_music.leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
		respond_in.send('Skipped! ⏩')
	}
}

export function loop(guild: Guild) {
	MusicData.get(guild.id).isLooping = !MusicData.get(guild.id).isLooping;
	if (MusicData.get(guild.id).isLooping) message.channel.send('Looping! 🔂');
	else message.channel.send('Stopped Looping! ➡');
}

export function shuffle(guild: Guild) {
	MusicData.get(guild.id).queue = Util.shuffle(MusicData.get(guild.id).queue);
	message.channel.send('Shuffled! 🔀')
}

export function move(guild: Guild, oldPosition: number, newPosition: number) {
	let queue = MusicData.get(guild.id).queue;
	let transferingSong = queue.splice(oldPosition - 1, 1)[0];
	queue.splice(newPosition - 1, 0, transferingSong);
}

export function seek(guild: Guild, startsec: number) {
	const guild_music = MusicData.get(guild.id);
	let currentSong = guild_music.nowplaying;
	console.log(startsec)
	guild_music.connection.dispatcher.destroy();
	const dispatcher = guild_music.connection.play(ytdl(currentSong.url, { filter: "audioonly", quality: "highestaudio", seek: startsec, opusEncoded: true }), { type: "opus" });
	dispatcher.setVolume(guild_music.volume / 100);
	dispatcher.on('finish', async () => {
		console.log('finished')
		if (guild_music.isLooping && guild_music.nowplaying != null) {
			guild_music.queue.unshift(guild_music.nowplaying);
			play(guild);
		}
		else if (guild_music.queue.length >= 1) play(guild); // Have next song
		else { // Doesn't have next song
			if (await DataManager.get(guild.id, 'settings.announceQueueEnd')) {
				currentSong.textChannel.send('Queue Ended.');
			}
			guild_music.leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
			guild_music.nowplaying = null;
		}
	})
	currentSong.getPlayedTime = () => {
		return (guild_music.connection.dispatcher.streamTime + startsec * 1000) / 1000;
	}
}

export async function search(field: string) {
	return await yts({ query: field, pageStart: 1, pageEnd: 3 });
}

export function getPlayedTime(guild: Guild) {
	return MusicData.get(guild.id).connection.dispatcher.streamTime;
}

export function getCurrentSong(guild: Guild) {
	return MusicData.get(guild.id).nowplaying;
}

export function getQueue(guild: Guild) {
	return MusicData.get(guild.id).queue;
}

export function getVolume(guild: Guild) {
	return MusicData.get(guild.id).volume;
}

export function removeSong(guild: Guild, index: number) {
	return MusicData.get(guild.id).queue.splice(index, 1)[0];
}

export function clearQueue(guild: Guild) {
	if (MusicData.get(guild.id)) MusicData.get(guild.id).queue = [];
}

export function isLooping(guild: Guild) {
	return MusicData.get(guild.id).isLooping;
}
