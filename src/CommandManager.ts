import { Guild, Message, MessageEmbed, PermissionString } from "discord.js";
import fs from 'fs';
import path from 'path';
import { bot } from './Main';

import { inlineCodeBlock, RED } from './Helper';
import { logger } from './Logger';
import ConfigManager from "./ConfigManager";
import { getGuildSettings } from "./DBManager";


export const CommandMap = new Map<string, Command>();
export type CommandCategory = "general" | "settings" | "features" | "music" | "misc" | "hidden" | "moderation";
interface IConstructor {
	name: string;
	displayName?: string;
	description: string;
	examples: string[];
	category: CommandCategory;
	serverOnly: false;
	requiredCallerPermissions: PermissionString[];
	requiredSelfPermissions: PermissionString[];
	exec: (message: Message, prefix: string, args: string[], sourceID: string) => void;
}
interface IConstructorInServer {
	name: string;
	displayName?: string;
	description: string;
	examples: string[];
	category: CommandCategory;
	serverOnly: true;
	requiredCallerPermissions: PermissionString[];
	requiredSelfPermissions: PermissionString[];
	exec: (message: Message & { guild: Guild; }, prefix: string, args: string[], sourceID: string) => void;
}

export class Command {
	constructor({ name, displayName, description, examples, category, serverOnly: serverOnly, requiredCallerPermissions: requiredCallerPermissions, requiredSelfPermissions: requiredSelfPermissions, exec }: IConstructor | IConstructorInServer) {

		// set values
		this.name = name;
		this.displayName = displayName ?? name;
		this.description = description;
		this.examples = examples;
		this.category = category;
		this.serverOnly = serverOnly;
		this.requiredCallerPermissions = requiredCallerPermissions;
		this.requiredSelfPermissions = requiredSelfPermissions;
		this.exec = exec;

		if (CommandMap.has(name)) {
			throw "Conflicted command names";
		}
		CommandMap.set(name, this); // Do not forget about this ...
	}

	readonly name: string;
	readonly displayName: string;
	readonly description: string;
	readonly examples: string[];
	readonly category: CommandCategory;
	readonly serverOnly: boolean;
	readonly requiredCallerPermissions: PermissionString[];
	readonly requiredSelfPermissions: PermissionString[];

	readonly exec: (message: Message, prefix: string, args: string[], sourceID: string) => void;
}

// loads commands
export function loadModules() {
	fs.readdir(path.join(__dirname, 'modules'), async (err, files) => {
		if (err) logger.error(err.stack);
		for (const file of files) {
			try {
				logger.info('Loading ' + file);
				await import(`./modules/${file}`);
			} catch (err) {
				logger.error(`Failed to load "${file}":\n${err.stack}`);
			}
		}

		logger.info('All modules were loaded.');
	});
}


export function sanitize(input: string) {

}

export async function run(command_name: string, args: string[], { message: message, prefix, sourceID }: { message: Message, prefix: string, sourceID: string; }) {
	if (!CommandMap.has(command_name)) { // check exist
		if ((await getGuildSettings(sourceID)).warnUnknownCommand && command_name != 'cancel')
			message.channel.send(new MessageEmbed({
				title: 'Unknown Command',
				description: `Invalid command, type ${inlineCodeBlock(`${prefix}help`)} for list of commands.`,
				color: RED
			}));
		return;
	}

	const command = CommandMap.get(command_name)!;

	let nocallerperm: PermissionString[] = [];
	let noselfperm: PermissionString[] = [];
	if (message.guild) {
		command.requiredCallerPermissions.forEach(perm => {
			if (!message.member.permissionsIn(message.channel).has(perm))
				nocallerperm.push(perm);
		});
		// command.requiredSelfPermissions.push('VIEW_CHANNEL');
		command.requiredSelfPermissions.forEach(perm => {
			if (!message.guild.me.permissionsIn(message.channel).has(perm))
				noselfperm.push(perm);
		});
		nocallerperm = message.member!.permissionsIn(message.channel).missing(command.requiredCallerPermissions);
		noselfperm = message.guild!.me!.permissionsIn(message.channel).missing(command.requiredSelfPermissions);
	}

	if (command.serverOnly && message.guild === null) { // check DM
		message.channel.send(new MessageEmbed({
			title: 'Not available in DM',
			description: `Sorry, this command can only be used in servers.`,
			color: RED
		}));
	} else if (nocallerperm.length + noselfperm.length > 0) {
		if (nocallerperm.length > 0) {
			message.channel.send(new MessageEmbed({
				author: { name: 'You don\'t have enough permission', iconURL: message.author.displayAvatarURL()! },
				description: `Lacking permission${nocallerperm.length > 1 ? 's' : ''}: ` + nocallerperm.map(perm => `\`${(perm)}\``).join(', '),
				color: RED
			}));
			return;

		} else if (noselfperm.length > 0) {
			if (noselfperm.includes('SEND_MESSAGES')) {
				logger.warn('No SEND_MESSAGE permission in channel ' + message.channel.id);
				return;
			}
			if (noselfperm.includes('VIEW_CHANNEL')) {
				logger.warn;
			}
			else message.channel.send(new MessageEmbed({
				author: { name: 'I don\'t have enough permission', iconURL: bot.user!.displayAvatarURL()! },
				description: `Lacking permission${noselfperm.length > 1 ? 's' : ''}: ` + noselfperm.map(perm => `\`${(perm)}\``).join(', '),
				color: RED
			}));
			return;
		}
	} else {
		if (ConfigManager.disableMusic && command.category === 'music') {
			message.channel.send('Music feature is temporary unavailable, sorry for your inconvenience.');
			return;
		}

		command.exec(message, prefix, args, sourceID);
	}
} 