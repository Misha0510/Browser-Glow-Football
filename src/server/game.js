const Constants = require("../shared/constants");
const Player = require("./player");
const Ball = require("./ball");
const perf_hooks = require("perf_hooks");

class Game {
	constructor() {
		this.sockets = {};
		this.players = {};
		this.ball = new Ball();
		this.lastUpdateTime = Date.now();
		this.players_count = 0;
		this.blueScore = 0;
		this.redScore = 0;
		this.bluePlayersCount = 0;
		this.redPlayersCount = 0;
		this.playerBallColisonDistance = (Constants.BALL.RADIUS + Constants.PLAYER.RADIUS) ** 2;
		this.playerBallHoldDistance = this.playerBallColisonDistance * 4;
		this.playerPlayerColisonDistance = (Constants.PLAYER.RADIUS * 2) ** 2;


		this.performance = {
			update: {
				sum: 0,
				avg: 0,
				max: 0,
				counter: 0,
			},
		};
		// Start updating
		this.interval = setInterval(() => {
			this.update();
		}
		, Constants.SERVER_PING);
	}

	update() {
		const start = perf_hooks.performance.now();

		const dt = (Date.now() - this.lastUpdateTime) / 1000;
		// Process colision
		this.colision(dt);
		// Process movement
		this.move(dt);
		// Send update to all players
		this.sendUpdate();
		// Save time of last update
		this.lastUpdateTime = Date.now();
		
		const end = perf_hooks.performance.now();
		this.performanceAddtime(end - start);
	}

	move(dt) {
		// Move ball
		let res;
		if ((res = this.ball.move(dt)) === 2) {
			this.goal(true);
		} else if (res === 1) {
			this.goal(false);
		}
		// Move all players
		Object.values(this.players).forEach(function (player) {
			player.move(dt);
		});
	}

	colision(dt) {
		let i = 0;

		for (const socket in this.players) {
			switch (this.isBallTouch(socket, dt)) {
			case 0:
				this.players[socket].velosity = Constants.PLAYER.SPEED;
				break;
			case 1:
				this.playerTouchBall(socket); //Touch
				break;
			case 2:
				this.playerHoldBall(socket);
				break;
			case 3:
				this.playerShotBall(socket); // Shot
				break;
			case 4:
				this.playerAssistBall(socket); // Assist
				break;
			case 5:
				this.playerInterractBall(socket);
				this.players[socket].velosity = Constants.PLAYER.NITRO_VELOSITY;
				break;
			}
			this.players[socket].assist = false;
			this.playerPlayerCollision(socket, i);

			i++;
		}
	}

	sendUpdate() {
		const update = this.createUpdate();
		Object.keys(this.sockets).forEach((playerID) => {
			const socket = this.sockets[playerID];
			socket.emit(Constants.MSG_TYPE.GAME_UPDATE, update);
		});
	}

	playerTouchBall(player) {
		const PowerVector = Math.atan2(this.ball.x - this.players[player].x, this.ball.y - this.players[player].y);
		this.ball.direction = PowerVector;
		this.ball.velosity =(((this.players[player].mass - this.ball.mass) *  this.players[player].velosity +  2 * this.ball.mass) /  (this.players[player].mass + this.ball.mass)) *2;
	}

	playerHoldBall(socket) {
		this.players[socket].velosity = Constants.PLAYER.PULL_SPEED;
		this.ball.x = this.players[socket].x + this.players[socket].radius * Math.sin(this.players[socket].direction);
		this.ball.y = this.players[socket].y + this.players[socket].radius * Math.cos(this.players[socket].direction);
		this.ball.direction = this.players[socket].direction;
		this.ball.velosity = this.players[socket].velosity;
	}

