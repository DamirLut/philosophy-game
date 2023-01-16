import { Container, Point, Text, TextStyle } from 'pixi.js';
import { emojiColor, TIMER } from './tools';
import { Question } from './type';

const style = new TextStyle({
  fontFamily: 'monogram-extended',
  fontSize: 16,
  fill: '#fff',
  wordWrap: true,
  wordWrapWidth: 440,
  lineJoin: 'round',
  letterSpacing: 1,
  lineHeight: 17,
});

export class Screen extends Container {
  pos1 = new Point(112, 15);
  pos2 = new Point(511, 113);

  text = new Text('', style);

  question = 'Сделали DamirLut & Ikysu\n\nhttps://damirlut.online\nhttps://iky.su\n';

  private timer = -1;
  timerText = new Text('', style);

  constructor() {
    super();
    this.x = this.pos1.x;
    this.y = this.pos1.y;
    const width = this.pos2.x - this.pos1.x;
    const height = this.pos2.y - this.pos1.y;

    this.addChild(this.text);
    this.addChild(this.timerText);
    this.timerText.position.set(this.x + width - 96, this.y + height - 16);

    setInterval(() => {
      const n = this.text.text.length;
      if (n < this.question.length) {
        this.setText(this.text.text + this.question[n]);
      }
    }, 50);
  }

  setText(text: string) {
    this.text.text = text;
  }

  setQuestion(quest: Question, preffix = '') {
    this.question = preffix + ' ' + quest.question + '\n';

    quest.options.forEach((option, index) => {
      this.question += `\n ${emojiColor[index]} ${option}`;
    });

    this.setText('');
    let i = TIMER;
    this.timer = setInterval(() => {
      this.timerText.text = --i;
      if (i == 0) {
        clearInterval(this.timer);
      }
    }, 1000);

    window.server.clients.forEach((client) => {
      client.send('question', quest);
    });
  }
}
