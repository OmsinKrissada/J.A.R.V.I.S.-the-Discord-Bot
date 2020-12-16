import { Command } from '../CommandManager';
import { Guild, GuildMember, GuildResolvable, MessageEmbed, Snowflake, TextChannel, Util, VoiceChannel, VoiceConnection } from 'discord.js';
import { Helper } from '../Helper';
import * as DataManager from '../DataManager';
import ytdl from 'discord-ytdl-core';
import yts from 'yt-search';
import { CONFIG } from '../ConfigManager';


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
	getPlayedTimeSec() {
		return MusicPlayerMap.get(this.requester.guild.id).getPlayedTime() / 1000;
	}
}

// class GuildMusicData {
// 	voiceChannelID = '';
// 	connection: VoiceConnection;
// 	nowplaying: Song;
// 	isLooping = false;
// 	queue: Array<Song> = [];
// 	volume: number = CONFIG.defaultVolume;
// 	leaveTimeout: NodeJS.Timeout;
// }
// const MusicData = new Map<GuildResolvable, GuildMusicData>();
const MusicPlayerMap = new Map<Snowflake, MusicPlayer>();

Command.bot.on('message', msg => {
	if (!MusicPlayerMap.has(msg.guild.id))
		MusicPlayerMap.set(msg.guild.id, new MusicPlayer(msg.guild));
})

class MusicPlayer {

	guild: Guild;

	voiceChannel: VoiceChannel;
	requestedChannel: TextChannel; // Text Channel
	connection: VoiceConnection;
	nowplaying: Song;
	isLooping = false;
	queue: Array<Song> = [];
	volume: number = CONFIG.defaultVolume;
	leaveTimeout: NodeJS.Timeout;

	constructor(guild: Guild) {
		this.guild = guild;
	}

	getTotalTime() {
		let totaltime = 0;
		this.queue.forEach(song => {
			totaltime += song.duration;
		});
		if (this.nowplaying) totaltime += this.nowplaying.duration - this.nowplaying.getPlayedTimeSec();
		return totaltime;
	}

	/**
	  * @returns Returns true if success, otherwise false.
	  */
	async addQueue(member: GuildMember, textField: string) {
		await this.join(member.voice.channel);
		if (textField == '') return true;
		let song = new Song();
		if (ytdl.validateURL(textField)) {
			// song.title = ytdl.getInfo;
			let info = await ytdl.getInfo(textField);
			song.title = info.videoDetails.title;
			song.url = textField;
			song.duration = Number(info.videoDetails.lengthSeconds);
			song.thumbnail = info.player_response.videoDetails.thumbnail.thumbnails[0].url;

		} else {
			const searchResult = await yts({ query: textField, pageStart: 1, pageEnd: 1 });
			const video = searchResult.videos[0];
			if (searchResult == null) return false;
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
			.setColor(Helper.green)
			.addField('Song Duration', `\`${Helper.prettyTime(song.getDuration())}\``, true)
			.addField('Position in Queue', `\`${this.nowplaying ? this.queue.length + 1 : 0}\``, true)
			.addField('Time Before Playing', `\`${Helper.prettyTime(this.getTotalTime())}\``, true)
			.setThumbnail(song.thumbnail)
		);
		if (song != null) {
			this.queue.push(song);
		} else {
			(<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID)).send('Null Error')
		}

