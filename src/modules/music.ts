import { Command } from "../CommandManager";
import { DMChannel, Guild, GuildMember, MessageEmbed, MessageReaction, Snowflake, StreamDispatcher, TextChannel, User, VoiceChannel, VoiceConnection } from "discord.js";
import { BLUE, confirm_type, GREEN, inlineCodeBlock, longarg, digitDurationString, progressBar, RED, sendEmbedPage, shuffle, YELLOW, ZERO_WIDTH } from "../Helper";
import axios, { AxiosResponse } from "axios";
import moment from "moment";
import { Shoukaku, Player, Connectors, Node, TrackResult, Track } from "shoukaku";
// import erela from 'erela.js'

import yts from "yt-search";
import CONFIG from "../ConfigManager";
import * as CommandManager from "../CommandManager";
import { getTrackSearchString } from "../Spotify";

import os from "os-utils";
import { bot, gracefulExit } from "../Main";
import { logger } from "../Logger";
import chalk from "chalk";
import { getGuildSettings, prisma } from "../DBManager";
import { intlFormat } from "date-fns";

if (CONFIG.maxCPUPercent > 0) {
	setInterval(
		() =>
			os.cpuUsage((percent) => {
				if (percent * 100 > CONFIG.maxCPUPercent) {
					MusicPlayerMap.forEach((player) => {
						if (player.getCurrentSong()) {
							player.pause();
							logger.debug("Paused songs due to high CPU usage.");
							player.respondChannel.send("Your song has been paused due to high CPU activity. Please try again in a moment.\nClick rection below or use resume command to try again.").then((msg) => {
								msg.react("😀");
								msg
									.awaitReactions((reaction: MessageReaction, user: User) => user.id != bot.user.id && reaction.emoji.name == "😀", { max: 1 })
									.then(() => {
										player.resume();
										logger.debug("Resumed from CPU high usage pause.");
									});
							});
						}
					});
				}
			}),
		5000,
	);
}

class Song {
	readonly title: string;
	readonly uri: string;
	readonly thumbnail: string;
	readonly duration: moment.Duration;
	readonly requester: GuildMember;
	readonly textChannel: TextChannel;
	encoded?: string;
	readonly href: string;

	constructor(obj: { title: string; uri: string; thumbnail: string; duration: moment.Duration; requester: GuildMember; textChannel: TextChannel; href: string; encoded?: string }) {
		this.title = obj.title;
		this.uri = obj.uri;
		this.thumbnail = obj.thumbnail;
		this.duration = obj.duration;
		this.requester = obj.requester;
		this.textChannel = obj.textChannel;
		this.encoded = obj.encoded;
		this.href = obj.href;
	}

