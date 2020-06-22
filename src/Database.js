const fs = require('fs')

let data = {};
exports.data = data;

exports.getOption = () => {

	// Get server data
	fs.readFile('./files/guild_option.json', 'utf-8', (err, filecontent) => {
		if (err) console.log(err);
		else data = JSON.parse(filecontent);
		this.data = data;

		console.log('read data: ')
		console.log(JSON.stringify(data))
	});
}

exports.setOption = (newDataObject) => {
	fs.writeFile('./files/guild_option.json', JSON.stringify(newDataObject, null, '	'), (err) => { if (err) throw err; });
}

exports.updateOption = () => {
	this.setOption(this.data);
}

exports.addGuildDefaultOption = (id, name, isDM) => {
	data.guilds[id] = {
		name: name,
		prefix: '!',
		dm: isDM,
		hooks: []
	}
	this.setOption(data)
}