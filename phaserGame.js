var config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: true
      }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
        extend: {
                    player: null,
                    reticle: null,
                    moveKeys: null,
                    bullets: null,
                    lastFired: 0,
                    time: 0,
                }
    }
};

var game = new Phaser.Game(config);

// Bullet class
var Bullet = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:

    // Bullet Constructor
    function Bullet (scene)
    {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');

        this.speed = 1;
        this.born = 0;
        this.direction = 0;
        this.xSpeed = 0;
        this.ySpeed = 0;
        this.setSize(12, 12, true);
    },

    // Shoots a bullet from the player to the reticle
    fire: function (player, pointer)
    {
        this.setPosition(player.x, player.y); // Initial position

        // Calculate trajectory of bullet so that it moves from player towards pointer
        // Alterntively reimplement to use Phaser arcade physics and vectors
        this.direction = Math.atan( (reticle.x-this.x) / (reticle.y-this.y));

        if (reticle.y > this.y)
        {
            this.xSpeed = this.speed*Math.sin(this.direction);
            this.ySpeed = this.speed*Math.cos(this.direction);
        }
        else
        {
            this.xSpeed = -this.speed*Math.sin(this.direction);
            this.ySpeed = -this.speed*Math.cos(this.direction);
        }

        // Take angling of the bullet from rotation of player
        this.rotation = player.rotation;

        // Time since new bullet spawned
        this.born = 0;
    },

    // Updates the position of the bullet each cycle
    update: function (time, delta)
    {
        this.x += this.xSpeed * delta;
        this.y += this.ySpeed * delta;

        this.born += delta;

        // Deactivates bullet after 1800 update cycles
        if (this.born > 1800)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }

});

function preload ()
{
    // Load in images and sprites
    // Made by tokkatrain: https://tokkatrain.itch.io/top-down-basic-set
    this.load.spritesheet('player_handgun', 'assets/sprites/player_handgun.png',
        { frameWidth: 66, frameHeight: 60 }
    );
    this.load.image('bullet', 'assets/sprites/bullet6.png');
    this.load.image('target', 'assets/sprites/target.png');
    this.load.image('background', 'assets/sprites/background.jpg');
}

function create ()
{
    // Create background
    var background = this.add.image(800, 600, 'background');
    background.setOrigin(0.5, 0.5).setDisplaySize(1600, 1200);

    // Create world bounds
    this.physics.world.setBounds(0, 0, 1600, 1200);

    // Create group for Bullet objects (so they can be recycled)
    this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });

    // Create player sprite
    player = this.physics.add.sprite(800, 600, 'player_handgun').setDepth(1);
    player.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true);
    player.setDrag(500, 500);

    // Create reticle sprite
    reticle = this.physics.add.sprite(800, 700, 'target').setDepth(1);
    reticle.setOrigin(0.5, 0.5).setDisplaySize(25, 25).setCollideWorldBounds(true);

    // Set camera zoom
    this.cameras.main.zoom = 0.5;

    // Creates object for input with WASD kets
    moveKeys = this.input.keyboard.addKeys({

        'up': Phaser.Input.Keyboard.KeyCodes.W,
        'down': Phaser.Input.Keyboard.KeyCodes.S,
        'left': Phaser.Input.Keyboard.KeyCodes.A,
        'right': Phaser.Input.Keyboard.KeyCodes.D

    });

    // Enables movement of player with WASD keys
    this.input.keyboard.on('keydown_W', function (event) {
        player.setAccelerationY(-800);
    });

    this.input.keyboard.on('keydown_S', function (event) {
        player.setAccelerationY(800);
    });

    this.input.keyboard.on('keydown_A', function (event) {
        player.setAccelerationX(-800);
    });

    this.input.keyboard.on('keydown_D', function (event) {
        player.setAccelerationX(800);
    });

    // Stops player acceleration on uppress of WASD keys
    this.input.keyboard.on('keyup_W', function (event) {
        if (moveKeys['down'].isUp)
        {
            player.setAccelerationY(0);
        }
    });

    this.input.keyboard.on('keyup_S', function (event) {
        if (moveKeys['up'].isUp)
        {
            player.setAccelerationY(0);
        }
    });

    this.input.keyboard.on('keyup_A', function (event) {
        if (moveKeys['right'].isUp)
        {
            player.setAccelerationX(0);
        }
    });

    this.input.keyboard.on('keyup_D', function (event) {
        if (moveKeys['left'].isUp)
        {
            player.setAccelerationX(0);
        }
    });

    // Fires bullet from player on left click of mouse
    this.input.on('pointerdown', function (pointer, time, lastFired) {

            var bullet = this.bullets.get(); // Get bullet from bullets group
            bullet.setActive(true);
            bullet.setVisible(true);

            if (bullet)
            {
                bullet.fire(player, pointer);
            }

    }, this);

    // Pointer lock will only work after mousedown
    game.canvas.addEventListener('mousedown', function () {

        game.input.mouse.requestPointerLock();

    });

    // Exit pointer lock when Q or escape (by default) is pressed.
    this.input.keyboard.on('keydown_Q', function (event) {

        if (game.input.mouse.locked)
        {
            game.input.mouse.releasePointerLock();
        }

    }, 0, this);

    //Move reticle upon locked pointer move
    this.input.on('pointermove', function (pointer) {

        if (this.input.mouse.locked)
        {

            // Move reticle with mouse
            reticle.x += pointer.movementX;
            reticle.y += pointer.movementY;

            // Only works when camera follows player
            var distX = reticle.x-player.x;
            var distY = reticle.y-player.y;

            // Ensures reticle cannot be moved offscreen
            if (distX > 800)
                reticle.x = player.x+800;
            else if (distX < -800)
                reticle.x = player.x-800;

            if (distY > 600)
                reticle.y = player.y+600;
            else if (distY < -600)
                reticle.y = player.y-600;

        }

    }, this);

}

// Alternatively to this, continually set sprite.body.maxVelocity in update
// Ensures sprite speed doesnt exceed maxVelocity while update is called
function constrainVelocity(sprite, maxVelocity)
{
    if (!sprite || !sprite.body)
    {
      return;
    }

    var angle, currVelocitySqr, vx, vy;
    vx = sprite.body.velocity.x;
    vy = sprite.body.velocity.y;
    currVelocitySqr = vx * vx + vy * vy;

    if (currVelocitySqr > maxVelocity * maxVelocity)
    {
        angle = Math.atan2(vy, vx);
        vx = Math.cos(angle) * maxVelocity;
        vy = Math.sin(angle) * maxVelocity;
        sprite.body.velocity.x = vx;
        sprite.body.velocity.y = vy;
    }
}

// var avgX;
// var avgY;

function update (time, delta)
{
    // Rotates player to face towards reticle
    player.rotation = Phaser.Math.Angle.Between(player.x, player.y, reticle.x, reticle.y);

    // Implement target-focus camera with physics smoothing
    // Camera position is average between reticle and player positions

    // Camera position is average between player and reticle
    // avgX = ((player.x+reticle.x)/2)-400;
    // avgY = ((player.y+reticle.y)/2)-300;
    // this.cameras.main.scrollX = avgX;
    // this.cameras.main.scrollY = avgY;

    // Camera follows reticle
    // this.cameras.main.startFollow(reticle);

    // Camera follows player
    this.cameras.main.startFollow(player);

    //Make reticle move with player
    reticle.body.velocity.x = player.body.velocity.x;
    reticle.body.velocity.y = player.body.velocity.y;

    // Constrain velocity of player
    constrainVelocity(player, 500);

}
