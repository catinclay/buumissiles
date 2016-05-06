var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var data = {};
var data 
app.use('/shapes', express.static('shapes'));
var flightSpeed = 5;

setInterval(onTimerTick, 1000/30);
io.on('connection', function(socket){
	var socketId = socket.id;
	console.log("new user: "+socketId);
	if (io.sockets.connected[socketId]) {
		console.log("new user: "+socketId);
	    io.sockets.connected[socketId].emit('getSocketId', socketId);
	    console.log(socketId);
	    data[socketId] = {posX:0, posY:0, angle:0};
	}

	socket.on('disconnect', function(){
		console.log("DC: " +socketId);
		delete data[socketId];
	});
  
  	socket.on('flight_turn', function(msg){
  		// console.log(pos.socketId+": "+pos.x +", "+pos.y);
  		// data[pos.socketId] = {posX:pos.x, posY:pos.y};
  		if(data[msg.socketId]!= undefined && data[msg.socketId].angle!=undefined){
  			data[msg.socketId].angle = msg.angle;
  		}
  	});
});

function caculate(){
	for(var k in data){
		if(data[k].posX != undefined && data[k].posY != undefined){
			data[k].posX -= flightSpeed * Math.cos(data[k].angle+Math.PI/2);
			data[k].posY += flightSpeed * Math.sin(data[k].angle+Math.PI/2);
		}
	}
}

function onTimerTick(){
	// console.log(data);
	caculate();
	var jsonS = JSON.stringify(data);
	// console.log(jsonS);
	io.sockets.emit('timeTick', jsonS);
	
}

app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.get('/index.js', function(req, res){
  res.sendfile('index.js');
});

// app.get('/shapes/SimpleSquareParticle.js', function(req, res){
//   res.sendfile('shapes/SimpleSquareParticle.js');
// });

http.listen(80, function(){
  console.log('listening on *:3000');
});