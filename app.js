var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var data = {};
data.usersCount = 0;
data.users = {};
data.missiles = [];
var missileProduceRate = 3000;
var missilesCountDown = 0;
app.use('/shapes', express.static('shapes'));
var flightSpeed = 5;
var missileSpeed = 7;
var missileRotateRate = 0.06;
var missileRadius = 200;
var groundWidth = 600;
var groundHeight = 600;
setInterval(onTimerTick, 1000/30);
io.on('connection', function(socket){
	var socketId = socket.id;
	console.log("new user: "+socketId);
	if (io.sockets.connected[socketId]) {
		console.log("new user: "+socketId);
	    io.sockets.connected[socketId].emit('getSocketId', socketId);
	    console.log(socketId);
	    data.users[socketId] = {posX:groundWidth/2, posY:groundHeight/2
	    					, angle:0, hp : 100};
	    data.usersCount++;
	}

	socket.on('disconnect', function(){
		console.log("DC: " +socketId);
		data.usersCount--;
		delete data.users[socketId];
	});

	socket.on('update_username', function(msg){
		if(data.users[msg.socketId]!= undefined){
			data.users[msg.socketId].username = msg.username;
		}
	});
  
  	socket.on('flight_turn', function(msg){
  		// console.log(pos.socketId+": "+pos.x +", "+pos.y);
  		// data[pos.socketId] = {posX:pos.x, posY:pos.y};
  		if(data.users[msg.socketId]!= undefined){
  			data.users[msg.socketId].angle = msg.angle;
  		}
  	});
});

function calculate(){
	for(var k in data.users){
		var user = data.users[k];
		if(user.posX != undefined && user.posY != undefined){
			user.posX -= flightSpeed * Math.cos(user.angle+Math.PI/2);
			user.posY += flightSpeed * Math.sin(user.angle+Math.PI/2);
			user.posX = Math.max(0, Math.min(groundWidth, user.posX));
			user.posY = Math.max(0, Math.min(groundHeight, user.posY));
		}
	}

	var destoyIndices = [];
	loopEachMissile:
	for(var i = 0; i < data.missiles.length; ++i){
		var minDistance;
		var nk;
		var missile = data.missiles[i];
		if(missile.isExploding){ 
			missile.explodingTimer -= 1000/30;
			if(missile.explodingTimer <= 0){
				destoyIndices.push(i);
			}
			continue; 
		}
		// missile bump user
		for(var k in data.users){
			var user = data.users[k];
			if(user.posX != undefined && user.posY != undefined){
				var dx = missile.posX - user.posX;
				var dy = missile.posY - user.posY;
				var dis = dx*dx+dy*dy;
				if(dis < missileRadius){
					missile.speed = 0;
					missile.isExploding = true;
					data.users[k].hp -= 20;
					break loopEachMissile;
				}
				if(minDistance == undefined || dis < minDistance){
					minDistance = dis;
					nk = k;
				}
			}
		}
		// missile bump missile
		for(var j = i+1; j < data.missiles.length; ++j) {
			var dx = missile.posX - data.missiles[j].posX;
			var dy = missile.posY - data.missiles[j].posY;
			var dis = dx*dx+dy*dy;
			if(dis < missileRadius){
				missile.speed = 0;
				missile.isExploding = true;
				data.missiles[j].speed = 0;
				data.missiles[j].isExploding = true;
				break loopEachMissile;
			}
		}
		// missile trace user
		if(data.users[nk] != undefined){
			missile.angle = rotateTo(missile.posX, missile.posY
									, data.users[nk].posX, data.users[nk].posY
									, missile.angle, missileRotateRate);
		}
		missile.posX -=  Math.cos(missile.angle+Math.PI/2)*missile.speed;
		missile.posY +=  Math.sin(missile.angle+Math.PI/2)*missile.speed;
	}

	for(var i = destoyIndices.length - 1; i >= 0; --i) {
		data.missiles.splice(destoyIndices[i], 1);
	}
}


function rotateTo(fx, fy, tx, ty, cd, rr){
	var td = Math.atan2(tx - fx, ty - fy);

	var tempTD = td > 0 ? td : 2 * Math.PI + td;
	var tempCD = cd > 0 ? cd : 2 * Math.PI + cd;
	// console.log(this.angle);
	if(Math.abs(tempTD - tempCD) < rr){
		return td;
	}
	
	if(tempCD > tempTD){
		tempTD = tempTD + 2 * Math.PI;
	}

	if(tempTD - tempCD < Math.PI){
		cd += rr;
	} else {
		cd -= rr;
	}


	if(cd > 2 * Math.PI){
		cd -= 2 * Math.PI;
	}else if(cd < 0){
		cd += 2 * Math.PI;
	}
	return cd;
}

function onTimerTick(){
	// console.log(data);
	if(data.missiles.length < data.usersCount*3){
		missilesCountDown -= 1000/30;
		if(missilesCountDown < 0){
			missilesCountDown = missileProduceRate;
			data.missiles.push({posX : -100, posY : -100
								, angle : 0, speed : missileSpeed
								, isExploding : false, explodingTimer : 500});
		}
		// console.log(data);
	}
	calculate();
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

http.listen(process.env.PORT || 5000, function(){
  console.log('listening on *:5000');
});