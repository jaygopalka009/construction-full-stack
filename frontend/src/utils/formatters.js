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

export function formatRunningHours(hours) {
  const val = Number(hours) || 0;
  return `${val.toLocaleString('en-IN')} hrs`;
}

export function getFuelBadgeColor(fuelStr) {
  const num = parseInt(fuelStr, 10);
  if (isNaN(num)) return '#059669';
  if (num <= 25) return '#dc2626';
  if (num <= 50) return '#d97706';
  return '#059669';
}

/**
 * Format date string into readable Indian standard format (DD/MM/YYYY)
 * @param {string|Date} dateVal - ISO date string or Date object
 * @returns {string} Formatted date string or fallback
 */
export function formatDateSafely(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateVal);
  }
}

/**
 * Format compact metric representation (e.g. 1.2K, 3.5M)
 * @param {number|string} value - Numerical metric
 * @returns {string} Compact formatted string
 */
export function formatCompactNumber(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
}

