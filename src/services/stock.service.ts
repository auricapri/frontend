export class StockService {
  async checkStock(variantId: string): Promise<{ available: number }> {
    return { available: 0 };
  }

  async reserveStock(variantId: string, quantity: number): Promise<boolean> {
    return false;
  }

  async releaseStock(variantId: string, quantity: number): Promise<void> {
  }
}
