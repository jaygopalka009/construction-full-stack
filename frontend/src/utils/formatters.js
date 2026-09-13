// Currency & Number Formatter for Indian Rupee (Lakhs, Crores, Thousands)

export function formatCurrency(amount) {
  const val = Number(amount) || 0;
  if (val === 0) return '₹ 0';

  if (val >= 10000000) {
    const crVal = val / 10000000;
    return `₹ ${crVal % 1 === 0 ? crVal : crVal.toFixed(2)} Cr`;
  }

  if (val >= 100000) {
    const lakhVal = val / 100000;
    return `₹ ${lakhVal % 1 === 0 ? lakhVal : lakhVal.toFixed(2)} Lakh`;
  }

  return `₹ ${val.toLocaleString('en-IN')}`;
}

export function formatNumber(num) {
  const val = Number(num) || 0;
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} Lakh`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)} K`;
  return val.toLocaleString('en-IN');
}
