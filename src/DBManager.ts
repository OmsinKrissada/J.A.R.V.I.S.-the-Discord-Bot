import { bot } from "./Main";
import CONFIG from "./ConfigManager";
import { Guild, Prisma, PrismaClient } from "@prisma/client";
import { Snowflake } from "discord.js";
import { logger } from "./Logger";

export const prisma = new PrismaClient({
	log: [
		{ emit: "event", level: "error" },
		{ emit: "event", level: "warn" },
		{ emit: "event", level: "info" },
		{ emit: "event", level: "query" },
	],
});
prisma.$on("error", (e) => {
	logger.error(e.message, "prisma");
});
prisma.$on("warn", (e) => {
	logger.warn(e.message, "prisma");
});
prisma.$on("info", (e) => {
	logger.info(e.message, "prisma");
});
prisma.$on("query", (e) => {
	logger.debug(`${e.query}; ${e.params}`, "prisma");
});

// type SelectSubset<T, U> = { [key in keyof T]: key extends keyof U ? T[key] : never; } & (T extends Prisma.SelectAndInclude ? "Please either choose `select` or `include`." : {})
// type SelectArrayToObject<T, U> = { [key in keyof T]: key extends keyof U ? T[key] : never; };
// export async function getGuildSettings<T>(guildId: string, select?: (T & Prisma.GuildSelect) | undefined): Promise<T extends Prisma.GuildSelect ? {} : Guild> {
export async function getGuildSettings(guildId: Snowflake) {
	// const extra: {
	// 	select?: T & Prisma.GuildSelect;
	// } = select ? { select: select } : {};
	const guild = await prisma.guild.findUnique({
		where: {
			id: guildId,
		},
		// ...extra
	});

	if (guild) return guild;
	else {
		let newGuild;
		let isDM = false;
		try {
			newGuild = await bot.guilds.fetch(guildId);
		} catch {
			newGuild = await bot.channels.fetch(guildId);
			isDM = true;
		}
		return await prisma.guild.create({
			data: {
				id: guildId,
				isDM: isDM,
				prefix: isDM ? CONFIG.defaultDMPrefix : CONFIG.defaultPrefix,
			},
		});
	}
}

export async function setGuildSettings(identifier: Snowflake, data: Prisma.OptionalFlat<Guild>) {
	let newChannel;
	try {
		newChannel = await bot.channels.fetch(identifier); // if it's a guild it will throw error
	} catch (err) {
		logger.warn("No channel found, maybe it's a guild: " + identifier);
	}
	return await prisma.guild.upsert({
		where: {
			id: identifier,
		},
		update: data,
		create: {
			id: identifier,
			isDM: newChannel?.type === "dm",
			prefix: newChannel?.type === "dm" ? CONFIG.defaultDMPrefix : CONFIG.defaultPrefix,
			...data,
		},
	});
}
