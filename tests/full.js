const http = require('http');
const fs = require('fs');
const supertest = require('supertest');
const chai = require('chai');
const chaiFiles = require('chai-files');
const express = require('express');
const sharper = require('../index');
const sizeOf = require('image-size');
const rimraf = require('rimraf')

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;
var dir = chaiFiles.dir;

var request = supertest('localhost:8800');
var app = express();
var Sharper = sharper({
	field : 'image',
	location : __dirname + '/upload/',
	output : 'png',
	sizes : [
		{suffix : 'xxs', width : 50, height: 50}
	]
});

// Set ping route
app.get('/', function(req, res){
    res.sendStatus(204);
});

// Set upload route
app.post('/upload', Sharper, function(err, req, res, next){
    res.sendStatus(500);
}, function(req, res){
    res.status(201).json(res.sharper);
});


/*****************************************************/


describe('Sharper', function(){
	
	//run express server before all tests
	before(function(done){
		app.listen(8800, function(){
		    done();
		});
	});


	// test server ping
	it('should return status code 204 on ping', function(done){
		http.get('http://127.0.0.1:8800/', function(res){
			expect(res.statusCode).to.equal(204);
			done();
		}).on('err', function(){
			throw new Error('server is not reachable.');
			process.exit(1);
		});
	});


	it('should return status code 201 on file upload', function(done){
		request
		.post('/upload')
		.attach('image', __dirname + '/test-file.jpg')
		.end(function(err, res){
			expect(res.statusCode).to.equal(201);
			expect(res.body).to.have.property('filename');

			done();
		});
	});


	it('should verify if file exists on the file system', function(done){
		request
		.post('/upload')
		.attach('image', __dirname + '/test-file.jpg')
		.end(function(err, res){
			var uploadedFile = res.body.destination + '/' + res.body.filename + '.xxs.png';
			expect(file(uploadedFile)).to.exist;
			done();
		});
	});


	it('png should have 50x50 image dimension', function(done){
		request
		.post('/upload')
		.attach('image', __dirname + '/test-file.jpg')
		.end(function(err, res){
			var uploadedFile = res.body.destination + '/' + res.body.filename + '.xxs.png';
			var dimensions = sizeOf(uploadedFile);

			expect(dimensions.type).to.equal('png');
			expect(dimensions.width).to.equal(50);
			expect(dimensions.height).to.equal(50);

			done();
		});
	});


	// clean upload directory
	// close node processes after all test done
	after(function(done){
		setTimeout(function(){
			rimraf(__dirname + '/upload/', {unlinkSync:true}, function(){
				done();
				process.exit(0);
			});
		});
	});
});

