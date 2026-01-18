import { SuppliersRepository } from '../repositories/suppliers.repository.js';
import type { Supplier, SupplierReview } from '../repositories/suppliers.repository.js';

export class SuppliersService {
  private suppliersRepo: SuppliersRepository;

  constructor() {
    this.suppliersRepo = new SuppliersRepository();
  }

  async getAll(): Promise<Supplier[]> {
    return this.suppliersRepo.getAll();
  }

  async getAllActive(): Promise<Supplier[]> {
    return this.suppliersRepo.getAllActive();
  }

  async getById(id: string): Promise<Supplier | null> {
    return this.suppliersRepo.getById(id);
  }

  async create(supplier: Partial<Supplier>): Promise<Supplier> {
    if (!supplier.store_name || supplier.store_name.trim() === '') {
      throw new Error('Nome da loja é obrigatório');
    }

    const cleanedSupplier = { ...supplier };
    
    if (cleanedSupplier.email && cleanedSupplier.email.trim() !== '') {
      if (!this.isValidEmail(cleanedSupplier.email)) {
        throw new Error('Formato de email inválido');
      }
    } else {
      cleanedSupplier.email = null;
    }

    if (cleanedSupplier.cnpj && cleanedSupplier.cnpj.trim() !== '') {
      if (!this.isValidCNPJ(cleanedSupplier.cnpj)) {
        throw new Error('CNPJ inválido. Verifique se está correto.');
      }
    } else {
      cleanedSupplier.cnpj = null;
    }

    Object.keys(cleanedSupplier).forEach(key => {
      const value = (cleanedSupplier as any)[key];
      if (typeof value === 'string' && value.trim() === '') {
        (cleanedSupplier as any)[key] = null;
      }
    });

    return this.suppliersRepo.create(cleanedSupplier);
  }

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const existing = await this.suppliersRepo.getById(id);
    if (!existing) {
      throw new Error('Fornecedor não encontrado');
    }

    const cleanedUpdates = { ...updates };

    if (cleanedUpdates.store_name !== undefined && cleanedUpdates.store_name.trim() === '') {
      throw new Error('Nome da loja não pode estar vazio');
    }

    if (cleanedUpdates.email && cleanedUpdates.email.trim() !== '') {
      if (!this.isValidEmail(cleanedUpdates.email)) {
        throw new Error('Formato de email inválido');
      }
    } else if (cleanedUpdates.email !== undefined) {
      cleanedUpdates.email = null;
    }

    if (cleanedUpdates.cnpj && cleanedUpdates.cnpj.trim() !== '') {
      if (!this.isValidCNPJ(cleanedUpdates.cnpj)) {
        throw new Error('CNPJ inválido. Verifique se está correto.');
      }
    } else if (cleanedUpdates.cnpj !== undefined) {
      cleanedUpdates.cnpj = null;
    }

    Object.keys(cleanedUpdates).forEach(key => {
      const value = (cleanedUpdates as any)[key];
      if (typeof value === 'string' && value.trim() === '') {
        (cleanedUpdates as any)[key] = null;
      }
    });

    return this.suppliersRepo.update(id, cleanedUpdates);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.suppliersRepo.getById(id);
    if (!existing) {
      throw new Error('Supplier not found');
    }

    return this.suppliersRepo.delete(id);
  }

  async getReviews(supplierId: string): Promise<SupplierReview[]> {
    const supplier = await this.suppliersRepo.getById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return this.suppliersRepo.getReviews(supplierId);
  }

  async createReview(userId: string, supplierId: string, rating: number, comment?: string | null): Promise<SupplierReview> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const supplier = await this.suppliersRepo.getById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    if (!supplier.is_active) {
      throw new Error('Cannot review inactive supplier');
    }

    const existingReviews = await this.suppliersRepo.getReviews(supplierId);
    const existingReview = existingReviews.find(r => r.user_id === userId);
    
    if (existingReview) {
      return this.suppliersRepo.updateReview(existingReview.id, { rating, comment });
    }

    return this.suppliersRepo.createReview({
      supplier_id: supplierId,
      user_id: userId,
      rating,
      comment: comment || null
    });
  }

  async toggleHelpful(reviewId: string, userId: string): Promise<{ helpful_count: number; user_has_helped: boolean }> {
    return this.suppliersRepo.toggleHelpful(reviewId, userId);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidCNPJ(cnpj: string): boolean {
    const cleaned = cnpj.replace(/[^\d]/g, '');
    if (cleaned.length !== 14) return false;
    
    if (/^(\d)\1+$/.test(cleaned)) return false;
    
    let length = cleaned.length - 2;
    let numbers = cleaned.substring(0, length);
    const digits = cleaned.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;
    
    length = length + 1;
    numbers = cleaned.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) return false;
    
    return true;
  }
}
