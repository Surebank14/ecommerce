export const CUSTOMER_PRICE_BLOCK_AMOUNT = 2500;
export const CUSTOMER_PRICE_BLOCK_FEE = 145;

export const calculateCustomerSellingPrice = (basePrice) => {
  const normalizedBasePrice = Number(basePrice || 0);
  if (normalizedBasePrice <= 0) return 0;

  const feeBlocks = Math.ceil(normalizedBasePrice / CUSTOMER_PRICE_BLOCK_AMOUNT);
  return normalizedBasePrice + (feeBlocks * CUSTOMER_PRICE_BLOCK_FEE);
};

export const calculatePayOnceSellingPrice = calculateCustomerSellingPrice;
export const calculatePaySmallSmallSellingPrice = calculateCustomerSellingPrice;

export const getProductDisplayPrice = (product) => {
  if (product?.hasVariations && Array.isArray(product.variations) && product.variations.length > 0) {
    const activePrices = product.variations
      .filter((variation) => variation.isActive !== false)
      .map((variation) => Number(variation.price || 0))
      .filter((price) => price > 0);

    if (activePrices.length > 0) {
      return calculateCustomerSellingPrice(Math.min(...activePrices));
    }
  }

  return calculateCustomerSellingPrice(product?.price);
};
