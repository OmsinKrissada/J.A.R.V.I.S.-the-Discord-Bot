import { Message, Guild, ChannelResolvable, VoiceConnection, VoiceChannel, GuildMember, GuildChannelResolvable, GuildMemberResolvable, TextChannel, Channel, MessageEmbed } from 'discord.js';
import * as ytdl from 'ytdl-core';
import { Youtube } from 'scrape-youtube';
import { bot } from './Main';
import { Util } from './Util';
import { message } from './Commando';

class Song {
	title: string;
	url: string;
	duration: number;
	requester: GuildMember;
	textChannel: TextChannel;
	voiceChannel: VoiceChannel;
}

class GuildMusicData {
	voiceChannelID = '';
	connection: VoiceConnection;
	nowplaying: Song;
	queue: Array<Song> = [];
	volume: 1;
}
var music_data: { [guild: string]: GuildMusicData } = {};

function getGuildData(guild_id: string) {
	return music_data[guild_id];
}

function constructData(guild_id: string) {
	if (!music_data.hasOwnProperty(guild_id)) {
		music_data[guild_id] = new GuildMusicData();
	}
}

export async function join(voiceChannel: VoiceChannel) {
	if (!getGuildData(voiceChannel.guild.id)) constructData(voiceChannel.guild.id);
	getGuildData(voiceChannel.guild.id).connection = await voiceChannel.join();
	getGuildData(voiceChannel.guild.id).voiceChannelID = voiceChannel.id;
	// console.log(music_data)
}

export function leave(guild: Guild) {
	if (!getGuildData(guild.id)) constructData(guild.id);
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

	if (!getGuildData(guild.id)) constructData(guild.id);
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
		song.textChannel.send('finished')
		getGuildData(guild.id).nowplaying = null;
		if (getGuildData(guild.id).queue.length >= 1) play(guild);
	})
	// dispatcher.setVolume(getGuildData(requester.guild.id).volume);

	song.textChannel.send(new MessageEmbed()
		.setDescription('Now playing ' + `**__[${song.title}](${song.url})__**` + ' requested by ' + `${song.requester.user}`)
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

// function run() {
// 	play(song, (<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID)))
// }

export function getQueue(guild: Guild) {
	if (!getGuildData(guild.id)) constructData(guild.id);
	return music_data[guild.id] ? music_data[guild.id].queue : [];
}

export async function addQueue(member: GuildMember, field: string) {
	if (!getGuildData(member.guild.id)) constructData(member.guild.id);
	await join(member.voice.channel);
	play(member.guild);
	if (field == '') return;

	let song = new Song();
	if (ytdl.validateURL(field)) {
		// song.title = ytdl.getInfo;
		let info = await ytdl.getInfo(field);
		song.title = info.title;
		song.url = field;
		song.duration = Number(info.length_seconds);

	} else {
		let youtube = new Youtube();
		let searchResult = await youtube.searchOne(field);
		song.title = searchResult.title;
		song.url = searchResult.link;
		song.duration = searchResult.duration;
	}
	song.requester = member;
	song.textChannel = (<TextChannel>member.lastMessage.channel);
	song.voiceChannel = member.voice.channel;

	member.lastMessage.channel.send(new MessageEmbed()
		.setTitle('Queue Added')
		.setDescription('Added ' + `**__[${song.title}](${song.url})__**` + ' to the queue.')
		.setColor(Util.blue)
	)

	if (!getGuildData(member.guild.id)) constructData(member.guild.id);
	getGuildData(member.guild.id).queue.push(song);

	if (!getGuildData(member.guild.id).nowplaying && getGuildData(member.guild.id).queue.length == 1) play(member.guild);
}

export function clearQueue(guild: Guild) {
	if (!getGuildData(guild.id)) constructData(guild.id);
	if (music_data[guild.id]) music_data[guild.id].queue = [];
}