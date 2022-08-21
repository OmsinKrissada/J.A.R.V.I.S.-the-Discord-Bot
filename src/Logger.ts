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
				const [group, message] = log.message.split(':group:');
				return `${log.level}${group ? ':' + group : ''} ${message}`;
			})
		);
		const file_format = winston.format.combine(
			winston.format.timestamp({
				format: "isoDateTime",
			}),
			winston.format.printf(log => {
				if (log.exception) return `${log.timestamp} ${log.level.toUpperCase()} ${log.stack}`.replace(/\[\d\dm/g, '');
				const [group, message] = log.message.split(':group:');
				return `${log.timestamp} ${log.level.toUpperCase()}${group ? ':' + group : ''} ${message}`.replace(/\[\d\dm/g, '');
			})
		);

		this.internal_logger = winston.createLogger({
			transports: [
				new winston.transports.Console({
					level: 'info',
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
			exitOnError: true,
		});
	}

	private getGroupColor(group: string) {
		if (group == 'prisma') return chalk.cyanBright(group);
		if (group == 'lavalink') return chalk.magentaBright(group);
		return chalk.gray(group);
	}

	info(message: any, group = '') {
		this.internal_logger.info(`${this.getGroupColor(group)}:group:${message}`);
	}
	warn(message: any, group = '') {
		this.internal_logger.warn(`${this.getGroupColor(group)}:group:${message}`);
	}
	error(message: any, group = '') {
		this.internal_logger.error(`${this.getGroupColor(group)}:group:${message}`);
	}
	debug(message: any, group = '') {
		this.internal_logger.debug(`${this.getGroupColor(group)}:group:${message}`);
	}
	query(message: any, group = '') {
		this.internal_logger.debug(`${group}:group:${message}`);
	}
}

export const logger = new LoggerClass();