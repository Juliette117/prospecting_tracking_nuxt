<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950  p-4">
    <UCard class="w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 ring-1 ring-white/20 dark:ring-white/10">
      <template #header>
        <h2 class="text-2xl font-bold text-center text-gray-900 dark:text-white">Connexion</h2>
        <p class="text-sm text-center text-gray-500 dark:text-gray-400 mt-1">Accédez à votre plateforme de prospection</p>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <UFormField label="Email" name="email">
          <UInput 
            v-model="email" 
            type="email" 
            placeholder="votre@email.com" 
            icon="i-heroicons-envelope" 
            required 
            
          />
        </UFormField>

        <UFormField label="Mot de passe" name="password">
          <UInput 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            icon="i-heroicons-lock-closed" 
            required 
            
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="loading"
          :disabled="isLocked"
          class="mt-6"
        >
          Se connecter
        </UButton>
      </form>

      <div class="mt-6 text-sm text-center text-gray-600 dark:text-gray-300">
        Pas encore de compte ? 
        <NuxtLink to="/auth/register" class="text-primary-500 hover:underline font-medium">
          S'inscrire
        </NuxtLink>
      </div>

      <!-- Affichage des erreurs -->
      <UAlert 
        v-if="errorMsg" 
        color="error" 
        variant="subtle" 
        :title="errorMsg" 
        class="mt-4" 
      />
      <UAlert
        v-if="attemptsMessage"
        :color="isLocked ? 'warning' : 'info'"
        variant="subtle"
        :title="attemptsMessage"
        class="mt-4"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getFrenchAuthErrorMessage } from '~/utils/auth-error'

// Utilisation du composable fourni par @nuxtjs/supabase
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { attemptsMessage, isLocked, recordFailure, resetAttempts } = useAuthAttempts('login')

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

// Redirige l'utilisateur s'il est déjà connecté
watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard')
  }
})

const handleLogin = async () => {
  try {
    if (isLocked.value) {
      errorMsg.value = attemptsMessage.value
      return
    }

    loading.value = true
    errorMsg.value = ''
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) throw error
    resetAttempts()
    await navigateTo('/dashboard')
  } catch (error: any) {
    recordFailure()
    errorMsg.value = getFrenchAuthErrorMessage(
      error,
      "Une erreur est survenue lors de la connexion.",
    )
  } finally {
    loading.value = false
  }
}
</script>
