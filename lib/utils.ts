import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return '¥' + Math.round(amount).toLocaleString()
}

export function formatNumber(num: number): string {
  return num.toLocaleString()
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function getDateRange(period: string) {
  const today = new Date()
  let startDate: Date
  let endDate: Date = today

  switch (period) {
    case 'today':
      startDate = endDate = today
      break
    case 'week':
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3)
      startDate = new Date(today.getFullYear(), quarter * 3, 1)
      break
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1)
      break
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
  }

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  }
}

export function calculateTrend(current: number, previous: number): {
  value: number
  direction: 'up' | 'down' | 'neutral'
} {
  if (previous === 0) {
    return { value: 0, direction: 'neutral' }
  }

  const change = ((current - previous) / previous) * 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'

  return {
    value: Math.abs(change),
    direction
  }
}
