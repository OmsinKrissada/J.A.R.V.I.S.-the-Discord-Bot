import { Command } from '../CommandManager';
import { DMChannel, Guild, GuildMember, MessageEmbed, Snowflake, StreamDispatcher, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
import { Helper } from '../Helper';
import axios, { AxiosResponse } from 'axios';
import moment from 'moment';

import DataManager from '../DataManager';
import ytdl from 'discord-ytdl-core';
import yts from 'yt-search';
import CONFIG from '../ConfigManager';



class Song {
	readonly title: string;
	readonly url: string;
	readonly thumbnail: string;
	readonly duration: moment.Duration;
	readonly requester: GuildMember;
	readonly textChannel: TextChannel;
	readonly voiceChannel: VoiceChannel;

	constructor(obj: { title: string, url: string, thumbnail: string, duration: moment.Duration, requester: GuildMember, textChannel: TextChannel, voiceChannel: VoiceChannel }) {
		this.title = obj.title;
		this.url = obj.url;
		this.thumbnail = obj.thumbnail;
		this.duration = obj.duration;
		this.requester = obj.requester;
		this.textChannel = obj.textChannel;
		this.voiceChannel = obj.voiceChannel;
	}

	getDuration() {
		return this.duration;
	}

	/**
	 * @returns Time played through the song
	 */
	getPlayedTime() { // Why don't I add this to MusicPlayer??? Ans: When you use !seek, it will need to change the played time so it needs to be song-specific (see this.seek() for detail)
		return moment.duration(MusicPlayerMap.get(this.requester.guild.id)!.getPlayedTime(), 'milliseconds');
	}
}


class Playlist {
	readonly title: string;
	readonly url: string;
	readonly thumbnail: string;
	readonly songs: Song[];
	constructor(title: string, url: string, thumbnail: string, songs: Song[]) {
		this.title = title;
		this.url = url;
		this.thumbnail = thumbnail;
		this.songs = songs;
	}
}

const MusicPlayerMap = new Map<Snowflake, MusicPlayer>();


class MusicPlayer {

	readonly guild: Guild;

	voiceChannel: VoiceChannel;
	respondChannel: TextChannel; // Text Channel
	connection: VoiceConnection | undefined;
	dispatcher: StreamDispatcher;
	private currentSong: Song | undefined;
	private previousSong: Song | undefined;
	private isLooping = false;
	private queue: Array<Song> = [];
	private volume: number = CONFIG.defaultVolume;
	private leaveTimeout: NodeJS.Timeout;

	constructor(guild: Guild) {
		this.guild = guild;
	}

	/**
	 * @returns Total duration of all songs in the queue.
	 */
	getTotalTime() {
		let totaltime = 0;
		this.queue.forEach(song => {
			totaltime += song.duration.asSeconds();
		});
		if (this.currentSong) totaltime += this.currentSong.duration.subtract(this.currentSong.getPlayedTime()).asSeconds();
		return moment.duration(totaltime, 'seconds');
	}

	private getYtdlVideoInfo(query: string) {

	}

	async findSongYoutube(query: string, { member, voiceChan, textChan }: { member: GuildMember, voiceChan: VoiceChannel, textChan: TextChannel }): Promise<Song | Playlist | undefined> {
		let songObj: { requester: GuildMember, textChannel: TextChannel, voiceChannel: VoiceChannel, title: string, url: string, duration: moment.Duration, thumbnail: string } = {
			requester: member,
			textChannel: textChan,
			voiceChannel: voiceChan,
			title: '', url: '', duration: moment.duration(0), thumbnail: ''
		};

		if (query.includes("list=")) {
			const listID = query.split(/&|\?/g).filter(arg => arg.startsWith('list='))[0].slice(5);

			let nextPage = undefined;
			const songs: Song[] = [];
			const waitmsg = textChan.send('Getting videos, please wait . . .');
			do {
				const songsstr: string[] = [];
				let paramObj: any = {
					key: CONFIG.token.youtube,
					part: 'contentDetails',
					playlistId: listID,
					fields: 'nextPageToken,prevPageToken,items/contentDetails/videoId',
					maxResults: 50,
				};
				if (nextPage) paramObj.pageToken = nextPage;
				let playlistItemRes: AxiosResponse;
				try {
					playlistItemRes = (await axios({
						method: 'GET',
						url: 'https://www.googleapis.com/youtube/v3/playlistItems/',
						params: paramObj
					}));
				} catch (err) {
					if ((await waitmsg).deletable) (await waitmsg).delete();
					return undefined;
				}
				const playlistdata = playlistItemRes.data;
				for (const song of playlistdata.items) {
					songsstr.push(song.contentDetails.videoId)
				}
				const videosRes = await axios({
					method: "GET",
					url: 'https://www.googleapis.com/youtube/v3/videos/',
					params: {
						key: CONFIG.token.youtube,
						part: 'contentDetails,snippet',
						id: songsstr.join(','),
						fields: 'items/id,items/contentDetails/duration,items/snippet/thumbnails/default,items/snippet/title'
					}
				})

				for (const vid of videosRes.data.items) {
					songs.push(new Song({
						title: vid.snippet.title,
						duration: moment.duration(vid.contentDetails.duration),
						thumbnail: vid.snippet.thumbnails.default.url,
						url: `https://youtube.com/watch?v=${vid.id}`,
						requester: member,
						textChannel: textChan,
						voiceChannel: voiceChan,
					}))
					nextPage = playlistdata.nextPageToken;
				}
			} while (nextPage);

			const playlistInfo = (await axios.get(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${listID}&key=${CONFIG.token.youtube}`)).data.items[0].snippet;

			// console.log(songs)
			if ((await waitmsg).deletable) (await waitmsg).delete();
			return new Playlist(playlistInfo.title, `https://youtube.com/playlist?list=${listID}`, playlistInfo.thumbnails.default.url, songs);

			// if (next) {
			// }
		}

		if (ytdl.validateURL(query)) {
			const info = await ytdl.getInfo(query);
			songObj.title = info.videoDetails.title;
			songObj.url = query;
			songObj.duration = moment.duration(info.videoDetails.lengthSeconds, 'seconds');
			songObj.thumbnail = info.player_response.videoDetails.thumbnail.thumbnails[0].url;
		} else {
			const searchResult = await yts({ query: query, pageStart: 1, pageEnd: 1 });
			const video = searchResult.videos[0];
			if (searchResult == null) return undefined;
			songObj.title = video.title;
			songObj.url = video.url;
			songObj.duration = moment.duration(video.duration.seconds, 'seconds');
			songObj.thumbnail = video.thumbnail;
		}
		let song = new Song(songObj);
		return song;
	}

	// findSongSpotify(query: string): Song[] {

	// }

	/**
	  * @returns Returns true if success, otherwise returns false.
	  */
	async appendQueue(member: GuildMember, musicChannel: VoiceChannel, referTextChannel: TextChannel, query: string) {
		if (this.connection) {
			if (this.voiceChannel.id != musicChannel.id)
				referTextChannel.send(new MessageEmbed({
					title: 'Warning',
					description: "I'm in a different voice channel. You won't be able to enjoy your music unless you join the one I'm currently in.",
					color: Helper.YELLOW
				}));
		} else {
			await this.connect(referTextChannel, musicChannel);
		}
		if (query == '') return true;


		let result: Song | Playlist | undefined;
		if (query.match(/https?:\/\/open.spotify.com\/(\w+)\/\w+/gi)) { // If matches Spotify URL format
			referTextChannel.send('Spotify support coming soon.')
			// result=bla bla bla
		} else {
			result = await this.findSongYoutube(query, { member: member, voiceChan: musicChannel, textChan: referTextChannel });
		}

		if (result instanceof Song) {
			const song = result;
			referTextChannel.send(new MessageEmbed()
				.setAuthor('Song Queued', member.user.displayAvatarURL())
				.setDescription('Queued ' + `**[${song.title}](${song.url})**` + '.\n')
				.setColor(Helper.GREEN)
				.addField('Song Duration', `\`${Helper.prettyTime(song.getDuration())}\``, true)
				.addField('Position in Queue', `\`${this.currentSong ? this.queue.length + 1 : 0}\``, true)
				.addField('Time Before Playing', `\`${Helper.prettyTime(this.getTotalTime().asSeconds())}\``, true)
				.setThumbnail(song.thumbnail)
			);
			this.queue.push(song);
		} else if (result instanceof Playlist) {
			const playlist = result;
			let totalDuration = 0;
			playlist.songs.forEach(song => totalDuration += song.getDuration().asSeconds());
			referTextChannel.send(new MessageEmbed()
				.setAuthor('Playlist Queued', member.user.displayAvatarURL())
				.setDescription(`Queued ${playlist.songs.length} songs from playlist **[${playlist.title}](${playlist.url})**.\n`)
				.setColor(Helper.GREEN)
				.addField('Playlist Duration', `\`${Helper.prettyTime(totalDuration)}\``, true)
				.addField('Position in Queue', `\`${this.currentSong ? this.queue.length + 1 : 0}\` to \`${this.currentSong ? this.queue.length + playlist.songs.length : playlist.songs.length - 1}\``, true)
				.addField('Time Before Playing', `\`${Helper.prettyTime(this.getTotalTime().asSeconds())}\``, true)
				.setThumbnail(playlist.thumbnail)
			);
			this.queue = this.queue.concat(playlist.songs);

		} else if (!result) {
			referTextChannel.send(new MessageEmbed({
				title: "No Songs Found",
				description: "Sorry, we experienced difficulties finding your song. Try again with other phrases.",
				color: Helper.RED
			}));
			return;
		}

		if (!this.currentSong && this.queue.length > 0) this.playNext();
		return true;
	}

	/**
	 * Returns whether the operation is success.
	 */
	async connect(textChannel: TextChannel, voiceChannel: VoiceChannel) {

		this.connection = await voiceChannel.join();
		if (!this.connection) return false;
		this.voiceChannel = voiceChannel;
		this.respondChannel = textChannel;

		this.connection.on('disconnect', () => { // on user force disconnect
			this.pause();
			this.connection = undefined;
			this.disconnect();
		})

		return true;
		// console.log(music_data)
	}

	/**
	 * Returns whether the operation is success.
	 */
	disconnect() {
		this.currentSong = undefined;
		this.isLooping = false;
		if (this.connection) {
			this.connection.disconnect();
			this.connection = undefined;
			this.queue = [];
			return true;
		} else return false;
	}

	configDispatcher(dispatcher: StreamDispatcher) {
		this.dispatcher = dispatcher
		dispatcher.on('unpipe', () => {
			// console.log('unpiped')
			this.leaveTimeout = setTimeout(() => { this.disconnect(); }, 60000);
			this.previousSong = this.currentSong;
			this.currentSong = undefined;
		});
		// dispatcher.on('unpipe', () => { console.log('unpiped') });
		dispatcher.on('finish', async () => {
			// console.log('finished')
			if (this.isLooping && this.previousSong) {
				this.play(this.previousSong);
			}
			else if (this.queue.length >= 1) this.playNext(); // Have next song
			else { // Doesn't have next song
				if ((await DataManager.get(this.guild.id)).settings.announceQueueEnd) {
					this.respondChannel.send('Queue Ended.');
				}
			}
		})
		dispatcher.setVolume(this.volume / 100);
	}

	async play(song: Song) {
		const play = async (song: Song) => {
			clearTimeout(this.leaveTimeout);

			if (!this.connection) {
				if (!await this.connect(song.textChannel, song.voiceChannel)) {
					this.respondChannel.send('Not able to connect, please contact Omsin for debugging.');
					return;
				}
			}

			// play song
			const dispatcher = this.connection!.play(ytdl(song.url, { filter: "audioonly", quality: "highestaudio", opusEncoded: true }), { type: "opus" });
			this.configDispatcher(dispatcher);
			this.currentSong = song;
			// console.log('set new song -> ' + (this.currentSong ? 'exist' : 'undefined'))


			if ((await DataManager.get(this.guild.id)).settings.announceSong) {
				song.textChannel.send(new MessageEmbed()
					.setDescription(`🎧 Now playing ` + ` **[${song.title}](${song.url})** \`${Helper.prettyTime(song.getDuration())}\` ` + `[${song.requester.user}]`)
					.setColor(Helper.BLUE)
				)
			}
		}
		if (this.connection && this.connection.dispatcher) {
			this.connection!.dispatcher.on('unpipe', _ => play(song))
			this.connection!.dispatcher.destroy();
		} else play(song);
	}

	async playNext() {
		if (this.connection && this.connection.dispatcher && this.connection.dispatcher.paused) { // first resume
			this.resume();
		}

		let song = this.queue.shift(); // extract next song
		if (!song) return;
		this.play(song);

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

	skip() {
		if (this.queue.length > 0) {
			this.playNext();
		} else if (this.connection && this.connection.dispatcher) {
			this.connection.dispatcher.destroy();
			this.respondChannel.send('Skipped! ⏩')
		} else {
			this.respondChannel.send('No song to skip to');
		}
	}

	setLooping(value: boolean) {
		this.isLooping = value;
	}

	getLooping() {
		return this.isLooping;
	}

	/** @returns Whether the song is looping after the action */
	toggleLooping() {
		this.isLooping = !this.isLooping;
		return this.isLooping;
	}

	shuffle() {
		this.queue = Helper.shuffle(this.queue);
	}

	move(oldPosition: number, newPosition: number) {
		let queue = this.queue;
		let transferingSong = queue.splice(oldPosition - 1, 1)[0];
		queue.splice(newPosition - 1, 0, transferingSong);
	}

	seek(startsec: number, responseChannel: TextChannel) {

		// console.log(startsec)
		if (!this.currentSong) {
			this.respondChannel.send("I'm not playing any song.");
			return;
		}
		if (!this.connection) {
			this.respondChannel.send('An unknown error occured, please contact Omsin for debug.');
			return;
		}
		const thissongiamplaying = new Song(this.currentSong);
		this.connection.dispatcher.on('unpipe', _ => seek(startsec))
		this.connection.dispatcher.destroy();
		const seek = async (startsec: number) => {
			clearTimeout(this.leaveTimeout);
			this.currentSong = thissongiamplaying;
			const dispatcher = this.connection!.play(ytdl(this.currentSong.url, { filter: "audioonly", quality: "highestaudio", seek: startsec, opusEncoded: true }), { type: "opus" });
			this.configDispatcher(dispatcher);
			this.currentSong = thissongiamplaying;
			this.currentSong.getPlayedTime = () => {
				return moment.duration(this.connection!.dispatcher.streamTime + startsec * 1000, 'milliseconds');
			}
			if (!this.currentSong) return;
			const secondsPlayed = Math.floor(this.currentSong.getPlayedTime().asSeconds());
			responseChannel.send(new MessageEmbed()
				.setTitle('Seeked!')
				.setDescription(`${Helper.prettyTime(secondsPlayed)} / ${Helper.prettyTime(this.currentSong.getDuration())}\n${Helper.progressBar(Math.round(secondsPlayed / this.currentSong.getDuration().asSeconds() * 100), 45)}`)
				.setColor(Helper.GREEN)
			)
		}
	}

	async search(field: string) {
		return await yts({ query: field, pageStart: 1, pageEnd: 3 });
	}

	getPlayedTime() {
		return this.connection ? this.dispatcher.streamTime : -1;
	}

	getCurrentSong() {
		return this.currentSong;
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

	removeSongRange(from: number, end: number) {
		this.queue.splice(from, end - from + 1);
	}

	clearQueue() {
		if (this) this.queue = [];
	}
}


Command.bot.on('message', msg => {
	if (msg.channel instanceof DMChannel) return;
	if (!MusicPlayerMap.has(msg.guild!.id))
		MusicPlayerMap.set(msg.guild!.id, new MusicPlayer(msg.guild!));
})



new Command({
	name: 'join',
	category: 'music',
	description: 'Joins the voice channel user is currently in',
	examples: ['join'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		if (args[0]) {
			const channel = message.guild!.channels.resolve(args[0]);
			if (channel && channel.type == 'voice') {
				player.connect(<TextChannel>message.channel, <VoiceChannel>channel);
			}
			else {
				message.channel.send('Channel with ID ' + args[0] + ' is not a voice channel.')
			}
		}
		else {
			if (!message.member!.voice.channel) {
				message.channel.send(new MessageEmbed()
					.setTitle('Error')
					.setDescription('**You must be in a voice channel** to use this command.')
					.setColor(Helper.RED)
				);
				return;
			}
			player.connect(<TextChannel>message.channel, message.member!.voice.channel)
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
		if (!message.member!.voice.channel) {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription('**You must be in a voice channel** to use this command.')
				.setColor(Helper.RED)
			);
			return;
		}
		await MusicPlayerMap.get(message.guild!.id)!.appendQueue(message.member!, message.member!.voice.channel, <TextChannel>message.channel, Helper.longarg(0, args));
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
		MusicPlayerMap.get(message.guild!.id)!.pause();
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
		MusicPlayerMap.get(message.guild!.id)!.resume();
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
		const player = MusicPlayerMap.get(message.guild!.id)!;
		if (player.disconnect()) {
			message.channel.send('👋 Successfully Disconnected!');
		} else {
			message.channel.send(new MessageEmbed()
				.setTitle('Error')
				.setDescription('I am **NOT** in a voice channel.')
				.setColor(Helper.RED)
			);
		}
	}
})


new Command({
	name: 'loop',
	category: 'music',
	description: 'Toggles or sets song looping',
	examples: ['loop', 'loop <on/off>'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		if (!player.connection) {
			message.channel.send(new MessageEmbed({
				title: "I'm not in a voice channel.",
				color: Helper.RED
			}))
			return;
		}
		if (args[0]) {
			if (args[0].toLowerCase() == 'on') {
				player.setLooping(true);
				message.channel.send('🔂 Looping Enabled!');
			} else if (args[0].toLowerCase() == 'off') {
				player.setLooping(false);
				message.channel.send('✋ Looping Disabled!');
			} else {
				message.channel.send(`❌ Invalid value ${Helper.inlineCodeBlock(args[0])}`)
			}
		} else {
			const isLooping = player.toggleLooping();
			if (isLooping) {
				message.channel.send('🔂 Looping Enabled!');
			} else {
				message.channel.send('✋ Looping Disabled!');
			}
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
		MusicPlayerMap.get(message.guild!.id)!.shuffle();
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
		const player = MusicPlayerMap.get(message.guild!.id)!;
		const current_song = player.getCurrentSong();
		if (!current_song) {
			message.channel.send(new MessageEmbed()
				.setTitle('No Playing Song')
				.setColor(Helper.BLUE)
			);
			return;
		}

		const secondsPlayed = Math.floor(current_song.getPlayedTime().asSeconds());
		message.channel.send(new MessageEmbed()
			.setTitle('🎧 Now Playing')
			// .setDescription(content)
			.setColor(Helper.BLUE)
			.setThumbnail(current_song.thumbnail)
			.addField('Song', `${current_song.title}`)
			.addField('Link', current_song.url)
			.addField('Duration', `${Helper.prettyTime(secondsPlayed)} / ${Helper.prettyTime(current_song.getDuration())}` + (player.getLooping() ? ' 🔂' : '') + `\n${Helper.progressBar(Math.round(secondsPlayed / current_song.getDuration().asSeconds() * 100), 45)}`)
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
		const player = MusicPlayerMap.get(message.guild!.id)!;
		if (player.connection) {
			player.skip();
		}
		else
			message.channel.send("I'm not in a voice channel")
	}
})

new Command({
	name: 'volume',
	category: 'music',
	description: 'Adjusts music volume',
	examples: ['volume <new volume(0-100)>'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		// try {
		if (args[0]) {
			let volume = isNaN(Number(args[0])) ? -1 : Number(args[0]);
			if (0 > volume || volume > 100) {
				message.channel.send(new MessageEmbed()
					.setTitle('Invalid Argument')
					.setDescription('The number must fall in the range of 0 to 100.')
					.setColor(Helper.RED)
				);
				return;
			}
			let oldVolume = player.getVolume();
			if (oldVolume == volume) {
				message.channel.send(new MessageEmbed()
					.setTitle('Volume Unchanged')
					.setDescription(`Volume has not changed since it's already at \`${args[0]}%\``)
					.setColor(Helper.BLUE)
				);
				return;
			}
			player.setVolume(volume);

			// } catch (err) {
			// 	console.log('error occured while changing the volume')
			// }
			message.channel.send(new MessageEmbed()
				.setTitle('Volume Adjusted ' + (oldVolume < volume ? '🔺' : '🔻'))
				.setDescription(`Volume has been ` + (oldVolume < volume ? 'increased' : 'decreased') + ` to \`${args[0]}%\`.\n\n**${Helper.progressBar(volume, 31)}**`)
				.setColor(Helper.GREEN)
			);
		}
		else {
			let volume = player.getVolume();
			message.channel.send(new MessageEmbed()
				.setTitle('Current Volume')
				.setDescription(`The volume is at \`${volume}%\`\n\n**${Helper.progressBar(volume, 31)}**`)
				.setColor(Helper.BLUE)
			);
		}
	}
})

new Command({
	name: 'queue',
	category: 'music',
	description: 'Shows current music queue',
	examples: ['queue'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!
		let content: string[] = [];
		let i = 0;
		player.getQueue().forEach(song => {
			i++;
			content.push(`${Helper.inlineCodeBlock(String(i))} - \`${Helper.prettyTime(song.getDuration())}\` __[${song.title}](${song.url})__ [${song.requester}]\n`);
		})

		let embed = new MessageEmbed()
			.setTitle('Song Queue 🎶')
			.setColor(Helper.BLUE);

		let currentSong = player.getCurrentSong();
		if (currentSong) {
			let secondsPlayed = Math.floor(currentSong.getPlayedTime().asSeconds()); // currentSong.getPlayedTime()
			embed.addField('​\n🎧 Now Playing', `**​[${currentSong.title}](${currentSong.url})** \n${Helper.progressBar(Math.round(secondsPlayed / currentSong.getDuration().asSeconds() * 100))}`)
				.addField('Total Time', `\`${Helper.prettyTime(player.getTotalTime().asSeconds())}\` (about ${moment.duration(player.getTotalTime(), 'seconds').humanize()})`, true)
				.addField('Loop Mode', player.getLooping() ? '🔂 Current Song' : '❌ None\n​', true);
		}
		Helper.sendEmbedPage(<TextChannel>message.channel, embed, '🔺 Upcoming\n', (content.length != 0 ? content : ['Empty Queue']))
	}
})

new Command({
	name: 'remove',
	category: 'music',
	description: 'Removes a song from music queue',
	examples: ['remove <song position>'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		if (Number(args[0]) - 1 < 0) {
			message.channel.send(new MessageEmbed()
				.setTitle('Song Not Found')
				.setDescription('Please do not use negative numbers.')
				.setColor(Helper.RED)
			);
			return;
		}
		const player = MusicPlayerMap.get(sourceID)!;
		let song = player.removeSong(Number(args[0]) - 1);
		if (!song) {
			message.channel.send(new MessageEmbed()
				.setTitle('Song Not Found')
				.setDescription('Please use any number displayed in ' + Helper.inlineCodeBlock(prefix + 'queue') + '.')
				.setColor(Helper.RED)
			);
			return;
		}
		message.channel.send(new MessageEmbed()
			.setAuthor('🗑️ Song Removed')
			.setDescription(`Removed [${song.title}](${song.url}) [${song.requester}]`)
			.setColor(Helper.GREEN)
		);

	}
})

new Command({
	name: 'clear',
	category: 'music',
	description: 'Removes all songs from music queue',
	examples: ['clear'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		MusicPlayerMap.get(message.guild!.id)!.clearQueue();
		message.channel.send(new MessageEmbed()
			.setTitle('Queue Cleared')
			.setDescription('Music queue for this server has been reset.')
			.setColor(Helper.GREEN)
		);
	}
})

new Command({
	name: 'rmrange',
	category: 'music',
	description: 'Removes songs in specified range from music queue',
	examples: ['rmrange <from> <to>'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const from = Number(args[0]);
		const to = Number(args[1]);
		const player = MusicPlayerMap.get(message.guild!.id)!;
		if (!(args[0] && args[1]) || isNaN(from) || isNaN(to)) {
			message.channel.send(new MessageEmbed({
				title: "Usage",
				description: 'rmrange <from (number)> <to (number)>',
				color: Helper.RED,
			}));
		} else if (from > to) {
			message.channel.send(new MessageEmbed({
				title: "Invalid Range",
				description: 'Position must be from lower to higher',
				color: Helper.RED,
			}));
		} else if (from - 1 < 0 || to - 1 < 0 || from > player.getQueue().length || to > player.getQueue().length) {
			message.channel.send(new MessageEmbed({
				title: 'Song Not Found',
				description: `Please use positions that exist in ${prefix}queue`,
				color: Helper.RED,
			})
			);
			return;
		} else {
			player.removeSongRange(from - 1, to - 1);
			message.channel.send(new MessageEmbed({
				title: 'Songs Removed',
				description: `${to - from + 1} songs have been removed from the queue.`,
				color: Helper.GREEN,
			})
			);
		}
	}
})




new Command({
	name: 'seek',
	category: 'music',
	description: 'Seeks to a specific second in the song',
	examples: ['seek <target second>'],
	requiredCallerPermissions: [],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!
		if (!player.connection) {
			message.channel.send(new MessageEmbed({
				title: 'No Playing Song',
				description: 'I am not playing any song at the moment.',
				color: Helper.RED
			}))
		}
		player.seek(<any>args[0], <TextChannel>message.channel);

	}
}) 