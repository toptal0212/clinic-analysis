import { StaffGoal } from './dataTypes'

const STORAGE_KEY = 'clinic_sales_goals'

export const saveGoalsToStorage = (goals: StaffGoal[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
    return true
  } catch (error) {
    console.error('Failed to save goals to localStorage:', error)
    return false
  }
}

export const loadGoalsFromStorage = (): StaffGoal[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return []
  } catch (error) {
    console.error('Failed to load goals from localStorage:', error)
    return []
  }
}

export const clearGoalsFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Failed to clear goals from localStorage:', error)
    return false
  }
}

export const exportGoalsToCSV = (goals: StaffGoal[]): string => {
  const headers = [
    'スタッフ名',
    '目標金額',
    '新規単価目標',
    '既存単価目標',
    '美容売上目標',
    'その他売上目標',
    '実績金額',
    '新規単価実績',
    '既存単価実績',
    '美容売上実績',
    'その他売上実績',
    '達成率(%)',
    '新規達成率(%)',
    '既存達成率(%)',
    '美容達成率(%)',
    'その他達成率(%)'
  ]

  const rows = goals.map(goal => [
    goal.staffName || '',
    goal.targetAmount || 0,
    goal.targetNewAverage || 0,
    goal.targetExistingAverage || 0,
    goal.targetBeautyRevenue || 0,
    goal.targetOtherRevenue || 0,
    goal.currentAmount || 0,
    goal.currentNewAverage || 0,
    goal.currentExistingAverage || 0,
    goal.currentBeautyRevenue || 0,
    goal.currentOtherRevenue || 0,
    (goal.achievementRate || 0).toFixed(1),
    (goal.newAchievementRate || 0).toFixed(1),
    (goal.existingAchievementRate || 0).toFixed(1),
    (goal.beautyAchievementRate || 0).toFixed(1),
    (goal.otherAchievementRate || 0).toFixed(1)
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  return csvContent
}

export const importGoalsFromCSV = (csvContent: string): StaffGoal[] => {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const goals: StaffGoal[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
      
      if (values.length >= headers.length) {
        const goal: StaffGoal = {
          staffId: `staff_${Date.now()}_${i}`,
          staffName: values[0] || '',
          targetAmount: parseFloat(values[1]) || 0,
          targetNewAverage: parseFloat(values[2]) || 0,
          targetExistingAverage: parseFloat(values[3]) || 0,
          targetBeautyRevenue: parseFloat(values[4]) || 0,
          targetOtherRevenue: parseFloat(values[5]) || 0,
          currentAmount: parseFloat(values[6]) || 0,
          currentNewAverage: parseFloat(values[7]) || 0,
          currentExistingAverage: parseFloat(values[8]) || 0,
          currentBeautyRevenue: parseFloat(values[9]) || 0,
          currentOtherRevenue: parseFloat(values[10]) || 0,
          achievementRate: parseFloat(values[11]) || 0,
          newAchievementRate: parseFloat(values[12]) || 0,
          existingAchievementRate: parseFloat(values[13]) || 0,
          beautyAchievementRate: parseFloat(values[14]) || 0,
          otherAchievementRate: parseFloat(values[15]) || 0
        }
        goals.push(goal)
      }
    }

    return goals
  } catch (error) {
    console.error('Failed to import goals from CSV:', error)
    return []
  }
}
