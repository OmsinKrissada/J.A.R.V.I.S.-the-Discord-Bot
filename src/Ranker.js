class Ranker {
	constructor(ownerid) {
		console.log('gonna create')
		this.python = require('child_process').spawn('/usr/bin/python3', ['./item-ranker.py'])
		this.python.stdout.on('data', data => {
			console.log(data.toString())
		})
		this.ownerid = ownerid;
	}
	send(jsonmsg) {
		this.python.stdin.write(jsonmsg)
		console.log('wrote')
		// this.python.stdout.on('data', data => {
		// 	console.log('data as ')
		// 	console.log(data.toString());
		// })
	}

	close() {
		python.on('close', code => {
			console.log('exit code = ' + code);
		})
	}
}
module.exports = Ranker;