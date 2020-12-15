import { Message, MessageEmbed, Permissions } from 'discord.js';
import fs from 'fs';
import path from 'path';
import * as DataManager from './DataManager';
import { bot } from './Main';

import { Util } from './Util';


export const CommandMap = new Map<string, Command>();
export type CommandCategory = "general" | "settings" | "features" | "music" | "misc" | "hiden";
interface IConstructor {
	name: string;
	displayName?: string;
	description: string;
	examples: string[];
	category: CommandCategory;
	serverOnly: boolean;
	requiredPermissions: number[];
	exec: (message: Message, prefix: string, args: string[], sourceID: string) => void;
}

export class Command {
	constructor({ name, displayName, description, examples, category, serverOnly: serverOnly, requiredPermissions, exec }: IConstructor) {

		// set values
		this.name = name;
		this.displayName = displayName ? displayName : name;
		this.description = description;
		this.examples = examples;
		this.category = category;
		this.serverOnly = serverOnly;
		this.requiredPermissions = requiredPermissions;
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
	readonly requiredPermissions: number[];

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

export async function run(command: string, args: string[], { message, prefix, sourceID }: { message: Message, prefix: string, sourceID: string }) {
	prefix = (await DataManager.get(sourceID)).prefix;
	console.log('checking for ' + command)
	if (CommandMap.has(command)) {
		CommandMap.get(command).exec(message, prefix, args, sourceID);
	} else if (command != 'cancel' && (await DataManager.get(sourceID)).settings.warnUnknownCommand)
		message.channel.send(new MessageEmbed()
			.setTitle('Error')
			.setDescription(`Invalid command, type ${Util.inlineCodeBlock(`${prefix}help`)} for list of commands.`)
			.setColor(Util.red));
}