	playerInterractBall(socket) {
		const ballY = this.ball.y;
		const ballX = this.ball.x;

		const playerY = this.players[socket].y;
		const playerX = this.players[socket].x;
		const currentDistance = (ballY - playerY) ** 2 + (ballX - playerX) ** 2;
		
		if (this.players[socket].pull) {
			
			if (currentDistance <= Constants.PHYSICS.DISTANCE_PLAYER_PULL_POWER) {
				this.ball.y -= Constants.PHYSICS.PLAYER_PULL_POWER * (ballY - playerY)/Math.abs(ballY - playerY);
				this.ball.x -= Constants.PHYSICS.PLAYER_PULL_POWER * (ballX - playerX)/Math.abs(ballX - playerX);
			}
			else if (currentDistance <= Constants.PHYSICS.DISTANCE_PLAYER_PULL_POWER * 4) {
				this.ball.y -= (Constants.PHYSICS.PLAYER_PULL_POWER / 2) * (ballY - playerY)/Math.abs(ballY - playerY);
				this.ball.x -= (Constants.PHYSICS.PLAYER_PULL_POWER / 2) * (ballX - playerX)/Math.abs(ballX - playerX);
			}
			return;
		}
		if (this.players[socket].rotateClockwise && currentDistance <= Constants.PHYSICS.DISTANCE_PLAYER_PULL_POWER) {
			this.ball.direction = Math.atan2(this.ball.x - this.players[socket].x, this.ball.y - this.players[socket].y) + Math.PI / 2;
			this.ball.velosity += Constants.PHYSICS.BOUNS_BALL_VELOSITY_ON_ROTATE; 
			return;
		}
		if (this.players[socket].rotateCounterClockwise && currentDistance <= Constants.PHYSICS.DISTANCE_PLAYER_PULL_POWER) {
			this.ball.direction = Math.atan2(this.ball.x - this.players[socket].x, this.ball.y - this.players[socket].y) - Math.PI / 2;
			this.ball.velosity += Constants.PHYSICS.BOUNS_BALL_VELOSITY_ON_ROTATE; 
			return;
		}
		if (this.players[socket].push && currentDistance <= Constants.PHYSICS.DISTANCE_PLAYER_PULL_POWER) {
			this.ball.direction = this.players[socket].direction;
			this.ball.velosity = this.players[socket].velosity;
		}
	}

	playerShotBall(socket) {
		this.ball.x = this.players[socket].x + (this.players[socket].radius + this.ball.radius + 2) * Math.sin(this.players[socket].direction);
		this.ball.y = this.players[socket].y + (this.players[socket].radius + this.ball.radius + 2) * Math.cos(this.players[socket].direction);
		this.ball.direction = this.players[socket].direction;
		this.ball.velosity = Constants.PHYSICS.SHOT_SPEED;
		this.players[socket].shot = 0;
		this.players[socket].pull = false;
		this.players[socket].push = false;
		this.players[socket].assist = false;
	}

	playerAssistBall(socket) {
		this.ball.x = this.players[socket].x + (this.players[socket].radius + this.ball.radius + 2) * Math.sin(this.players[socket].direction);
		this.ball.y = this.players[socket].y + (this.players[socket].radius + this.ball.radius + 2) * Math.cos(this.players[socket].direction);
		this.ball.direction = this.players[socket].direction;
		this.ball.velosity = Constants.PHYSICS.ASSIST_SPEED;

		this.players[socket].pull = false;
	}

	isBallTouch(socket, dt) {
		const ballY = this.ball.x + dt * this.ball.velosity * Math.cos(this.ball.direction);
		const ballX = this.ball.y + dt * this.ball.velosity * Math.sin(this.ball.direction);

		const playerY = this.players[socket].x + dt * this.players[socket].velosity * Math.cos(this.players[socket].direction);
		const playerX = this.players[socket].y + dt * this.players[socket].velosity * Math.sin(this.players[socket].direction);

		const currentDistance = (ballY - playerY) ** 2 + (ballX - playerX) ** 2;

		if (currentDistance <= this.playerBallColisonDistance) {
			if (this.players[socket].pull) {
				if (this.players[socket].shot !== 0) {
					return 3;
				} // Player Hold the ball and shots it in same time
				else if (this.players[socket].assist === true) {
					return 4;
				} // Player assist
				else {
					return 2;
				} // Player holds the ball
			} else {
				return 1;
			} // Just collision
		} else {
			if (currentDistance <= this.playerBallHoldDistance && this.players[socket].pull){
				return 2;
			}
			else if (this.players[socket].pull || this.players[socket].push || this.players[socket].rotateClockwise || this.players[socket].rotateCounterClockwise) {
				return 5;
			} // Player gets Nitro
			else {
				return 0;
			} // No collision
		}
	}

	playerPlayerCollision(player, me_index) {
		let i = 0;
		for (const other in this.players) {
			if (i > me_index) {
				const current_distance = (this.players[other].x - this.players[player].x) ** 2 + (this.players[other].y - this.players[player].y) ** 2;
				if (current_distance <= Constants.PLAYER.RADIUS ** 2 * 2) {
					// Process colision = change directions and speed
					const dir = this.players[other].direction;
					this.players[other].direction = this.players[player].direction;
					this.players[player].direction = dir;
				}
			}
			i++;
		}
	}

