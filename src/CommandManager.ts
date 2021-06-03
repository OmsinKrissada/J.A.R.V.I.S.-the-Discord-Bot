import { Message, MessageEmbed, Permissions, PermissionString } from "discord.js";
import fs from 'fs';
import path from 'path';
import { settings } from './DBManager';
import { bot } from './Main';

import { Helper } from './Helper';
import { logger } from './Logger';


export const CommandMap = new Map<string, Command>();
export type CommandCategory = "general" | "settings" | "features" | "music" | "misc" | "hiden" | "moderation";
interface IConstructor {
	name: string;
	displayName?: string;
	description: string;
	examples: string[];
	category: CommandCategory;
	serverOnly: boolean;
	requiredCallerPermissions: PermissionString[];
	requiredSelfPermissions: PermissionString[];
	exec: (message: Message, prefix: string, args: string[], sourceID: string) => void;
}

export class Command {
	constructor({ name, displayName, description, examples, category, serverOnly: serverOnly, requiredCallerPermissions: requiredCallerPermissions, requiredSelfPermissions: requiredSelfPermissions, exec }: IConstructor) {

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
				logger.info('Loading ' + file)
				await import(path.join(__dirname, 'modules', file))
			} catch (err) {
				logger.error(`Failed to load "${file}":\n${err.stack}`);
			}
		}

		logger.info('All modules were loaded.');
	});
}


export function sanitize(input: string) {

}

export async function run(command_name: string, args: string[], { message: sourcemsg, prefix, sourceID }: { message: Message, prefix: string, sourceID: string }) {
	prefix = (await settings.get(sourceID, ["prefix"])).prefix;
	if (CommandMap.has(command_name)) { // check exist
		const command = CommandMap.get(command_name)!;

		let nocallerperm: PermissionString[] = [];
		let noselfperm: PermissionString[] = [];
		if (sourcemsg.guild) {
			command.requiredCallerPermissions.forEach(perm => {
				if (!sourcemsg.member!.permissionsIn(sourcemsg.channel).has(perm))
					nocallerperm.push(perm);
			})
			// command.requiredSelfPermissions.push('VIEW_CHANNEL');
			command.requiredSelfPermissions.forEach(perm => {
				if (!sourcemsg.guild.me!.permissionsIn(sourcemsg.channel).has(perm))
					noselfperm.push(perm);
			})
			nocallerperm = sourcemsg.member!.permissionsIn(sourcemsg.channel).missing(command.requiredCallerPermissions)
			noselfperm = sourcemsg.guild!.me!.permissionsIn(sourcemsg.channel).missing(command.requiredSelfPermissions)
		}

		if (command.serverOnly && sourcemsg.guild === null) { // check DM
			sourcemsg.channel.send(new MessageEmbed({
				title: 'Not available in DM',
				description: `Sorry, this command can only be used in servers.`,
				color: Helper.RED
			}));
		} else if (nocallerperm.length + noselfperm.length > 0) {
			if (nocallerperm.length > 0) {
				sourcemsg.channel.send(new MessageEmbed({
					author: { name: 'You don\'t have enough permission', iconURL: sourcemsg.author.displayAvatarURL()! },
					description: `Lacking permission${nocallerperm.length > 1 ? 's' : ''}: ` + nocallerperm.map(perm => `\`${(perm)}\``).join(', '),
					color: Helper.RED
				}))
				return;

			} else if (noselfperm.length > 0) {
				if (noselfperm.includes('SEND_MESSAGES')) {
					logger.warn('No SEND_MESSAGE permission in channel ' + sourcemsg.channel.id);
					return;
				}
				if (noselfperm.includes('VIEW_CHANNEL')) {
					logger.warn
				}
				else sourcemsg.channel.send(new MessageEmbed({
					author: { name: 'I don\'t have enough permission', iconURL: bot.user!.displayAvatarURL()! },
					description: `Lacking permission${noselfperm.length > 1 ? 's' : ''}: ` + noselfperm.map(perm => `\`${(perm)}\``).join(', '),
					color: Helper.RED
				}));
				return;
			}
		} else {
			command.exec(sourcemsg, prefix, args, sourceID);
		}
	} else if (command_name != 'cancel' && (await settings.get(sourceID, ["warnUnknownCommand"])).warnUnknownCommand)
		sourcemsg.channel.send(new MessageEmbed({
			title: 'Unknown Command',
			description: `Invalid command, type ${Helper.inlineCodeBlock(`${prefix}help`)} for list of commands.`,
			color: Helper.RED
		}));
}