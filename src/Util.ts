import { exec } from 'child_process';
import fs from 'fs';
import yaml from 'js-yaml';
import { TextChannel, MessageEmbed, MessageReaction, User } from 'discord.js';

var config = yaml.safeLoad(fs.readFileSync('./settings/config.yml', 'utf8'));

class UtilClass {

	red = config['colors']['red'];
	green = config['colors']['green'];
	blue = config['colors']['blue'];
	yellow = config['colors']['yellow'];

	inlineCodeBlock(content: string) {
		return `\`\`${content.replace(/`/g, '‎`‎')}\`\``;
	}

	refreshIp(): Promise<string> {
		// Get IP 
		return new Promise((resolve, _reject) => {
			exec('dig +short -4 myip.opendns.com @resolver1.opendns.com', (err, stdout, stderr) => {
				if (err) {
					console.warn(err);
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
		return message;
	}
}

export const Util = new UtilClass();