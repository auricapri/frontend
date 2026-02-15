import type { Product, ProductVariant } from '../../types';
import type { LocalizedText } from '../../types/common';

/**
 * Helper to get localized text value
 */
function getLocalizedValue(text: LocalizedText | string | undefined, locale: string): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] || text.en || text.pt || '';
}

/**
 * Organization Schema (Global)
 * Use this on all pages to establish site authority
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Auricapri",
  "url": "https://www.auricapri.com.br",
  "logo": "https://www.auricapri.com.br/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+55-11-XXXX-XXXX",
    "contactType": "customer service",
    "availableLanguage": ["Portuguese", "English", "Spanish", "French"]
  },
  "sameAs": [
    "https://www.instagram.com/auricapri",
    "https://www.facebook.com/auricapri"
  ]
};

/**
 * WebSite Schema (with Search)
 * Use this on the homepage to enable search box in Google results
 */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Auricapri",
  "url": "https://www.auricapri.com.br",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.auricapri.com.br/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

/**
 * Product Schema (dynamic)
 * Use this on product pages for rich snippets with price, availability, and ratings
 *
 * @param product - Product data from API
 * @param variant - Selected variant with price and stock
 * @param locale - Current language (en, pt, es, fr)
 */
export function createProductSchema(
  product: Product,
  variant: ProductVariant,
  locale: string
) {
  const productName = getLocalizedValue(product.name, locale);
  const productDescription = getLocalizedValue(product.description, locale);
  const productImage = variant.variant_images?.[0] || product.base_images?.[0] || product.default_image_url;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productName,
    "image": productImage,
    "description": productDescription,
    "sku": variant.sku,
    "brand": {
      "@type": "Brand",
      "name": "Auricapri"
    },
    "offers": {
      "@type": "Offer",
      "price": variant.retail_price.toFixed(2),
      "priceCurrency": "BRL",
      "availability": variant.stock_quantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "url": window.location.href,
      "seller": {
        "@type": "Organization",
        "name": "Auricapri"
      }
    },
    ...(product.average_rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.average_rating,
        "reviewCount": product.total_reviews || 0
      }
    })
  };
}

/**
 * BreadcrumbList Schema
 * Use this on product and collection pages for breadcrumb navigation in search results
 *
 * @param items - Array of breadcrumb items with name and url
 *
 * @example
 * createBreadcrumbSchema([
 *   { name: 'Home', url: 'https://www.auricapri.com.br/' },
 *   { name: 'Women', url: 'https://www.auricapri.com.br/collection/women' },
 *   { name: 'Dresses', url: 'https://www.auricapri.com.br/collection/dresses' }
 * ])
 */
export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

/**
 * CollectionPage Schema
 * Use this on collection pages for better indexing
 *
 * @param collectionName - Name of the collection
 * @param collectionDescription - Description of the collection
 * @param collectionUrl - URL of the collection page
 * @param numberOfItems - Total number of products in the collection
 */
export function createCollectionSchema(
  collectionName: string,
  collectionDescription: string,
  collectionUrl: string,
  numberOfItems: number
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": collectionName,
    "description": collectionDescription,
    "url": collectionUrl,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": numberOfItems
    }
  };
}

/**
 * FAQPage Schema
 * Use this on pages with FAQ sections
 *
 * @param faqs - Array of FAQ items with question and answer
 */
export function createFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
