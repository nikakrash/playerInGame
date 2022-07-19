import { IGameBase } from './GameBase';
import { makeBinaryMatrix, getTime, isItDoubleClick } from '../modules/helpers';
import dpr from '../dpr';

class GameManager extends Phaser.GameObjects.Container {
  gameBase: IGameBase;

  mutingLayerImage: string

  roundedDetailPositionX: number;

  roundedDetailPositionY: number;

  gameBasePositionX: number;

  gameBasePositionY: number;

  detailPositionInBaseX: number;

  detailPositionInBaseY: number;

  isDetailInGameBase: boolean;

  gameState: string[][] = [];

  isDetailPlacedInBase = false;

  isWin = false;

  isDetailRotatable = true;

  needInitialRotationOnReturn = true;

  cubeWidth: number = dpr(60);

  constructor(gameBase: IGameBase, mutingLayerImage: string, scene: Phaser.Scene) {
    super(scene);

    this.gameBase = gameBase;
    this.mutingLayerImage = mutingLayerImage;

    this.init();
  }

  private init(): void {
    this.gameBasePositionX = this.gameBase.x;
    this.gameBasePositionY = this.gameBase.y;
    this.gameState = makeBinaryMatrix(this.gameBase.map);

    this.clickOnDetail();
    this.doubleClickOnDetail();
    this.drop();
  }

  protected checkOnWinnings(): void {
    const cubesInBase = this.gameBase.map.length * this.gameBase.map[0].length;
    let emptyCells = cubesInBase;

    for (let y = 0; y < this.gameBase.map.length; y += 1) {
      for (let x = 0; x < this.gameBase.map[0].length; x += 1) {
        if (this.gameState[y][x] === 'filled') {
          emptyCells -= 1;
        }
        else {
          return;
        }
      }
    }

    if (emptyCells === 0) {
      this.isWin = true;
    }

    this.makeDetailsDisable();
  }

