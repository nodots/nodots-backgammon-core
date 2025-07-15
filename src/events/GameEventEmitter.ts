export class GameEventEmitter {
  constructor(private gameId: string) {}
  emit(event: string, data: any) { console.log(`Event ${event}:`, data) }
  getGameId() { return this.gameId }
}
