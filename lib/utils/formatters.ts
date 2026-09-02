export function formatOrderNumber(orderId: string, index?: number): string {
  if (typeof index === 'number') {
    return `#${String(index + 1).padStart(5, '0')}`;
  }
  if (!orderId) return '#00001';
  
  // Extract numeric parts from UUID / ID string
  const digits = orderId.replace(/\D/g, '');
  if (digits.length > 0) {
    const num = parseInt(digits.slice(-5), 10);
    if (!isNaN(num) && num > 0) {
      return `#${String(num).padStart(5, '0')}`;
    }
  }
  return `#${orderId.slice(0, 5).toUpperCase()}`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(price || 0);
}
