const express = require('express');
const sharper = require('../index');

var app = express();

var Sharper = sharper();

// Upload route
app.post('/upload', Sharper, function(err, req, res, next){
    console.log(err);
    res.status(500).send('upload failed...');
}, function(req, res){
    console.log(res.sharper);
    res.send('done...');
});

// Static route
app.use('/bower', express.static(__dirname + '/../bower_components'));

// Test page
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.listen(8800, function(){
    console.log('test server is listening...');
});