const fs = require('fs');

var type_colors = {
    html:    '\x1b[37m',
    good:    '\x1b[32m',
    info:    '\x1b[36m',
    socket:  '\x1b[35m',
    uptime:  '\x1b[34m',
    warning: '\x1b[33m',
    error:   '\x1b[31m',
};

function log(type, data) {
    if (type in type_colors) {
        const date_time = new Date();
        const time = date_time.toLocaleTimeString();
        
        var space_string = '';
        for (var i = 0; i < 8 - type.length; i++) {
            space_string += ' ';
        }

        console.log(type_colors[type], '\x1b[1m', `[${time}] [${type.toUpperCase()}] ${space_string}`, '\x1b[0m', `${data}`);
    }
    
    return;
}
exports.log = log;

function imageToBase64(imagePath) {
    fs.readFile(imagePath, (err, data) => {
        if (err) throw err;
        var base64Image = Buffer.from(data, 'binary').toString('base64');
        console.log(base64Image)
    });
}
exports.imageToBase64 = imageToBase64;