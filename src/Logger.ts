import winston from 'winston';
import chalk from 'chalk';
import fs from 'fs';
import linereader from 'n-readlines';

// Checks if file directory exists, if not, creates them.
if (!fs.existsSync('./logs')) {
	fs.mkdirSync('./logs');
}

// renames latest.log to its appropriate name
if (fs.existsSync('./logs/latest.log')) {
	const reader = new linereader('./logs/latest.log');
	const filename = './logs/' + reader.next().toString().substr(2) + '.log';
	if (reader.next())
		fs.renameSync('./logs/latest.log', filename.replace(/:/g, '-'));
	else fs.rmSync('./logs/latest.log');
}


var logfile = fs.createWriteStream(`./logs/latest.log`, { encoding: 'utf-8' });


logfile.write('# ' + new Date().toISOString() + '\n');

class LoggerClass {
	private readonly internal_logger: winston.Logger;

	constructor() {
		const coloredLevelString = (level: string) => {
			if (level == 'info') return chalk.greenBright('INFO');
			if (level == 'warn') return chalk.yellowBright('WARN');
			if (level == 'error') return chalk.redBright('ERROR');
			if (level == 'debug') return chalk.cyanBright('DEBUG');
			return level;
		};
		const console_format = winston.format.combine(
			winston.format.timestamp({
				format: "HH:mm:ss"
			}),
			winston.format.printf(
				log => chalk`${coloredLevelString(log.level)} {grey ${log.timestamp}} {white ${(log.message)}}`
			));
		const file_format = winston.format.combine(
			winston.format.timestamp({
				format: "isoDateTime",
			}),
			winston.format.printf(
				log => `${log.level.toUpperCase()} ${log.timestamp} ${(log.message)}`.replace(/\[\d\dm/g, '')
			));

		this.internal_logger = winston.createLogger({
			transports: [
				new winston.transports.Console({ level: 'debug', format: console_format, handleExceptions: false }),
				new winston.transports.File({ level: 'debug', filename: './logs/latest.log', format: file_format, handleExceptions: true }),
			],
			exitOnError: false,
		});
	}


	info(message: string) {
		this.internal_logger.info(message);
	}
	warn(message: string) {
		this.internal_logger.warn(message);
	}
	error(message: string) {
		this.internal_logger.error(message);
	}
	debug(message: string) {
		this.internal_logger.debug(message);
	}
}

export const logger = new LoggerClass();