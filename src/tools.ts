import { Container } from 'pixi.js';

export function Lerp(start: number, end: number, t: number) {
  return (1 - t) * start + t * end;
}

export function Choose<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export function RandomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function Clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export const TIMER = 30;

export const emojiColor = ['🟥', '🟦', '🟩', '🟨'];
export const colors = ['red', 'blue', 'green', 'yellow'];

export function testForAABB(object1: Container, object2: Container) {
  const bounds1 = object1.getBounds();
  const bounds2 = object2.getBounds();

  return (
    bounds1.x < bounds2.x + bounds2.width &&
    bounds1.x + bounds1.width > bounds2.x &&
    bounds1.y < bounds2.y + bounds2.height &&
    bounds1.y + bounds1.height > bounds2.y
  );
}
