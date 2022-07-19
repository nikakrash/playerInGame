import debounce from 'lodash.debounce';
import { IGameBase } from "./GameBase";
import { Player } from "../entities/player/player";
import { calculatePosition, isMoveOnRight, isMoveOnLeft, isItJump, isJumpUp } from "../modules/helpers";

interface ICellInfo {
  x: number | undefined,
  y: number | undefined,
  isAvailable: boolean | undefined
}

interface ICellInfoArray {
  top: ICellInfo,
  near: ICellInfo,
  bottom: ICellInfo
}

interface ICoordinates {
  x: number,
  y: number
}

class PlayerManager extends Phaser.GameObjects.Container {
  coordinatesInBase: ICoordinates;

  gameBase: IGameBase;

  gameBaseHeightInCubes: number;

  gameBaseWidthInCubes: number;

  player: Player;

  gameState: string[][];

  cellsOnLeft: ICellInfoArray;

  cellsOnRight: ICellInfoArray;

  xInBase: number;

  yInBase: number;

  xOnLeftMove: number | undefined;

  xOnRightMove: number | undefined;

  constructor(
    coordinatesInBase: ICoordinates,
    gameBase: IGameBase,
    gameState: string[][],
    scene: Phaser.Scene) {
    super(scene);

    this.coordinatesInBase = coordinatesInBase;
    this.gameBase = gameBase;
    this.gameState = gameState;

    this.init();
  }

  private init(): void {
    this.create();
    this.addInGameState();
    this.addMovementListener();
  }

  private create(): void {
    this.x = calculatePosition(this.coordinatesInBase.x);
    this.y = calculatePosition(this.coordinatesInBase.y);

    this.player = new Player(this.x, this.y, this.scene);
  }

  private addInGameState(): void {
    this.gameState[this.coordinatesInBase.y][this.coordinatesInBase.x] = 'player';
  }

  private addMovementListener(): void {
    const leftKey = this.scene.input.keyboard.addKey('LEFT');
    const rightKey = this.scene.input.keyboard.addKey('RIGHT');

    const onControlClickDebounce = debounce((direction) => {
      if (direction === 'left') {
        this.onLeftControlClick();
      }
      else {
        this.onRightControlClick();
      }
    }, 250);

    leftKey.on('down', () => {
      onControlClickDebounce('left');
    })

    rightKey.on('down', () => {
      onControlClickDebounce('right');
    })
  }

  private onLeftControlClick(): void {
    this.getStateOfAroundCells();

    if (this.canMoveLeft()) {
      const position = this.setNewPosition(this.cellsOnLeft);
      const coordinatesInBase = { x: this.xInBase, y: this.yInBase };

      this.move(position, coordinatesInBase);
    }
  }

  private onRightControlClick(): void {
    this.getStateOfAroundCells();

    if (this.canMoveRight()) {
      const position = this.setNewPosition(this.cellsOnRight);
      const coordinatesInBase = { x: this.xInBase, y: this.yInBase };

      this.move(position, coordinatesInBase);
    }
  }

  private move(position: ICoordinates, newCoordinatesInBase: ICoordinates): void {
    this.moveVisually(position, this.coordinatesInBase, newCoordinatesInBase);
    this.updateCoordinatesInBase(newCoordinatesInBase.x, newCoordinatesInBase.y);
    this.addNewPositionInState(this.coordinatesInBase.x, this.coordinatesInBase.y);
  }

  private moveVisually(position: ICoordinates, oldCoordinatesInBase: ICoordinates, newCoordinatesInBase: ICoordinates): void {
    const oldX = oldCoordinatesInBase.x;
    const newX = newCoordinatesInBase.x;
    const oldY = oldCoordinatesInBase.y;
    const newY = newCoordinatesInBase.y

    if (!isItJump(oldX, newX, oldY, newY) && isMoveOnRight(oldX, newX)) {
      this.player.runRight(
        position.x,
        position.y
      );
    }
    else if (!isItJump(oldX, newX, oldY, newY) && isMoveOnLeft(oldX, newX)) {
      this.player.runLeft(
        position.x,
        position.y
      );
    }
    else if (isItJump(oldX, newX, oldY, newY) && isMoveOnRight(oldX, newX)) {
      this.player.jumpRight(
        position.x,
        position.y,
        isJumpUp(oldY, newY)
      );
    }
    else if (isItJump(oldX, newX, oldY, newY) && isMoveOnLeft(oldX, newX)) {
      this.player.jumpLeft(
        position.x,
        position.y,
        isJumpUp(oldY, newY)
      );
    }
  }