  private clickOnDetail(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image[]) => {
      const object = gameObject[0];
      const isGameDetail = !!(object && object.data);

      if (isGameDetail) {
        const detail = object;
        this.scene.input.setDraggable(detail, false);

        this.checkDetailPosition(detail.x, detail.y, detail);
        this.roundCoordinates(detail.x, detail.y, detail);

        this.scene.children.bringToTop(detail);
      }
    })
  }

  private doubleClickOnDetail(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image[]) => {
      const objectFirstClick = gameObject[0];
      const isGameDetail = !!(objectFirstClick && objectFirstClick.data);
      const firsClickTime = getTime();

      if (isGameDetail && this.isDetailInGameBase && !this.isWin) {
        this.scene.input.on('pointerdown', (secondPointer: Phaser.Input.Pointer, secondGameObject: Phaser.GameObjects.Image[]) => {
          const objectSecondClick = secondGameObject[0];
          const secondClickTime = getTime();

          if (objectFirstClick === objectSecondClick && isItDoubleClick(firsClickTime, secondClickTime)) {
            const detail = objectSecondClick;
            const {detailInfo} = detail.data.list;

            detailInfo.isDragged = true;

            this.deleteDetailFromGameState(detail);
            this.moveDetailToStartPosition(detail, detailInfo.startX, detailInfo.startY);
          }
        })
      }
    })
  }

  private drop(): void {
    this.scene.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
      const detail = gameObject;
      const {detailInfo} = detail.data.list;
      detailInfo.isDragged = true;
      this.scene.input.dragTimeThreshold = 30;
      this.scene.children.bringToTop(detail);

      detail.x = dragX;
      detail.y = dragY;
    })

    this.scene.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      const detail = gameObject;
      const {detailInfo} = detail.data.list;

      this.roundCoordinates(detail.x, detail.y, detail);
      this.checkDetailPosition(this.roundedDetailPositionX, this.roundedDetailPositionY, detail);

      if (!this.isDetailInGameBase) {
        this.moveDetailToStartPosition(detail, detailInfo.startX, detailInfo.startY);
      }
      else if (this.isDetailCanPlaseInGameBase(detail)) {
          this.addDetailToGameBase(detail);
          this.refreshDetailCoordinates(detail);
        }
        else {
          this.moveDetailToStartPosition(detail, detailInfo.startX, detailInfo.startY);
        }
    })
  }

  private isDetailCanPlaseInGameBase(detail: Phaser.GameObjects.Image): boolean {
    const {detailInfo} = detail.data.list;
    let cubesInGameBase = 0;
    let cubesDetail = 0;
    const isDetailCanPlaseInGameBase = false;

    for (let y = this.detailPositionInBaseY; y < this.detailPositionInBaseY + detailInfo.matrix.length; y+= 1) {
      for (let x = this.detailPositionInBaseX; x < this.detailPositionInBaseX + detailInfo.matrix[0].length; x+= 1) {
        const detailX = x - this.detailPositionInBaseX;
        const detailY = y - this.detailPositionInBaseY;
      }
    }

    return cubesInGameBase === cubesDetail;
  }

  private addDetailToGameBase(detail: Phaser.GameObjects.Image) {
    const {detailInfo} = detail.data.list;

    for (let y = this.detailPositionInBaseY; y < this.detailPositionInBaseY + detailInfo.matrix.length; y+= 1) {
      for (let x = this.detailPositionInBaseX; x < this.detailPositionInBaseX + detailInfo.matrix[0].length; x+= 1) {
        const detailX = x - this.detailPositionInBaseX;
        const detailY = y - this.detailPositionInBaseY;

        if (detailInfo.matrix[detailY][detailX] === 1) {
          if (this.gameState[y][x] === 'empty') {
            this.gameState[y][x] = 'filled';
          }
        }
      }
    }
  }

  private refreshDetailCoordinates(detail: Phaser.GameObjects.Image): void {
    detail.x = this.roundedDetailPositionX;
    detail.y = this.roundedDetailPositionY;
  }

  protected makeDetailsDisable(): void {
    this.scene.input.on('pointerover', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image[]) => {
      const object = gameObject[0];
      const isGameDetail = !!(object && object.data);

      if (isGameDetail) {
        const hoverObject = object;
        const isHoverOnDetail = !!hoverObject.data;

        if (isHoverOnDetail) {
          hoverObject.disableInteractive();
        }
      }
    })
  }

  private moveDetailToStartPosition(detail: Phaser.GameObjects.Image, startX: number, startY: number) {
    const {detailInfo} = detail.data.list;
    const distance = Phaser.Math.Distance.Between(detail.x, detail.y, startX, startY);
    const duration = distance / 2.5;

    if (this.needInitialRotationOnReturn) {
      detailInfo.matrix = detailInfo.initialMatrix;
      detail.rotation = 0;
    }

    this.scene.tweens.add({
      targets: detail,
      x: startX,
      y: startY,
      duration
    });

    this.scene.input.setDraggable(detail);
  }

  protected checkDetailPosition(currentX: number, currentY: number, detail: Phaser.GameObjects.Image): void {
    if (detail.data) {
      const gameBaseWidth = this.gameBase.width;
      const gameBaseHeight = this.gameBase.height;

      const detailWidth = detail.data.list.detailInfo.matrix[0].length * this.cubeWidth;
      const detailHeigth = detail.data.list.detailInfo.matrix.length * this.cubeWidth;


      const detailPositionX = currentX - detailWidth / 2;
      const detailPositionY = currentY - detailHeigth / 2;

      this.isDetailInGameBase = detailPositionX >= this.gameBasePositionX &&
                                detailPositionX <= (this.gameBasePositionX + gameBaseWidth - detailWidth) &&
                                detailPositionY >= this.gameBasePositionY &&
                                detailPositionY <= (this.gameBasePositionY + gameBaseHeight - detailHeigth);
    }
  }

  private roundCoordinates(currentX: number, currentY: number, detail: Phaser.GameObjects.Image): void {
    const detailWidth = detail.data.list.detailInfo.matrix[0].length * this.cubeWidth;
    const detailHeigth = detail.data.list.detailInfo.matrix.length * this.cubeWidth;

    const detailInBasePositionX = currentX - this.gameBasePositionX - detailWidth / 2;
    const detailInBasePositionY = currentY - this.gameBasePositionY - detailHeigth / 2;

    this.detailPositionInBaseX = Math.round(detailInBasePositionX / this.cubeWidth);
    this.detailPositionInBaseY = Math.round(detailInBasePositionY / this.cubeWidth);

    this.roundedDetailPositionX = this.gameBasePositionX + this.detailPositionInBaseX * this.cubeWidth + detailWidth / 2;
    this.roundedDetailPositionY = this.gameBasePositionY + this.detailPositionInBaseY * this.cubeWidth + detailHeigth / 2;
  }

  private deleteDetailFromGameState(detail: Phaser.GameObjects.Image): void {
    const {detailInfo} = detail.data.list;

    for (let y = this.detailPositionInBaseY; y < this.detailPositionInBaseY + detailInfo.matrix.length; y+= 1) {
      for (let x = this.detailPositionInBaseX; x < this.detailPositionInBaseX + detailInfo.matrix[0].length; x+= 1) {
        const detailX = x - this.detailPositionInBaseX;
        const detailY = y - this.detailPositionInBaseY;

        if (detailInfo.matrix[detailY][detailX] === 1) {
          this.gameState[y][x] = 'empty';
        }
      }
    }

    this.isDetailInGameBase = false;
  }
}

export default GameManager;
