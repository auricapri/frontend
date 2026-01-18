import { ProductsRepository } from '../repositories/products.repository.js';
import type { Product } from '../repositories/products.repository.js';
import { AssetsRepository, Asset } from '../repositories/assets.repository.js';
import type { CartItem } from '../../shared/types/index.js';

export class StockService {
  private productsRepo: ProductsRepository;
  private assetsRepo: AssetsRepository;

  constructor() {
    this.productsRepo = new ProductsRepository();
    this.assetsRepo = new AssetsRepository();
  }

  async updateStockAfterOrder(items: CartItem[], products: Product[], assets: Asset[]): Promise<void> {
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      const variant = product?.variants?.find((v: any) => v.id === item.variant_id);
      
      if (variant) {
        const newStock = Math.max(0, variant.stock_quantity - item.quantity);
        await this.productsRepo.updateStock(variant.id, newStock);
        
        if (variant.correlated_assets) {
          for (const link of variant.correlated_assets) {
            const totalAssetNeeded = link.quantity_required * item.quantity;
            const asset = assets.find(a => a.id === link.asset_id);
            if (asset) {
              const newAssetStock = Math.max(0, asset.stock_quantity - totalAssetNeeded);
              await this.assetsRepo.updateStock(asset.id, newAssetStock);
            }
          }
        }
      }
    }
  }
}