	getDuration() {
		return this.duration;
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

// connect to LavaLink server

const LavalinkServer = [
	{
		name: "Main Node",
		url: `${CONFIG.lavalink.hostname}:${CONFIG.lavalink.port}`,
		auth: CONFIG.lavalink.password,
	},
];
const ShoukakuOptions = {
	moveOnDisconnect: true,
	resumable: false,
	resumableTimeout: 5000,
	reconnectTries: 2,
	restTimeout: 10000,
};
let shoukakuclient: Shoukaku;

let isFirstAttempt = true;

// let lavanode: Node;
function connectToLavaServer() {
	return new Promise<void>((resolve, reject) => {
		logger.info(`Connecting to Lavalink server ...`, "lavalink");
		shoukakuclient = new Shoukaku(new Connectors.DiscordJS(bot), LavalinkServer, ShoukakuOptions);
		// if (!isFirstAttempt) shoukakuclient.addNode(LavalinkServer[0]);
		// isFirstAttempt = false;

		shoukakuclient.on("error", (name, error) => {
			logger.error(`Lavalink - ${name}: ${error.stack}`);
		});
		shoukakuclient.on("close", (name, code, reason) => {
			logger.warn(`Lavalink - ${name}: Closed with code ${code}, Reason: "${reason || "No reason"}"`);
		});
		shoukakuclient.on("disconnect", (name, reason) => {
			logger.error(`Lavalink - ${name}: Disconnected, Reason: "${reason || "No reason"}"`);
			shoukakuclient.removeNode("Main Node");
			// lavanode = null;
			logger.error("Exiting ...");
			gracefulExit("LAVALINK");
		});
		shoukakuclient.on("ready", (name) => {
			logger.info(`Connected to Lavalink server at ${CONFIG.lavalink.hostname}:${CONFIG.lavalink.port}`, "lavalink");
			resolve();
		});

		// console.log('gonna wait')

		// console.log('wait over');
	});
}
if (!CONFIG.disableMusic) connectToLavaServer();

class MusicPlayer {
	readonly guild: Guild;

	voiceChannel: VoiceChannel;
	respondChannel: TextChannel; // Text Channel
	// connection: VoiceConnection | undefined;
	dispatcher: StreamDispatcher;
	private currentSong: Song | undefined;
	private isLooping = false;
	private queue: Array<Song> = [];
	private volume: number = CONFIG.defaultVolume;
	private leaveTimeout: NodeJS.Timeout;
	public lavaplayer: Player = null;
	// private trackId: string;
	private playedTime: number;

	constructor(guild: Guild) {
		this.guild = guild;
		prisma.guild
			.findUnique({
				select: {
					musicVolume: true,
				},
				where: {
					id: guild.id,
				},
			})
			.then(({ musicVolume }) => {
				if (musicVolume !== null) this.volume = musicVolume;
			});
		// this.voiceChannel = guild.me.voice.channel;
		// if (guild.me.voice.channel) this.disconnect();		-----> this was to leave channels after restart, but I think LavaLink should be able to handle it for me now
	}

	/**
	 *
	 * @returns Position of the playing track
	 */
	getPlayedTime() {
		if (!this.lavaplayer) return null;
		return moment.duration(this.lavaplayer.position, "milliseconds"); // still have problem with position -.- it's not real-time
	}

	/**
	 * @returns Total duration of all songs in the queue.
	 */
	getTotalTime() {
		let totaltime = 0;
		this.queue.forEach((song) => {
			totaltime += song.duration.asSeconds();
		});
		if (this.currentSong) totaltime += this.currentSong.duration.subtract(this.getPlayedTime()).asSeconds();
		return moment.duration(totaltime, "seconds");
	}

	async findSongYoutube(query: string, { member, textChan }: { member: GuildMember; textChan: TextChannel }): Promise<Song | Playlist | undefined> {
		// if query is a playlist
		if (query.includes("list=")) {
			const listID = query
				.split(/&|\?/g)
				.filter((arg) => arg.startsWith("list="))[0]
				.slice(5);

			let nextPageToken: string;
			const songs: Song[] = [];
			const waitmsgpromise = textChan.send("<a:loading:845534883396583435> Getting videos");
			do {
				let paramObj = {
					key: CONFIG.token.youtube,
					part: "contentDetails",
					playlistId: listID,
					fields: "nextPageToken,prevPageToken,items/contentDetails/videoId",
					maxResults: 50,
					pageToken: undefined,
				};
				if (nextPageToken) paramObj.pageToken = nextPageToken;

				// request playlist items from YouTube
				let playlistItemRes: AxiosResponse;
				try {
					playlistItemRes = await axios({
						method: "GET",
						url: "https://www.googleapis.com/youtube/v3/playlistItems/",
						params: paramObj,
					});
				} catch (err) {
					const waitmsg = await waitmsgpromise;
					if (waitmsg.deletable) waitmsg.delete();
					textChan.send("An error occured while trying to get playlist");
					return null;
				}
				const playlistdata = playlistItemRes.data;
				const songsstr = playlistdata.items.map((s) => s.contentDetails.videoId);

				// get detailed information of videos got from a playlist
				const videosRes = await axios({
					method: "GET",
					url: "https://www.googleapis.com/youtube/v3/videos/",
					params: {
						key: CONFIG.token.youtube,
						part: "contentDetails,snippet",
						id: songsstr.join(","),
						fields: "items/id,items/contentDetails/duration,items/snippet/thumbnails/default,items/snippet/title",
					},
				});

				for (const vid of videosRes.data.items) {
					songs.push(
						new Song({
							title: vid.snippet.title,
							duration: moment.duration(vid.contentDetails.duration),
							thumbnail: vid.snippet.thumbnails.default.url,
							uri: vid.id,
							href: `https://youtube.com/watch?v=${vid.id}`,
							requester: member,
							textChannel: textChan,
						}),
					);
					nextPageToken = playlistdata.nextPageToken;
				}
			} while (nextPageToken);

			const playlistInfo = (await axios.get(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${listID}&key=${CONFIG.token.youtube}`)).data.items[0].snippet;

			const waitmsg = await waitmsgpromise;
			if (waitmsg.deletable) waitmsg.delete();
			return new Playlist(playlistInfo.title, `https://youtube.com/playlist?list=${listID}`, playlistInfo.thumbnails.default.url, songs);
		}

		// if query is a single video
		const results = (await this.lavaplayer.node.rest.resolve(`ytsearch:${query}`)).data as Track[];
		const track = results.shift();
		if (track) {
			return new Song({
				requester: member,
				textChannel: textChan,
				title: track.info.title,
				uri: track.info.identifier,
				href: `https://youtube.com/watch?v=${track.info.identifier}`,
				duration: moment.duration(track.info.length),
				thumbnail: `https://i.ytimg.com/vi/${track.info.identifier}/mqdefault.jpg`,
				encoded: track.encoded,
			});
		}
		return null;
	}

	/**
	 * @returns Returns true if success, otherwise returns false.
	 */
	async appendQueue(member: GuildMember, guild: Guild, referTextChannel: TextChannel, query: string) {
		if (query == "") return true;

		let result: Song | Playlist | undefined;
		if (query.match(/https?:\/\/open.spotify.com\/(\w+)\/\w+/gi)) {
			// If matches Spotify URL format

			const [head, params_str] = query.split("spotify.com");
			const params = params_str.split(/\/|\?|\&/g);
			const trackID = params[params.indexOf("track") + 1];
			logger.debug(trackID);
			if (trackID) {
				const { name, artist, href, thumbnail_url } = await getTrackSearchString(trackID);

				const { data } = (await this.lavaplayer.node.rest.resolve(`ytsearch:${artist} ${name}`)) as TrackResult;
				result = new Song({
					requester: member,
					textChannel: referTextChannel,
					title: `${artist} - ${name}`,
					uri: data.info.identifier,
					href: href,
					duration: moment.duration(data.info.length),
					thumbnail: thumbnail_url,
					encoded: data.encoded,
				});
			} else {
				referTextChannel.send("Only support single Spotify track at this moment. Sorry :( (im working on it k?)");
			}

			// const data = await lavanode.rest.resolve(query);
			// this.trackId = data.tracks[0].track;
			// await this.lavaplayer.playTrack(this.trackId, { noReplace: false });
		} else {
			result = await this.findSongYoutube(query, {
				member: member,
				textChan: referTextChannel,
			});
		}

		if (result instanceof Song) {
			const song = result;
			referTextChannel.send(
				new MessageEmbed()
					.setAuthor("Song Queued", member.user.displayAvatarURL())
					.setDescription("Queued " + `**[${song.title}](${song.href})**` + ".\n")
					.setColor(GREEN)
					.addField("Song Duration", `\`${digitDurationString(song.getDuration().asSeconds())}\``, true)
					.addField("Position in Queue", `\`${this.currentSong ? this.queue.length + 1 : 0}\``, true)
					.addField("Time Before Playing", `\`${this.getTotalTime().asSeconds() ? digitDurationString(this.getTotalTime().asSeconds()) : "Now"}\``, true)
					.setThumbnail(song.thumbnail),
			);
			this.queue.push(song);
		} else if (result instanceof Playlist) {
			const playlist = result;
			let totalDuration = 0;
			playlist.songs.forEach((song) => (totalDuration += song.getDuration().asSeconds()));
			referTextChannel.send(
				new MessageEmbed()
					.setAuthor("Playlist Queued", member.user.displayAvatarURL())
					.setDescription(`Queued ${playlist.songs.length} songs from playlist **[${playlist.title}](${playlist.url})**.\n`)
					.setColor(GREEN)
					.addField("Playlist Duration", `\`${digitDurationString(totalDuration)}\``, true)
					.addField("Position in Queue", `\`${this.currentSong ? this.queue.length + 1 : 0}\` to \`${this.currentSong ? this.queue.length + playlist.songs.length : playlist.songs.length - 1}\``, true)
					.addField("Time Before Playing", `\`${this.getTotalTime().asSeconds() ? digitDurationString(this.getTotalTime().asSeconds()) : "Now"}\``, true)
					.setThumbnail(playlist.thumbnail),
			);
			this.queue = this.queue.concat(playlist.songs);
		} else if (!result) {
			referTextChannel.send(
				new MessageEmbed({
					title: "No Songs Found",
					description: "Sorry, we experienced difficulties finding your song. Try again with other phrases.",
					color: RED,
				}),
			);
			return;
		} else {
			console.log(result);
		}

		if (!this.currentSong && this.queue.length > 0) this.playNext();
		return true;
	}

	/**
	 * Returns whether the operation is success.
	 */
	async connect(textChannel: TextChannel, voiceChannel: VoiceChannel) {
		this.respondChannel = textChannel;
		this.voiceChannel = voiceChannel;

		// if (!lavanode) {
		// 	logger.debug('Adding node');
		// 	shoukakuclient.addNode(LavalinkServer[0]);
		// 	await connectToLavaServer();
		// 	logger.debug(`Reconnected to Lavalink server (initiated from player${this.guild.id})`);
		// }

		this.lavaplayer = await shoukakuclient.joinVoiceChannel({
			guildId: this.voiceChannel.guild.id,
			channelId: this.voiceChannel.id,
			shardId: 0,
			deaf: true,
		});
		// this.lavaplayer.on('exception', (error) => {
		// 	logger.error(`Music Player[${this.guild.id}]: Lavalink player error: ${error}`);
		// 	this.lavaplayer.disconnect();
		// });
		this.lavaplayer.setGlobalVolume(this.volume);

		// when the player is closed
		this.lavaplayer.on("closed", (reason: any) => {
			// on user force disconnect
			logger.debug(`Music Player[${this.guild.id}]: Lavalink player fired "closed", Reason: "${reason.reason}"`);
			setTimeout(() => {
				if (!this.guild.member(bot.user).voice.channel) {
					this.disconnect();
					logger.debug("force disconnected");
					// this.lavaplayer = null;
				} else {
					this.lavaplayer.stopTrack();
					this.lavaplayer.playTrack({
						track: this.currentSong.encoded,
						options: { startTime: this.playedTime, noReplace: false },
					});
					setTimeout(() => {
						clearTimeout(this.leaveTimeout);
						this.leaveTimeout = null;
						logger.debug(`Music Player[${this.guild.id}]: Cleared Timeout`);
					}, 5000);
				}
			}, 200);
		});
		this.lavaplayer.on("update", (update) => (this.playedTime = update.state.position));

		// when the player finish playing a song
		this.lavaplayer.on("end", async (reason) => {
			logger.debug(`Music Player[${this.guild.id}]: Lavalink player fired "end", Reason: "${reason.reason}"`);
			if (reason.reason != "replaced") {
				if (this.leaveTimeout) clearTimeout(this.leaveTimeout);
				this.leaveTimeout = setTimeout(() => this.disconnect(), 300000);
				logger.debug(`Music Player[${this.guild.id}]: Registered Timeout (5 mins)`);
			}
			if (reason.reason != "finished") return;
			if (this.isLooping) {
				// have looping enabled
				this.play(this.currentSong);
			} else if (this.queue.length >= 1)
				this.playNext(); // Have next song
			else {
				// Doesn't have next song
				this.currentSong = null;
				if ((await getGuildSettings(this.guild.id)).announceQueueEnd) {
					this.respondChannel.send("Queue Ended.");
				}
			}
		});
	}

	/**
	 * @returns Whether the bot has a player before running this method
	 */
	disconnect() {
		this.currentSong = null;
		this.isLooping = false;
		this.voiceChannel = null;
		if (this.lavaplayer) {
			shoukakuclient.leaveVoiceChannel(this.lavaplayer.guildId);
			this.lavaplayer = null;
			this.queue = [];
			return true;
		} else {
			return false;
		}
	}

	// configDispatcher(dispatcher: StreamDispatcher) {
	// 	this.dispatcher = dispatcher
	// 	dispatcher.on('unpipe', () => {
	// 		// console.log('unpiped')
	// 		this.leaveTimeout = setTimeout(() => { this.disconnect(); }, 60000);
	// 		// this.previousSong = this.currentSong;
	// 		this.currentSong = null;
	// 	});
	// 	// dispatcher.on('unpipe', () => { console.log('unpiped') });
	// 	dispatcher.on('finish', async () => {
	// 		// console.log('finished')
	// 		if (this.isLooping && this.previousSong) {
	// 			this.play(this.previousSong);
	// 		}
	// 		else if (this.queue.length >= 1) this.playNext(); // Have next song
	// 		else { // Doesn't have next song
	// 			if ((await DataManager.get(this.guild.id)).settings.announceQueueEnd) {
	// 				this.respondChannel.send('Queue Ended.');
	// 			}
	// 		}
	// 	})
	// 	dispatcher.setVolume(this.volume / 100);
	// }

	async play(song: Song) {
		// const play = async (song: Song) => {								-----> this lines is with the comment below

		if (!this.lavaplayer) {
			try {
				logger.debug(`Music Player[${this.guild.id}]: Trying to connect player from play method`);
				this.connect(song.textChannel, this.voiceChannel);
			} catch (err) {
				logger.debug(`Music Player[${this.guild.id}]: Cannot connect to voice channel. An unknown error occured.`);
				this.respondChannel.send("Cannot connect to voice channel. An unknown error occured.");
			}
		}

		// play song
		clearTimeout(this.leaveTimeout);
		this.leaveTimeout = null;
		logger.debug(`Music Player[${this.guild.id}]: Cleared Timeout`);
		if (!song.encoded) {
			const result = (await this.lavaplayer.node.rest.resolve(song.uri)) as TrackResult;
			song.encoded = result.data.encoded;
		}
		await this.lavaplayer.playTrack({
			track: song.encoded,
			options: { noReplace: false },
		});
		this.currentSong = song;

		const { saveMusicHistory, announceSong } = await getGuildSettings(this.guild.id);
		if (saveMusicHistory) {
			await prisma.musicHistory.create({
				data: {
					guildId: this.guild.id,
					requesterId: song.requester.id,
					title: song.title,
					uri: song.uri,
				},
			});
		}
		if (announceSong) {
			song.textChannel.send(new MessageEmbed().setDescription(`🎧 Now playing ` + ` **[${song.title}](${song.href})** \`${digitDurationString(song.getDuration().asSeconds())}\` ` + `[${song.requester.user}]`).setColor(BLUE));
		}

		// if (this.connection?.dispatcher) {
		// 	this.connection!.dispatcher.on('unpipe', _ => play(song))		-----> I don't understand this... I wish I could talk to my past self
		// 	this.connection!.dispatcher.destroy();
		// } else play(song);
	}

	async playNext() {
		// if (this.connection?.dispatcher?.paused) { // first resume
		// 	this.resume();													-----> WHY??
		// }

		let song = this.queue.shift(); // extract next song
		if (!song) return;
		this.play(song);
	}

	pause() {
		if (!this.lavaplayer) return;
		this.lavaplayer.setPaused(true);
	}

	resume() {
		if (!this.lavaplayer) return;
		this.lavaplayer.setPaused(false);
	}

	setVolume(volume: number) {
		if (!this.lavaplayer) return;
		logger.debug(`volume: ${volume}`);
		this.lavaplayer.setGlobalVolume(volume);
		logger.debug(`Volume set to ${volume} in "${this.guild.id}"`);
		this.volume = volume;
	}

	skip() {
		if (this.queue.length > 0) {
			this.playNext();
		} else if (this.lavaplayer) {
			this.lavaplayer.stopTrack();
			this.currentSong = null;
			this.respondChannel.send("Skipped! ⏩");
		} else {
			throw "NO_PLAYING_SONG";
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
		this.queue = shuffle(this.queue);
	}

	move(oldPosition: number, newPosition: number) {
		let queue = this.queue;
		let transferingSong = queue.splice(oldPosition - 1, 1)[0];
		queue.splice(newPosition - 1, 0, transferingSong);
	}

	async seek(second: number, responseChannel: TextChannel) {
		// console.log(startsec)
		if (!this.currentSong || !this.lavaplayer) {
			// both side of "or" should have same value tho, I put both in just to make sure
			throw "NO_PLAYING_SONG";
		}

		const secondsPlayed = this.getPlayedTime().asSeconds();
		await this.lavaplayer.seekTo(second * 1000);
		// clearTimeout(this.leaveTimeout);

		responseChannel.send(
			new MessageEmbed()
				.setTitle("Seeked!")
				// cannot get real-time position back from Lavalink server -.- making the next line inaccurate
				// .setDescription(`${prettyTime(secondsPlayed)} / ${prettyTime(this.currentSong.getDuration().asSeconds())}\n${progressBar(Math.round(secondsPlayed / this.currentSong.getDuration().asSeconds() * 100), 45)}`)
				.setColor(GREEN),
		);
	}

	async search(field: string) {
		return (await yts({ query: field, pageStart: 1, pageEnd: 3 })).videos;
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

bot.on("message", (msg) => {
	if (msg.channel instanceof DMChannel) return;
	if (!MusicPlayerMap.has(msg.guild!.id)) MusicPlayerMap.set(msg.guild!.id, new MusicPlayer(msg.guild!));
});

// change voiceChannel value to new channel when forced to move
bot.on("voiceStateUpdate", async (_, newvs) => {
	const player = MusicPlayerMap.get(newvs.guild.id);
	if (player && newvs.member.id == bot.user.id && newvs.channel && MusicPlayerMap.get(newvs.guild.id).voiceChannel?.id != newvs.channel.id) {
		MusicPlayerMap.get(newvs.guild.id).voiceChannel = newvs.channel;

		// const track = this.lavaplayer.track;
		// this.lavaplayer = await lavanode.joinVoiceChannel({
		// 	guildID: newvs.guild.id,
		// 	voiceChannelID: newvs.channel.id,
		// 	deaf: true,
		// });
		// this.lavaplayer.playTrack(track);

		// this.lavaplayer.voiceConnection.attemptReconnect();
	}
});

new Command({
	name: "join",
	category: "music",
	description: "Joins the voice channel user is currently in",
	examples: ["join"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES", "CONNECT"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		if (args[0]) {
			const channel = message.guild!.channels.resolve(args[0]);
			if (channel && channel.type == "voice") {
				player.connect(<TextChannel>message.channel, <VoiceChannel>channel);
			} else {
				message.channel.send("Channel with ID " + args[0] + " is not a voice channel.");
			}
		} else {
			if (!message.member!.voice.channel) {
				message.channel.send(new MessageEmbed().setTitle("Error").setDescription("**You must be in a voice channel** to use this command.").setColor(RED));
				return;
			}
			player.connect(<TextChannel>message.channel, message.member!.voice.channel);
		}
	},
});

new Command({
	name: "play",
	category: "music",
	description: "",
	examples: [],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES", "CONNECT", "SPEAK"],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		// Some part of code is from discord.js
		if (!message.guild.me.voice.channel && !message.member.voice.channel) {
			message.channel.send(
				new MessageEmbed({
					title: "Error",
					description: "I am not in a voice channel, use join command to connect me to one.",
					color: RED,
				}),
			);
			return;
		}
		const player = MusicPlayerMap.get(message.guild.id);
		if (player.voiceChannel) {
			// only bot is in a vc
			const member = message.member;
			if (!member.voice.channel) {
				message.channel.send(
					new MessageEmbed({
						title: "Warning",
						description: "**You're NOT in a voice channel.** You won't be able to enjoy your music unless you join the one I'm currently in.",
						color: YELLOW,
					}),
				);
			} else if (player.voiceChannel.id != member.voice.channel.id)
				message.channel.send(
					new MessageEmbed({
						title: "Warning",
						description: "**I'm in a different voice channel.** You won't be able to enjoy your music unless you join the one I'm currently in.",
						color: YELLOW,
					}),
				);
		} else {
			// equivalent to if (message.member.voice.channel) -- only user is in a vc
			await MusicPlayerMap.get(message.guild.id).connect(<TextChannel>message.channel, message.member!.voice.channel);
		}
		await MusicPlayerMap.get(message.guild!.id)!.appendQueue(message.member!, message.guild, <TextChannel>message.channel, longarg(0, args));
	},
});

new Command({
	name: "pause",
	category: "music",
	description: "Pauses song",
	examples: ["pause"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		MusicPlayerMap.get(message.guild!.id)!.pause();
		message.channel.send("Paused! ⏸");
	},
});

new Command({
	name: "resume",
	category: "music",
	description: "Resumes song",
	examples: ["resume"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		MusicPlayerMap.get(message.guild!.id)!.resume();
		message.channel.send("Resumed! ▶");
	},
});

new Command({
	name: "leave",
	category: "music",
	description: "Disconnects from voice channel",
	examples: ["leave"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;

		if (player.disconnect()) {
			message.channel.send("👋 Successfully Disconnected!");
		} else {
			message.channel.send(new MessageEmbed().setTitle("Error").setDescription("I am **NOT** in a voice channel.").setColor(RED));
		}
	},
});

new Command({
	name: "loop",
	category: "music",
	description: "Toggles or sets song looping",
	examples: ["loop", "loop <on/off>"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		if (!player.voiceChannel) {
			message.channel.send(
				new MessageEmbed({
					title: "I'm not in a voice channel.",
					color: RED,
				}),
			);
			return;
		}
		if (args[0]) {
			if (args[0].toLowerCase() == "on") {
				player.setLooping(true);
				message.channel.send("🔂 Looping Enabled!");
			} else if (args[0].toLowerCase() == "off") {
				player.setLooping(false);
				message.channel.send("✋ Looping Disabled!");
			} else {
				message.channel.send(`❌ Invalid value ${inlineCodeBlock(args[0])}`);
			}
		} else {
			const isLooping = player.toggleLooping();
			if (isLooping) {
				message.channel.send("🔂 Looping Enabled!");
			} else {
				message.channel.send("✋ Looping Disabled!");
			}
		}
	},
});

new Command({
	name: "shuffle",
	category: "music",
	description: "Shuffles current queue",
	examples: ["shuffle"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		MusicPlayerMap.get(message.guild!.id)!.shuffle();
		message.channel.send("Shuffled! 🔀");
	},
});

new Command({
	name: "nowplaying",
	category: "music",
	description: "Shows currently playing song",
	examples: ["nowplaying"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		const current_song = player.getCurrentSong();
		if (!current_song) {
			message.channel.send(new MessageEmbed().setTitle("No Playing Song").setColor(BLUE));
			return;
		}

		const secondsPlayed = Math.floor(player.getPlayedTime().asSeconds());
		message.channel.send(
			new MessageEmbed()
				.setTitle("🎧 Now Playing")
				// .setDescription(content)
				.setColor(BLUE)
				.setThumbnail(current_song.thumbnail)
				.addField("Song", `[${current_song.title}](${current_song.href})`)
				.addField("Duration", `\`${digitDurationString(secondsPlayed)}\` / \`${digitDurationString(current_song.getDuration().asSeconds())}\`` + (player.getLooping() ? " 🔂" : "") + `\n${progressBar(Math.round((secondsPlayed / current_song.getDuration().asSeconds()) * 100), 45)}`)
				.addField("Text Channel", current_song.textChannel, true)
				.addField("Voice Channel", `${player.voiceChannel}`, true)
				.addField("Requester", `${current_song.requester}`, true),
		);
	},
});

new Command({
	name: "skip",
	category: "music",
	description: "Skips current song",
	examples: ["skip"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		try {
			player.skip();
		} catch (err) {
			message.channel.send("Unable to skip, I'm not playing any song.");
		}
	},
});

new Command({
	name: "volume",
	category: "music",
	description: "Adjusts music volume",
	examples: ["volume <new volume(0-100)>"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		// try {
		if (args[0]) {
			let volume = isNaN(Number(args[0])) ? -1 : Number(args[0]);
			if (0 > volume || volume > 100) {
				message.channel.send(new MessageEmbed().setTitle("Invalid Argument").setDescription("The number must fall in the range of 0 to 100.").setColor(RED));
				return;
			}
			let oldVolume = player.getVolume();
			if (oldVolume == volume) {
				message.channel.send(new MessageEmbed().setTitle("Volume Unchanged").setDescription(`Volume has not changed since it's already at \`${args[0]}%\``).setColor(BLUE));
				return;
			}
			player.setVolume(volume);

			// } catch (err) {
			// 	console.log('error occured while changing the volume')
			// }
			await prisma.guild.update({
				data: {
					musicVolume: volume,
				},
				where: {
					id: message.guild.id,
				},
			});
			message.channel.send(
				new MessageEmbed()
					.setTitle("Volume Adjusted " + (oldVolume < volume ? "🔺" : "🔻"))
					.setDescription(`Volume has been ` + (oldVolume < volume ? "increased" : "decreased") + ` to \`${args[0]}%\`.\n\n**${progressBar(volume, 31)}**`)
					.setColor(GREEN),
			);
		} else {
			let volume = player.getVolume();
			message.channel.send(
				new MessageEmbed()
					.setTitle("Current Volume")
					.setDescription(`The volume is at \`${volume}%\`\n\n**${progressBar(volume, 31)}**`)
					.setColor(BLUE),
			);
		}
	},
});

new Command({
	name: "queue",
	category: "music",
	description: "Shows current music queue",
	examples: ["queue"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		let content: string[] = [];
		let i = 0;
		player.getQueue().forEach((song) => {
			i++;
			content.push(`${inlineCodeBlock(String(i))} - \`${digitDurationString(song.getDuration().asSeconds())}\` __[${song.title}](${song.href})__ [${song.requester}]\n`);
		});

		let embed = new MessageEmbed().setTitle("Song Queue 🎶").setColor(BLUE);

		let currentSong = player.getCurrentSong();
		if (currentSong) {
			let secondsPlayed = Math.floor(player.getPlayedTime().asSeconds()); // currentSong.getPlayedTime()
			embed
				.addField(`${ZERO_WIDTH}\n🎧 Now Playing`, `**${ZERO_WIDTH}[${currentSong.title}](${currentSong.href})** \n${progressBar(Math.round((secondsPlayed / currentSong.getDuration().asSeconds()) * 100))}`)
				.addField("Total Time", `\`${digitDurationString(player.getTotalTime().asSeconds())}\` `, true)
				.addField("Loop Mode", player.getLooping() ? "🔂 Current Song" : `❌ None\n${ZERO_WIDTH}`, true);
		}
		sendEmbedPage(<TextChannel>message.channel, embed, "🔺 Upcoming\n", content.length != 0 ? content : ["Empty Queue"]);
	},
});

new Command({
	name: "remove",
	category: "music",
	description: "Removes a song from music queue",
	examples: ["remove <song position>"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		if (Number(args[0]) - 1 < 0) {
			message.channel.send(new MessageEmbed().setTitle("Song Not Found").setDescription("Please do not use negative numbers.").setColor(RED));
			return;
		}
		const player = MusicPlayerMap.get(sourceID)!;
		let song = player.removeSong(Number(args[0]) - 1);
		if (!song) {
			message.channel.send(
				new MessageEmbed()
					.setTitle("Song Not Found")
					.setDescription("Please use any number displayed in " + inlineCodeBlock(prefix + "queue") + ".")
					.setColor(RED),
			);
			return;
		}
		message.channel.send(new MessageEmbed().setAuthor("🗑️ Song Removed").setDescription(`Removed [${song.title}](${song.href}) [${song.requester}]`).setColor(GREEN));
	},
});

new Command({
	name: "clear",
	category: "music",
	description: "Removes all songs from music queue",
	examples: ["clear"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		MusicPlayerMap.get(message.guild!.id)!.clearQueue();
		message.channel.send(new MessageEmbed().setTitle("Queue Cleared").setDescription("Music queue for this server has been reset.").setColor(GREEN));
	},
});

new Command({
	name: "rmrange",
	category: "music",
	description: "Removes songs in specified range from music queue",
	examples: ["rmrange <from> <to>"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const from = Number(args[0]);
		const to = Number(args[1]);
		const player = MusicPlayerMap.get(message.guild!.id)!;
		if (!(args[0] && args[1]) || isNaN(from) || isNaN(to)) {
			message.channel.send(
				new MessageEmbed({
					title: "Usage",
					description: "rmrange <from (number)> <to (number)>",
					color: RED,
				}),
			);
		} else if (from > to) {
			message.channel.send(
				new MessageEmbed({
					title: "Invalid Range",
					description: "Position must be from lower to higher",
					color: RED,
				}),
			);
		} else if (from - 1 < 0 || to - 1 < 0 || from > player.getQueue().length || to > player.getQueue().length) {
			message.channel.send(
				new MessageEmbed({
					title: "Song Not Found",
					description: `Please use positions that exist in ${prefix}queue`,
					color: RED,
				}),
			);
			return;
		} else {
			player.removeSongRange(from - 1, to - 1);
			message.channel.send(
				new MessageEmbed({
					title: "Songs Removed",
					description: `${to - from + 1} songs have been removed from the queue.`,
					color: GREEN,
				}),
			);
		}
	},
});

new Command({
	name: "search",
	category: "music",
	description: "Searches for a song on YouTube.",
	examples: ["search <field>"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(sourceID);
		const results = await player.search(args.join(" "));
		const song: yts.VideoSearchResult = await confirm_type("Pick a song you want\n(type number in chat)", results, message.author, <TextChannel>message.channel, (result) => `\`${result.duration.timestamp}\` __[${result.title}](${result.url})__\n`);
		if (song)
			CommandManager.run("play", [song.url], {
				message: message,
				prefix: prefix,
				sourceID: sourceID,
			});
	},
});

new Command({
	name: "seek",
	category: "music",
	description: "Seeks to a specific second in the song",
	examples: ['seek <"forward/backward/to"> <duration>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	exec(message, prefix, args, sourceID) {
		const player = MusicPlayerMap.get(message.guild!.id)!;
		try {
			let seconds = 0;
			if (isNaN(+args[0])) {
				const vals = args[0].split(":");
				console.log(vals);
				if (vals.length > 3 || vals.some((v) => isNaN(+v))) {
					message.channel.send(
						new MessageEmbed({
							title: "Invalid format",
							color: RED,
						}),
					);
					return;
				}

				if (vals.length === 2) {
					seconds += +vals[0] * 60;
					seconds += +vals[1];
				} else if (vals.length === 3) {
					seconds += +vals[0] * 60 * 60;
					seconds += +vals[1] * 60;
					seconds += +vals[2];
				}
			} else {
				seconds = +args[0];
			}
			console.log(seconds);
			player.seek(seconds, <TextChannel>message.channel);
		} catch (err) {
			message.channel.send(
				new MessageEmbed({
					title: "No Playing Song",
					description: "I am not playing any song at the moment.",
					color: RED,
				}),
			);
		}

		// if (!player.connection) {
		// 	message.channel.send(new MessageEmbed({
		// 		title: 'Invalid Option',
		// 		description: `Use ${inlineCodeBlock(prefix + 'help seek')} for info.`,		-----> for the future
		// 		color: RED
		// 	}))
		// 	return;
		// }
		// switch (args[0]) {
		// 	case 'forward':
		// 	case 'backward':
		// 	case 'to':
		// 	default:

		// }
	},
});

new Command({
	name: "history",
	category: "music",
	description: "List songs that have been played.",
	examples: ["history"],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ["SEND_MESSAGES"],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		const history = await prisma.musicHistory.findMany({
			where: {
				guildId: message.guild.id,
			},
			orderBy: {
				timestamp: "desc",
			},
		});

		let lastTimestamp: number;
		const historyLines = history.map((song) => {
			const mergeSpan = 60; // in seconds
			const currentTimestamp = Math.round(song.timestamp.getTime() / 1000 / mergeSpan);
			const lineStr = `${currentTimestamp !== lastTimestamp ? `__<t:${Math.round(song.timestamp.getTime() / 1000)}:R>__ ` : ""}[${song.title}](https://youtube.com/watch?v=${song.uri}) by <@${song.requesterId}>\n`;
			lastTimestamp = currentTimestamp;
			return lineStr;
		});
		let embed = new MessageEmbed().setTitle("🗓️ Song History").setColor(BLUE).setFooter("Order: newest to oldest");
		sendEmbedPage(<TextChannel>message.channel, embed, ZERO_WIDTH, historyLines.length != 0 ? historyLines : ["Empty History"]);
	},
});
