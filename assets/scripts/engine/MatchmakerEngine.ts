// assets/scripts/engine/MatchmakerEngine.ts
import { CharacterData, FortuneLotData, MatchResultPayload, TraitId } from '../core/Types';

export class MatchmakerEngine {
  /** 所有參與比對的特質維度 */
  private static readonly ALL_TRAIT_KEYS: TraitId[] = [
    'strength',
    'wealth_wild',
    'clingy_dark',
    'gentle',
    'pure_heart',
    'ethereal',
    'humor_meme',
  ];

  /**
   * 初始化一個初始為 0 的玩家特質向量
   */
  public static createInitialTraits(): Record<TraitId, number> {
    const traits = {} as Record<TraitId, number>;
    for (const key of this.ALL_TRAIT_KEYS) {
      traits[key] = 0;
    }
    return traits;
  }

  /**
   * 將選項的特質權重累加進玩家向量中
   * @param current 玩家目前特質
   * @param delta 該選項帶來的特質增量
   */
  public static accumulateTraits(
    current: Record<TraitId, number>,
    delta: Partial<Record<TraitId, number>>
  ): Record<TraitId, number> {
    const updated = { ...current };
    for (const key of this.ALL_TRAIT_KEYS) {
      if (delta[key] !== undefined) {
        updated[key] = (updated[key] || 0) + (delta[key] as number);
      }
    }
    return updated;
  }

  /**
   * 核心匹配演算法：計算玩家向量與籤池中候選角色的最高契合者
   * @param playerTraits 玩家作答累積之向度
   * @param candidateCharacters 該籤池下的候選角色陣列
   * @param sourceLot 當前抽到的靈籤
   */
  public static evaluateMatch(
    playerTraits: Record<TraitId, number>,
    candidateCharacters: CharacterData[],
    sourceLot: FortuneLotData
  ): MatchResultPayload {
    if (!candidateCharacters || candidateCharacters.length === 0) {
      throw new Error('[MatchmakerEngine] 候選角色名單為空，無法結算！');
    }

    let bestMatchChar: CharacterData = candidateCharacters[0];
    let highestSimilarity = -1;

    // 依序比對每位候選人
    for (const char of candidateCharacters) {
      const sim = this.calculateCosineSimilarity(playerTraits, char.traits);
      if (sim > highestSimilarity) {
        highestSimilarity = sim;
        bestMatchChar = char;
      }
    }

    // 將 0.0 ~ 1.0 的餘弦相似度，映射轉換為大眾直觀的 65% ~ 99% 契合度分數
    const normalizedScore = Math.min(
      99,
      Math.max(65, Math.round(65 + Math.pow(Math.max(0, highestSimilarity), 1.2) * 34))
    );

    return {
      matchedCharacter: bestMatchChar,
      matchScore: normalizedScore,
      sourceLot: sourceLot,
      playerTraits: { ...playerTraits },
    };
  }

  /**
   * 計算兩個多維特質向量之間的餘弦相似度 (Cosine Similarity)
   * 公式：Sim(A, B) = (A · B) / (||A|| * ||B||)
   */
  private static calculateCosineSimilarity(
    vecA: Record<TraitId, number>,
    vecB: Record<TraitId, number>
  ): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const key of this.ALL_TRAIT_KEYS) {
      const valA = vecA[key] || 0;
      const valB = vecB[key] || 0;

      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) {
      return 0; // 若玩家全無加分或角色向度為空，避免除以 0
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}