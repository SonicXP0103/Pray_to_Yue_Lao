// assets/scripts/core/GameManager.ts
import { _decorator, Component, EventTarget } from 'cc';
import { GameStage, FortuneLotData, CharacterData, QuestionData, MatchResultPayload, TraitId, BwaResultType } from './Types';
import { DataManager } from '../data/DataManager';
import { MatchmakerEngine } from '../engine/MatchmakerEngine';

const { ccclass, property } = _decorator;

export enum GameEvent {
  STAGE_CHANGED = 'STAGE_CHANGED',           // 階段切換
  LOT_SELECTED = 'LOT_SELECTED',             // 搖出靈籤
  BWA_TOSSED = 'BWA_TOSSED',                 // 擲筊結果判定
  QUESTION_UPDATED = 'QUESTION_UPDATED',     // 換下一題
  MATCH_COMPLETED = 'MATCH_COMPLETED',       // 匹配開箱結算完成
}

@ccclass('GameManager')
export class GameManager extends Component {
  private static _instance: GameManager | null = null;
  public static readonly events: EventTarget = new EventTarget();

  public static get instance(): GameManager {
    return this._instance!;
  }

  // ===== 當前局狀態資料 (Session State) =====
  private _playerName: string = '';
  private _currentStage: GameStage = GameStage.NONE;
  private _currentLot: FortuneLotData | null = null;
  private _currentQuestions: QuestionData[] = [];
  private _currentQuestionIndex: number = 0;
  private _playerTraits: Record<TraitId, number> = MatchmakerEngine.createInitialTraits();
  private _matchResult: MatchResultPayload | null = null;

  onLoad() {
    if (GameManager._instance === null) {
      GameManager._instance = this;
    } else {
      this.node.destroy();
      return;
    }
  }

  async start() {
    // 遊戲啟動時載入所有 JSON 靜態表
    await DataManager.instance.loadAllConfigs();
    // 進入初始畫面 (INTRO)
    this.changeStage(GameStage.INTRO);
  }

  // ===== Getter 屬性 =====
  public get playerName(): string { return this._playerName; }
  public get currentStage(): GameStage { return this._currentStage; }
  public get currentLot(): FortuneLotData | null { return this._currentLot; }
  public get currentQuestions(): QuestionData[] { return this._currentQuestions; }
  public get currentQuestionIndex(): number { return this._currentQuestionIndex; }
  public get currentQuestion(): QuestionData | null {
    return this._currentQuestions[this._currentQuestionIndex] || null;
  }
  public get matchResult(): MatchResultPayload | null { return this._matchResult; }

  // ===== 階段切換 FSM =====
  public changeStage(newStage: GameStage) {
    this._currentStage = newStage;
    console.log(`[GameManager] 切換階段至: ${newStage}`);
    GameManager.events.emit(GameEvent.STAGE_CHANGED, newStage);
  }

  /**
   * 步驟 0：設定玩家尊名，並進入點香階段
   */
  public startPrayer(name: string) {
    this._playerName = name.trim() || '虔誠善信';
    this._playerTraits = MatchmakerEngine.createInitialTraits();
    this._currentQuestionIndex = 0;
    this._matchResult = null;
    this.changeStage(GameStage.INCENSE);
  }

  /**
   * 步驟 1：完成點香，進入搖籤階段
   */
  public finishIncense() {
    this.changeStage(GameStage.SHAKE_LOT);
  }

  /**
   * 步驟 2：搖動籤筒抽出一支靈籤 (一番賞核心水池決定)
   */
  public pickLot(): FortuneLotData {
    const lot = DataManager.instance.getRandomLot();
    this._currentLot = lot;
    // 預先取出該籤專屬題庫
    this._currentQuestions = DataManager.instance.getQuestionsForLot(lot.id);
    this._currentQuestionIndex = 0;

    GameManager.events.emit(GameEvent.LOT_SELECTED, lot);
    // 抽中籤後，前往請示月老 (擲筊階段)
    this.changeStage(GameStage.TOSS_BWA);
    return lot;
  }

  /**
   * 步驟 3：擲筊請示月老 (機率：聖筊 50%、笑筊 25%、陰筊 25%)
   */
  public tossBwa(): BwaResultType {
    const rand = Math.random();
    let result: BwaResultType;

    if (rand < 0.5) {
      result = BwaResultType.HOLY;     // 50% 聖筊 (應允)
    } else if (rand < 0.75) {
      result = BwaResultType.LAUGHING; // 25% 笑筊 (不表態/笑而不答)
    } else {
      result = BwaResultType.YIN;      // 25% 陰筊 (不贊同)
    }

    GameManager.events.emit(GameEvent.BWA_TOSSED, result);

    if (result === BwaResultType.HOLY) {
      // 聖筊：月老應允此籤，進入心測答題
      this.scheduleOnce(() => {
        this.changeStage(GameStage.QUIZ);
      }, 1.2);
    } else {
      // 笑筊 / 陰筊：月老不允，要求重回籤筒換籤
      this.scheduleOnce(() => {
        this.changeStage(GameStage.SHAKE_LOT);
      }, 1.8);
    }

    return result;
  }

  /**
   * 步驟 4：回答目前心測題目
   */
  public answerQuestion(optionId: string) {
    const q = this.currentQuestion;
    if (!q) return;

    const opt = q.options.find(o => o.id === optionId);
    if (opt) {
      // 累加特質向度
      this._playerTraits = MatchmakerEngine.accumulateTraits(this._playerTraits, opt.traitWeights);
    }

    // 檢查是否還有下一題
    if (this._currentQuestionIndex < this._currentQuestions.length - 1) {
      this._currentQuestionIndex++;
      GameManager.events.emit(GameEvent.QUESTION_UPDATED, this.currentQuestion);
    } else {
      // 全數答完，進入敕符儀式
      this.changeStage(GameStage.SUMMON);
    }
  }

  /**
   * 步驟 5：完成敕符召喚，進行結算匹配
   */
  public completeSummonAndEvaluate(): MatchResultPayload {
    if (!this._currentLot) {
      throw new Error('未抽取靈籤，無法進行匹配');
    }

    // 取得該籤所屬候選角色名冊
    const candidateChars: CharacterData[] = [];
    for (const charId of this._currentLot.candidateCharacterIds) {
      const char = DataManager.instance.getCharacterById(charId);
      if (char) candidateChars.push(char);
    }

    // 執行向量匹配
    const result = MatchmakerEngine.evaluateMatch(
      this._playerTraits,
      candidateChars,
      this._currentLot
    );

    this._matchResult = result;
    GameManager.events.emit(GameEvent.MATCH_COMPLETED, result);
    this.changeStage(GameStage.RESULT);
    return result;
  }

  /**
   * 重開一局
   */
  public restartGame(keepName: boolean = true) {
    if (!keepName) {
      this._playerName = '';
      this.changeStage(GameStage.INTRO);
    } else {
      this._playerTraits = MatchmakerEngine.createInitialTraits();
      this._currentQuestionIndex = 0;
      this._currentLot = null;
      this._matchResult = null;
      this.changeStage(GameStage.INCENSE);
    }
  }
}