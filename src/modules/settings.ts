import { MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { Command } from '../CommandManager';
import DataManager from '../DataManager';
import { Helper } from '../Helper';
import { bot } from '../Main';


new Command({
	name: 'settings',
	category: 'settings',
	description: 'Modifies bot\'s settings',
	examples: ['settings <settings> <value>', 'settings <settings>'],
	requiredCallerPermissions: ['MANAGE_GUILD'],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	async exec(message, prefix, args, sourceID) {
		const settings = (await DataManager.get(sourceID)).settings;
		const settingsdesc = {
			warnUnknownCommand: 'Warns when the bot receives an unknown command.',
			announceSong: 'Announces when a song is being played.',
			announceQueueEnd: 'Announces when music queue is ended.',
			queueInOrder: 'Use sync method to get videos from playlist. (EXPERIMENTAL)',
			enforceUserLimit: 'Kicks users when joining a voice channel that exceed the user limit regardless of the permission they have. (Requires MOVE_MEMBER permission)',
		}

		const field = args[0];
		const value = args[1];
		if (field in settingsdesc) {
			let embedOptions: MessageEmbedOptions;
			if (!value) {
				embedOptions = {
					description: `Current value: \`${settings[field]}\``,
					color: Helper.BLUE
				}
			}
			else if (['true', 'on', 'yes', 'enable'].includes(value.toLowerCase())) {
				const oldval = settings[field];
				DataManager.set(sourceID, `settings.${field}`, true);
				embedOptions = {
					title: 'Setting Applied',
					description: `You've changed the value of \`${field}\` from \`${oldval}\` to \`true\`.`,
					color: Helper.GREEN
				}
			}
			else if (['false', 'off', 'no', 'disable'].includes(value.toLowerCase())) {
				const oldval = settings[field];
				DataManager.set(sourceID, `settings.${field}`, false);
				embedOptions = {
					title: 'Setting Applied',
					description: `You've changed the value of \`${field}\` from \`${oldval}\` to \`false\`.`,
					color: Helper.GREEN
				}
			}
			else {
				embedOptions = {
					description: `Invalid value`,
					color: Helper.RED
				}
			}
			message.channel.send(new MessageEmbed(embedOptions))

		}


		else {
			const embed_fields: any[] = [];
			for (const setting in settings) {
				if (setting in settingsdesc && setting != 'toString') {
					embed_fields.push({ name: settingsdesc[setting], value: (settings[setting] ? '🟩' : '🟥') + ' `' + setting + '`\n' + Helper.ZERO_WIDTH, inline: false });
					console.log(setting)
				}
			}

			const embed = new MessageEmbed({
				author: { name: 'My Settings', iconURL: bot.user.displayAvatarURL() },
				description: `Use \`${prefix}settings <setting> <true/false>\` to change their values.\n**Example**: \`${prefix}settings warnUnknownCommand false\``,
				color: Helper.BLUE,
				fields: embed_fields,
			})
			message.channel.send(embed)
		}

	}
});