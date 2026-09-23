// assets/scripts/ui/UIManager.ts
import { _decorator, Component, Node } from 'cc';
import { GameStage } from '../core/Types';
import { GameEvent, GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
  @property({ type: Node, tooltip: '階段 0：廟門登記面板' })
  public introPanel: Node | null = null;

  @property({ type: Node, tooltip: '階段 1：點香互動面板' })
  public incensePanel: Node | null = null;

  @property({ type: Node, tooltip: '階段 2：搖籤筒面板' })
  public lotPanel: Node | null = null;

  @property({ type: Node, tooltip: '階段 3：擲筊決策面板' })
  public bwaPanel: Node | null = null;

  @property({ type: Node, tooltip: '階段 4：情境心測面板' })
  public quizPanel: Node | null = null;

  @property({ type: Node, tooltip: '階段 5：敕符召喚面板' })
  public summonPanel: Node | null = null;

  @property({ type: Node, tooltip: '階段 6：開箱結算面板' })
  public resultPanel: Node | null = null;

  onEnable() {
    GameManager.events.on(GameEvent.STAGE_CHANGED, this.onStageChanged, this);
  }

  onDisable() {
    GameManager.events.off(GameEvent.STAGE_CHANGED, this.onStageChanged, this);
  }

  private onStageChanged(stage: GameStage) {
    // 隱藏所有面板
    if (this.introPanel) this.introPanel.active = stage === GameStage.INTRO;
    if (this.incensePanel) this.incensePanel.active = stage === GameStage.INCENSE;
    if (this.lotPanel) this.lotPanel.active = stage === GameStage.SHAKE_LOT;
    if (this.bwaPanel) this.bwaPanel.active = stage === GameStage.TOSS_BWA;
    if (this.quizPanel) this.quizPanel.active = stage === GameStage.QUIZ;
    if (this.summonPanel) this.summonPanel.active = stage === GameStage.SUMMON;
    if (this.resultPanel) this.resultPanel.active = stage === GameStage.RESULT;
  }
}