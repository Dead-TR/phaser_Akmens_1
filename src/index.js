import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'phaser';

document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
})

export const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 600,
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  "scale": {
    "mode": 0,
    "autoCenter": 2
  },
  physics: {
    default: 'arcade',
    arcade: {
      // debug: true,
    }
  }
};

const game = new Phaser.Game(config);

function preload (){
  this.load.image('grass', 'assets/img/grass.png');
  this.load.image('empty', 'assets/img/emptyLayers.png');
  this.load.image('cursor', 'assets/img/cursor.png');

  this.load.tilemapCSV('grassGrid', 'assets/grids/grass.csv');
  this.load.tilemapCSV('moovement', 'assets/grids/moovement.csv');

  this.load.spritesheet(
    'playerUp',
    'assets/img/player/p_up.png',
    {
      frameWidth: 19,
      frameHeight: 44,
      startFrame: 0,
      endFrame: 3,
    }
  );

  this.load.spritesheet(
    'playerDown',
    'assets/img/player/p_down.png',
    {
      frameWidth: 20,
      frameHeight: 44,
      startFrame: 0,
      endFrame: 3,
    }
  );

  this.load.spritesheet(
    'playerLeft',
    'assets/img/player/p_left.png',
    {
      frameWidth: 20,
      frameHeight: 45,
      startFrame: 0,
      endFrame: 3,
    }
  );

  this.load.spritesheet(
    'playerRight',
    'assets/img/player/p_right.png',
    {
      frameWidth: 20,
      frameHeight: 45,
      startFrame: 0,
      endFrame: 3,
    }
  );
}

let player, activeCell, playerTile, cam, mooveLayer, mooveOrder;

function create (){
  cam = this.cameras.main;

  const grassMap = this.make.tilemap({ //Таблиця зображень
    key: 'grassGrid',
    tileWidth: 32,
    tileHeight: 32,
  });

  const mooveMap = this.make.tilemap({ //Таблиця колізії
    key: 'moovement',
    tileWidth: 32,
    tileHeight: 32,
  });

  //тайлсет графіки
  const grassTileset = grassMap.addTilesetImage('grass', null, 32, 32);
  const grassLayer = grassMap.createStaticLayer(
    0,
    grassTileset,
    ((config.width - 480) / 2),
    ((config.height - 480) / 2)
  );

  // тайлсет колізії:
  const mooveTileset = grassMap.addTilesetImage('empty', null, 32, 32); // зелений -- обмеження
  mooveLayer = mooveMap.createStaticLayer(
    0,
    null, //слот, під зображення
    ((config.width - 480) / 2),
    ((config.height - 480) / 2)
  );

  //курсор і персонаж
  const cursor = this.add.image(
    ((config.width - 480) / 2) + 224 + 16,
    ((config.height - 480) / 2) + 416 + 16,
    'cursor',
  );

  player = this.physics.add
    .sprite(
      ((config.width - 480) / 2) + 224 + 16,
      ((config.height - 480) / 2) + 406 + 16,
      'playerUp',
      1,
    ).setOrigin(0.5, 0.5)

  cam.setBounds(0, 0, mooveLayer.width + 100, mooveLayer.height + 100);
  cam.startFollow(player, true, 1, 1, 0, 0);

  // блок переміщення курсору
  activeCell = {};
  mooveOrder = true;

  const playerGoAction = () => {
    if (mooveOrder) {
      // mooveOrder = false; // -- заборона на зміну напрямку руху персонажа
      const tile = mooveLayer.getTileAtWorldXY(cursor.x, cursor.y + 32, false); //т-мап курсору
      playerTile = mooveLayer.getTileAtWorldXY(player.x, player.y, false); //т-мап персонажа

      activeCell.cursorX = cursor.x;
      activeCell.cursorY = cursor.y;
      activeCell.userX = player.x;
      activeCell.userY = player.y;
      activeCell.pixelY = tile.pixelY;
      activeCell.pixelX = tile.pixelX;
    }
  }

  this.input.on('pointerup', (event) => {
    if(event.leftButtonReleased()) {
      const stopIndex = 1;

      const tile = mooveLayer.getTileAtWorldXY(event.downX+cam.scrollX, event.downY+cam.scrollY, true);

      if (tile !== null && tile.index !== stopIndex) {
        cursor.x = tile.pixelX + 16 + ((config.width - 480) / 2);
        cursor.y = tile.pixelY + 16 + ((config.height - 480) / 2);
      }
    }

    if(event.rightButtonReleased()) {
      playerGoAction();
    }
  }, this)

  this.input.keyboard.on('keydown', function (event) {
    const stopIndex = 1;

    if(event.code === "Space") {
      console.log("scrollX", cam.scrollX)
      console.log("scrollY", cam.scrollY)
    }

    if (event.key === 'ArrowLeft') {
      const tile = mooveLayer.getTileAtWorldXY(cursor.x - 32, cursor.y, false);

      if (tile !== null && tile.index !== stopIndex) {
        cursor.x -= 32;
      }
    }

    else if (event.key === 'ArrowRight') {
      const tile = mooveLayer.getTileAtWorldXY(cursor.x + 32, cursor.y, false);

      if (tile !== null && tile.index !== stopIndex) {
        cursor.x += 32;
      }
    }

    else if (event.key === 'ArrowUp') {
      const tile = mooveLayer.getTileAtWorldXY(cursor.x, cursor.y - 32, false);

      if (tile !== null && tile.index !== stopIndex) {
        cursor.y -= 32;
      }
    }

    else if (event.key === 'ArrowDown') {
      const tile = mooveLayer.getTileAtWorldXY(cursor.x, cursor.y + 32, false);

      if (tile !== null && tile.index !== stopIndex) {
        cursor.y += 32;
      }
    }

    if (event.key === 'Enter') {
      playerGoAction();
    }
  });
  // кінець блоку переміщення курсору

  // блок створення анімацій
  this.anims.create({
    key: 'playerGoUp',
    frames: this.anims.generateFrameNumbers(
      'playerUp',
      {
        start: 0,
        end: 3,
      },
    ),
    frameRate: 6,
    repeat: -1,
  })

  this.anims.create({
    key: 'playerGoDown',
    frames: this.anims.generateFrameNumbers(
      'playerDown',
      {
        start: 0,
        end: 3,
      },
    ),
    frameRate: 6,
    repeat: -1,
  });

  this.anims.create({
    key: 'playerGoLeft',
    frames: this.anims.generateFrameNumbers(
      'playerLeft',
      {
        start: 0,
        end: 3,
      },
    ),
    frameRate: 6,
    repeat: -1,
  });

  this.anims.create({
    key: 'playerGoRight',
    frames: this.anims.generateFrameNumbers(
      'playerRight',
      {
        start: 0,
        end: 3,
      },
    ),
    frameRate: 6,
    repeat: -1,
  });
  // кінець блоку створення анімацій

}