		if (!this.nowplaying && this.queue.length >= 1) this.play();
		return true;
	}

	async join(voiceChannel: VoiceChannel) {

		this.connection = await voiceChannel.join();
		this.voiceChannel = voiceChannel;

		this.connection.on('disconnect', () => {
			this.pause();
			this.nowplaying = null;
			this.connection = null;
			this.isLooping = false;
		})
		// console.log(music_data)
	}

	leave() {
		this.connection.disconnect();
		if (this.requestedChannel)
			this.requestedChannel.send('👋 Successfully Disconnected!');
	}

	async play() {

		clearTimeout(this.leaveTimeout);

		if (this.connection && this.connection.dispatcher && this.connection.dispatcher.paused) {
			this.resume();
		}
		if (this.queue.length <= 0) return;

		let song = this.queue.shift();

		let requester = song.requester;
		if (!this.connection) {
			await this.join(requester.voice.channel);
		}

		const dispatcher = this.connection.play(ytdl(song.url, { filter: "audioonly", quality: "highestaudio", opusEncoded: true }), { type: "opus" })
		this.nowplaying = song;
		dispatcher.on('close', () => { console.log('closed') })
		dispatcher.on('unpipe', () => { console.log('unpiped') })
		dispatcher.on('finish', async () => {
			console.log('finished')
			if (this.isLooping && this.nowplaying != null) {
				this.queue.unshift(this.nowplaying);
				this.play();
			}
			else if (this.queue.length >= 1) this.play(); // Have next song
			else { // Doesn't have next song
				if ((await DataManager.get(this.guild.id)).settings.announceQueueEnd) {
					song.textChannel.send('Queue Ended.');
				}
				this.leaveTimeout = setTimeout(() => { this.leave(); }, 60000);
				this.nowplaying = null;
			}
		})
		dispatcher.setVolume(this.volume / 100);

		if ((await DataManager.get(this.guild.id)).settings.announceSong) {
			song.textChannel.send(new MessageEmbed()
				.setDescription(`🎧 Now playing ` + ` **[${song.title}](${song.url})** \`${Helper.prettyTime(song.getDuration())}\` ` + `[${song.requester.user}]`)
				.setColor(Helper.blue)
			)
		}
	}

	pause() {
		if (this.connection && this.connection.dispatcher) {
			this.connection.dispatcher.pause();
		}
	}

	resume() {
		if (this.connection && this.connection.dispatcher) {
			this.connection.dispatcher.resume();
		}
	}

	setVolume(volume: number) {
		if (this && this.connection && this.connection.dispatcher) this.connection.dispatcher.setVolume(volume / 100)
		this.volume = volume;
	}

	/**
	 * @returns Whether the operation is successful
	 */
	skip() {
		if (this.queue.length > 0) {
			this.play();
			return true;
		}
		else if (this.connection && this.connection.dispatcher) {
			this.connection.dispatcher.destroy();
			this.nowplaying = null;
			this.leaveTimeout = setTimeout(() => { this.leave(); }, 60000);
			return true;
		} else return false;
	}

	setLoop(value: boolean) {
		this.isLooping = value;
	}

	/** @returns Whether the song is looping after the action */
	toggleLoop() {
		this.isLooping = !this.isLooping;
		if (this.isLooping) return true;
		else return false;
	}

	shuffle() {
		this.queue = Helper.shuffle(this.queue);
	}

	move(oldPosition: number, newPosition: number) {
		let queue = this.queue;
		let transferingSong = queue.splice(oldPosition - 1, 1)[0];
		queue.splice(newPosition - 1, 0, transferingSong);
	}

	seek(startsec: number) {
		let currentSong = this.nowplaying;
		console.log(startsec)
		this.connection.dispatcher.destroy();
		const dispatcher = this.connection.play(ytdl(currentSong.url, { filter: "audioonly", quality: "highestaudio", seek: startsec, opusEncoded: true }), { type: "opus" });
		dispatcher.setVolume(this.volume / 100);
		dispatcher.on('finish', async () => {
			console.log('finished')
			if (this.isLooping && this.nowplaying != null) {
				this.queue.unshift(this.nowplaying);
				this.play();
			}
			else if (this.queue.length >= 1) this.play(); // Have next song
			else { // Doesn't have next song
				if ((await DataManager.get(this.guild.id)).settings.announceQueueEnd) {
					currentSong.textChannel.send('Queue Ended.');
				}
				this.leaveTimeout = setTimeout(() => { this.leave(); }, 60000);
				this.nowplaying = null;
			}
		})
		currentSong.getPlayedTimeSec = () => {
			return (this.connection.dispatcher.streamTime + startsec * 1000) / 1000;
		}
	}

	async search(field: string) {
		return await yts({ query: field, pageStart: 1, pageEnd: 3 });
	}

	getPlayedTime() {
		return this.connection.dispatcher.streamTime;
	}

	getCurrentSong() {
		return this.nowplaying;
	}

	getQueue() {
		return this.queue;
	}

	getVolume() {
		return this.volume;
	}

	removeSong(index: number) {
		return this.queue.splice(index, 1)[0];
	}

	clearQueue() {
		if (this) this.queue = [];
	}
}


// function getTotalTime(guild: Guild) {
// 	const music = MusicData.get(guild.id);
// 	let totaltime = 0;
// 	music.queue.forEach(song => {
// 		totaltime += song.duration;
// 	});
// 	if (music.nowplaying) totaltime += music.nowplaying.duration - music.nowplaying.getPlayedTime();
// 	return totaltime;
// }

// function constructData(guild_id: string) {
// 	if (!MusicData.has(guild_id)) {
// 		MusicData.set(guild_id, new GuildMusicData());
// 	}
// }

// async function join(voiceChannel: VoiceChannel) {
// 	let guild = voiceChannel.guild;

