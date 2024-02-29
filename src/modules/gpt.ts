import axios from 'axios';
import { MessageEmbed, Permissions, Util } from 'discord.js';
import { Command } from '../CommandManager';
import * as Helper from '../Helper';
import { bot } from '../Main';
import config from '../ConfigManager';

// new Command({
// 	name: 'chat',
// 	category: 'features',
// 	description: 'Chat with ChatGPT using unofficial API',
// 	examples: ['gpt <prompt>'],
// 	requiredCallerPermissions: [],
// 	requiredSelfPermissions: ['SEND_MESSAGES'],
// 	serverOnly: true,
// 	async exec(message, prefix, args, _sourceID) {
// 		await message.channel.send('Coming soon!');
// 		return;
// 		const prompt = args.join(' ');
// 		if (!prompt) {
// 			message.channel.send(`Please provide your prompt. Usage: ${prefix}gpt <prompt>`);
// 			return;
// 		}
// 	}
// });

new Command({
	name: 'img',
	category: 'features',
	description: 'Generate images using DALL E API from OpenAI',
	examples: ['img <prompt>'],
	requiredCallerPermissions: [],
	requiredSelfPermissions: ['SEND_MESSAGES'],
	serverOnly: true,
	async exec(message, prefix, args, _sourceID) {
		const prompt = args.join(' ');
		if (!prompt) {
			message.channel.send(`Please provide your prompt. \`Usage: ${prefix}img <your prompt>\`\nE.g. \`\`\`${prefix}img a mountain made of cake\n${prefix}img An astronaut riding a horse in a photorealistic style\n${prefix}img a boy drinking coffee in a classroom, sitting in his seat, pixel art\`\`\``);
			return;
		}
		const msg = message.channel.send('<a:loading:845534883396583435> The AI is thinking...');
		const startTime = new Date();
		try {
			const { data: res } = await axios.post('https://api.openai.com/v1/images/generations',
				{
					prompt: prompt,
					n: 1,
					size: '1024x1024',
					// user:''
				},
				{
					headers: {
						Authorization: `Bearer ${config.token.openai}`
					}
				}
			);
			const elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
			const url = res.data[0].url;
			(await msg).edit('', {
				embed: {
					description: `Prompt: **${Util.escapeMarkdown(prompt)}**\n\n**[Click here for full image](${url})**`,
					image: { url: url },
					footer: { text: `This command uses DALL E from OpenAI. Took ${elapsed}s` }
				}
			});
		} catch (e) {
			await ((await msg).edit(`An error has occured: ${e}`));
		}
	}
});

// curl https://api.openai.com/v1/images/generations \
//   -H 'Content-Type: application/json' \
//   -H "Authorization: Bearer $OPENAI_API_KEY" \
//   -d '{
//     "prompt": "a white siamese cat",
//     "n": 1,
//     "size": "1024x1024"
//   }'