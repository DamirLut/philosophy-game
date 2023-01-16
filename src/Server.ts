import Peer, { DataConnection } from 'peerjs';
import { Application, Assets, Extract, Sprite } from 'pixi.js';
import { Button } from './Button';
import { Player } from './Player';
import { Screen } from './Screen';
import { colors, TIMER } from './tools';
import { Question } from './type';

export class Server {
  peer = new Peer('ph-123', {
    host: 'peer.iky.su',
  });

  clients: Player[] = [];
  buttons: Button[] = [];
  screen = new Screen();

  questions: Question[] = [];
  currentQuest = 0;
  running = false;

  constructor() {
    this.peer.on('open', () => {
      console.log('Server ready');
      this.peer.on('connection', this.onConnect.bind(this));
    });

    setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.alive) {
          console.log(client.nickname, 'time out');
          this.disconnect(client, 'time out');
        }
        client.alive = false;
      });
    }, 1000 * 10);

    this.ready();
  }

  async ready() {
    window.spritesheet = await Assets.load('./assets/data.json');
    window.app = new Application({
      width: 640,
      height: 360,
      background: 0x2ec6e5,
      antialias: false,
    });
    window.app.renderer.plugins.image = new Extract(window.app.renderer as any);

    const background = Sprite.from('./assets/background.png');
    window.app.stage.addChild(background);
    window.app.stage.addChild(this.screen);
    document.getElementById('app')!.appendChild(window.app.view as any);

    const center = 640 / 2;

    this.buttons = [
      new Button(center - 100, 200, 'red'),
      new Button(center - 100, 310, 'green'),
      new Button(center + 100, 200, 'blue'),
      new Button(center + 100, 310, 'yellow'),
    ];
    window.app.ticker.add((delta) => {
      this.buttons.forEach((btn) => (btn.pressed = false));
      this.clients.forEach((client) => client.Update(delta));
      this.buttons.forEach((btn) => btn.Update());
    });

    this.fetchQuestion();
  }

  private onConnect(connection: DataConnection) {
    if (!this.running) {
      const player = new Player(connection);
      this.clients.push(player);
      connection.on('close', () => {
        this.disconnect(player, 'close');
      });
    } else {
      connection.close();
    }
  }

  private disconnect(player: Player, reason: string) {
    player.disconnect(reason);

    this.clients.splice(this.clients.indexOf(player), 1);
    this.updateList();
  }

  updateList() {
    const list = document.getElementById('list')!;
    list.innerHTML = `<h3>Игроков: ${this.clients.length}</h3>`;
    this.clients.forEach((client) => {
      list.innerHTML += `<span>${client.nickname}</span>`;
    });
  }

  startGame() {
    this.running = true;
    const next = () => {
      if (this.currentQuest < this.questions.length) {
        const quest = this.questions.at(this.currentQuest++)!;
        this.screen.setQuestion(quest, `${this.currentQuest}/${this.questions.length})`);

        setTimeout(() => {
          const answer = quest.answer.map((answer) => quest.options.indexOf(answer));
          console.log('Правильный:', answer);
          this.clients.forEach((player) => {
            if (!answer.includes(colors.indexOf(player.button?.color!))) {
              this.disconnect(player, 'Bad answer');
            }
          });

          if (this.clients.length > 0) {
            next();
          } else {
            this.endGame();
          }
        }, 1000 * TIMER);
      } else {
        this.endGame(true);
        this.updateList();
      }
    };
    next();
  }

  private async endGame(showPlayers = false) {
    document.getElementById('panel')!.style.display = 'flex';
    this.running = false;
    if (showPlayers) {
      const div = document.createElement('div');
      div.className = 'banner';
      div.id = 'banner';

      div.innerHTML = `
        <h1>Победители</h1>
        <ul>
          ${(
            await Promise.all(
              this.clients.map(async (player) => {
                const spr = await window.app.renderer.plugins.image.base64(player.animations.idle);
                return `<li>
                <img src='${spr}' width="64" height="64" />
                <h4>${player.nickname}</h4>
              </li>`;
              }),
            )
          ).join('')}
        </ul>
      `;

      document.body.appendChild(div);
    }
  }

  private async fetchQuestion() {
    const data = await fetch('https://iky.su/philosophy-game/q.json').then((res) => res.json());
    data.sort(() => Math.random() - 0.5);
    this.questions = data;
    console.log(this.questions);
  }
}
