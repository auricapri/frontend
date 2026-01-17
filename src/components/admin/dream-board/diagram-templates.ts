import { Node, Edge, MarkerType } from 'reactflow';
import { Product, Collection, ProductVariant, LocalizedText } from '../../../types';
import { getCurrencySymbol } from '../../../utils/currency';
import { Locale } from '../../../i18n';

export type TemplateType = 'cost' | 'revenue' | 'collection' | 'custom';

interface TemplateConfig {
  name: string;
  description: string;
  type: TemplateType;
}

const getLocalizedText = (text: LocalizedText | string | undefined, locale: string = 'pt'): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale as keyof LocalizedText] || text.pt || text.en || '';
};

const generateNodeId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateEdgeId = () => `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const TEMPLATE_CONFIGS: Record<TemplateType, TemplateConfig> = {
  cost: {
    name: 'Fluxo de Custo',
    description: 'Fornecedor -> Produto -> Embalagem -> Frete -> Resultado',
    type: 'cost',
  },
  revenue: {
    name: 'Fluxo de Receita',
    description: 'Produto -> Marketing -> Venda -> Cliente -> Resultado',
    type: 'revenue',
  },
  collection: {
    name: 'Fluxo de Colecao',
    description: 'Colecao -> Produtos -> Variacoes -> Resultado',
    type: 'collection',
  },
  custom: {
    name: 'Personalizado',
    description: 'Comece do zero',
    type: 'custom',
  },
};

export function generateCostFlowTemplate(locale: Locale = 'pt'): { nodes: Node[]; edges: Edge[] } {
  const currencySymbol = getCurrencySymbol(locale);
  const baseX = 100;
  const baseY = 200;
  const spacing = 280;

  const supplierNodeId = generateNodeId();
  const productNodeId = generateNodeId();
  const packagingNodeId = generateNodeId();
  const shippingNodeId = generateNodeId();
  const resultNodeId = generateNodeId();

  const nodes: Node[] = [
    {
      id: supplierNodeId,
      type: 'variable',
      position: { x: baseX, y: baseY },
      data: {
        label: 'Fornecedor',
        varName: 'fornecedor',
        value: 0,
        unit: currencySymbol,
        description: 'Custo do fornecedor',
      },
    },
    {
      id: productNodeId,
      type: 'product',
      position: { x: baseX + spacing, y: baseY },
      data: {
        label: 'Produto',
        productName: 'Produto',
        value: 0,
        unit: currencySymbol,
        category: 'custo',
      },
    },
    {
      id: packagingNodeId,
      type: 'variable',
      position: { x: baseX + spacing * 2, y: baseY },
      data: {
        label: 'Embalagem',
        varName: 'embalagem',
        value: 0,
        unit: currencySymbol,
        description: 'Custo de embalagem',
      },
    },
    {
      id: shippingNodeId,
      type: 'variable',
      position: { x: baseX + spacing * 3, y: baseY },
      data: {
        label: 'Frete',
        varName: 'frete',
        value: 0,
        unit: currencySymbol,
        description: 'Custo de frete',
      },
    },
    {
      id: resultNodeId,
      type: 'result',
      position: { x: baseX + spacing * 4, y: baseY },
      data: {
        label: 'Resultado',
        title: 'Custo Total',
        formula: 'fornecedor + produto + embalagem + frete',
      },
    },
  ];

  const edges: Edge[] = [
    {
      id: generateEdgeId(),
      source: supplierNodeId,
      target: productNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: '' },
    },
    {
      id: generateEdgeId(),
      source: productNodeId,
      target: packagingNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: '' },
    },
    {
      id: generateEdgeId(),
      source: packagingNodeId,
      target: shippingNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: '' },
    },
    {
      id: generateEdgeId(),
      source: shippingNodeId,
      target: resultNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: '' },
    },
  ];

  return { nodes, edges };
}

export function generateRevenueFlowTemplate(locale: Locale = 'pt'): { nodes: Node[]; edges: Edge[] } {
  const currencySymbol = getCurrencySymbol(locale);
  const baseX = 100;
  const baseY = 200;
  const spacing = 280;

  const productNodeId = generateNodeId();
  const marketingNodeId = generateNodeId();
  const saleNodeId = generateNodeId();
  const customerNodeId = generateNodeId();
  const resultNodeId = generateNodeId();

  const nodes: Node[] = [
    {
      id: productNodeId,
      type: 'product',
      position: { x: baseX, y: baseY },
      data: {
        label: 'Produto',
        productName: 'Produto',
        value: 0,
        unit: currencySymbol,
        category: 'receita',
      },
    },
    {
      id: marketingNodeId,
      type: 'variable',
      position: { x: baseX + spacing, y: baseY },
      data: {
        label: 'Marketing',
        varName: 'marketing',
        value: 0,
        unit: currencySymbol,
        description: 'Custo de marketing',
      },
    },
    {
      id: saleNodeId,
      type: 'calculator',
      position: { x: baseX + spacing * 2, y: baseY },
      data: {
        label: 'Venda',
        expression: 'produto - marketing',
        result: 0,
      },
    },
    {
      id: customerNodeId,
      type: 'variable',
      position: { x: baseX + spacing * 3, y: baseY },
      data: {
        label: 'Cliente',
        varName: 'cliente',
        value: 1,
        unit: 'un',
        description: 'Quantidade de clientes',
      },
    },
    {
      id: resultNodeId,
      type: 'result',
      position: { x: baseX + spacing * 4, y: baseY },
      data: {
        label: 'Resultado',
        title: 'Receita Total',
        formula: '(produto - marketing) * cliente',
      },
    },
  ];

  const edges: Edge[] = [
    {
      id: generateEdgeId(),
      source: productNodeId,
      target: marketingNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: '' },
    },
    {
      id: generateEdgeId(),
      source: marketingNodeId,
      target: saleNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: '' },
    },
    {
      id: generateEdgeId(),
      source: saleNodeId,
      target: customerNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: '' },
    },
    {
      id: generateEdgeId(),
      source: customerNodeId,
      target: resultNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: '' },
    },
  ];

  return { nodes, edges };
}

export function generateCollectionFlowTemplate(
  collection: Collection,
  products: Product[],
  locale: Locale = 'pt'
): { nodes: Node[]; edges: Edge[] } {
  const currencySymbol = getCurrencySymbol(locale);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const baseX = 100;
  const baseY = 100;
  const productSpacingX = 350;
  const variantSpacingY = 150;

  const collectionNodeId = generateNodeId();
  nodes.push({
    id: collectionNodeId,
    type: 'image',
    position: { x: baseX, y: baseY + 200 },
    data: {
      label: getLocalizedText(collection.name, locale),
      imageUrl: collection.image_url || '',
      caption: 'Colecao',
    },
  });

  const resultNodeId = generateNodeId();
  const resultX = baseX + (products.length + 1) * productSpacingX;
  
  nodes.push({
    id: resultNodeId,
    type: 'result',
    position: { x: resultX, y: baseY + 200 },
    data: {
      label: 'Resultado',
      title: `Total ${getLocalizedText(collection.name, locale)}`,
      formula: '',
    },
  });

  products.forEach((product, productIndex) => {
    const productX = baseX + (productIndex + 1) * productSpacingX;
    const productY = baseY;
    const productNodeId = generateNodeId();

    nodes.push({
      id: productNodeId,
      type: 'product',
      position: { x: productX, y: productY },
      data: {
        label: getLocalizedText(product.name, locale),
        productId: product.id,
        productName: getLocalizedText(product.name, locale),
        productImage: product.base_images?.[0] || '',
        value: product.variants?.[0]?.retail_price || 0,
        unit: currencySymbol,
        category: 'colecao',
        variants: product.variants?.map(v => ({
          variantId: v.id,
          productId: product.id,
          sku: v.sku,
          color: getLocalizedText(v.color_name, locale),
          colorHex: v.color_hex,
          size: v.size,
          retail_price: v.retail_price,
          wholesale_price: v.wholesale_price,
          cost_price: v.cost_price,
          stock_quantity: v.stock_quantity,
        })),
      },
    });

    edges.push({
      id: generateEdgeId(),
      source: collectionNodeId,
      target: productNodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: '' },
    });

    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant, variantIndex) => {
        const variantNodeId = generateNodeId();
        const variantY = productY + (variantIndex + 1) * variantSpacingY;

        nodes.push({
          id: variantNodeId,
          type: 'variant',
          position: { x: productX + 50, y: variantY },
          data: {
            label: variant.sku,
            variantId: variant.id,
            productId: product.id,
            productName: getLocalizedText(product.name, locale),
            sku: variant.sku,
            color: getLocalizedText(variant.color_name, locale),
            colorHex: variant.color_hex,
            size: variant.size,
            retail_price: variant.retail_price,
            wholesale_price: variant.wholesale_price,
            cost_price: variant.cost_price,
            stock_quantity: variant.stock_quantity,
            variant_images: variant.variant_images || [],
            comments: [],
          },
        });

        edges.push({
          id: generateEdgeId(),
          source: productNodeId,
          target: variantNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          data: { label: '' },
        });

        edges.push({
          id: generateEdgeId(),
          source: variantNodeId,
          target: resultNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          data: { label: '' },
        });
      });
    } else {
      edges.push({
        id: generateEdgeId(),
        source: productNodeId,
        target: resultNodeId,
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { label: '' },
      });
    }
  });

  return { nodes, edges };
}

export function generateProductNode(
  product: Product,
  position: { x: number; y: number },
  locale: Locale = 'pt'
): Node {
  const currencySymbol = getCurrencySymbol(locale);
  return {
    id: generateNodeId(),
    type: 'product',
    position,
    data: {
      label: getLocalizedText(product.name, locale),
      productId: product.id,
      productName: getLocalizedText(product.name, locale),
      productImage: product.base_images?.[0] || '',
      value: product.variants?.[0]?.retail_price || 0,
      unit: currencySymbol,
      category: '',
      variants: product.variants?.map(v => ({
        variantId: v.id,
        productId: product.id,
        sku: v.sku,
        color: getLocalizedText(v.color_name, locale),
        colorHex: v.color_hex,
        size: v.size,
        retail_price: v.retail_price,
        wholesale_price: v.wholesale_price,
        cost_price: v.cost_price,
        stock_quantity: v.stock_quantity,
      })),
      comments: [],
    },
  };
}

export function generateVariantNode(
  product: Product,
  variant: ProductVariant,
  position: { x: number; y: number },
  locale: Locale = 'pt'
): Node {
  return {
    id: generateNodeId(),
    type: 'variant',
    position,
    data: {
      label: variant.sku,
      variantId: variant.id,
      productId: product.id,
      productName: getLocalizedText(product.name, locale),
      sku: variant.sku,
      color: getLocalizedText(variant.color_name, locale),
      colorHex: variant.color_hex,
      size: variant.size,
      retail_price: variant.retail_price,
      wholesale_price: variant.wholesale_price,
      cost_price: variant.cost_price,
      stock_quantity: variant.stock_quantity,
      variant_images: variant.variant_images || [],
      comments: [],
    },
  };
}

export function getTemplateByType(type: TemplateType, locale: Locale = 'pt'): { nodes: Node[]; edges: Edge[] } {
  switch (type) {
    case 'cost':
      return generateCostFlowTemplate(locale);
    case 'revenue':
      return generateRevenueFlowTemplate(locale);
    case 'collection':
      return { nodes: [], edges: [] };
    case 'custom':
    default:
      return { nodes: [], edges: [] };
  }
}

