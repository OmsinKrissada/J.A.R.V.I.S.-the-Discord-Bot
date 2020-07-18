import { exec } from 'child_process';
import fs from 'fs';
import yaml from 'js-yaml';

var config = yaml.safeLoad(fs.readFileSync('./settings/config.yml', 'utf8'));

export class Util {

	static red = config['colors']['red'];
	static green = config['colors']['green'];
	static blue = config['colors']['blue'];
	static yellow = config['colors']['yellow'];

	static inlineCodeBlock(content: string) {
		return `\`\`${content.replace(/`/g, '‎`‎')}\`\``;
	}

	static refreshIp(): Promise<string> {
		// Get IP 
		return new Promise((resolve, _reject) => {
			exec('dig +short myip.opendns.com @resolver1.opendns.com', (err, stdout, stderr) => {
				if (err) {
					console.warn(err);
				}
				resolve(stdout ? stdout : stderr);
			});
		});
	}

	static getDateTimeString(date: Date) {
		return `${Util.min2(date.getDate())}/${Util.min2(date.getMonth())}/${Util.min2(date.getFullYear())}-${Util.min2(date.getHours())}:${Util.min2(date.getMinutes())}:${Util.min2(date.getSeconds())}`;
	}

	static min2(num: number) {
		return ('0' + num).slice(-2);
	}

	static getNumberEmoji(integer: number) {
		let numberstr = {
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
	static progressBar(percent: number, length = 30): string {
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
		return progress;
	}

	static prettyTime(seconds: number): string {
		return `${Util.min2(Math.floor(seconds / 60))}:${Util.min2(seconds % 60)}`
	}
}