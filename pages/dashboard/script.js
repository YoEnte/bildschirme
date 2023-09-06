var socket = io();

var loggedIn = false;
var user; 
var images = {};


var mainPath = `${ejsHost}/${ejsStatics}/_general_files/images/`;
var documentLoaded = false;

var inputUser;
var inputPassword;
var loginCon;
var dashboardCon;
var startCon;
var screensCon;
var imagesCon;
var slideShowsCon;

addEventListener('DOMContentLoaded', (event) => {
    documentLoaded = true;

	inputUser = document.querySelector('#user');
	inputPassword = document.querySelector('#password');
	loginCon = document.querySelector('#login_con');
	dashboardCon = document.querySelector('#dashboard_con');
	startCon = document.querySelector('#start_con');
	screensCon = document.querySelector('#screens_con');
	imagesCon = document.querySelector('#images_con');
	slideShowsCon = document.querySelector('#slideShows_con');
});

socket.on('connect', () => {
	console.log('connected');

	logout();
});

socket.on('error', (e) => {
	console.log(e);
});

socket.on('user_login', (data) => {
    if (data.status == 'passed') {
        console.log('logged in as', data.user);
        loggedIn = true;
		user = data.user;

		loginCon.style.visibility = 'hidden';
		dashboardCon.style.visibility = 'visible';
		startCon.style.visibility = 'visible';
    }
});

function login() {

	if (inputUser.value == '' && inputPassword.value == '') {
		inputUser.value = 'YoEnte';
		inputPassword.value = 'adminENTE2199';
	}

	socket.emit('user_fetch_login', {user: inputUser.value, password: inputPassword.value});
}

function logout() {
	loggedIn = false;
	inputUser.value = '';
	inputPassword.value = '';

	dashboardCon.style.visibility = 'hidden';
	imagesCon.style.visibility = 'hidden';
	slideShowsCon.style.visibility = 'hidden';
	screensCon.style.visibility = 'hidden';
	startCon.style.visibility = 'hidden';
	loginCon.style.visibility = 'visible';
}


// start
function tab_start() {
	imagesCon.style.visibility = 'hidden';
	slideShowsCon.style.visibility = 'hidden';
	screensCon.style.visibility = 'hidden';
	startCon.style.visibility = 'visible';
}

// screens
function tab_screens() {
	fetchScreens();
	startCon.style.visibility = 'hidden';
	imagesCon.style.visibility = 'hidden';
	slideShowsCon.style.visibility = 'hidden';
	screensCon.style.visibility = 'visible';
}

function fetchScreens() {
	socket.emit('user_fetch_screens');
}

socket.on('user_screens', (data) => {
	console.log(data.screens);
});


// images
function tab_images() {
	fetchImages();
	startCon.style.visibility = 'hidden';
	slideShowsCon.style.visibility = 'hidden';
	screensCon.style.visibility = 'hidden';
	imagesCon.style.visibility = 'visible';
}

function fetchImages() {
	socket.emit('user_fetch_images');
}

socket.on('user_images', (data) => {
	console.log(data.images);

	for (i of Object.keys(data.images)) {
        images[i] = new Image;
        images[i].src = mainPath + data.images[i];
        images[i].id = 'screen_img';
    }

    counter = 0;
    selected = 0;

    allImgsLoaded = true;
});


// slideShows
function tab_slideShows() {
	fetchImages();
	fetchSlideShows();
	startCon.style.visibility = 'hidden';
	imagesCon.style.visibility = 'hidden';
	screensCon.style.visibility = 'hidden';
	slideShowsCon.style.visibility = 'visible';
}

function fetchSlideShows() {
	socket.emit('user_fetch_slideShows');
}

socket.on('user_slideShows', (data) => {
	console.log(data.slideShows);
});