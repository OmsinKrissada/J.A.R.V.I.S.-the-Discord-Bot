import { Message, MessageEmbed, Permissions, PermissionString } from 'discord.js';
import fs from 'fs';
import path from 'path';
import * as DataManager from './DataManager';
import { bot } from './Main';

import { Util } from './Helper';


export const CommandMap = new Map<string, Command>();
export type CommandCategory = "general" | "settings" | "features" | "music" | "misc" | "hiden";
interface IConstructor {
	name: string;
	displayName?: string;
	description: string;
	examples: string[];
	category: CommandCategory;
	serverOnly: boolean;
	requiredCallerPermissions: PermissionString[];
	exec: (message: Message, prefix: string, args: string[], sourceID: string) => void;
}

export class Command {
	constructor({ name, displayName, description, examples, category, serverOnly: serverOnly, requiredCallerPermissions: requiredCallerPermissions, exec }: IConstructor) {

		// set values
		this.name = name;
		this.displayName = displayName ? displayName : name;
		this.description = description;
		this.examples = examples;
		this.category = category;
		this.serverOnly = serverOnly;
		this.requiredCallerPermissions = requiredCallerPermissions;
		this.exec = exec;

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

	readonly exec: (message: Message, prefix: string, args: string[], sourceID: string) => void;
}

// loads commands
fs.readdir(path.join(__dirname, 'commands'), (err, files) => {
	if (err) console.error(err);
	files.forEach(file => {
		import(path.join(__dirname, 'commands', file)).then(() => console.log('Loaded ' + file))
		// console.log('Requested to register ' + file);
	});
	console.log('');
});


export function sanitize(input: string) {

}

export async function run(command_name: string, args: string[], { message: sourcemsg, prefix, sourceID }: { message: Message, prefix: string, sourceID: string }) {
	prefix = (await DataManager.get(sourceID)).prefix;
	console.log('checking for ' + command_name)
	if (CommandMap.has(command_name)) { // check exist
		const command = CommandMap.get(command_name);

		let noperm: PermissionString[] = [];
		command.requiredCallerPermissions.forEach(perm => {
			if (!sourcemsg.member.permissions.has(perm))
				noperm.push(perm);
		})

		if (command.serverOnly && sourcemsg.guild === null) { // check DM
			sourcemsg.channel.send(new MessageEmbed()
				.setTitle('Not available in DM')
				.setDescription(`Sorry, this command can only be used in servers.`)
				.setColor(Util.red));
		} else if (command.requiredCallerPermissions.length == 0 || noperm.length == 0) {
			command.exec(sourcemsg, prefix, args, sourceID);
		} else {
			sourcemsg.channel.send(new MessageEmbed()
				.setTitle('You don\'t have enough permission')
				.setDescription(`You are lacking permission${noperm.length > 1 ? 's' : ''}: ` + noperm.map(perm => `\`${(perm)}\``).join(', '))
				.setColor(Util.red));
		}
	} else if (command_name != 'cancel' && (await DataManager.get(sourceID)).settings.warnUnknownCommand)
		sourcemsg.channel.send(new MessageEmbed()
			.setTitle('Unknown Command')
			.setDescription(`Invalid command, type ${Util.inlineCodeBlock(`${prefix}help`)} for list of commands.`)
			.setColor(Util.red));
}