function update() {
  playerTile = mooveLayer.getTileAtWorldXY(player.x, player.y, false);
  // cam.setFollowOffset(player.x, 0);

  //рух по вертикалі----------------------------
  if (activeCell.cursorY >= 0) {

    if ((activeCell.userY - (activeCell.cursorY)) < 0) { //рух вниз
      !player.anims.isPlaying && player.anims.play('playerGoDown', true);
      player.setVelocityY(100);

      characterCollision(0, 32);//зупиняємо персонажа, перед перешкодою
    } else if ((activeCell.userY - (activeCell.cursorY)) >= 0) { //вгору
      !player.anims.isPlaying && player.anims.play('playerGoUp', true);
      player.setVelocityY(-100);

      characterCollision(0, -5)
    }

    //зупинення гравця
    if (
      activeCell.pixelY + 36 >= Math.floor(player.y)-1
        && activeCell.pixelY + 35 <= Math.floor(player.y)+1
    ) {
      playerStop('y');
    };
  };

  //рух по горизонталі--------------------------
  if (activeCell.cursorX >= 0) {
    if ((activeCell.userX - (activeCell.cursorX)) < 0) {
      player.anims.play('playerGoRight', true);
      player.setVelocityX(100); //праворуч

      characterCollision(15, 0);
    } else if ((activeCell.userX - (activeCell.cursorX)) > 0) {
      player.anims.play('playerGoLeft', true);
      player.setVelocityX(-100);  //ліворуч

      characterCollision(-15, 0);
    }

    //зупинення гравця
    if (
      activeCell.pixelX + 76 >= Math.floor(player.x)-1
        && activeCell.pixelX + 75 <= Math.floor(player.x)+1
    ) {
      playerStop('x');
    };
  }//------------------------------------------

  if (!activeCell.cursorX && !activeCell.cursorY) {
    mooveOrder = true;
  }
}


//функція зупинення гравця
function playerStop(coordinate) {
  player.anims.pause(player.anims.currentAnim.frames[1]);

  if (coordinate === 'y') {
    player.setVelocityY(0);
    delete activeCell.cursorY;
  } else if (coordinate === 'x') {
    player.setVelocityX(0);
    delete activeCell.cursorX;
  }
}

//ф-я, що зупиняє персонажа, перед перешкодою:
function characterCollision(cooX, cooY) {
  const aheadTile = mooveLayer.getTileAtWorldXY(player.x + cooX, player.y + cooY);
  if (aheadTile.index === 1) {
    if (cooY === 0) {
      playerStop('x');
      delete activeCell.cursorX;
    } else {
      playerStop('y');
      delete activeCell.cursorY;
    }
  }
}