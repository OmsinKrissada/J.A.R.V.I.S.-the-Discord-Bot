const fs = require('fs')

let data = {};
exports.data = data;

exports.getDatabase = () => {

	// Check if file dir exist, if not, create them.
	if (!fs.existsSync('./files')) {
		fs.mkdirSync('./files')
	}
	// Get server data
	fs.readFile('./files/database.json', 'utf-8', (err, filecontent) => {
		// Create ./files/database.json if not exist/error occur
		if (err) {
			let default_data = { guilds: {} };

			fs.writeFile('./files/database.json', JSON.stringify(default_data), (err) => { if (err) throw err; });
			data = default_data;
		}
		else data = JSON.parse(filecontent);
		this.data = data;

		console.log('read data: ')
		console.log(JSON.stringify(data))
	});
}

exports.setDatabase = (newDataObject) => {
	fs.writeFile('./files/database.json', JSON.stringify(newDataObject, null, '	'), (err) => { if (err) throw err; });
}

exports.addGuildDefaultData = (id, name, isDM) => {
	data.guilds[id] = {
		name: name,
		prefix: '!',
		dm: isDM
	}
	setDatabase(data)
}