// 	MusicData.get(guild.id).connection = await voiceChannel.join();
// 	MusicData.get(guild.id).voiceChannelID = voiceChannel.id;

// 	MusicData.get(guild.id).connection.on('disconnect', () => {
// 		pause(guild);
// 		MusicData.get(guild.id).nowplaying = null;
// 		MusicData.get(guild.id).connection = null;
// 		MusicData.get(guild.id).isLooping = false;
// 	})
// 	// console.log(music_data)
// }

// function leave(guild: Guild, announceChannel?: TextChannel) {

// }



// async function play(guild: Guild) {
// 	const guild_music = MusicData.get(guild.id);

// 	clearTimeout(guild_music.leaveTimeout);

// 	if (guild_music.connection && guild_music.connection.dispatcher && guild_music.connection.dispatcher.paused) {
// 		resume(guild);
// 	}
// 	if (guild_music.queue.length <= 0) return;

// 	let song = guild_music.queue.shift();

// 	let requester = song.requester;
// 	if (!guild_music.connection) {
// 		await join(requester.voice.channel);
// 	}

// 	const dispatcher = guild_music.connection.play(ytdl(song.url, { filter: "audioonly", quality: "highestaudio", opusEncoded: true }), { type: "opus" })
// 	guild_music.nowplaying = song;
// 	dispatcher.on('close', () => { console.log('closed') })
// 	dispatcher.on('unpipe', () => { console.log('unpiped') })
// 	dispatcher.on('finish', async () => {
// 		console.log('finished')
// 		if (guild_music.isLooping && guild_music.nowplaying != null) {
// 			guild_music.queue.unshift(guild_music.nowplaying);
// 			play(guild);
// 		}
// 		else if (guild_music.queue.length >= 1) play(guild); // Have next song
// 		else { // Doesn't have next song
// 			if ((await DataManager.get(guild.id)).settings.announceQueueEnd) {
// 				song.textChannel.send('Queue Ended.');
// 			}
// 			guild_music.leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
// 			guild_music.nowplaying = null;
// 		}
// 	})
// 	dispatcher.setVolume(MusicData.get(requester.guild.id).volume / 100);

// 	if ((await DataManager.get(guild.id)).settings.announceSong) {
// 		song.textChannel.send(new MessageEmbed()
// 			.setDescription(`🎧 Now playing ` + ` **[${song.title}](${song.url})** \`${Helper.prettyTime(song.getDuration())}\` ` + `[${song.requester.user}]`)
// 			.setColor(Helper.blue)
// 		)
// 	}
// }

// /**
//  * @returns Returns true if success, otherwise false.
//  */
// async function addQueue(member: GuildMember, textField: string) {
// 	let guild_music = MusicData.get(member.guild.id);
// 	await join(member.voice.channel);
// 	if (textField == '') return true;
// 	let song = new Song();
// 	if (ytdl.validateURL(textField)) {
// 		// song.title = ytdl.getInfo;
// 		let info = await ytdl.getInfo(textField);
// 		song.title = info.videoDetails.title;
// 		song.url = textField;
// 		song.duration = Number(info.videoDetails.lengthSeconds);
// 		song.thumbnail = info.player_response.videoDetails.thumbnail.thumbnails[0].url;

// 	} else {
// 		const searchResult = await yts({ query: textField, pageStart: 1, pageEnd: 1 });
// 		const video = searchResult.videos[0];
// 		if (searchResult == null) return false;
// 		song.title = video.title;
// 		song.url = video.url;
// 		song.duration = video.duration.seconds;
// 		song.thumbnail = video.thumbnail;
// 	}
// 	song.requester = member;
// 	song.textChannel = (<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID));
// 	song.voiceChannel = member.voice.channel;

// 	(<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID)).send(new MessageEmbed()
// 		.setAuthor('Song Queued', member.user.displayAvatarURL())
// 		.setDescription('Queued ' + `**[${song.title}](${song.url})**` + '.\n')
// 		.setColor(Helper.green)
// 		.addField('Song Duration', `\`${Helper.prettyTime(song.getDuration())}\``, true)
// 		.addField('Position in Queue', `\`${guild_music.nowplaying ? guild_music.queue.length + 1 : 0}\``, true)
// 		.addField('Time Before Playing', `\`${Helper.prettyTime(getTotalTime(member.guild))}\``, true)
// 		.setThumbnail(song.thumbnail)
// 	);
// 	if (song != null) {
// 		MusicData.get(member.guild.id).queue.push(song);
// 	} else {
// 		(<TextChannel>member.guild.channels.resolve(member.lastMessageChannelID)).send('Null Error')
// 	}

