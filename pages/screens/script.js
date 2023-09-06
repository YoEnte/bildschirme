var socket = io();

var loggedIn = false;
var slideName;
var slideShow;

var mainPath = `${ejsHost}/${ejsStatics}/_general_files/images/`;
var images = {};
var allImgsLoaded = false;
var documentLoaded = false;

var counter = 0;
var selected = 0;

var screen;

addEventListener('DOMContentLoaded', (event) => {
    documentLoaded = true;

    screen = document.querySelector('#screen_con');
    console.log(screen)
});

var interval1000 = setInterval(function() {

    console.log("count", counter, selected)

    if (allImgsLoaded && documentLoaded) {
        if (counter == slideShow.content[selected].duration) {
            counter = 0;
            selected++;
            if (selected == slideShow.content.length) {
                selected = 0;
            }

            newSrc = images[slideShow.content[selected].image];
            console.log(newSrc);

            screen.appendChild(newSrc);
            screen.removeChild(screen.firstElementChild);

        } else {
            counter++;
        }
    }

}, 1000);

socket.on('connect', () => {
	console.log('connected');

    loggedIn = false;

    if (!loggedIn) {
        socket.emit('screen_login', {login: localStorage['login']});
    }
});

socket.on('error', (data) => {
	console.log(data.message);
});

socket.on('login', (data) => {
    if (data.status == 'passed') {
        console.log('logged in as', data.screen);
        loggedIn = true;
        fetchSlideName();
    }
});

function fetchSlideName() {
    socket.emit('screen_fetch_slideName');
}

socket.on('slideName', (data) => {
    console.log('got slidename:', data.slideName);
    slideName = data.slideName;
    fetchSlideShow();
});

function fetchSlideShow() {
    socket.emit('screen_fetch_slideShow', {slideName: slideName});
}

socket.on('slideShow', (data) => {
    console.log('got slideshow:', data.slideShow);
    slideShow = data.slideShow;
    fetchImages();
});

function fetchImage() {

}

function fetchImages() {
    var imgs = [];
    for (i of slideShow.content) {
        imgs.push(i.image);
    }

    socket.emit('screen_fetch_images', {images: imgs})
}

socket.on('images', (data) => {
    console.log('got image urls:', data.urls);

    for (i of Object.keys(data.urls)) {
        images[i] = new Image;
        images[i].src = mainPath + data.urls[i];
        images[i].id = 'screen_img';
    }

    counter = 0;
    selected = 0;

    allImgsLoaded = true;
});