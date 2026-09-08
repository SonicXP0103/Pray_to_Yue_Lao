// assets/scripts/core/Types.ts

/**
 * 玩家與角色的人格特質向度 ID
 * 採用標準字串列舉模式，方便 JSON 序列化與資料表欄位映射
 */
export type TraitId =
  | 'strength'     // 剛猛力量 / 猛獸反差
  | 'wealth_wild'  // 金玉重工 / 豪門貴氣
  | 'clingy_dark'  // 幽冥離奇 / 深情病嬌
  | 'gentle'       // 溫柔療癒 / 體貼居家
  | 'pure_heart'   // 純情耿直 / 青梅白月光
  | 'ethereal'     // 仙氣縹緲 / 超脫塵俗
  | 'humor_meme';  // 搞笑迷因 / 喜劇反差

/**
 * 有限狀態機 (FSM) 遊戲全域狀態定義
 */
export enum GameStage {
  NONE = 'NONE',
  INTRO = 'INTRO',           // 廟門啟航：信眾登記
  INCENSE = 'INCENSE',       // 虔心點香：拖曳火柴互動
  SHAKE_LOT = 'SHAKE_LOT',   // 籤筒抽籤：一番賞水池決定
  TOSS_BWA = 'TOSS_BWA',     // 執筊請示：二元判定 (聖筊 / 陰笑筊)
  QUIZ = 'QUIZ',             // 情境心測：題庫答題累加權重
  SUMMON = 'SUMMON',         // 敕符儀式：畫符聚氣
  RESULT = 'RESULT',         // 開箱結算：翻牌展示與圖鑑解鎖
}

/**
 * 擲筊二元判定結果
 */
export enum BwaResultType {
  HOLY = 'HOLY',             // 聖筊 (一正一反 - 月老應允)
  LAUGHING = 'LAUGHING',     // 笑筊 (雙正平面 - 月老笑而不答)
  YIN = 'YIN',               // 陰筊/怒筊 (雙反凸面 - 月老不許)
}

/**
 * 靈籤水池資料結構 (對應 lots.json / 一番賞系列)
 */
export interface FortuneLotData {
  id: string;                      // 籤池唯一 ID (如 "lot_wild_beast")
  code: string;                    // 籤號代碼 (如 "天字第一號")
  title: string;                   // 靈籤全名 (如 "狂鸞伏虎・猛獸破天籤")
  seriesName: string;              // 一番賞所屬系列 (如 "剛猛野性系列")
  isMixedPool?: boolean;           // 是否為大亂鬥大混籤
  poemBrief: string;               // 籤詩四句偈
  themeSummary: string;            // 籤義情境綜述
  questionIds: number[];           // 專屬綁定之題目 ID 陣列
  candidateCharacterIds: string[]; // 該靈籤之候選角色名單
}

/**
 * 角色資料結構 (對應 characters.json)
 */
export interface CharacterData {
  id: string;                      // 角色 ID (如 "gorilla_waifu")
  name: string;                    // 姓名 (如 "狂野大猩猩")
  nickname: string;                // 稱號 (如 "銀背純情霸主")
  rarity: 'UR' | 'SSR' | 'SR' | 'R'; // 稀有度
  type: 'funny_twist' | 'pure_quality' | 'legendary_god';
  quote: string;                   // 角色招牌台詞
  narrativeDesc: string;           // 月老命定判詞
  traits: Record<TraitId, number>; // 6維特質基準向量 (0 ~ 100)
}

/**
 * 題目選項資料結構
 */
export interface QuestionOptionData {
  id: string;                      // 選項識別碼 ("A", "B", "C", "D")
  text: string;                    // 主選項文案
  subtext: string;                 // 情境補充文案
  traitWeights: Partial<Record<TraitId, number>>; // 該選項賦予玩家的特質增量
}

/**
 * 心測題目資料結構 (對應 questions.json)
 */
export interface QuestionData {
  id: number;                      // 題目唯一識別碼 (如 101, 201)
  lotId?: string;                  // 所屬籤池代碼
  scenario: string;                // 情境標籤 (如 "荒野野獸遭遇")
  title: string;                   // 題目題幹
  options: QuestionOptionData[];   // 4 個選項
}

/**
 * 結算輸出物件
 */
export interface MatchResultPayload {
  matchedCharacter: CharacterData; // 最終匹配角色
  matchScore: number;              // 契合度分數 (60 ~ 99)
  sourceLot: FortuneLotData;       // 抽出之靈籤
  playerTraits: Record<TraitId, number>; // 玩家累計的人格向量
}