import { Server } from './Server';
import { Application } from 'pixi.js';

declare global {
  interface Window {
    server: Server;
    spritesheet: any;
    app: Application;
  }
}
