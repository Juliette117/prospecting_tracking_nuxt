<script setup lang="ts">

import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function register() {

  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = "Les mots de passe ne correspondent pas"
    return
  }

  loading.value = true

  const { error: authError } = await supabase.auth.signUp({
    email: email.value,
    password: password.value
  })

  if (authError) {
    error.value = authError.message
  } else {
    success.value = true
  }

  loading.value = false
}

</script>

<template>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-gray-950 to-blue-900">

  <div class="w-full max-w-md">

    <UCard class="backdrop-blur-xl bg-gray-900/80 border border-gray-800 shadow-2xl">

      <div class="space-y-8">

        <!-- Header -->

        <div class="text-center space-y-2">

          <div class="flex items-center justify-center gap-2">

            <div class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <UIcon name="i-lucide-user-plus" class="text-white"/>
            </div>

            <h1 class="text-3xl font-bold text-white">
              ProspectFlow
            </h1>

          </div>

          <p class="text-gray-400 text-sm">
            Crée ton compte
          </p>

        </div>

        <!-- Success -->

        <UAlert
          v-if="success"
          color="primary"
          variant="soft"
        >
          Compte créé ! Vérifie ton email pour confirmer ton inscription.
        </UAlert>

        <!-- Form -->

        <UForm
          v-if="!success"
          class="space-y-4"
          @submit="register"
        >

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

          <UFormGroup label="Confirmer le mot de passe">

            <UInput
              class="m-2"
              v-model="confirmPassword"
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
            Créer un compte
          </UButton>

        </UForm>

        <!-- Error -->

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
        >
          {{ error }}
        </UAlert>

        <!-- Divider -->

        <UDivider label="ou continuer avec" />

        <!-- OAuth -->

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

        <!-- Login link -->

        <p class="text-center text-sm text-gray-400">

          Déjà un compte ?

          <NuxtLink
            to="/login"
            class="text-blue-400 hover:text-blue-300"
          >
            Se connecter
          </NuxtLink>

        </p>

      </div>

    </UCard>

  </div>

</div>

</template>