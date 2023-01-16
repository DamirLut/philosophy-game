import { DataConnection } from 'peerjs';
import { AnimatedSprite, Container,  Point, Sprite  } from 'pixi.js';
import { Button } from './Button';
import { Choose, Clamp, RandomRange, testForAABB } from './tools';
/*
const style = new TextStyle({
  fontFamily: 'monogram',
  
fontSize: 12,
  fill: '#ffffff',
  stroke: '#000',
  strokeThickness: 5,
});
*/
const heros = ['doux', 'kuro', 'loki', 'mono', 'nico', 'olaf', 'kira', 'vita', 'mort', 'tard'];

heros.sort(() => Math.random() - 0.5);

function getHero() {
  const hero = heros.shift()!;
  heros.push(hero);
  return hero;
}

export class Player extends Container {
  private resetTimeout = -1;
  private sprite: AnimatedSprite;
  
  nickname = 'loading...';
  canMove = false;
  alive = true;
  button: Button | null = null;

  spawn = new Point(0, 0);
  spawnAnimation = false;

  sex = Choose(['female', 'male']);
  hero = getHero();

  animations = {
    idle: new AnimatedSprite(window.spritesheet.animations[`${this.sex}-${this.hero}/idle`]),
    move: new AnimatedSprite(window.spritesheet.animations[`${this.sex}-${this.hero}/move`]),
    dead: new AnimatedSprite(window.spritesheet.animations[`${this.sex}-${this.hero}/dead`]),
    spawn: new AnimatedSprite(window.spritesheet.animations[`${this.sex}-${this.hero}/spawn`]),
  };

  constructor(private peer: DataConnection) {
    super();

    this.sprite = this.animations.idle;

    const shadow = Sprite.from('./assets/shadow.png');
    shadow.anchor.set(0.5, 1);
    shadow.position.set(0, this.sprite.height / 2);

    this.x = -100;
    this.y = -100;

    this.addChild(shadow);
    this.addChild(this.sprite);

    window.app.stage.addChild(this);

    const events: Record<string, (data: any) => void> = {};

    Object.getOwnPropertyNames(Player.prototype).forEach((fn) => {
      if (fn.startsWith('on')) {
        const name = fn.replace('on', '').toLowerCase();
        ///@ts-ignore
        events[name] = this[fn];
      }
    });

    this.peer.on('data', (message) => {
      const { event, data } = message as { event: string; data: unknown };
      if (event in events) {
        events[event].bind(this)(data);
      }
    });
  }

  Update(delta: number) {
    if (!this.canMove) {
      if (this.spawnAnimation) {
        if (this.y < this.spawn.y) {
          this.y += 5 * delta;
          this.y = Math.floor(this.y);
        } else {
          this.spawnAnimation = false;
          this.sprite.play();
        }
      }

      return;
    }

    let anyPress = false;

    window.server.buttons.forEach((btn) => {
      if (testForAABB(this, btn)) {
        btn.pressed = true;
        anyPress = true;
        if (this.button != btn) {
          this.send('button', { color: btn.color });
          this.button = btn;
        }
      }
    });

    if (!anyPress && this.button) {
      this.button = null;
      this.send('button', { color: -1 });
    }
  }

  onMove({ x, y }: { x: number; y: number }) {
    if (!this.canMove) return;
    this.x += x;
    this.y -= y;
    const width = this.sprite.width;
    const height = this.sprite.height;

    this.x = Math.floor(Clamp(this.x, width / 2, 640 - width / 2));
    this.y = Math.floor(Clamp(this.y, 150, 360 - height / 2));

    this.sprite.scale.x = x != 0 ? Math.sign(x) : this.sprite.scale.x;

    this.updateSprite(this.animations.move);

    if (this.resetTimeout > 0) {
      clearTimeout(this.resetTimeout);
    }

    this.resetTimeout = setTimeout(() => {
      this.updateSprite(this.animations.idle);
    }, 100);
  }
  onSetnickname({ nickname, sex }: { nickname: string; sex: string }) {
    this.nickname = nickname;
    this.sex = sex;

    this.setAnimations();
    this.updateSprite(this.animations.spawn);
    this.sprite.stop();
    this.spawnAnimation = true;

    const radius = 25;

    this.spawn.x = Math.floor(window.app.screen.width / 2 + RandomRange(-radius, radius));
    this.spawn.y = Math.floor(window.app.screen.height / 1.5 + RandomRange(-radius, radius));
    this.x = this.spawn.x;
    this.y = -100;

    //this.text.text = nickname;
    this.send('question', { question: window.server.screen.question });
    window.app.renderer.plugins.image.base64(this.animations.idle).then((image: string) => {
      this.send('dyno', { image });
    });

    console.log(this.nickname, 'connected');

    window.server.updateList();
  }

  onHeartbeat() {
    this.alive = true;
  }

  send(event: string, data: object) {
    this.peer.send({ event, data });
  }

  private setAnimations() {
    this.animations = {
      idle: new AnimatedSprite(window.spritesheet.animations[`${this.sex}-${this.hero}/idle`]),
      move: new AnimatedSprite(window.spritesheet.animations[`${this.sex}-${this.hero}/move`]),
      dead: new AnimatedSprite(window.spritesheet.animations[`${this.sex}-${this.hero}/dead`]),
      spawn: new AnimatedSprite(window.spritesheet.animations[`${this.sex}-${this.hero}/spawn`]),
    };
    Object.entries(this.animations).forEach(([type, sprite]) => {
      sprite.animationSpeed = 1000 / (60 * 100);
      sprite.anchor.set(0.5);
      sprite.name = type;
    });

    this.animations.dead.loop = false;
    this.animations.spawn.loop = false;

    this.animations.spawn.onComplete = () => {
      this.canMove = true;
      this.updateSprite(this.animations.idle);
      this.spawnAnimation = false;
    };
  }

  private updateSprite(sprite: AnimatedSprite) {
    if (this.sprite.name != sprite.name) {
      this.removeChild(this.sprite);
      this.sprite = sprite;
      this.sprite.play();
      this.addChild(this.sprite);
    }
  }

  disconnect(reason: string) {
    this.updateSprite(this.animations.dead);
    const remove = () => {
      this.alive = false;
      window.app.stage.removeChild(this);
      this.peer.close();
      console.log(this.nickname, 'disconnected', reason);
    };
    this.sprite.onComplete = remove;
    setTimeout(() => {
      if (this.alive) {
        window.app.stage.removeChild(this);
        this.peer.close();
        console.log(this.nickname, 'disconnected', reason);
      }
    }, 5000);
  }
}
