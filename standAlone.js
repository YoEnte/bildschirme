const fs = require('fs');
const path = require('path');

const toolsJS = require('./services/tools.js');
const pagesJS = require('./services/pages.js');
const saveDataFileName = './services/save_data.json';
const saveData = require(saveDataFileName);

toolsJS.imageToBase64(path.join(__dirname, 'testJPEG01.jpeg'));