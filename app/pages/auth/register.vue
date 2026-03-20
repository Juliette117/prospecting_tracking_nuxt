<template>
  <div class="flex min-h-screen items-start justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 p-4 py-8 sm:items-center">
    <UCard class="w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 ring-1 ring-white/20 dark:ring-white/10">
      <template #header>
        <h2 class="text-center text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Créer un compte</h2>
        <p class="text-sm text-center text-gray-500 dark:text-gray-400 mt-1">Rejoignez notre plateforme de prospection</p>
      </template>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <UFormField label="Prenom" name="firstName">
          <UInput
            v-model="firstName"
            type="text"
            placeholder="Votre prenom"
            icon="i-heroicons-user"
            required
            class="mt-2"
          />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput 
            v-model="email" 
            type="email" 
            placeholder="votre@email.com" 
            icon="i-heroicons-envelope" 
            required 
            class="mt-2"
          />
        </UFormField>

        <UFormField label="Mot de passe" name="password">
          <UInput 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            icon="i-heroicons-lock-closed" 
            required 
            class="mt-2"
          />
        </UFormField>

        <UFormField label="Confirmer le mot de passe" name="confirmPassword">
          <UInput 
            v-model="confirmPassword" 
            type="password" 
            placeholder="••••••••" 
            icon="i-heroicons-lock-closed" 
            required 
            class="mt-2"
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="loading"
          class="mt-6"
        >
          Créer mon compte
        </UButton>
      </form>

      <div class="mt-6 text-sm text-center text-gray-600 dark:text-gray-300">
        Vous avez déjà un compte ? 
        <NuxtLink to="/auth/login" class="text-primary-500 hover:underline font-medium">
          Se connecter
        </NuxtLink>
      </div>

      <!-- Affichage des erreurs ou succès -->
      <UAlert 
        v-if="errorMsg" 
        color="error" 
        variant="subtle" 
        :title="errorMsg" 
        class="mt-4" 
      />
      <UAlert 
        v-if="successMsg" 
        color="success" 
        variant="subtle" 
        :title="successMsg" 
        class="mt-4" 
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getFrenchAuthErrorMessage } from '~/utils/auth-error'

const user = useSupabaseUser()

const firstName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// Redirige l'utilisateur s'il est déjà connecté
watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard')
  }
})

const handleRegister = async () => {
  try {
    if (password.value !== confirmPassword.value) {
      errorMsg.value = "Les mots de passe ne correspondent pas."
      return
    }

    loading.value = true
    errorMsg.value = ''
    successMsg.value = ''

    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        firstName: firstName.value,
        email: email.value,
        password: password.value,
      },
    })

    successMsg.value = "Inscription réussie ! Vous pouvez maintenant vous connecter."
    firstName.value = ''
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
  } catch (error: any) {
    errorMsg.value = getFrenchAuthErrorMessage(
      error?.data
        ? {
            code: error.data.code,
            message: error.statusMessage,
            status: error.statusCode,
          }
        : error,
      "Une erreur est survenue lors de l'inscription.",
    )
  } finally {
    loading.value = false
  }
}
</script>
