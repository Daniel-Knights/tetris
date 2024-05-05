export type GameStatusType =
  | "PLAYING"
  | "PAUSED"
  | "GAME_OVER"
  | "SOFT_DROP"
  | "HARD_DROP"
  | "LOCK_DOWN"
  | "LINE_CLEAR";

export class GameStatus {
  #status: GameStatusType;

  constructor(status: GameStatusType) {
    this.#status = status;
  }

  is(...statuses: GameStatusType[]) {
    return statuses.includes(this.#status);
  }

  toString() {
    return this.#status;
  }
}
