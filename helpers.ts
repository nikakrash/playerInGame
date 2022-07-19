import { cubeWidth } from "../utils/levelCubeData";
import dpr from "../dpr";


export function calculatePosition(coordinateInBase: number): number {
  const position = coordinateInBase * dpr(cubeWidth);

  return position;
}

export function isMoveOnRight(oldX: number, newX: number): boolean {
  return oldX < newX;
}

export function isMoveOnLeft(oldX: number, newX: number): boolean {
  return oldX > newX;
}

export function isItJump(oldX: number, newX: number, oldY: number, newY: number): boolean {
  return oldY !== newY;
}

export function isJumpUp(oldY: number, newY: number): boolean {
  return oldY < newY;
}
