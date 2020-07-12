import { Message, Guild, ChannelResolvable, VoiceConnection, VoiceChannel, GuildMember, GuildChannelResolvable, GuildMemberResolvable, TextChannel, Channel, MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import { Youtube } from 'scrape-youtube';
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
		return `${Util.min2(Math.floor(this.duration / 60))}:${Util.min2(this.duration % 60)}`;
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

// export async function pause(guild:Guild) {
// 	getGuildData(guild.id).connection.dispatcher.pause()
// }

export async function play(guild: Guild) {

	if (getGuildData(guild.id).connection && getGuildData(guild.id).connection.dispatcher && getGuildData(guild.id).connection.dispatcher.paused) {
		resume(guild)
		console.log('lol')
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
			leave(guild);
		}
	})
	dispatcher.setVolume(music_data[requester.guild.id].volume);

	song.textChannel.send(new MessageEmbed()
		.setDescription(`Now playing ` + ` **[${song.title}](${song.url})** \`${song.getDuration()}\` ` + `[${song.requester.user}]`)
		.setColor(Util.blue)
	)
	// console.log(song)
	console.log(getGuildData(requester.guild.id).connection.dispatcher.volumeDecibels)
	console.log(getGuildData(requester.guild.id).connection.dispatcher.volumeLogarithmic)
	// console.log(dispatcher)
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
	else leave(guild);
}

export function getPlayedTime(guild) {
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

export async function addQueue(member: GuildMember, field: string) {
	await join(member.voice.channel);
	if (field == '') return;
	let song = new Song();
	if (ytdl.validateURL(field)) {
		// song.title = ytdl.getInfo;
		let info = await ytdl.getInfo(field);
		song.title = info.title;
		song.url = field;
		song.duration = Number(info.length_seconds);
		song.thumbnail = info.thumbnail_url;

	} else {
		let youtube = new Youtube();
		let searchResult = await youtube.searchOne(field);
		console.log(searchResult)
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
	song.textChannel = (<TextChannel>member.lastMessage.channel);
	song.voiceChannel = member.voice.channel;

	member.lastMessage.channel.send(new MessageEmbed()
		.setAuthor('Song Queued', member.user.displayAvatarURL())
		.setDescription('Added ' + `**[${song.title}](${song.url})** \`${song.getDuration()}\`` + ' to the queue.')
		.setColor(Util.blue)
		.setThumbnail(song.thumbnail)
	)

	if (!getGuildData(member.guild.id)) constructData(member.guild.id);
	getGuildData(member.guild.id).queue.push(song);

	if (!getGuildData(member.guild.id).nowplaying && getGuildData(member.guild.id).queue.length >= 1) play(member.guild);
}

export function removeSong(guild: Guild, index: number) {
	return music_data[guild.id].queue.splice(index, 1)[0];
}

export function clearQueue(guild: Guild) {
	if (!getGuildData(guild.id)) constructData(guild.id);
	if (music_data[guild.id]) music_data[guild.id].queue = [];
}
