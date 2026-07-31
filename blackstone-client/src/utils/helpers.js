export function formatCurrency(amount, currency = 'NZD') {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency }).format(amount)
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium' }).format(new Date(date))
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ')
}
