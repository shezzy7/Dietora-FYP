import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'

// Approximate meal times for reminders
const MEAL_TIMES = {
  breakfast: { h: 8, m: 0 },   // 8:00 AM
  lunch: { h: 13, m: 0 },      // 1:00 PM
  snack: { h: 16, m: 30 },     // 4:30 PM
  dinner: { h: 20, m: 0 },     // 8:00 PM
}

export default function useMealReminders() {
  const { current: mealPlan } = useSelector((s) => s.mealPlan)
  const { current: progress } = useSelector((s) => s.progress)

  useEffect(() => {
    if (!mealPlan || !progress) return

    // Request notification permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const checkReminders = () => {
      const now = new Date()
      // Current day index (0 = Monday, 6 = Sunday for our logic, wait. JS getDay: 0=Sun, 1=Mon.
      // Our logic: startDate is usually a Monday. Let's just use the current day offset from startDate,
      // but to keep it simple and robust, we just check what day of the week it is.
      // Dietora days: 1 to 7 (Monday to Sunday)
      const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
      
      const todayPlan = mealPlan.days?.find(d => d.day === currentDayOfWeek)
      const todayProgress = progress.days?.find(d => d.day === currentDayOfWeek)

      if (!todayPlan || !todayProgress) return

      Object.entries(MEAL_TIMES).forEach(([mealType, time]) => {
        // If meal is already completed, no reminder needed
        const mealDone = todayProgress.meals?.find(m => m.mealType === mealType)?.completed
        if (mealDone) return

        const mealData = todayPlan.meals?.[mealType]
        if (!mealData || !mealData.name) return

        // Check if it's within 15 minutes of the meal time
        const diffMinutes = (now.getHours() * 60 + now.getMinutes()) - (time.h * 60 + time.m)
        
        // If exactly at meal time (using a 1 minute window because interval runs every 60s)
        if (diffMinutes >= 0 && diffMinutes < 1) {
          const title = `Time for ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}! 🍽️`
          const body = `${mealData.name} (${mealData.calories} kcal) is scheduled for now.`
          
          if (Notification.permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/vite.svg', // Default icon
            })
          } else {
            // Fallback to in-app toast
            toast.success(`${title}\n${body}`, { duration: 5000, icon: '🔔' })
          }
        }
      })
    }

    // Run immediately, then every 60 seconds
    checkReminders()
    const interval = setInterval(checkReminders, 60000)

    return () => clearInterval(interval)
  }, [mealPlan, progress])
}
