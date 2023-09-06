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
const pagesJS = require('./services/pages.js');

const testSaveDataFileName = './services/test_save_data.json';
const testSaveData = require(testSaveDataFileName);

const saveDataDirectory = './services/save_data/';
const saveDataImagesFile = 'images.json';
const saveDataScreensFile = 'screens.json';
const saveDataSlideShowsFile = 'slideshows.json';
const saveDataUsersFile = 'users.json';
const saveDataImages = require(path.join(__dirname, saveDataDirectory, saveDataImagesFile));
const saveDataScreens = require(path.join(__dirname, saveDataDirectory, saveDataScreensFile));
const saveDataSlideShows = require(path.join(__dirname, saveDataDirectory, saveDataSlideShowsFile));
const saveDataUsers = require(path.join(__dirname, saveDataDirectory, saveDataUsersFile));

const port = 4000;

// scrict routing (exact urls -> if no trailing slash then no trailing slash and vice versa)
app.enable('strict routing');

// static files
const host = `http://localhost:${port}`;

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
		trailing_good = false;
	}

	if (trailing_good) {
		toolsJS.log('html', `got a request on: ${url}`);
		next();
	} else {
		res.status(404).render(path.join(__dirname, 'pages', pagesJS.pages['404'].directory, 'index.html'), { host: host, statics: static_files, page: pagesJS.pages['404'].directory });
	}
});

// landing page
app.get('/', (req, res) => {
	var homePage = 'home';
	res.status(200).render(path.join(__dirname, 'pages', pagesJS.pages[homePage].directory, 'index.html'), { host: host, statics: static_files, page: pagesJS.pages[homePage].directory});
});

app.get('/uptime', (req, res) => {
	res.status(200).render(path.join(__dirname, 'pages', pagesJS.pages['uptime'].directory, 'index.html'), { host: host, statics: static_files, page: pagesJS.pages['uptime'].directory});
});

// any other page
app.get('/:page', (req, res) => {
	var page = req.params.page;

	try {
		if (fs.existsSync(path.join(__dirname, 'pages', pagesJS.pages[page].directory, 'index.html'))) { /* file exists */ }
	} catch (err) {
		res.status(404).render(path.join(__dirname, 'pages', pagesJS.pages['404'].directory, 'index.html'), { host: host, statics: static_files, page: pagesJS.pages['404'].directory });
		return;
	}

	var pass_on = true;

	if (pass_on) {
		if (req.url.startsWith('/p/uptime')) {
			toolsJS.log('uptime', 'uptime robot successfully monitored!');
		}

		res.status(200).render(path.join(__dirname, 'pages', pagesJS.pages[page].directory, 'index.html'), { host: host, statics: static_files, page: pagesJS.pages[page].directory});
	} else {
		res.status(404).render(path.join(__dirname, 'pages', pagesJS.pages['restricted'].directory, 'index.html'), { host: host, statics: static_files, page: pagesJS.pages['restricted'].directory });
	}
});

// all other urls -> 404 error
app.get('*', (req, res) => {
	res.status(404).render(path.join(__dirname, 'pages', pagesJS.pages['404'].directory, 'index.html'), { host: host, statics: static_files, page: pagesJS.pages['404'].directory });
});

//  [==================]   Socket.IO   [==================]
var screens_loggedIn = {};
var users_loggedIn = {};

io.on('connect', (socket) => {
	toolsJS.log('socket', `${socket.id} connected to the server`);

	socket.on('disconnect', () => {
		toolsJS.log('socket', `${socket.id} disconnected from the server`);
		screen_logout();
	});

	socket.on('screen_login', (data) => {
		if (saveDataScreens[data.login] == undefined) {
			socket.emit('error', {message: 'login failed'});
			return;
		}

		screens_loggedIn[socket.id] = data.login;
		console.log(screens_loggedIn);
		socket.emit('screen_login', {status: 'passed', screen: data.login});
	});

	socket.on('screen_logout', (data) => {
		screen_logout();
	});

	function screen_logout() {
		delete screens_loggedIn[socket.id];
		console.log(screens_loggedIn);
	}

	socket.on('screen_fetch_slideName', () => {
		if (false) {
			socket.emit('error', {message: 'slideshow fetch failed'});
			return;
		}

		var account = screens_loggedIn[socket.id];

		socket.emit('screen_slideName', {slideName: saveDataScreens[account].slideshow});
	});

	socket.on('screen_fetch_slideShow', (data) => {
		if (false) {
			socket.emit('error', {message: 'slideshow fetch failed'});
			return;
		}

		var slideShow;

		if (data.slideName == undefined) {
			slideShow = saveDataSlideShows[saveDataScreens[screens_loggedIn[socket.id]]];
		} else {
			slideShow = saveDataSlideShows[data.slideName];
		}

		account = screens_loggedIn[socket.id];

		socket.emit('screen_slideShow', {slideShow: slideShow});
	});

	socket.on('screen_fetch_images', (data) => {
		if (false) {
			socket.emit('error', {message: 'slideshow fetch failed'});
			return;
		}

		var urls = {};
		for (i of data.images) {
			urls[i] = saveDataImages[i];
		}
		socket.emit('screen_images', {urls: urls});
	});



	socket.on('user_fetch_login', (data) => {
		if (saveDataUsers[data.user] == undefined) {
			socket.emit('error', {message: 'login failed, wrong user'});
			return;
		}

		if (data.password != saveDataUsers[data.user].password) {
			socket.emit('error', {message: 'login failed, wrong password'});
			return;
		}

		users_loggedIn[socket.id] = data.user;
		socket.emit('user_login', {status: 'passed', user: data.user});
	});

	socket.on('user_fetch_screens', (data) => {
		if (false) {
			socket.emit('error', {message: 'slideshow fetch failed'});
			return;
		}

		socket.emit('user_screens', {screens: saveDataScreens});
	});

	socket.on('user_change_screens', (data) => {
		if (users_loggedIn[socket.id] == undefined) {
			socket.emit('error', {message: 'failed, not logged in'});
			return;
		}
	});



	socket.on('user_fetch_images', (data) => {
		if (false) {
			socket.emit('error', {message: 'slideshow fetch failed'});
			return;
		}

		socket.emit('user_images', {images: saveDataImages});
	});

	socket.on('user_change_images', (data) => {
		if (users_loggedIn[socket.id] == undefined) {
			socket.emit('error', {message: 'failed, not logged in'});
			return;
		}
	});



	socket.on('user_fetch_slideShows', (data) => {
		if (false) {
			socket.emit('error', {message: 'slideshow fetch failed'});
			return;
		}

		socket.emit('user_slideShows', {slideShows: saveDataSlideShows});
	});

	socket.on('user_change_slideShows', (data) => {
		if (users_loggedIn[socket.id] == undefined) {
			socket.emit('error', {message: 'failed, not logged in'});
			return;
		}
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