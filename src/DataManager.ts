import * as fs from 'fs'
import yaml from 'js-yaml';

interface GuildOption {
	[guild_id: string]: object
}

export class DataManager {
	static data: GuildOption = {};

	static getOption = () => {

		if (!fs.existsSync('./files/guild_option.json')) fs.writeFileSync('./files/guild_option.json', '{"guilds":{}}');

		// Get server data
		fs.readFile('./files/guild_option.json', 'utf-8', (err, filecontent) => {
			if (err) console.log(err);
			else DataManager.data = JSON.parse(filecontent);
			DataManager.data = DataManager.data;

			console.log('read data: ')
			console.log(JSON.stringify(DataManager.data))
		});
	}

	static setOption = (newDataObject: object) => {
		if (newDataObject == {}
		) {
			console.log('BadData')
			// return;
		}
		fs.writeFile('./files/guild_option.json', JSON.stringify(newDataObject, null, '	'), (err) => { if (err) throw err; });
	}

	static updateOption = () => {
		DataManager.setOption(DataManager.data);
	}

	static addGuildDefaultOption = (id: string, name: string, isDM: boolean) => {
		DataManager.data.guilds[id] = {
			name: name,
			prefix: yaml.safeLoad(fs.readFileSync('./settings/config.yml', 'utf8'))['defaultPrefix'],
			dm: isDM,
			hooks: []
		}
		DataManager.setOption(DataManager.data)
	}
}