const { exec } = require('child_process');

class Util {

	red = 0xff0000
	green = 0x00ff00
	blue = 0x4287f5
	yellow = 0xebc934

	inlineCodeBlock(content) {
		return `\`\`${content.replace(/`/g, '‎`‎')}\`\``;
	}

	refreshIp() {
		// Get IP 
		return new Promise((resolve, reject) => {
			exec('dig +short myip.opendns.com @resolver1.opendns.com', (err, stdout, stderr) => {
				if (err) {
					console.warn(err);
				}
				resolve(stdout ? stdout : stderr);
			});
		});
	}

	getDateTimeString(date) {
		return `${date.getDate().min2()}/${date.getMonth().min2()}/${date.getFullYear().min2()}-${date.getHours().min2()}:${date.getMinutes().min2()}:${date.getSeconds().min2()}`;
	}

	min2() {
		return ('0' + this).slice(-2);
	}
}

module.exports = new Util;