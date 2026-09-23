import { _decorator, Button, Component, Label, Node, tween, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';

const { ccclass, property } = _decorator;

/**
 * 搖籤階段的 View：負責畫面與動畫，抽籤結果及流程仍由 GameManager 管理。
 */
@ccclass('UIShakeLotStage')
export class UIShakeLotStage extends Component {
  @property({ type: Node, tooltip: '做左右搖擺動畫的籤筒節點' })
  public lotPotNode: Node | null = null;

  @property({ type: Node, tooltip: '抽出後顯示的靈籤資訊卡' })
  public popLotCard: Node | null = null;

  @property({ type: Label, tooltip: '靈籤編號，例如：天字第一號' })
  public lotCodeLabel: Label | null = null;

  @property({ type: Label, tooltip: '靈籤名稱' })
  public lotTitleLabel: Label | null = null;

  @property({ type: Label, tooltip: '一番賞系列名稱' })
  public lotSeriesLabel: Label | null = null;

  @property({ type: Label, tooltip: '四句籤詩' })
  public lotPoemLabel: Label | null = null;

  @property({ type: Button, tooltip: '替代搖晃手勢的手動按鈕' })
  public shakeButton: Button | null = null;

  @property({ type: Button, tooltip: '確認靈籤並前往擲筊的按鈕' })
  public toBwaButton: Button | null = null;

  private _isShaking = false;

  onEnable() {
    this.resetStage();
    this.shakeButton?.node.on(Button.EventType.CLICK, this.startShakeProcess, this);
    this.toBwaButton?.node.on(Button.EventType.CLICK, this.onToBwaClick, this);
  }

  onDisable() {
    this.shakeButton?.node.off(Button.EventType.CLICK, this.startShakeProcess, this);
    this.toBwaButton?.node.off(Button.EventType.CLICK, this.onToBwaClick, this);
    this.lotPotNode && tween(this.lotPotNode).stop();
    this.popLotCard && tween(this.popLotCard).stop();
  }

  private resetStage() {
    this._isShaking = false;
    if (this.popLotCard) this.popLotCard.active = false;
    if (this.shakeButton) {
      this.shakeButton.node.active = true;
      this.shakeButton.interactable = true;
    }
    if (this.toBwaButton) this.toBwaButton.node.active = false;
    if (this.lotPotNode) {
      this.lotPotNode.setRotationFromEuler(0, 0, 0);
      this.lotPotNode.setScale(Vec3.ONE);
    }
  }

  /** 由按鈕（未來也可由裝置搖晃手勢）觸發。 */
  public startShakeProcess() {
    if (this._isShaking) return;
    this._isShaking = true;
    if (this.shakeButton) this.shakeButton.interactable = false;

    if (!this.lotPotNode) {
      this.finishShakeAndPopLot();
      return;
    }

    tween(this.lotPotNode)
      .repeat(5, tween()
        .to(0.08, { eulerAngles: new Vec3(0, 0, 12) })
        .to(0.08, { eulerAngles: new Vec3(0, 0, -12) })
        .to(0.08, { eulerAngles: new Vec3(0, 0, 0) }))
      .call(() => this.finishShakeAndPopLot())
      .start();
  }

  private finishShakeAndPopLot() {
    const lot = GameManager.instance.pickLot();

    if (this.lotCodeLabel) this.lotCodeLabel.string = lot.code;
    if (this.lotTitleLabel) this.lotTitleLabel.string = lot.title;
    if (this.lotSeriesLabel) this.lotSeriesLabel.string = `一番賞水池：【${lot.seriesName}】`;
    if (this.lotPoemLabel) this.lotPoemLabel.string = lot.poemBrief;

    if (!this.popLotCard) {
      this.showBwaButton();
      return;
    }

    this.popLotCard.active = true;
    this.popLotCard.setScale(0.2, 0.2, 1);
    this.popLotCard.setPosition(0, -100, 0);
    tween(this.popLotCard)
      .to(0.5, {
        scale: new Vec3(1, 1, 1),
        position: new Vec3(0, 60, 0),
      }, { easing: 'backOut' })
      .call(() => this.showBwaButton())
      .start();
  }

  private showBwaButton() {
    if (this.shakeButton) this.shakeButton.node.active = false;
    if (this.toBwaButton) this.toBwaButton.node.active = true;
  }

  private onToBwaClick() {
    GameManager.instance.proceedToBwa();
  }
}