  private addNewPositionInState(x: number, y: number): void {
    this.gameState[y][x] = 'player';
  }

  private setNewPosition(cellsArray: ICellInfoArray): ICoordinates {
    const yUnderBottom = cellsArray.bottom.y !== undefined && cellsArray.bottom.y !== this.gameBaseHeightInCubes ? cellsArray.bottom.y + 1 : undefined;
    const isCellUnderBottomEmpty = yUnderBottom !== undefined && cellsArray.bottom.x !== undefined ? this.gameState[yUnderBottom][cellsArray.bottom.x] === 'empty' : undefined;
    const isNearCellEmpty = this.isCellEmpty(cellsArray.near.x, cellsArray.near.y);

    if (!isCellUnderBottomEmpty && cellsArray.bottom.isAvailable && isNearCellEmpty && cellsArray.bottom.x !== undefined && cellsArray.bottom.y !== undefined) {
      this.xInBase = cellsArray.bottom.x;
      this.yInBase = cellsArray.bottom.y;
    }
    else if (!cellsArray.bottom.isAvailable && cellsArray.near.isAvailable && cellsArray.near.x !== undefined && cellsArray.near.y !== undefined) {
      this.xInBase = cellsArray.near.x;
      this.yInBase = cellsArray.near.y;
    }
    else if (!cellsArray.near.isAvailable && cellsArray.top && cellsArray.top.isAvailable && cellsArray.top.x !== undefined && cellsArray.top.y !== undefined) {
      this.xInBase = cellsArray.top.x;
      this.yInBase = cellsArray.top.y;
    }

    const x = calculatePosition(this.xInBase);
    const y = calculatePosition(this.yInBase);

    return { x, y };
  }

  private updateCoordinatesInBase(x: number, y: number): void {
    this.coordinatesInBase = { x, y };
  }

  private getStateOfAroundCells(): void {
    this.gameBaseWidthInCubes = this.gameBase.map[1].length - 1;
    this.gameBaseHeightInCubes = this.gameBase.map.length - 1;

    const yTop = this.coordinatesInBase.y !== -1 ? this.coordinatesInBase.y - 1 : undefined;
    const yNear = this.coordinatesInBase.y;
    const yBottom = this.coordinatesInBase.y !== this.gameBaseHeightInCubes ? this.coordinatesInBase.y + 1 : undefined;

    this.xOnLeftMove = this.coordinatesInBase.x !== 0 ? this.coordinatesInBase.x - 1 : undefined;
    this.xOnRightMove = this.coordinatesInBase.x !== this.gameBaseWidthInCubes ? this.coordinatesInBase.x + 1 : undefined;

    this.cellsOnLeft = {
      top: {
        x: this.xOnLeftMove,
        y: yTop,
        isAvailable: this.isCellEmpty(this.xOnLeftMove, yTop)
      },
      near: {
        x: this.xOnLeftMove,
        y: yNear,
        isAvailable: this.isCellEmpty(this.xOnLeftMove, yNear)
      },
      bottom: {
        x: this.xOnLeftMove,
        y: yBottom,
        isAvailable: this.isCellEmpty(this.xOnLeftMove, yBottom)
      }
    }

    this.cellsOnRight = {
      top: {
        x: this.xOnRightMove,
        y: yTop,
        isAvailable: this.isCellEmpty(this.xOnRightMove, yTop)
      },
      near: {
        x: this.xOnRightMove,
        y: yNear,
        isAvailable: this.isCellEmpty(this.xOnRightMove, yNear)
      },
      bottom: {
        x: this.xOnRightMove,
        y: yBottom,
        isAvailable: this.isCellEmpty(this.xOnRightMove, yBottom)
      }
    }
  }

  private canMoveLeft(): boolean | undefined {
    return this.cellsOnLeft.bottom.isAvailable || this.cellsOnLeft.near.isAvailable || this.cellsOnLeft.top.isAvailable
  }

  private canMoveRight(): boolean | undefined {
    return this.cellsOnRight.bottom.isAvailable || this.cellsOnRight.near.isAvailable || this.cellsOnRight.top.isAvailable;
  }

  private isCellEmpty(x: number | undefined, y: number | undefined): boolean | undefined {
    let isEmpty;

    if (x !== undefined && y !== undefined && y !== -1) {
      isEmpty = this.gameState[y][x] === 'empty';
    }
    else if (x !== undefined && y === -1) {
      isEmpty = true;
    }

    return isEmpty;
  }
}

export default PlayerManager;
