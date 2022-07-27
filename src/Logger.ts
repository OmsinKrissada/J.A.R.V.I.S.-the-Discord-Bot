import chalk from 'chalk';
import fs from 'fs';
import winston from 'winston';
import { createGzip } from 'zlib';
import { gracefulExit } from './Main';

// Checks if file directory exists, if not, create them.
if (!fs.existsSync('./logs')) {
	fs.mkdirSync('./logs');
}

// Renames latest.log to its datetime name, then compressses it.
if (fs.existsSync('./logs/latest.log')) {
	const newFilename = `./logs/${fs.statSync('./logs/latest.log').ctime.toISOString().replace(/:/g, '_')}.log`;
	fs.renameSync('./logs/latest.log', newFilename);
	const gzip = createGzip();
	fs.createReadStream(newFilename).pipe(gzip).pipe(fs.createWriteStream(newFilename + '.gz')).once('finish', () => fs.rmSync(newFilename));
}

class LoggerClass {
	private readonly internal_logger: winston.Logger;

	constructor() {
		const coloredLevelString = (level: string) => {
			if (level == 'info') return chalk.greenBright('info');
			if (level == 'warn') return chalk.yellowBright('warn');
			if (level == 'error') return chalk.redBright('error');
			if (level == 'debug') return chalk.cyanBright('debug');
			return level;
		};
		const console_format = winston.format.combine(
			winston.format.timestamp({
				format: "HH:mm:ss"
			}),
			winston.format.colorize(),
			winston.format.printf(log => {
				if (log.exception) {
					gracefulExit('ERROR');
					return `${log.timestamp} ${log.level} ${log.stack}`;
				}
				return `${log.timestamp} ${log.level} ${log.message}`;
			})
		);
		const file_format = winston.format.combine(
			winston.format.timestamp({
				format: "isoDateTime",
			}),
			winston.format.printf(log => {
				if (log.exception) return `${log.timestamp} ${log.level.toUpperCase()} ${log.stack}`.replace(/\[\d\dm/g, '');
				return `${log.timestamp} ${log.level.toUpperCase()} ${log.message}`.replace(/\[\d\dm/g, '');
			})
		);

		this.internal_logger = winston.createLogger({
			transports: [
				new winston.transports.Console({
					level: 'debug',
					format: console_format,
					handleExceptions: true,
				}),
				new winston.transports.File({
					level: 'debug',
					filename: './logs/latest.log',
					format: file_format,
					handleExceptions: true
				}),
			],
			// exceptionHandlers: [
			// 	new winston.transports.Console({
			// 		// filename: './logs/exceptions.log',
			// 		level: 'debug',
			// 		format: console_format,
			// 		handleExceptions: true,
			// 	}),
			// ],
			// rejectionHandlers: [
			// 	new winston.transports.Console({
			// 		// filename: './logs/exceptions.log',
			// 		level: 'debug',
			// 		format: console_format,
			// 		handleExceptions: true,
			// 	}),
			// ],

			exitOnError: true,
		});
	}


	info(message: any) {
		this.internal_logger.info(message);
	}
	warn(message: any) {
		this.internal_logger.warn(message);
	}
	error(message: any) {
		this.internal_logger.error(message);
	}
	debug(message: any) {
		this.internal_logger.debug(message);
	}
}

export const logger = new LoggerClass();