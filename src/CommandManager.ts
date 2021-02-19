import { Message, MessageEmbed, Permissions, PermissionString } from 'discord.js';
import fs from 'fs';
import path from 'path';
import DataManager from './DataManager';
import { bot } from './Main';

import { Helper } from './Helper';


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
		this.displayName = displayName ? displayName : name;
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

	static readonly bot = bot;

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
fs.readdir(path.join(__dirname, 'commands'), (err, files) => {
	if (err) console.error(err);
	files.forEach(file => {
		import(path.join(__dirname, 'commands', file))
			.then(() => console.log('Loaded ' + file))
			.catch(err => {
				console.error(`\x1b[31mERROR: ${err}\x1b[0m`);
				console.error('\x1b[36mExiting process ...\x1b[0m');
				process.exit();
			})
	});
	console.log('');
});


export function sanitize(input: string) {

}

export async function run(command_name: string, args: string[], { message: sourcemsg, prefix, sourceID }: { message: Message, prefix: string, sourceID: string }) {
	prefix = (await DataManager.get(sourceID)).prefix;
	// console.log('checking for ' + command_name)
	if (CommandMap.has(command_name)) { // check exist
		const command = CommandMap.get(command_name)!;

		let nocallerperm: PermissionString[] = [];
		let noselfperm: PermissionString[] = [];
		if (sourcemsg.guild) {
			command.requiredCallerPermissions.forEach(perm => {
				if (!sourcemsg.member!.permissionsIn(sourcemsg.channel).has(perm))
					nocallerperm.push(perm);
			})
			command.requiredSelfPermissions.forEach(perm => {
				if (!sourcemsg.guild!.me!.permissionsIn(sourcemsg.channel).has(perm))
					noselfperm.push(perm);
			})
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
					description: `You are lacking permission${nocallerperm.length > 1 ? 's' : ''}: ` + nocallerperm.map(perm => `\`${(perm)}\``).join(', '),
					color: Helper.RED
				}))
				return;

			} else if (noselfperm.length > 0) {
				if (noselfperm.includes('SEND_MESSAGES')) console.log('No SEND_MESSAGE permission in channel ' + sourcemsg.channel.id)
				else sourcemsg.channel.send(new MessageEmbed({
					author: { name: 'I don\'t have enough permission', iconURL: Command.bot.user!.displayAvatarURL()! },
					description: `I am lacking permission${noselfperm.length > 1 ? 's' : ''}: ` + noselfperm.map(perm => `\`${(perm)}\``).join(', '),
					color: Helper.RED
				}));
				return;
			}
		} else {
			command.exec(sourcemsg, prefix, args, sourceID);
		}
	} else if (command_name != 'cancel' && (await DataManager.get(sourceID)).settings.warnUnknownCommand)
		sourcemsg.channel.send(new MessageEmbed({
			title: 'Unknown Command',
			description: `Invalid command, type ${Helper.inlineCodeBlock(`${prefix}help`)} for list of commands.`,
			color: Helper.RED
		}));
}