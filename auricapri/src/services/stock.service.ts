export class StockService {
  async checkStock(_variantId: string): Promise<{ available: number }> {
    return { available: 0 };
  }

  async reserveStock(_variantId: string, _quantity: number): Promise<boolean> {
    return false;
  }

  async releaseStock(_variantId: string, _quantity: number): Promise<void> {
    return;
  }
}
