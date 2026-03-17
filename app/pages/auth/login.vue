<script setup lang="ts">

import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function login() {

  loading.value = true
  error.value = ''

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (authError) {
    error.value = authError.message
  } else {
    navigateTo('/dashboard')
  }

  loading.value = false
}

</script>

<template>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-gray-950 to-blue-900">

  <div class="w-full max-w-md">

    <UCard
      class="backdrop-blur-xl bg-gray-900/80 border border-gray-800 shadow-2xl"
    >

      <div class="space-y-8">

        <!-- Logo / titre -->

        <div class="text-center space-y-2">

          <h1 class="text-3xl font-bold text-white">
            ProspectFlow
          </h1>

          <p class="text-gray-400 text-sm">
            Suivi de prospection & opportunités
          </p>

        </div>

        <!-- Form -->

        <UForm class="space-y-4" @submit="login">

          <UFormGroup label="Email">

            <UInput
              class="m-2"
              v-model="email"
              type="email"
              size="lg"
              placeholder="email@exemple.com"
              icon="i-lucide-mail"
            />

          </UFormGroup>

          <UFormGroup label="Mot de passe">

            <UInput
              class="m-2"
              v-model="password"
              type="password"
              size="lg"
              placeholder="••••••••"
              icon="i-lucide-lock"
            />

          </UFormGroup>

          <UButton
            class="m-2"
            block
            size="lg"
            color="primary"
            :loading="loading"
          >
            Se connecter
          </UButton>

        </UForm>

        <!-- erreur -->

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
        >
          {{ error }}
        </UAlert>

        <!-- divider -->

        <UDivider label="ou continuer avec" />

        <!-- oauth -->

        <div class="grid grid-cols-2 gap-3">

          <UButton
            icon="i-simple-icons-google"
            variant="outline"
            block
          >
            Google
          </UButton>

          <UButton
            icon="i-simple-icons-github"
            variant="outline"
            block
          >
            GitHub
          </UButton>

        </div>

      </div>

    </UCard>

  </div>

</div>

</template>