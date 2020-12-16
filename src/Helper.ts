import { exec } from 'child_process';
import { TextChannel, MessageEmbed, MessageReaction, User, EmojiResolvable, Message, MessageEmbedOptions, Emoji } from 'discord.js';
import { CONFIG } from './ConfigManager';

class UtilClass {

	red = CONFIG.colors.red;
	green = CONFIG.colors.green;
	blue = CONFIG.colors.blue;
	yellow = CONFIG.colors.yellow;

	inlineCodeBlock(content: string) {
		return `\`\`${content.replace(/`/g, '‎`‎')}\`\``;
	}

	refreshIp(): Promise<string> {
		// Get IP 
		return new Promise((resolve, _reject) => {
			exec('dig +short -4 myip.opendns.com @resolver1.opendns.com', (err, stdout, stderr) => {
				if (err) {
					// console.warn(err);
				}
				resolve(stdout ? stdout : stderr);
			});
		});
	}

	getDateTimeString(date: Date) {
		return `${this.min2(date.getDate())}/${this.min2(date.getMonth())}/${this.min2(date.getFullYear())}-${this.min2(date.getHours())}:${this.min2(date.getMinutes())}:${this.min2(date.getSeconds())}`;
	}

	min2(num: number) {
		return ('0' + num).slice(-2);
	}

	getNumberEmoji(integer: number) {
		let numberstr: { [key: string]: string } = {
			'0': ':zero:',
			'1': ':one:',
			'2': ':two:',
			'3': ':three:',
			'4': ':four:',
			'5': ':five:',
			'6': ':six:',
			'7': ':seven:',
			'8': ':eight:',
			'9': ':nine:',

		};
		let emojistr = '';
		let digits = integer.toString().split('');
		digits.forEach(digit => {
			emojistr += numberstr[digit];
		})
		return emojistr;
	}

	/**
	 * 
	 * @param percent A percentage from 0 to 100.
	 * @param length Full length of the progress bar. (default to 30)
	 */
	progressBar(percent: number, length = 30): string {
		let show = Math.round(percent / 100 * length);
		let progress = '';
		for (let i = 0; i < show - 1; i++) {
			progress += '─';
		}
		progress += '⚪'
		for (let i = 0; i < length - show; i++) {
			progress += '─';
		}
		console.log(progress)
		return '`|' + progress + '|`';
	}

	prettyTime(seconds: number): string {
		seconds = Math.round(seconds)
		return `${seconds / 3600 >= 1 ? this.min2(Math.floor(seconds / 3600)) + ':' : ''}` + `${this.min2(Math.floor(seconds / 60) % 60)}:${this.min2(seconds % 60)}`
	}

	shuffle(array: Array<any>): typeof array {
		let shuffledArray = [];
		while (array.length > 0) {
			let index = Math.floor(Math.random() * array.length);
			console.log(index)
			shuffledArray.push(array[index]);
			array = array.filter(item => array.indexOf(item) != index);
		}
		return shuffledArray;
	}

	longarg(begin_index = 1, args: string[]) {
		return args.slice(begin_index).join(' ').trim();
	}

	async sendEmbedPage(textChannel: TextChannel, prototype: MessageEmbed, name: string, value: string[], inline = false) {
		let pages: MessageEmbed[] = [];
		while (value.length > 0) {
			let page = new MessageEmbed(prototype);
			let val = '';

			let nextval = '';
			for (let i = 0; val.length + nextval.length <= 1020 && value.length > 0; i++) {
				nextval = value.shift();
				val += nextval;
			}

			if (val.length > 0) page.addFields({ name: name, value: val, inline: inline });
			pages.push(page);
		}

		let pagenum = 1;
		pages.forEach(page => {
			page.setFooter(page.footer ? page.footer.text + `\n\nPage ${pagenum++} / ${pages.length}` : `Page ${pagenum++} / ${pages.length}`);
		})


		let current_page = 0;
		const message = await textChannel.send(pages[0]);

		if (pages.length > 1) {
			if (pages.length > 2) message.react('⏮')
			message.react('◀');
			message.react('▶');
			if (pages.length > 2) message.react('⏭')
		}
		message.react('🛑');

		const collector = message.createReactionCollector((_reaction: MessageReaction, user: User) => !user.bot, { time: 1000000 })
		collector.on('collect', (reaction, user) => {
			if (reaction.emoji.name == '◀') {
				message.reactions.resolve('◀').users.remove(user);
				if (current_page + 1 > 1) {
					message.edit(pages[--current_page]);
				}
			}
			else if (reaction.emoji.name == '▶') {
				message.reactions.resolve('▶').users.remove(user);
				if (current_page + 1 < pages.length) {
					message.edit(pages[++current_page]);
				}
			}
			else if (reaction.emoji.name == '⏮') {
				message.reactions.resolve('⏮').users.remove(user);
				if (current_page + 1 > 1) {
					message.edit(pages[0]);
					current_page = 0;
				}
			}
			else if (reaction.emoji.name == '⏭') {
				message.reactions.resolve('⏭').users.remove(user);
				if (current_page + 1 < pages.length) {
					message.edit(pages[pages.length - 1]);
					current_page = pages.length - 1;
				}
			}
			else if (reaction.emoji.name == '🛑') {
				if (message.deletable) message.delete();
			}
			else {
				message.reactions.resolve(reaction.emoji.name).users.remove(user);
			}
		})
		collector.on('end', () => {
			message.reactions.removeAll();
		})
		return message;
	}

	/**
 * 
 * @param reactions Reaction(s) to use as choice
 * @param timeout Time to wait for answer (ms)
 * @returns An emoji which user selected, returns null if time limit hit.
 */
	async confirm_click(title: string, description: string, reactions: EmojiResolvable[], textChannel: TextChannel, allowedUser: User, timeout?: number): Promise<{ message: Message; emoji: EmojiResolvable | null; }> {

		let return_value: { message: Message, emoji: EmojiResolvable | null };
		let embed = new MessageEmbed()
			.setTitle(title)
			.setDescription(description)
			.setColor(Util.yellow);
		if (timeout) {
			embed.setFooter(`You have ${timeout / 1000} seconds to respond.`);
		}

		await textChannel.send(embed).then(async (confirm_msg) => {
			reactions.forEach(reaction => {
				confirm_msg.react(reaction);
			})
			await confirm_msg.awaitReactions((reaction: MessageReaction, user: User) => reactions.includes(reaction.emoji.name) && user == allowedUser, { max: 1, time: timeout, errors: ['time'] })
				.then(collected => {
					// console.log(collected.first().emoji.name)
					// console.log(reactions)
					return_value = { message: confirm_msg, emoji: collected.first().emoji.name };
				}).catch(() => {
					if (timeout) {
						confirm_msg.edit(embed.setFooter('Time\'s up'));
						confirm_msg.reactions.removeAll();
					}
					return_value = { message: confirm_msg, emoji: null };
				})
		});
		return return_value;
	}


	confirm_type(prototype: MessageEmbed | MessageEmbedOptions, list: Array<any>, message: Message, prefix: string, text_to_display: (_: any) => string = (item) => item, is_delete = false): Promise<any> {
		let confirm = (resolve: (arg0: any) => void) => {
			const embed = new MessageEmbed(prototype);
			if (list.length <= 1) {
				resolve(list[0]);
				return list[0];
			}
			if (!embed.color) embed.setColor(Util.blue);
			if (!embed.footer) embed.setFooter(`Type ${prefix}cancel to cancel.`);

			let items: string[] = [];
			let i = 1;
			list.forEach((item) => {
				if (text_to_display) {
					items.push(`${Util.getNumberEmoji(i)} - ${text_to_display(item)}\n\n`);
				} else {
					items.push(`${Util.getNumberEmoji(i)} - ${item}\n\n`);
				}
				i++;
			})
			Util.sendEmbedPage(<TextChannel>message.channel, embed, '​', items)
				.then((confirm_msg) => {
					message.channel.awaitMessages(response => response.author.id == message.author.id, { max: 1 }).then((collected) => {
						const answer_msg = collected.first();
						if (confirm_msg.deleted) return undefined;

						if (answer_msg.content == prefix + 'cancel') {
							resolve(undefined);
							return undefined;
						}
						else if (!(Number(answer_msg.content) >= 1 && Number(answer_msg.content) <= list.length)) {
							if (confirm_msg.deletable) confirm_msg.delete();
							confirm_msg.channel.send(new MessageEmbed()
								.setDescription('Invalid answer, aborted.')
								.setColor(Util.red)
							).then(msg => { if (msg.deletable) msg.delete({ timeout: 10000 }) })
							resolve(undefined);
							return undefined;
						}
						else {
							let result = Array.from(list.keys())[Number(answer_msg.content) - 1];
							if (confirm_msg.deletable) confirm_msg.delete();
							if (answer_msg.deletable) answer_msg.delete();
							console.log(result)
							resolve(list[result]);
							return list[result];
						}
					});
				})
			if (is_delete && message.deletable) message.delete();
		}
		return new Promise(confirm);
	}
}


export const Util = new UtilClass();