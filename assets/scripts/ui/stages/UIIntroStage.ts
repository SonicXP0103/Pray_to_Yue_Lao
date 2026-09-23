// assets/scripts/ui/stages/UIIntroStage.ts
import { _decorator, Component, EditBox, Button } from 'cc';
import { GameManager } from '../../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('UIIntroStage')
export class UIIntroStage extends Component {
  @property({ type: EditBox, tooltip: '信眾姓名輸入框' })
  public nameInput: EditBox | null = null;

  @property({ type: Button, tooltip: '開始祈願按鈕' })
  public startButton: Button | null = null;

  onEnable() {
    if (this.startButton) {
      this.startButton.node.on(Button.EventType.CLICK, this.onStartClick, this);
    }
  }

  onDisable() {
    if (this.startButton) {
      this.startButton.node.off(Button.EventType.CLICK, this.onStartClick, this);
    }
  }

  private onStartClick() {
    const inputName = this.nameInput ? this.nameInput.string.trim() : '';
    const finalName = inputName || '虔誠善信';

    console.log(`[UIIntroStage] 善信登記: ${finalName}`);
    GameManager.instance.startPrayer(finalName);
  }
}