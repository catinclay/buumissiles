var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var data = {};
data.usersCount = 0;
data.users = {};
data.missiles = [];
data.medals = [];
var defaultWinnerCounter = 300;
data.winCondition = 50;
data.winnerCounter = 300;
data.winner = "AAAA";
var missileProduceRate = 1500;
var missilesCountDown = 0;
app.use('/shapes', express.static('shapes'));
var flightSpeed = 5;
var flightRadius = 600;
var missileSpeed = 7;
var missileRotateRate = 0.06;
var missileRadius = 200;
var medalRadius = 600;
var medalRatio = 20; // how many score for 1 medal
var groundWidth = 600;
var groundHeight = 600;
setInterval(onTimerTick, 1000/30);
var missileDamage = 20;
var medalHealth = 5;
var explodingDuration = 750;
var stunTime = 300;
io.on('connection', function(socket){
	var socketId = socket.id;
	console.log("new user: "+socketId);
	if (io.sockets.connected[socketId]) {
		console.log("new user: "+socketId);
	    io.sockets.connected[socketId].emit('getSocketId', socketId);
	    console.log(socketId);
	    data.users[socketId] = {posX:groundWidth/2, posY:groundHeight/2
	    					, angle:0, hp : 100, isAlive : true, score : 0, cantControl : 0};
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
  		if(data.users[msg.socketId]!= undefined && data.users[msg.socketId].cantControl == 0){
  			data.users[msg.socketId].angle = msg.angle;
  		}
  	});

  	socket.on('revive_request', function(msg) {
  		data.users[msg.socketId].hp = 100;
  		data.users[msg.socketId].isAlive = true;
  		data.users[msg.socketId].score = 0;
  		data.users[msg.socketId].posX = Math.random()*groundWidth;
  		data.users[msg.socketId].posY = Math.random()*groundHeight;
  	});

});

function restartGame() {
	data.medals = [];
	for (var sid in data.users) {
		data.users[sid].hp = 100;
  		data.users[sid].isAlive = true;
  		data.users[sid].score = 0;
  		data.users[sid].posX = Math.random()*groundWidth;
  		data.users[sid].posY = Math.random()*groundHeight;
	}
	data.winner = "";
}

function calculate(){

	for (var sid in data.users) {
		if (data.users[sid].score >= data.winCondition && data.winnerCounter == 0) {
			data.winnerCounter = defaultWinnerCounter;
			data.winner = data.users[sid].username;
		}
	}

	if (data.winnerCounter > 0) {
		data.winnerCounter--;
		if (data.winnerCounter == 0){
			restartGame();
		}
		return;
	}

	if(data.medals.length < 1) {
		data.medals.push({posX : Math.random()*groundWidth, posY : Math.random()*groundHeight});
	}
	var eatenMedals = [];
	for(var i = 0; i < data.medals.length; ++i){
		var medal = data.medals[i];
		for(var k in data.users){
			var user = data.users[k];
			if(!user.isAlive){ continue; }
			var dx = medal.posX - user.posX;
			var dy = medal.posY - user.posY;
			var dis = dx*dx+dy*dy;
			if(dis < medalRadius){
				user.hp = Math.min(user.hp+medalHealth, 100);
				user.score += 10;
				eatenMedals.push(i);
			}
		}
	}
	for(var i = eatenMedals.length - 1; i >= 0; --i) {
		data.medals.splice(eatenMedals[i], 1);
	}
	for(var k in data.users){
		var user = data.users[k];
		if(!user.isAlive){ continue; }
		if(user.posX != undefined && user.posY != undefined){
			if(user.cantControl >0){
				user.cantControl -= 1000/30;
			}else{
				user.cantControl = 0;
			}
			user.posX -= flightSpeed * Math.cos(user.angle+Math.PI/2);
			user.posY += flightSpeed * Math.sin(user.angle+Math.PI/2);
			user.posX = Math.max(0, Math.min(groundWidth, user.posX));
			user.posY = Math.max(0, Math.min(groundHeight, user.posY));
		}
		// user collision 
		for( var j in data.users){
			var user2 = data.users[j];
			if(!user2.isAlive || j==k){ continue; }
			var dx = user2.posX - user.posX;
			var dy = user2.posY - user.posY;
			var dis = dx*dx + dy*dy;
			if (dis < flightRadius) {
				//define ollision action => combine?
				var angle1 = Math.atan2(-dx, -dy);
				user.angle = angle1;
				// var angle2 = Math.atan2(dx, -dy);
				io.sockets.emit('flight_collision', 
					{socketId : k, turnToAngle : angle1});
				if(user.cantControl == 0){
					user.cantControl = stunTime;
				}
				// io.sockets.emit('flight_collision', 
				// 	{socketId : j, turnToAngle : angle2});


			}
		}

	}
	var destoyIndices = [];
	loopEachMissile:
	for(var i = 0; i < data.missiles.length; ++i){
		var minDistance;
		var nk;
		var missile = data.missiles[i];
		if(missile.posX < -groundWidth || missile.posX> groundWidth*2 ||
			missile.posY < -groundHeight || missile.posY > groundHeight*2){
			missile.speed = 0;
			missile.isExploding = true;
		}

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
			if(!user.isAlive){ continue; }
			if(user.posX != undefined && user.posY != undefined){
				var dx = missile.posX - user.posX;
				var dy = missile.posY - user.posY;
				var dis = dx*dx+dy*dy;
				if(dis < missileRadius){
					missile.speed = 0;
					missile.isExploding = true;
					user.hp -= missileDamage;
					if(user.hp <= 0){
						user.isAlive = false;
						data.medals.push({posX : user.posX, posY : user.posY});
						for(var j = 0; j < data.users[k].score / medalRatio; ++j){
							data.medals.push({
								posX : Math.max(0, Math.min(groundWidth, user.posX+ Math.random()*50-25))
								, posY : Math.max(0, Math.min(groundHeight, user.posY+ Math.random()*50-25))});
						}
						user.score = 0;
					}
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
		if(data.users[nk] != undefined && data.users[nk].isAlive){
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

function generateMissile(){
	if(data.missiles.length < data.usersCount*3){
		missilesCountDown -= 1000/30;
		if(missilesCountDown < 0){
			missilesCountDown = missileProduceRate;
			var offset = groundWidth/6;
			var gx;
			var gy;
			if(Math.random() > 0.5){
				gx = Math.random()*groundWidth;
				gy = -offset;
				if(Math.random() > 0.5){
					gy *= -1;
					gy += groundHeight;
				}
			}else{
				gy = Math.random()*groundHeight;
				gx = -offset;
				if(Math.random() > 0.5){
					gx *= -1;
					gx += groundWidth;
				}
			}
			data.missiles.push({posX : gx, posY : gy
								, angle : Math.random()*2*Math.PI, speed : missileSpeed
								, isExploding : false, explodingTimer : explodingDuration});
		}
		// console.log(data);
	}
}

function onTimerTick(){
	// console.log(data);

	generateMissile();
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