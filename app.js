//  [=================]   Preperation   [=================]
// module imports & server instance
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const toolsJS = require('./services/tools.js');
const dataJS = require('./services/data.js');
const saveDataFileName = './services/save_data.json';
const saveData = require(saveDataFileName);

const port = 4000;

// scrict routing (exact urls -> if no trailing slash then no trailing slash and vice versa)
app.enable('strict routing');

// static files
const host = `https://localhost:${port}`;

const static_files = 'files';
app.use('/files/', express.static(path.join(__dirname, 'pages')));

// setup engine
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');

// [=================]   Url Requests   [=================]
// fix url (trailing slash)
app.all('*', (req, res, next) => {
	const url = req.url;
	var trailing_good = false;

	if (url != '/') {
		if (url.slice(-1) == '/') {
			res.redirect(url.slice(0, -1));
			return;
		} else {
			trailing_good = true;
		}
	} else {
		trailing_good = true;
	}

	if (['/favicon.ico'].includes(url)) {
		res.status(404);
	}

	if (trailing_good) {
		toolsJS.log('html', `got a request on: ${url}`);
		next();
	} else {
		res.status(404).render(path.join(__dirname, 'pages', dataJS.pages['404'].directory, 'index.html'), { host: host, statics: static_files, page: dataJS.pages['404'].directory });
	}
});

// landing page
app.get('/', (req, res) => {
	res.redirect('/p/home');
});

// any other page
app.get('/p/:page', (req, res) => {
	var page = req.params.page;

	try {
		if (fs.existsSync(path.join(__dirname, 'pages', dataJS.pages[page].directory, 'index.html'))) { /* file exists */ }
	} catch (err) {
		res.status(404).render(path.join(__dirname, 'pages', dataJS.pages['404'].directory, 'index.html'), { host: host, statics: static_files, page: dataJS.pages['404'].directory });
		return;
	}

	var pass_on = true;

	if (pass_on) {
		if (req.url.startsWith('/p/uptime')) {
			toolsJS.log('uptime', 'uptime robot successfully monitored!');
		}

		res.status(200).render(path.join(__dirname, 'pages', dataJS.pages[page].directory, 'index.html'), { host: host, statics: static_files, page: dataJS.pages[page].directory});
	} else {
		res.status(404).render(path.join(__dirname, 'pages', dataJS.pages['restricted'].directory, 'index.html'), { host: host, statics: static_files, page: dataJS.pages['restricted'].directory });
	}
});

// all other urls -> 404 error
app.get('*', (req, res) => {
	res.status(404).render(path.join(__dirname, 'pages', dataJS.pages['404'].directory, 'index.html'), { host: host, statics: static_files, page: dataJS.pages['404'].directory });
});

//  [==================]   Socket.IO   [==================]
io.on('connect', (socket) => {
	toolsJS.log('socket', `${socket.id} connected to the server`);

	socket.emit('sendData', saveData, {
		emit: 'socket',
		close: false, msgIfSender: 'Daten vom Server geladen.',
	}); // send save_data.json as obj

	// list manager
	socket.on('saveItem', (socketData) => { // [original, title, content]

		var error = false;
		if (socketData[0] != '') {		// modify
			
			// check doubles for modify
			var originalIndex = undefined;
			for (var i = 0; i < saveData.data.length; i++) {

				// if double and title changed
				if (saveData.data[i].title == socketData[1] && socketData[0] != socketData[1]) {
					error = true;
					break;
				}

				// find index of original
				if (saveData.data[i].title == socketData[0]) {
					originalIndex = i;
				}
			}

			if (originalIndex == undefined) {
				error = true;
			}

			if (!error) {
				saveData.data[originalIndex] = {title: socketData[1], content: socketData[2]};
				fs.writeFileSync(saveDataFileName, JSON.stringify(saveData));
			}
			
		} else {						// add
			
			// check doubles for add
			for (var i = 0; i < saveData.data.length; i++) {

				// if double
				if (saveData.data[i].title == socketData[1]) {
					error = true;
					break;
				}
			}

			if (!error) {
				saveData.data.push({title: socketData[1], content: socketData[2]});
				fs.writeFileSync(saveDataFileName, JSON.stringify(saveData));
			}
		}

		if (!error) {
			
			io.emit('sendData', saveData, {
				emit: 'io', senderId: socket.id, changes: [...socketData],
				close: false, msgIfSender: 'Element erfolgreich gespeichert.', msgIfNotSender: 'Daten vom Server geladen.'
			});
		} else {
	
			socket.emit('sendData', saveData, {
				emit: 'socket',
				close: false, msgIfSender: 'Ein Fehler ist aufgetreten!',
			});
		}
	});
	
	socket.on('deleteItem', (socketData) => {

		for (var i = 0; i < saveData.data.length; i++) {

			if (saveData.data[i].title == socketData) {

				saveData.data.splice(i, 1);
				fs.writeFileSync(saveDataFileName, JSON.stringify(saveData));
				break;
			}
		}

		io.emit('sendData', saveData, {
			emit: 'io', senderId: socket.id, 
			close: true, msgIfSender: 'Element erfolgreich gelöscht.', msgIfNotSender: 'Daten vom Server geladen.'
		});
	});

	socket.on('disconnect', () => {
		toolsJS.log('socket', `${socket.id} disconnected from the server`);
	});
});


//  [====================]   other   [====================]
// listen to port (on launch)
http.listen(port, () => {
	console.log('\n');
	toolsJS.log('good', `server started and is running on port: ${port}`);

	/*
	console.log(saveData.players[0].collection[0]);
	saveData.players[0].collection[0].checked = false;
	fs.writeFileSync(saveDataFileName, JSON.stringify(saveData));
	console.log(saveData.players[0].collection[0]);*/
});