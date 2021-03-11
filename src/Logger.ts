import winston, { format } from 'winston';
import chalk from 'chalk';

class LoggerClass {
	private readonly internal_logger: winston.Logger;

	constructor() {
		const coloredLevelString = (level: string) => {
			if (level == 'info') return chalk.greenBright('INFO');
			if (level == 'warn') return chalk.yellowBright('WARN');
			if (level == 'error') return chalk.redBright('ERROR');
			if (level == 'debug') return chalk.cyanBright('DEBUG');
			return level;
		}
		const format = winston.format.combine(
			winston.format.timestamp({
				format: "HH:MM:SS"
			}),
			winston.format.printf(
				log => chalk`${coloredLevelString(log.level)} {grey ${log.timestamp}} {white ${(log.message)}}`
			))

		this.internal_logger = winston.createLogger({
			transports: [
				new winston.transports.Console({ level: 'debug' }),
			],
			exceptionHandlers: [
				new winston.transports.File({ filename: '/logs/exceptions.log' }),
				new winston.transports.Console(),
			],
			format: format,
		});
	}


	info(message: string) {
		this.internal_logger.info(message)
	}
	warn(message: string) {
		this.internal_logger.warn(message)
	}
	error(message: string) {
		this.internal_logger.error(message)
	}
	debug(message: string) {
		this.internal_logger.debug(message)
	}
}

export const logger = new LoggerClass();