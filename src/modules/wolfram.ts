import { MessageEmbed } from 'discord.js';
import { Command } from '../CommandManager';
import ConfigManager from '../ConfigManager';
import * as Helper from '../Helper';
import axios from 'axios';
import { logger } from '../Logger';


new Command({
	name: 'ask',
	category: 'misc',
	description: 'Sends query to Wolfram Alpha.',
	examples: [],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: false,
	async exec(message, prefix, args, sourceID) {
		const input = encodeURI(args.join(' ')).replace(/\+/g, '%2B');
		const apitoken = ConfigManager.token.wolfram;
		logger.debug(`Wolfram: sending as "${input}"`);
		const replymsg = message.channel.send(`<a:loading:845534883396583435> Processing request from **${message.author.tag}**`);
		let output;
		try {
			output = (await axios.get(`https://api.wolframalpha.com/v1/result?i=${input}&appid=${apitoken}`)).data;
		} catch (err) {
			(await replymsg).edit('', new MessageEmbed()
				.setAuthor(`Q: ${args.join(' ')}`, message.author.displayAvatarURL())
				.setDescription(`Cannot recognize your question, try with less ambiguous phrases.`)
				.setColor(Helper.RED)
			);
		}
		logger.debug(`Wolfram: got response as "${output}"`);
		if (output) {
			(await replymsg).edit('', new MessageEmbed()
				.setAuthor(`Q: ${args.join(' ')}`, message.author.displayAvatarURL())
				.setDescription(`Answer: **${output}**`)
				.setColor(Helper.GREEN)
				// .setFooter('Results and information from this site are not a certified or definitive source of information that can be relied on for legal, financial, medical, life-safety or any other critical purposes.')
			);
		}
		else {
			(await replymsg).edit('', new MessageEmbed()
				.setAuthor(`Q: ${args.join(' ')}`, message.author.displayAvatarURL())
				.setDescription(`Cannot recognize your question, try with less ambiguous phrases.`)
				.setColor(Helper.RED)
			);
		}
		// if ((await replymsg).deletable) (await replymsg).delete();
	}
});