// 	if (!MusicData.get(member.guild.id).nowplaying && MusicData.get(member.guild.id).queue.length >= 1) play(member.guild);
// 	return true;
// }

// function pause(guild: Guild) {
// 	if (MusicData.get(guild.id).connection && MusicData.get(guild.id).connection.dispatcher) {
// 		MusicData.get(guild.id).connection.dispatcher.pause();
// 	}
// }

// function resume(guild: Guild) {
// 	if (MusicData.get(guild.id).connection && MusicData.get(guild.id).connection.dispatcher) {
// 		MusicData.get(guild.id).connection.dispatcher.resume();
// 	}
// }

// function volume(guild: Guild, volume: number) {
// 	if (MusicData.get(guild.id) && MusicData.get(guild.id).connection && MusicData.get(guild.id).connection.dispatcher) MusicData.get(guild.id).connection.dispatcher.setVolume(volume / 100)
// 	MusicData.get(guild.id).volume = volume;
// }

// function skip(guild: Guild, respond_in: TextChannel) {
// 	if (MusicData.get(guild.id).queue.length > 0) {
// 		play(guild);
// 		respond_in.send('Skipped! ⏩')
// 	}
// 	else if (MusicData.get(guild.id).connection && MusicData.get(guild.id).connection.dispatcher) {
// 		const guild_music = MusicData.get(guild.id);
// 		guild_music.connection.dispatcher.destroy();
// 		guild_music.nowplaying = null;
// 		guild_music.leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
// 		respond_in.send('Skipped! ⏩')
// 	}
// }

// /** @returns Whether the song is looping after the action */
// function loop(guild: Guild) {
// 	MusicData.get(guild.id).isLooping = !MusicData.get(guild.id).isLooping;
// 	if (MusicData.get(guild.id).isLooping) return true;
// 	else return false;
// }

// function shuffle(guild: Guild) {
// 	MusicData.get(guild.id).queue = Helper.shuffle(MusicData.get(guild.id).queue);
// }

// function move(guild: Guild, oldPosition: number, newPosition: number) {
// 	let queue = MusicData.get(guild.id).queue;
// 	let transferingSong = queue.splice(oldPosition - 1, 1)[0];
// 	queue.splice(newPosition - 1, 0, transferingSong);
// }

// function seek(guild: Guild, startsec: number) {
// 	const guild_music = MusicData.get(guild.id);
// 	let currentSong = guild_music.nowplaying;
// 	console.log(startsec)
// 	guild_music.connection.dispatcher.destroy();
// 	const dispatcher = guild_music.connection.play(ytdl(currentSong.url, { filter: "audioonly", quality: "highestaudio", seek: startsec, opusEncoded: true }), { type: "opus" });
// 	dispatcher.setVolume(guild_music.volume / 100);
// 	dispatcher.on('finish', async () => {
// 		console.log('finished')
// 		if (guild_music.isLooping && guild_music.nowplaying != null) {
// 			guild_music.queue.unshift(guild_music.nowplaying);
// 			play(guild);
// 		}
// 		else if (guild_music.queue.length >= 1) play(guild); // Have next song
// 		else { // Doesn't have next song
// 			if ((await DataManager.get(guild.id)).settings.announceQueueEnd) {
// 				currentSong.textChannel.send('Queue Ended.');
// 			}
// 			guild_music.leaveTimeout = setTimeout(() => { leave(guild); }, 60000);
// 			guild_music.nowplaying = null;
// 		}
// 	})
// 	currentSong.getPlayedTime = () => {
// 		return (guild_music.connection.dispatcher.streamTime + startsec * 1000) / 1000;
// 	}
// }

// async function search(field: string) {
// 	return await yts({ query: field, pageStart: 1, pageEnd: 3 });
// }

// function getPlayedTime(guild: Guild) {
// 	return MusicData.get(guild.id).connection.dispatcher.streamTime;
// }

// function getCurrentSong(guild: Guild) {
// 	return MusicData.get(guild.id).nowplaying;
// }

// function getQueue(guild: Guild) {
// 	return MusicData.get(guild.id).queue;
// }

// function getVolume(guild: Guild) {
// 	return MusicData.get(guild.id).volume;
// }

// function removeSong(guild: Guild, index: number) {
// 	return MusicData.get(guild.id).queue.splice(index, 1)[0];
// }

// function clearQueue(guild: Guild) {
// 	if (MusicData.get(guild.id)) MusicData.get(guild.id).queue = [];
// }

// function isLooping(guild: Guild) {
// 	return MusicData.get(guild.id).isLooping;
// }



