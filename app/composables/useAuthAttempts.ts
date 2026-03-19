import { computed } from 'vue'

export const useAuthAttempts = (_scope: 'login' | 'register') => {
  const attemptsMessage = computed(() => '')
  const isLocked = computed(() => false)
  const remainingAttempts = computed(() => Number.POSITIVE_INFINITY)

  const recordFailure = () => {}
  const resetAttempts = () => {}

  return {
    attemptsMessage,
    isLocked,
    maxFailedAttempts: Number.POSITIVE_INFINITY,
    recordFailure,
    remainingAttempts,
    resetAttempts,
  }
}
