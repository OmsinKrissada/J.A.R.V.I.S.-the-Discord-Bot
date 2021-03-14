import { exec } from 'child_process';
import { TextChannel, MessageEmbed, MessageReaction, User, EmojiResolvable, Message, MessageEmbedOptions, Guild, GuildMember, Channel } from 'discord.js';
import moment from 'moment';
import CONFIG from './ConfigManager';
import { logger } from './Logger';
import { bot } from './Main';

class HelperClass {

	readonly ZERO_WIDTH = '​';

	readonly RED = CONFIG.colors.red;
	readonly GREEN = CONFIG.colors.green;
	readonly BLUE = CONFIG.colors.blue;
	readonly YELLOW = CONFIG.colors.yellow;
	readonly AQUA = CONFIG.colors.aqua;

	inlineCodeBlock(content: string) {
		return `\`\`${content.replace(/`/g, '‎`‎')}\`\``;
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
		if (percent < 0 || percent > 100) {
			logger.warn(`Received invalid percent for progress bar (${percent}), the behavior may be unpredictable.`)
			// throw { name: 'RangeError', message: 'percent field must fall between 0 to 100' };
		}
		let show = Math.round(percent / 100 * length);
		let progress = '';
		for (let i = 0; i < show - 1; i++) {
			progress += '━';
		}
		progress += '⚪'
		for (let i = 0; i < length - show; i++) {
			progress += '─';
		}
		// console.log(progress)
		return (progress[0] == '⚪' ? '`|' : '`┝') + progress + (progress[progress.length - 1] == '⚪' ? '|`' : '┤`');
	}

	prettyTime(seconds: number) {
		const duration = moment.duration(seconds, 'seconds');

		const hours = Math.floor(duration.hours());
		const mins = duration.minutes();
		const secs = duration.seconds();
		return `\`${hours > 0 ? hours + ':' : ''}${mins}:${Helper.min2(secs)}\``;
	}

	fullDurationString(duration: moment.Duration) {
		let str = '';
		const days = Math.floor(duration.asDays());
		const hours = duration.hours();
		const mins = duration.minutes();
		const secs = duration.seconds();
		if (days) str += `${days} day${days > 1 ? 's' : ''} `;
		if (hours) str += `${hours} hour${hours > 1 ? 's' : ''} `;
		if (mins) str += `${mins} minute${mins > 1 ? 's' : ''} `;
		if (secs) str += `${secs} second${secs > 1 ? 's' : ''}`;
		return str.trimEnd();
	}


	shuffle(array: Array<any>): any[] {
		let shuffledArray: any[] = [];
		while (array.length > 0) {
			let index = Math.floor(Math.random() * array.length);
			// console.log(index)
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

			if (value[0].length > 1024) { // Catch when value tooooo long
				logger.error(`Cannot split value in page feature: length exceeds 1024 (${value[0].length})`);
				break;
			}

			for (let i = 0; value.length > 0 && val.length + value[0].length <= 1024; i++) {
				val += value.shift() + (inline ? '' : '\n');
			}

			if (val.length > 0) page.addFields({ name: name, value: val });
			pages.push(page);
		}

		let pagenum = 1;
		pages.forEach(page => {
			page.setFooter(page.footer ? page.footer.text + `\nPage ${pagenum++} / ${pages.length}` : `Page ${pagenum++} / ${pages.length} `);
		})


		let current_page = 0;
		const message = await textChannel.send(pages[0]);

		if (pages.length > 1) {
			if (pages.length > 2) message.react('⏮').catch(() => { });
			message.react('◀').catch(() => { });
			message.react('▶').catch(() => { });
			if (pages.length > 2) message.react('⏭').catch(() => { });
		}


		const collector = message.createReactionCollector((_reaction: MessageReaction, user: User) => !user.bot, { time: 1000000 })
		collector.on('collect', (reaction, user) => {
			if (reaction.emoji.name == '◀') {
				message.reactions.resolve('◀')!.users.remove(user);
				if (current_page + 1 > 1) {
					message.edit(pages[--current_page]);
				}
			}
			else if (reaction.emoji.name == '▶') {
				message.reactions.resolve('▶')!.users.remove(user);
				if (current_page + 1 < pages.length) {
					message.edit(pages[++current_page]);
				}
			}
			else if (reaction.emoji.name == '⏮') {
				message.reactions.resolve('⏮')!.users.remove(user);
				if (current_page + 1 > 1) {
					message.edit(pages[0]);
					current_page = 0;
				}
			}
			else if (reaction.emoji.name == '⏭') {
				message.reactions.resolve('⏭')!.users.remove(user);
				if (current_page + 1 < pages.length) {
					message.edit(pages[pages.length - 1]);
					current_page = pages.length - 1;
				}
			}
			else if (reaction.emoji.name == '📄') {
				message.reactions.resolve('📄')!.users.remove(user);
				message.channel.send(new MessageEmbed({ author: { name: 'Type page number in chat >>>', iconURL: user.displayAvatarURL() } })).then(ask4pagemsg => {
					message.channel.awaitMessages((responsemsg: Message) => responsemsg.author.id == user.id, { max: 1, time: 60000 }).then(msg => {
						const text = msg.first().content;
						if (!isNaN(+text) && +text >= 1 && +text <= pages.length) {
							message.edit(pages[+text - 1])
						} else {
							msg.first().reply('Unknown page').then(unknownmsg => unknownmsg.delete({ timeout: 5000 }));
						}
						(<TextChannel>message.channel).bulkDelete([ask4pagemsg, msg.first()])
						msg.first().delete();
					}).finally(() => {
						if (!ask4pagemsg.deleted) ask4pagemsg.delete();
					});
				});
			}
			else {
				message.reactions.resolve(reaction.emoji.name)!.users.remove(user);
			}
		})
		collector.on('end', () => {
			message.reactions.removeAll().catch(() => { });
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
			.setColor(Helper.YELLOW);
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
					return_value = { message: confirm_msg, emoji: collected.first()!.emoji.name };
				}).catch(() => {
					if (timeout) {
						confirm_msg.edit(embed.setFooter('Time\'s up'));
						confirm_msg.reactions.removeAll();
					}
					return_value = { message: confirm_msg, emoji: null };
				})
		});
		return return_value!;
	}


	async confirm_type(title: string, list: any[], caller: User, channel: TextChannel, displayingFunction: (_: any) => string = (item) => item): Promise<typeof list[0] | null> {
		const embed = new MessageEmbed({ author: { name: title, iconURL: caller.displayAvatarURL() } });
		if (list.length <= 1) {
			return list[0];
		}
		if (!embed.color) embed.setColor(Helper.BLUE);
		if (!embed.footer) embed.setFooter(`Type "cancel" to cancel.`);

		let items: string[] = [];
		let i = 1;
		list.forEach((item) => {
			if (displayingFunction) {
				items.push(`\`${i}\` - ${displayingFunction(item)}`);
			} else {
				items.push(`\`${i}\` - ${item}`);
			}
			i++;
		})
		const confirm_msg = await Helper.sendEmbedPage(<TextChannel>channel, embed, '​', items)
		const collected = await channel.awaitMessages(response => response.author.id == caller.id, { max: 1 });

		const answer_msg = collected.first()!;

		if (channel instanceof TextChannel) channel.bulkDelete([confirm_msg, answer_msg]);

		if (answer_msg.content.toLowerCase() == 'cancel') {
			channel.send(new MessageEmbed({
				title: `Canceled`,
				color: Helper.RED
			}));
			return null;
		}
		else if (!(Number(answer_msg.content) >= 1 && Number(answer_msg.content) <= list.length)) {
			channel.send(new MessageEmbed({
				description: `Invalid index (${Helper.inlineCodeBlock(answer_msg.content)}), aborted.`,
				color: Helper.RED
			}));
			return null;
		}
		else {
			const result = list[Number(answer_msg.content) - 1];
			return result;
		}
	}

	/**
	 * 
	 * @param resolvable 
	 * @param options If provided, this will also search for matching user in the list.
	 */
	async resolveUser(resolvable: string, options?: GuildAliasOption): Promise<User | undefined> {
		resolvable = resolvable.replace(/<|@|!|>/g, '');
		if (!isNaN(+resolvable)) {
			try {
				return await bot.users.fetch(resolvable);
			} catch (err) {
				return null;
			}
		}

		if (options) {
			const users = options.memberList.filter(member => member.displayName.toLowerCase().includes(resolvable.toLowerCase()) || member.user.username.toLowerCase().includes(resolvable.toLowerCase()));
			if (users.length > 0) {
				const member = await Helper.confirm_type(`Who is "${resolvable}" being refered to? \n(type in chat)`, users, options.caller, options.askingChannel)
				return member?.user ?? null;
			}
		}
	}


}

interface GuildAliasOption {
	caller: User;
	askingChannel: TextChannel;
	memberList: GuildMember[];
}

export const Helper = new HelperClass();