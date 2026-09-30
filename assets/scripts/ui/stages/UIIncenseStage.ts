import { _decorator, Button, Component, Label, Node, tween, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';

const { ccclass, property } = _decorator;

/**
 * 點香階段的最小可玩 View。
 * 目前使用按鈕完成儀式；未來可在不影響流程的前提下，替換為拖曳火柴與碰撞判定。
 */
@ccclass('UIIncenseStage')
export class UIIncenseStage extends Component {
  @property({ type: Label, tooltip: '點香儀式的引導與完成提示文字' })
  public promptLabel: Label | null = null;

  @property({ type: Button, tooltip: '暫代拖曳互動的一鍵點香按鈕' })
  public igniteButton: Button | null = null;

  @property({ type: Node, tooltip: '可選：三炷香的替代節點，用於完成時的動畫' })
  public incenseNodes: Node[] = [];

  private _isIgniting = false;

  onEnable() {
    this.resetStage();
    this.igniteButton?.node.on(Button.EventType.CLICK, this.onIgniteClick, this);
  }

  onDisable() {
    this.igniteButton?.node.off(Button.EventType.CLICK, this.onIgniteClick, this);
    this.incenseNodes.forEach((node) => tween(node).stop());
  }

  private resetStage() {
    this._isIgniting = false;
    if (this.promptLabel) this.promptLabel.string = '虔心燃起三炷香，祈求月老指引良緣。';
    if (this.igniteButton) {
      this.igniteButton.interactable = true;
      this.igniteButton.node.active = true;
    }
    this.incenseNodes.forEach((node) => node.setScale(Vec3.ONE));
  }

  private onIgniteClick() {
    if (this._isIgniting) return;
    this._isIgniting = true;

    if (this.igniteButton) this.igniteButton.interactable = false;
    if (this.promptLabel) this.promptLabel.string = '香火已燃，月老已聞汝願……';

    this.incenseNodes.forEach((node, index) => {
      tween(node)
        .delay(index * 0.12)
        .to(0.12, { scale: new Vec3(1.15, 1.15, 1) })
        .to(0.18, { scale: new Vec3(1, 1, 1) })
        .start();
    });

    // 保留短暫回饋時間，讓玩家理解此次操作已成功。
    this.scheduleOnce(() => {
      GameManager.instance.finishIncense();
    }, 0.7);
  }
}
