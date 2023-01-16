import './style.css';
import { Server } from './Server';

window.server = new Server();

document.getElementById('start')!.addEventListener('click', () => {
  document.getElementById('panel')!.style.display = 'none';
  document.getElementById('banner')?.remove();
  window.server.startGame();
});
