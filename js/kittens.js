// This sectin contains some game constants
var GAME_WIDTH = 375;
var GAME_HEIGHT = 500;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 3;
var MAX_LIVES = 500;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;

var AMMO_WIDTH = 1;
var AMMO_HEIGHT = 1;



// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var UP_ARROW_CODE = 38;
var RIGHT_ARROW_CODE = 39;
var DOWN_ARROW_CODE = 40;
var SPACE_ARROW_CODE = 32;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';
var MOVE_UP = 'up';
var MOVE_DOWN = 'down';



// Preload game images
var images = {};
['enemy.png', 'stars.png', 'player.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});





//superclass entity
class Entity {
    render(ctx)
    {
    		//variables sprite, x and y to be defined in subclass
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}

class Enemy extends Entity {
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];
        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
    }

    //updates the location of the enemy
    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }
}

class ammo extends Entity {
	constructor(xPos,yPos){
		super();
		this.x = xPos+(PLAYER_WIDTH/2);
		this.y = yPos+PLAYER_HEIGHT;
		this.sprite = images['bullet.png'];
		this.speed = Math.random() / 2 + 0.25;
	}

	update(timeDiff){
		this.y = this.y - timeDiff * this.speed;
	}
}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];
        this.lives = MAX_LIVES;
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - 5;
            console.log("X:"+this.x);
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + 5;
						console.log("X:"+this.x);
        }
        else if (direction === MOVE_UP && this.y > 0){
        		this.y = this.y - 5;
						console.log("Y:"+this.y);
				}
				else if (direction === MOVE_DOWN && this.y < GAME_HEIGHT - PLAYER_HEIGHT){
						this.y = this.y + 5;
						console.log("Y:"+this.y);
				}
    }
}
class Sound {
    constructor(src)
    {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
    }
    play()
    {
        this.sound.play();
    }
    stop()
    {
        this.sound.pause();
    }
}
/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();
        this.isRestart = 0;
        this.bgSound = new Sound("sounds/Game-Menu_Looping.mp3")
        this.collisionSound = new Sound("sounds/sfx_exp_medium1.wav");
        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
				//create enemies array if not already setup
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }


		// This method finds a random spot where there is no enemy, and puts one in there
		addEnemy() {
			var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

			var enemySpot;
			// Keep looping until we find a free enemy spot at random
			while (this.enemies[enemySpot]) {
				enemySpot = Math.floor(Math.random() * enemySpots);
			}
			//
			this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
		}

		setupBullets() {
			var maxBullets = GAME_WIDTH*GAME_HEIGHT; //as each bullet can at most ocuppy q pixel
			if(!this.bullets){
				this.bullets = [];
				this.bullets.length = maxBullets; //max bullet array length
			}
		}

		addBullet(){

		}


    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();
        this.bgSound.play();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
            else if (e.keyCode === UP_ARROW_CODE){
            		this.player.move(MOVE_UP);
						}
						else if (e.keyCode === DOWN_ARROW_CODE){
            	this.player.move(MOVE_DOWN);
						}
						else if (e.keyCode === SPACE_ARROW_CODE){

						}
            else if (e.keyCode === SPACE_ARROW_CODE && this.isRestart)
            {
                //this.score = 0;
                gameEngine.gameLoop();
            } 
        });

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill
    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;
        //this.bgSound.play();//
				//Increase the score
				this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));

        //Call update on all bullets
				this.bullets.forEach(bullet=> bullet.update(timeDiff));

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });
        this.setupEnemies();

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score + ' GAME OVER', 5, 30);
            document.addEventListener('keydown', e => {
            if (e.keyCode === SPACE_ARROW_CODE) {
                this.score = 0;
                this.player.lives = MAX_LIVES;
                this.isRestart = 1;
            	}
        	});
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score, 5, 30);
            this.ctx.fillText('LIFE:' + this.player.lives, 150, 30);
            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    colission(objA,objB,objAWeidth,objAHeight,objBWeidth,objBHeigth,){
    	console.log("objA:"+objA.x+","+objA.y);
    	console.log("objB:"+objB.x+","+objB.y);
			//What you tried didnt work (vertical and horizontal separation)
			//Reminder, Distance calculations is for circles
			//For Rectangular (axis aligned bounded box) collision detection	(Comparing boundaries)
			//https://developer.mozilla.org/kab/docs/Games/Techniques/2D_collision_detection#Axis-Aligned_Bounding_Box
			//https://www.youtube.com/watch?v=8b_reDI7iPM GOOD VIDEO for interviews
    	if(((objA.x + objAWeidth)> objB.x)//Player right > Eenemy Left
				&&(objA.x < objB.x + objBWeidth)//Palyer left < Enemy right
				&&((objA.y + objAHeight)>objB.y)//Palyer left < Enemy right
				&&(objA.y < objB.y + objBHeigth)//Player bottom < Enemy top
			){
				return true;
			}
			return false;
    }


    isPlayerDead() {
        // TODO: fix this function!
        for(var i = 0; i < this.enemies.length; i++){
        	console.log(this.enemies[i]);
					console.log(this.player);
					console.log("Printing This: " + this);
					//check for collision
					if(this.enemies[i] !== undefined) {
						if(this.colission(this.player,this.enemies[i],PLAYER_WIDTH,PLAYER_HEIGHT,ENEMY_WIDTH,ENEMY_HEIGHT))
						{
							this.collisionSound.play();
							delete this.enemies[i];

							if(this.player.lives === 0){
								this.bgSound.stop();
								return true;
							}
							else {
								console.log(this.player.lives);
								this.player.lives = this.player.lives - 1;
								console.log(this.player.lives);
								return false;
							}
						}
					}
        }
        return false;
    }
}

// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();