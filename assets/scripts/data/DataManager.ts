// assets/scripts/data/DataManager.ts
import { resources, JsonAsset, error, log } from 'cc';
import { FortuneLotData, CharacterData, QuestionData } from '../core/Types';

export class DataManager {
  private static _instance: DataManager | null = null;

  // 記憶體快取 (Map 結構提供 O(1) 極速查詢)
  private _lotsMap: Map<string, FortuneLotData> = new Map();
  private _charactersMap: Map<string, CharacterData> = new Map();
  private _questionsMap: Map<number, QuestionData> = new Map();

  private _allLotsList: FortuneLotData[] = [];
  private _allCharactersList: CharacterData[] = [];

  private _isLoaded: boolean = false;

  private constructor() {}

  /** 取得單例實例 */
  public static get instance(): DataManager {
    if (!this._instance) {
      this._instance = new DataManager();
    }
    return this._instance;
  }

  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  /**
   * 非同步平行載入所有 JSON 設定檔
   */
  public async loadAllConfigs(): Promise<boolean> {
    if (this._isLoaded) return true;

    try {
      const [lotsJson, charsJson, questionsJson] = await Promise.all([
        this.loadJsonAsset('data/lots'),
        this.loadJsonAsset('data/characters'),
        this.loadJsonAsset('data/questions'),
      ]);

      // 1. 解析靈籤資料
      const rawLots = lotsJson.json as FortuneLotData[];
      this._allLotsList = rawLots;
      this._lotsMap.clear();
      rawLots.forEach((lot) => this._lotsMap.set(lot.id, lot));

      // 2. 解析角色資料
      const rawChars = charsJson.json as CharacterData[];
      this._allCharactersList = rawChars;
      this._charactersMap.clear();
      rawChars.forEach((char) => this._charactersMap.set(char.id, char));

      // 3. 解析題庫資料
      const rawQuestions = questionsJson.json as QuestionData[];
      this._questionsMap.clear();
      rawQuestions.forEach((q) => this._questionsMap.set(q.id, q));

      this._isLoaded = true;
      log('[DataManager] 所有數值資料表加載完畢！籤池數:', this._lotsMap.size, '角色數:', this._charactersMap.size, '題數:', this._questionsMap.size);
      return true;
    } catch (err) {
      error('[DataManager] 資料載入失敗:', err);
      return false;
    }
  }

  /**
   * 封裝 Cocos resources.load 為 Promise
   */
  private loadJsonAsset(path: string): Promise<JsonAsset> {
    return new Promise((resolve, reject) => {
      resources.load(path, JsonAsset, (err, asset) => {
        if (err || !asset) {
          reject(err || new Error(`找不到資源: ${path}`));
        } else {
          resolve(asset);
        }
      });
    });
  }

  // ================= 查詢 API =================

  /** 取得所有可供抽取的靈籤清單 */
  public getAllLots(): FortuneLotData[] {
    return this._allLotsList;
  }

  /** 隨機抽取一支靈籤 (抽籤核心) */
  public getRandomLot(): FortuneLotData {
    const index = Math.floor(Math.random() * this._allLotsList.length);
    return this._allLotsList[index];
  }

  /** 依 ID 取得特定靈籤 */
  public getLotById(lotId: string): FortuneLotData | undefined {
    return this._lotsMap.get(lotId);
  }

  /** 依 ID 取得特定角色 */
  public getCharacterById(charId: string): CharacterData | undefined {
    return this._charactersMap.get(charId);
  }

  /** 取得全角色列表 (用於圖鑑展示) */
  public getAllCharacters(): CharacterData[] {
    return this._allCharactersList;
  }

  /**
   * 根據籤池 ID，取得該籤綁定的題目清單 (動態題庫篩選核心)
   */
  public getQuestionsForLot(lotId: string): QuestionData[] {
    const lot = this._lotsMap.get(lotId);
    if (!lot) return [];

    const result: QuestionData[] = [];
    for (const qid of lot.questionIds) {
      const q = this._questionsMap.get(qid);
      if (q) {
        result.push(q);
      }
    }
    return result;
  }
}