new Command({
	name: 'join',
	category: 'music',
	description: 'Joins the voice channel user is currently in',
	examples: ['join'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		if (args[0]) {
			const channel = message.guild.channels.resolve(args[0]);
			if (channel && channel.type == 'voice') {
				MusicPlayerMap.get(message.guild.id).join(<VoiceChannel>channel);
			}
			else {
				message.channel.send('Channel with ID ' + args[0] + ' is not a voice channel.')
			}
		}
		else {
			if (!message.member.voice.channel) {
				message.channel.send(new MessageEmbed()
					.setTitle('Error')
					.setDescription('**You must be in a voice channel** to use this command.')
					.setColor(Helper.red)
				);
				return;
			}
			MusicPlayerMap.get(message.guild.id).join(message.member.voice.channel)
		}
	}
})


new Command({
	name: 'play',
	category: 'music',
	description: '',
	examples: [],
	requiredCallerPermissions: [],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) { // Some part of code is from discord.js
		if (!message.member.voice.channel) {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription('**You must be in a voice channel** to use this command.')
				.setColor(Helper.red)
			);
			return;
		}
		if (!(await MusicPlayerMap.get(message.guild.id).addQueue(message.member, Helper.longarg(0, args)))) {
			message.channel.send('Sorry, we experienced difficulties finding your song. Try with other phrases.');
		}
	}
})

new Command({
	name: 'pause',
	category: 'music',
	description: 'Pauses song',
	examples: ['pause'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		MusicPlayerMap.get(message.guild.id).pause();
		message.channel.send('Paused! ⏸')
	}
})

new Command({
	name: 'resume',
	category: 'music',
	description: 'Resumes song',
	examples: ['resume'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		MusicPlayerMap.get(message.guild.id).resume();
		message.channel.send('Resumed! ▶')
	}
})

new Command({
	name: 'leave',
	category: 'music',
	description: 'Disconnects from voice channel',
	examples: ['leave'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const music = MusicPlayerMap.get(message.guild.id);
		if (music.connection) {
			MusicPlayerMap.get(message.guild.id).leave();
			message.channel.send('👋 Successfully Disconnected!');
		} else {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription('I am **NOT** in a voice channel.')
				.setColor(Helper.red)
			);
		}
	}
})


new Command({
	name: 'loop',
	category: 'music',
	description: 'Toggles songs looping',
	examples: [],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const isLooping = MusicPlayerMap.get(message.guild.id).toggleLoop();
		if (isLooping) {
			message.channel.send('Looping! 🔂');
		} else {
			message.channel.send('Stopped Looping! ➡');
		}
	}
})

new Command({
	name: 'shuffle',
	category: 'music',
	description: 'Shuffles current queue',
	examples: ['shuffle'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		MusicPlayerMap.get(message.guild.id).shuffle();
		message.channel.send('Shuffled! 🔀')
	}
})

new Command({
	name: 'nowplaying',
	category: 'music',
	description: 'Shows currently playing song',
	examples: ['nowplaying'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const current_song = MusicPlayerMap.get(message.guild.id).getCurrentSong();
		if (!current_song) {
			message.channel.send(new MessageEmbed()
				.setTitle('No Playing Song')
				.setColor(Helper.blue)
			);
			return;
		}

		const secondsPlayed = Math.floor(current_song.getPlayedTimeSec());
		message.channel.send(new MessageEmbed()
			.setTitle('🎧 Now Playing')
			// .setDescription(content)
			.setColor(Helper.blue)
			.setThumbnail(current_song.thumbnail)
			.addField('Song', `${current_song.title}`)
			.addField('Link', current_song.url)
			.addField('Duration', `${Helper.prettyTime(secondsPlayed)} / ${Helper.prettyTime(current_song.getDuration())}` + (MusicPlayerMap.get(message.guild.id).isLooping ? ' 🔂' : '') + `\n${Helper.progressBar(Math.round(secondsPlayed / current_song.getDuration() * 100), 45)}`)
			.addField('Text Channel', current_song.textChannel, true)
			.addField('Voice Channel', current_song.voiceChannel, true)
			.addField('Requester', `${current_song.requester}`, true)
		);
	}
})


new Command({
	name: 'skip',
	category: 'music',
	description: 'Skips current song',
	examples: ['skip'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const success = MusicPlayerMap.get(message.guild.id).skip();
		if (success)
			message.channel.send('Skipped! ⏩')
		else
			message.channel.send('Not able to skip')

	}
})

new Command({
	name: '',
	category: 'music',
	description: '',
	examples: [],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) { }
}) 