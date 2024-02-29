import { GuildResolvable, User } from "discord.js";

class Poll {
	title: string;
	description?: string;
	options: string[];
	author: User;
}

const polls = new Map<GuildResolvable, Poll[]>();

export function create(title: string) {
	let created_poll = new Poll();
}

export function setTitle(title: string) {

}

export function edit() {

}

export function remove() {

}

export function list() {

}

export function show() {

}