import { Message, Guild, ChannelResolvable, VoiceConnection, VoiceChannel, GuildMember, GuildChannelResolvable, GuildMemberResolvable, TextChannel, Channel, MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import youtube, { Youtube } from 'scrape-youtube';
import { bot } from './Main';
import { Util } from './Util';
import { message } from './Commando';

class Song {
	title: string;
	url: string;
	thumbnail: string;
	duration: number;
	requester: GuildMember;
	textChannel: TextChannel;
	voiceChannel: VoiceChannel;
	getDuration() {
		return `${prettyTime(this.duration)}`;
	}
	getPlayedTime(guild: Guild) {
		return getPlayedTime(guild);
	}
}

class GuildMusicData {
	voiceChannelID = '';
	connection: VoiceConnection;
	nowplaying: Song;
	queue: Array<Song> = [];
	volume: number = 0.05;
}
var music_data: { [guild: string]: GuildMusicData } = {};

function prettyTime(seconds: number) {
	return `${Util.min2(Math.floor(seconds / 60))}:${Util.min2(seconds % 60)}`
}

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
		message.channel.send('i am not in a voice channel');
		return;
	}
	pause(guild);
	getGuildData(guild.id).nowplaying = null;
	getGuildData(guild.id).connection.disconnect();
	getGuildData(guild.id).connection = null;
}


let leaveTimeout: NodeJS.Timeout;

export async function play(guild: Guild) {

	if (getGuildData(guild.id).connection && getGuildData(guild.id).connection.dispatcher && getGuildData(guild.id).connection.dispatcher.paused) {
		resume(guild)
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
		getGuildData(guild.id).nowplaying = null;
		if (getGuildData(guild.id).queue.length >= 1) play(guild);
		else {
			song.textChannel.send('Queue Ended.');
			leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
		}
	})
	dispatcher.setVolume(music_data[requester.guild.id].volume);

	song.textChannel.send(new MessageEmbed()
		.setDescription(`🎧 Now playing ` + ` **[${song.title}](${song.url})** \`${song.getDuration()}\` ` + `[${song.requester.user}]`)
		.setColor(Util.blue)
	)
}

export async function addQueue(member: GuildMember, field: string) {
	clearTimeout(leaveTimeout);
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
	if (music.nowplaying) totaltime += music.nowplaying.duration;

	(<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID)).send(new MessageEmbed()
		.setAuthor('Song Queued', member.user.displayAvatarURL())
		.setDescription('Added ' + `**[${song.title}](${song.url})** \`${song.getDuration()}\`` + ' to the queue.\n')
		.setColor(Util.green)
		.addField('Position:', '`' + (music.nowplaying ? music.queue.length + 1 : 0) + '` songs until playing.', true)
		.addField('Time before playing:', prettyTime(totaltime), true)
		.setThumbnail(song.thumbnail)
	);

	if (!getGuildData(member.guild.id)) constructData(member.guild.id);
	getGuildData(member.guild.id).queue.push(song);

	if (!getGuildData(member.guild.id).nowplaying && getGuildData(member.guild.id).queue.length >= 1) play(member.guild);
}

export function pause(guild: Guild) {
	if (getGuildData(guild.id).connection.dispatcher) music_data[guild.id].connection.dispatcher.pause();
}

export function resume(guild: Guild) {
	music_data[guild.id].connection.dispatcher.resume();
}

export function volume(guild: Guild, volume: number) {
	if (music_data[guild.id] && music_data[guild.id].connection && music_data[guild.id].connection.dispatcher) music_data[guild.id].connection.dispatcher.setVolume(volume)
	music_data[guild.id].volume = volume;
}

export function skip(guild: Guild) {
	if (music_data[guild.id].queue.length > 0) play(guild);
	else {
		music_data[guild.id].connection.dispatcher.destroy();
		music_data[guild.id].nowplaying = null;
	}
	leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
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