	goal(team) {
		// Set ball to center
		this.ball.x = Constants.PITCH.FULL_X / 2;
		this.ball.y = Constants.PITCH.FULL_Y / 2;
		this.ball.velosity = 0;
		// Set Players to start
		let red_number = 1;
		let blue_number = 1;

		for (const socket in this.players) {
			// For blue tam
			if (this.players[socket].team) {
				this.players[socket].x =
          (Constants.PITCH.FULL_X / 2) * (blue_number / 3);
				this.players[socket].y = Constants.PITCH.FULL_Y / 2;
				blue_number++;
			} else if (!this.players[socket].team) {
				this.players[socket].x =
          Constants.PITCH.FULL_X / 2 +
          (Constants.PITCH.FULL_X / 2) * (red_number / 3);
				this.players[socket].y = Constants.PITCH.FULL_Y / 2;
				red_number++;
			}

			this.players[socket].velosity = 0;
			this.players[socket].pull = false;
			this.players[socket].push = false;
		}

		let res;
		if (team === true) {
			this.redScore++;
			res = {
				team_scored: false,
				blue: this.blueScore,
				red: this.redScore,
			};
		} else {
			this.blueScore++;
			res = {
				team_scored: true,
				blue: this.blueScore,
				red: this.redScore,
			};
		}

		
		Object.keys(this.sockets).forEach((playerID) => {
			const socket = this.sockets[playerID];
			socket.emit(Constants.MSG_TYPE.GOAL, res);
		});
		
		this.sendUpdate();
		this.pause(Constants.GAME.AFTER_GOAL_DELAY_MS); // Wait for players to see the goal
	}

	pause(delay) {
		clearInterval(this.interval);
		setTimeout(() => {
			this.lastUpdateTime = Date.now();
			this.interval = setInterval(() => {
				this.update();
			}, Constants.SERVER_PING);
		}, delay);
	}

	handleInput(socket, msg) {
		if (!Object.prototype.hasOwnProperty.call(this.players, `${socket.id}`))
			return;
		
		if (msg.inputType === Constants.INPUT_TYPE.KEY)
			for (let key in msg.res) {
				this.players[socket.id][key] = msg.res[key];	
			}
		else
			this.players[socket.id][msg.inputType] = msg.res;	

	}
	
	createUpdate() {
		return {
			t: Date.now(),
			ball: this.ball,
			players: Object.values(this.players).map((player) => {
				return {
					x: player.x,
					y: player.y,
					socket: player.socket,
					team: player.team,
				};
			}),
		};
	}

	addPlayer(socket, nickname) {
		this.players_count++;
		const team = this.players_count % 2;
		const team_name = team === true ? "BLUE".blue : "RED ".red;
		team === true ? this.bluePlayersCount++ : this.redPlayersCount++;
		this.sockets[socket.id] = socket;

		// Generate a position to start this player at.
		const x = Constants.PITCH.FULL_X / 3 + (Constants.PITCH.FULL_X / 3) * !team;
		const y = (Constants.PITCH.FULL_Y / 5) * (team === true ? (this.bluePlayersCount % 3) + 2 : (this.redPlayersCount % 3) + 2);
		// Add player to global players array
		this.players[socket.id] = new Player(socket.id, nickname, x, y, team);
		console.log(team_name + ":    " + nickname.bold + ":  connected:  on socket: ( " + socket.id + " )");
	}

	removePlayer(socket) {
		if (!Object.prototype.hasOwnProperty.call(this.players, `${socket.id}`))
			return;
		
		if (this.players[socket.id].team === true)
			this.bluePlayersCount--;
		else
			this.redPlayersCount--;
		
		delete this.sockets[ socket.id ];
		delete this.players[ socket.id ];
		this.players_count--;
	}
	
	performanceAddtime(time) {
		this.performance.update.sum += time;
		
		if (this.performance.update.counter++ >= 1000 / Constants.SERVER_PING) {
			this.performance.update.avg = this.performance.update.sum / this.performance.update.counter;
			this.performance.update.sum = 0;
			this.performance.update.counter = 0;
			process.stdout.write("\r\x1b[K");
			process.stdout.write("Update: " + this.performance.update.avg.toFixed(2) + "ms");
		}
	} 
}

module.exports = Game;