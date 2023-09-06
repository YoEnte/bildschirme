var socket = io();

socket.on('connect', () => {
	console.log('connected');
});

socket.on('error', (e) => {
	console.log(e);
});
