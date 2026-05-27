const { app } = require('electron');
const MainWindowFactory = require('./windows/MainWindowFactory');

require('../database/connection');

app.whenReady().then(() => {

    MainWindowFactory.createHomeWindow();

});