import { Container, Sprite } from 'pixi.js';


export class Button extends Container {
  btnSprite: Sprite;
  btnPressedSprite: Sprite;

  sprite: Sprite;
  pressed = false;

  constructor(x: number, y: number, public color: 'blue' | 'green' | 'red' | 'yellow') {
    super();
    this.position.set(x, y);
    this.btnSprite = Sprite.from(`./assets/buttons/${color}1.png`);
    this.btnPressedSprite = Sprite.from(`./assets/buttons/${color}2.png`);
    this.btnSprite.name = 'button';
    this.btnPressedSprite.name = 'button-pressed';

    this.btnSprite.anchor.set(0.5);
    this.btnPressedSprite.anchor.set(0.5);

    this.sprite = this.btnSprite;

    this.addChild(this.sprite);

    window.app.stage.addChild(this);
  }

  Update() {
    this.updateSprite(this.pressed ? this.btnPressedSprite : this.btnSprite);
  }

  private updateSprite(sprite: Sprite) {
    if (this.sprite.name != sprite.name) {
      this.removeChild(this.sprite);
      this.sprite = sprite;
      this.addChild(this.sprite);
    }
  }
}
