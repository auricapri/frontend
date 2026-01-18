import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { OrdersRepository } from '../repositories/orders.repository.js';
import type { Order } from '../repositories/orders.repository.js';
import { PaymentMethod } from '../../shared/types/enums.js';
import type { LocalizedText, OrderItem } from '../../shared/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PDFService {
  private ordersRepo: OrdersRepository;

  constructor() {
    this.ordersRepo = new OrdersRepository();
  }

  /**
   * Generate receipt PDF for an order
   */
  async generateReceiptPDF(orderId: string): Promise<Buffer> {
    const order = await this.ordersRepo.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const templatePath = join(__dirname, '../templates/receipt.html');
    let template = await readFile(templatePath, 'utf-8');

    // Replace template variables
    template = this.fillReceiptTemplate(template, order);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(template, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate PLP (Postal Label Document) PDF for an order
   */
  async generatePLPPDF(orderId: string, metrics: { totalWeight: number; dimensions: string }): Promise<Buffer> {
    const order = await this.ordersRepo.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const templatePath = join(__dirname, '../templates/plp.html');
    let template = await readFile(templatePath, 'utf-8');

    // Replace template variables
    template = this.fillPLPTemplate(template, order, metrics);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(template, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private fillReceiptTemplate(template: string, order: Order): string {
    const getLoc = (obj: LocalizedText | string | undefined | null, locale: string = 'pt'): string => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || '';
    };

    const formatCurrency = (value: number, locale: string = 'pt-BR'): string => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formattedDate = new Date(order.created_at).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const itemsHtml = (order.items || []).map((item: OrderItem) => {
      const itemName = getLoc(item.name);
      const colorName = getLoc(item.color_name);
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">
            <strong>${itemName}</strong><br/>
            <span style="font-size: 10px; color: #666;">${colorName} / ${item.size} • Qtd: ${item.quantity}</span>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: bold;">
            ${formatCurrency(item.price * item.quantity)}
          </td>
        </tr>
      `;
    }).join('');

    const subtotal = order.subtotal || order.total + (order.discount_amount || 0);
    const discountHtml = order.discount_amount && order.discount_amount > 0
      ? `<tr>
          <td style="padding: 8px; color: #22c55e; font-weight: bold;">DESCONTO APLICADO</td>
          <td style="padding: 8px; text-align: right; color: #22c55e; font-weight: bold;">-${formatCurrency(order.discount_amount)}</td>
        </tr>`
      : '';

    return template
      .replace('{{ORDER_ID}}', order.id.slice(0, 8).toUpperCase())
      .replace('{{FORMATTED_DATE}}', formattedDate)
      .replace('{{PAYMENT_METHOD}}', order.payment_method === PaymentMethod.PIX ? 'PIX' : 'CARTÃO CRÉDITO')
      .replace('{{ITEMS_HTML}}', itemsHtml)
      .replace('{{SUBTOTAL}}', formatCurrency(subtotal))
      .replace('{{DISCOUNT_HTML}}', discountHtml)
      .replace('{{TOTAL}}', formatCurrency(order.total))
      .replace('{{TRACKING_CODE}}', order.tracking_code || '')
      .replace('{{TRACKING_SECTION}}', order.tracking_code
        ? `<div style="background: #000; color: #fff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; opacity: 0.8;">Código de Rastreio</div>
            <div style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 4px;">${order.tracking_code}</div>
          </div>`
        : '');
  }

  private fillPLPTemplate(template: string, order: Order, metrics: { totalWeight: number; dimensions: string }): string {
    const getLoc = (obj: LocalizedText | string | undefined | null): string => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      return obj['pt'] || obj['en'] || Object.values(obj)[0] || '';
    };

    const sender = {
      name: 'AURICAPRI GLOBAL LOGISTICS',
      doc: '00.000.000/0001-99',
      address: 'Centro de Distribuição V19 - São Paulo, SP',
    };

    const recipient = order.shipping_address_snapshot || {
      logradouro: 'Endereço não informado',
      localidade: 'N/A',
      uf: 'N/A',
      cep: '00000-000',
      numero: '',
      bairro: '',
    };

    const itemsHtml = (order.items || []).map((item: OrderItem) => {
      const itemName = getLoc(item.name);
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${itemName} (${item.size || 'U'})</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${item.price.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const plpSequence = `PLP-SEQ-${Date.now()}-${order.id.slice(0, 4)}`;

    return template
      .replace('{{ORDER_ID}}', order.id.slice(0, 8).toUpperCase())
      .replace('{{DATE}}', new Date().toLocaleDateString('pt-BR'))
      .replace('{{DECLARED_VALUE}}', order.total.toFixed(2))
      .replace('{{SENDER_NAME}}', sender.name)
      .replace('{{SENDER_DOC}}', sender.doc)
      .replace('{{SENDER_ADDRESS}}', sender.address)
      .replace('{{RECIPIENT_STREET}}', recipient.logradouro)
      .replace('{{RECIPIENT_NUMBER}}', recipient.numero || '')
      .replace('{{RECIPIENT_NEIGHBORHOOD}}', recipient.bairro || '')
      .replace('{{RECIPIENT_CITY}}', recipient.localidade)
      .replace('{{RECIPIENT_STATE}}', recipient.uf)
      .replace('{{RECIPIENT_CEP}}', recipient.cep || '')
      .replace('{{TOTAL_WEIGHT}}', metrics.totalWeight.toString())
      .replace('{{DIMENSIONS}}', metrics.dimensions)
      .replace('{{CARRIER}}', order.internal_logistics?.selected_carrier || 'TRANSP. PADRÃO')
      .replace('{{ITEMS_HTML}}', itemsHtml)
      .replace('{{PLP_SEQUENCE}}', plpSequence);
  }
}

