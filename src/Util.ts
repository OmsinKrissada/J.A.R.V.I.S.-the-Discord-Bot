import { exec } from 'child_process';

export class Util {

	static red = 0xff0000
	static green = 0x00ff00
	static blue = 0x4287f5
	static yellow = 0xebc934

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
}