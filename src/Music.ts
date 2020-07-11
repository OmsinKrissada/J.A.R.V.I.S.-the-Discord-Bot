import { Message, Guild, ChannelResolvable, VoiceConnection, VoiceChannel, GuildMember, GuildChannelResolvable, GuildMemberResolvable, TextChannel, Channel, MessageEmbed } from 'discord.js';
import * as ytdl from 'ytdl-core';
import { bot } from './Main';
import { Util } from './Util';
import { message } from './Commando';

class Song {
	title: string;
	url: string;
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
	console.log(music_data)
}

export async function leave(guild: Guild) {
	getGuildData(guild.id).nowplaying = null;
	getGuildData(guild.id).connection.dispatcher.pause();
	getGuildData(guild.id).connection.disconnect();
	getGuildData(guild.id).connection = null;
	console.log(music_data)
}

// export async function pause(guild:Guild) {
// 	getGuildData(guild.id).connection.dispatcher.pause()
// }

export async function play(guild: Guild) {

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
	console.log(song)
	console.log(getGuildData(requester.guild.id).connection.dispatcher.volumeDecibels)
	console.log(getGuildData(requester.guild.id).connection.dispatcher.volumeLogarithmic)
	console.log(dispatcher)
}

// function run() {
// 	play(song, (<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID)))
// }

export function getQueue(guild: Guild) {
	return music_data[guild.id] ? music_data[guild.id].queue : [];
}

export async function addQueue(member: GuildMember, field: string) {

	let song = new Song();
	if (ytdl.validateURL(field)) {
		// song.title = ytdl.getInfo;
		song.title = (await ytdl.getInfo(field)).title;
		song.url = field;
		song.requester = member;
		song.textChannel = (<TextChannel>member.lastMessage.channel);
		song.voiceChannel = member.voice.channel;
	} else {
		song.title = 'unknown';
		song.url = 'unknown';
		song.requester = member;
	}

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
	if (music_data[guild.id]) music_data[guild.id].queue = [];
}