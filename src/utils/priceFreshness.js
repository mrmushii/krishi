/**
 * Calculate price based on freshness rule:
 * - If listedAt = today → show current market price
 * - If listedAt older → apply age discount: price = marketPrice * (1 - min(0.1 * daysOld, 0.4))
 *   10% discount per day, capped at 40%
 */
export const calculateFreshPrice = (marketPrice, listedAt) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const listedDate = new Date(listedAt)
  listedDate.setHours(0, 0, 0, 0)
  
  const daysOld = Math.floor((today - listedDate) / (1000 * 60 * 60 * 24))
  
  if (daysOld === 0) {
    return {
      price: marketPrice,
      discount: 0,
      isFresh: true
    }
  }
  
  const discountRate = Math.min(0.1 * daysOld, 0.4)
  const discountedPrice = marketPrice * (1 - discountRate)
  
  return {
    price: discountedPrice,
    discount: discountRate * 100,
    isFresh: false,
    daysOld
  }
}

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0
  }).format(price)
}

