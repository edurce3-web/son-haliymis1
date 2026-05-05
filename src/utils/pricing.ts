// Profesyonel Kurs Fiyatlandırma Sistemi
// Farklı para birimleri için optimize edilmiş fiyat yapıları

export interface PriceOption {
  level: number;
  value: number;
  label: string;
  displayPrice: string;
}

export interface CurrencyPricing {
  currency: string;
  symbol: string;
  name: string;
  prices: PriceOption[];
}

// Fiyat üretici fonksiyon
function generatePriceLevels(currency: string, symbol: string, minPrice: number, step: number, formatConfig?: { suffix?: string, noDecimals?: boolean, reverseSymbol?: boolean, commaDecimal?: boolean }): PriceOption[] {
  const prices: PriceOption[] = [];
  for (let i = 1; i <= 50; i++) {
    let val = minPrice + (i - 1) * step;
    
    // Biraz düzeltme yapalım küsuratlar için
    if (val > 1000 && !formatConfig?.noDecimals) {
      val = Math.floor(val) + 0.99;
    } else if (!formatConfig?.noDecimals) {
      val = Math.floor(val) + 0.99;
    } else {
        val = Math.floor(val);
    }
    
    // Format
    let label = formatConfig?.noDecimals ? val.toString() : val.toFixed(2);
    if (formatConfig?.commaDecimal && !formatConfig?.noDecimals) {
      label = label.replace('.', ',');
    }
    
    // Display Price
    let displayPrice = '';
    if (formatConfig?.suffix) {
      displayPrice = formatConfig.reverseSymbol ? `${val} ${symbol} ${formatConfig.suffix}` : `${symbol}${label} ${formatConfig.suffix}`;
    } else {
      displayPrice = formatConfig?.reverseSymbol ? `${label}${symbol}` : `${symbol}${label}`;
    }
    
    // Add thousand separators for labels if needed
    if (val >= 1000) {
      const parts = label.split(formatConfig?.commaDecimal ? ',' : '.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, formatConfig?.commaDecimal ? '.' : ',');
      label = parts.join(formatConfig?.commaDecimal ? ',' : '.');
      
      displayPrice = formatConfig?.reverseSymbol ? `${label}${symbol}` : `${symbol}${label}`;
      if (formatConfig?.suffix) {
        displayPrice = `${displayPrice} ${formatConfig.suffix}`;
      }
    }
    
    prices.push({
      level: i,
      value: val,
      label,
      displayPrice: `Seviye ${i} - ${displayPrice}`
    });
  }
  return prices;
}

// Para birimi yapıları
export const CURRENCY_PRICING: CurrencyPricing[] = [
  {
    currency: 'TRY',
    symbol: '₺',
    name: 'Türk Lirası',
    prices: generatePriceLevels('TRY', '₺', 199, 100, { commaDecimal: true })
  },
  {
    currency: 'USD',
    symbol: '$',
    name: 'US Dollar',
    prices: generatePriceLevels('USD', '$', 9.99, 5)
  },
  {
    currency: 'EUR',
    symbol: '€',
    name: 'Euro',
    prices: generatePriceLevels('EUR', '€', 9.99, 5, { commaDecimal: true })
  },
  {
    currency: 'GBP',
    symbol: '£',
    name: 'British Pound',
    prices: generatePriceLevels('GBP', '£', 8.99, 5)
  },
  {
    currency: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    prices: generatePriceLevels('JPY', '¥', 1200, 500, { noDecimals: true, commaDecimal: true }) // comma decimal helps thousand sep logic
  },
  {
    currency: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    prices: generatePriceLevels('CAD', 'C$', 14.99, 5)
  },
  {
    currency: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    prices: generatePriceLevels('AUD', 'A$', 14.99, 5)
  },
  {
    currency: 'CHF',
    symbol: 'Fr',
    name: 'Swiss Franc',
    prices: generatePriceLevels('CHF', 'Fr', 14.90, 5) // Swiss uses .90 often but .99 is fine
  },
  {
    currency: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    prices: generatePriceLevels('CNY', '¥', 68, 20, { noDecimals: true })
  },
  {
    currency: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    prices: generatePriceLevels('INR', '₹', 499, 200, { noDecimals: true })
  },
  {
    currency: 'KRW',
    symbol: '₩',
    name: 'Korean Won',
    prices: generatePriceLevels('KRW', '₩', 12000, 3000, { noDecimals: true, commaDecimal: true })
  },
  {
    currency: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    prices: generatePriceLevels('BRL', 'R$', 39.90, 10, { commaDecimal: true })
  },
  {
    currency: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    prices: generatePriceLevels('MXN', '$', 199, 50, { noDecimals: true })
  },
  {
    currency: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    prices: generatePriceLevels('RUB', '₽', 899, 300, { noDecimals: true, reverseSymbol: true })
  },
  {
    currency: 'SAR',
    symbol: '﷼',
    name: 'Saudi Riyal',
    prices: generatePriceLevels('SAR', '﷼', 37.50, 15)
  },
  {
    currency: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    prices: generatePriceLevels('AED', 'د.إ', 36.75, 15)
  }
];


// Varsayılan para birimi (Türk Lirası)
export const DEFAULT_CURRENCY = 'TRY';
export const COURSE_PRICE_OPTIONS = CURRENCY_PRICING.find(c => c.currency === 'TRY')?.prices || [];

// Para birimini değiştir ve fiyat seçeneklerini güncelle
export const getPriceOptionsForCurrency = (currency: string): PriceOption[] => {
  const currencyData = CURRENCY_PRICING.find(c => c.currency === currency);
  return currencyData ? currencyData.prices : (CURRENCY_PRICING.find(c => c.currency === 'TRY')?.prices || []);
};

// Para birimi bilgisini al
export const getCurrencyInfo = (currency: string) => {
  return CURRENCY_PRICING.find(c => c.currency === currency) || CURRENCY_PRICING[0];
};

// Fiyat doğrulama fonksiyonu (para birimine göre)
export const isValidCoursePrice = (price: number, currency: string = DEFAULT_CURRENCY): boolean => {
  const prices = getPriceOptionsForCurrency(currency);
  return prices.some(option => option.value === price);
};

// Fiyat formatı fonksiyonu (para birimine göre)
export const formatCoursePrice = (price: number, currency: string = DEFAULT_CURRENCY): string => {
  const currencyInfo = getCurrencyInfo(currency);
  const priceOption = currencyInfo.prices.find(p => p.value === price);

  if (priceOption) {
    return priceOption.displayPrice;
  }

  // Fallback formatting
  return `${currencyInfo.symbol}${price.toFixed(2)}`;
};
