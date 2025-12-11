// Holiday detection based on appointment data
// 予約がない日を定休日として認識

export interface HolidayInfo {
  date: string
  isHoliday: boolean
  appointmentCount: number
}

/**
 * Detect holidays based on appointment data
 * Days with no appointments are considered holidays
 */
export function detectHolidays(records: any[]): HolidayInfo[] {
  const dateMap = new Map<string, number>()

  // Count appointments per date
  records.forEach(record => {
    const dateStr = record.recordDate || record.visitDate || record.accountingDate || record.reservationDate
    if (!dateStr) return

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return

    const dateKey = date.toISOString().split('T')[0]
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1)
  })

  // Get all dates in the range
  const allDates: string[] = []
  if (records.length > 0) {
    const dates = records
      .map(r => {
        const dateStr = r.recordDate || r.visitDate || r.accountingDate || r.reservationDate
        if (!dateStr) return null
        const date = new Date(dateStr)
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]
      })
      .filter((d): d is string => d !== null)
      .sort()

    if (dates.length > 0) {
      const startDate = new Date(dates[0])
      const endDate = new Date(dates[dates.length - 1])
      
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        allDates.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
  }

  // Mark holidays (days with no appointments)
  return allDates.map(date => ({
    date,
    isHoliday: (dateMap.get(date) || 0) === 0,
    appointmentCount: dateMap.get(date) || 0
  }))
}

/**
 * Get holiday statistics
 */
export function getHolidayStatistics(records: any[]): {
  totalDays: number
  holidayDays: number
  workingDays: number
  holidayRate: number
} {
  const holidays = detectHolidays(records)
  const totalDays = holidays.length
  const holidayDays = holidays.filter(h => h.isHoliday).length
  const workingDays = totalDays - holidayDays
  const holidayRate = totalDays > 0 ? (holidayDays / totalDays) * 100 : 0

  return {
    totalDays,
    holidayDays,
    workingDays,
    holidayRate
  }
}

