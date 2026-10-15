import { _decorator, Button, Component, Label, Node, tween, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';
import { BwaResultType } from '../../core/Types';

const { ccclass, property } = _decorator;

/**
 * 擲筊階段的 View：播放筊杯動畫並呈現結果文案。
 * 機率計算與後續狀態切換統一交由 GameManager 處理。
 */
@ccclass('UITossBwaStage')
export class UITossBwaStage extends Component {
  @property({ type: Node, tooltip: '左側筊杯的替代節點或美術容器' })
  public bwaLeft: Node | null = null;

  @property({ type: Node, tooltip: '右側筊杯的替代節點或美術容器' })
  public bwaRight: Node | null = null;

  @property({ type: Label, tooltip: '顯示擲筊結果的文字' })
  public resultLabel: Label | null = null;

  @property({ type: Label, tooltip: '顯示目前靈籤名稱的提示文字' })
  public lotPromptLabel: Label | null = null;

  @property({ type: Button, tooltip: '觸發擲筊的按鈕' })
  public tossButton: Button | null = null;

  private _isTossing = false;

  onEnable() {
    this.resetStage();
    const lot = GameManager.instance.currentLot;
    if (this.lotPromptLabel) {
      this.lotPromptLabel.string = lot
        ? `求得：【${lot.title}】\n請執筊請示月老。`
        : '請先回籤筒求得靈籤。';
    }
    this.tossButton?.node.on(Button.EventType.CLICK, this.onTossClick, this);
  }

  onDisable() {
    this.tossButton?.node.off(Button.EventType.CLICK, this.onTossClick, this);
    if (this.bwaLeft) tween(this.bwaLeft).stop();
    if (this.bwaRight) tween(this.bwaRight).stop();
  }

  private resetStage() {
    this._isTossing = false;
    if (this.tossButton) {
      this.tossButton.node.active = true;
      this.tossButton.interactable = true;
    }
    if (this.resultLabel) this.resultLabel.string = '虔心默念祈願，執筊叩問天機。';
    if (this.bwaLeft) {
      this.bwaLeft.setPosition(-90, -100, 0);
      this.bwaLeft.setRotationFromEuler(0, 0, 0);
    }
    if (this.bwaRight) {
      this.bwaRight.setPosition(90, -100, 0);
      this.bwaRight.setRotationFromEuler(0, 0, 0);
    }
  }

  private onTossClick() {
    if (this._isTossing) return;
    this._isTossing = true;
    if (this.tossButton) this.tossButton.interactable = false;

    this.playTossAnimation(() => {
      const result = GameManager.instance.tossBwa();
      this.displayBwaResult(result);
    });
  }

  private playTossAnimation(onComplete: () => void) {
    if (!this.bwaLeft || !this.bwaRight) {
      onComplete();
      return;
    }

    tween(this.bwaLeft)
      .to(0.3, { position: new Vec3(-120, 120, 0), eulerAngles: new Vec3(0, 0, 360) })
      .to(0.3, { position: new Vec3(-90, -80, 0), eulerAngles: new Vec3(0, 0, 720) }, { easing: 'bounceOut' })
      .start();

    tween(this.bwaRight)
      .to(0.3, { position: new Vec3(120, 150, 0), eulerAngles: new Vec3(0, 0, -360) })
      .to(0.3, { position: new Vec3(90, -70, 0), eulerAngles: new Vec3(0, 0, -720) }, { easing: 'bounceOut' })
      .call(onComplete)
      .start();
  }

  private displayBwaResult(result: BwaResultType) {
    if (!this.resultLabel) return;

    switch (result) {
      case BwaResultType.HOLY:
        this.resultLabel.string = '【聖筊・大吉】\n月老神尊應允！即刻賜予姻緣考驗。';
        break;
      case BwaResultType.LAUGHING:
        this.resultLabel.string = '【笑筊・不答】\n月老笑而不語，請回籤筒重求。';
        break;
      case BwaResultType.YIN:
        this.resultLabel.string = '【陰筊・不允】\n神明不許！速回籤筒重新求籤。';
        break;
    }
  }
}
