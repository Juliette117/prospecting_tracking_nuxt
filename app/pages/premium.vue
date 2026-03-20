<template>
  <div class="dashboard-shell min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 class="dashboard-tight-title text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Plateforme de Suivi de Prospection
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            Gerez vos candidatures et missions freelance
          </p>
        </div>

        <div class="dashboard-header-actions flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div class="dashboard-user-pill rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-left text-sm text-slate-200 shadow-sm backdrop-blur">
            Bonjour <span class="font-bold text-white">{{ userDisplayName }}</span>
          </div>

          <UButton
            color="primary"
            variant="soft"
            icon="i-heroicons-arrow-right-on-rectangle"
            :loading="isSigningOut"
            class="dashboard-primary-action justify-center rounded-2xl"
            @click="handleSignOut"
          >
            Se deconnecter
          </UButton>
        </div>
      </header>

      <section class="mt-6 overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[rgba(255,255,255,0.92)] shadow-[0_24px_80px_-40px_rgba(41,72,152,0.28)] backdrop-blur">
        <div class="border-b border-[var(--dashboard-line)] px-4 pt-3 sm:px-6">
          <div class="dashboard-tab-strip flex gap-1 overflow-x-auto pb-1">
            <NuxtLink
              v-for="tab in tabs"
              :key="tab.to"
              :to="tab.to"
              class="dashboard-tab-link inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition"
              :class="tab.isActive
                ? 'border-[var(--dashboard-accent)] text-[var(--dashboard-accent)]'
                : 'border-transparent text-[var(--dashboard-muted)] hover:text-[var(--dashboard-ink)]'"
            >
              <UIcon :name="tab.icon" class="h-4 w-4" />
              <span class="whitespace-nowrap">{{ tab.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <div class="px-4 py-6 sm:px-6">
          <div class="flex flex-col gap-4 border-b border-[var(--dashboard-line)] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div class="inline-flex items-center rounded-full bg-[rgba(79,124,255,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--dashboard-accent)]">
                Offre Pro
              </div>
              <p class="mt-3 max-w-2xl text-sm text-[var(--dashboard-muted)]">
                Une offre pensee pour les profils qui veulent structurer, analyser et accelerer leur prospection.
              </p>
            </div>

            <div class="inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Bientot disponible
            </div>
          </div>

          <div class="mt-6 grid gap-5 xl:grid-cols-2 xl:items-start">
            <section class="overflow-hidden rounded-[28px] border border-[#cfd9ff] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#38bdf8_100%)] p-[1px] shadow-[0_28px_70px_-40px_rgba(37,99,235,0.65)] xl:col-span-2">
              <div class="rounded-[27px] bg-[linear-gradient(135deg,rgba(15,23,42,0.97)_0%,rgba(15,23,42,0.9)_100%)] px-5 py-6 text-white lg:px-6 lg:py-7">
                <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div class="max-w-2xl">
                    <h3 class="text-2xl font-bold tracking-tight sm:text-3xl">
                      Debloquez un cockpit premium pour piloter votre prospection.
                    </h3>
                    <p class="mt-3 text-sm leading-6 text-slate-200 sm:text-[15px]">
                      L offre Pro regroupe les analyses avancees, les rappels intelligents, les exports et un graphe enrichi pour aller plus vite sur vos candidatures et vos missions freelance.
                    </p>
                  </div>

                  <div class="grid max-w-sm gap-3 lg:max-w-xs">
                    <div class="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                        Avantages
                      </p>
                      <p class="mt-2 text-sm font-semibold text-white">
                        Plus de visibilite, moins d oublis, des decisions plus rapides.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-7 grid gap-3 sm:grid-cols-2">
                  <article
                    v-for="highlight in proHighlights"
                    :key="highlight.label"
                    class="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur"
                  >
                    <div class="flex items-start gap-3">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white shadow-sm"
                      >
                        <UIcon :name="highlight.icon" class="h-5 w-5" />
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-white">{{ highlight.label }}</p>
                        <p class="mt-1 text-xs leading-5 text-slate-300">{{ highlight.description }}</p>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section class="rounded-[28px] border border-[var(--dashboard-line)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.18)] xl:col-span-2">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p class="text-sm font-semibold text-[var(--dashboard-ink)]">Les piliers de l'offre</p>
                  <p class="mt-1 max-w-2xl text-sm text-[var(--dashboard-muted)]">
                    Une organisation en trois briques pour rendre la page plus claire et mieux separer la promesse, le prix et les benefices.
                  </p>
                </div>
              </div>

              <div class="mt-5 grid gap-4 md:grid-cols-3">
                <article
                  v-for="pillar in premiumPillars"
                  :key="pillar.title"
                  class="rounded-[24px] border border-[var(--dashboard-line)] bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.16)]"
                >
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl text-white" :style="{ background: pillar.iconBackground }">
                    <UIcon :name="pillar.icon" class="h-5 w-5" />
                  </div>
                  <h3 class="mt-4 text-lg font-semibold text-[var(--dashboard-ink)]">{{ pillar.title }}</h3>
                  <p class="mt-2 text-sm leading-6 text-[var(--dashboard-muted)]">{{ pillar.description }}</p>
                </article>
              </div>
            </section>

            <aside class="rounded-[28px] border border-[var(--dashboard-line)] bg-white p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.3)] xl:col-span-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-[var(--dashboard-ink)]">Plan Pro</p>
                  <p class="mt-1 text-sm text-[var(--dashboard-muted)]">
                    Pour independants et profils en recherche active
                  </p>
                </div>
                <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Early access
                </span>
              </div>

              <div class="mt-5 flex items-end gap-2">
                <span class="dashboard-stat-value text-3xl font-bold tracking-tight text-[var(--dashboard-ink)] sm:text-4xl">20 EUR</span>
                <span class="pb-1 text-sm text-[var(--dashboard-muted)]">/ mois</span>
              </div>

              <div class="mt-5 rounded-[24px] bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] p-4">
                <p class="text-sm font-semibold text-[var(--dashboard-ink)]">Ce que vous debloquez</p>
                <div class="mt-4 space-y-3">
                  <div
                    v-for="benefit in proBenefits"
                    :key="benefit"
                    class="flex items-start gap-2 text-sm text-[var(--dashboard-ink)]"
                  >
                    <UIcon name="i-heroicons-check-circle" class="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                    <span>{{ benefit }}</span>
                  </div>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect, ref } from 'vue'
import { dashboardTabs } from '~/utils/dashboard-tabs'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const isSigningOut = ref(false)

const tabs = computed(() =>
  dashboardTabs.map((tab) => ({
    ...tab,
    isActive: tab.activePaths.some((path) => route.path.startsWith(path)),
  })),
)

const userDisplayName = computed(() => {
  const firstName = user.value?.user_metadata?.firstName

  if (typeof firstName === 'string' && firstName.trim().length > 0) {
    return firstName
  }

  return user.value?.email ?? 'utilisateur inconnu'
})

const proHighlights = [
  {
    label: 'Analytics avances',
    description: 'Suivi du taux de conversion, delais moyens et opportunites les plus performantes.',
    icon: 'i-heroicons-chart-bar-square',
  },
  {
    label: 'Rappels intelligents',
    description: 'Alertes sur les relances, deadlines et entretiens pour ne plus perdre d opportunite.',
    icon: 'i-heroicons-bell-alert',
  },
  {
    label: 'Exports premium',
    description: 'Generation de rapports PDF, CSV et Excel pour partager votre suivi ou archiver vos donnees.',
    icon: 'i-heroicons-arrow-down-tray',
  },
  {
    label: 'Graphe enrichi',
    description: 'Filtres, regroupements et focus avances pour mieux exploiter votre reseau professionnel.',
    icon: 'i-heroicons-share',
  },
]

const proBenefits = [
  'Exports CSV, Excel et PDF en un clic',
  'Scoring automatique des opportunites prioritaires',
  'Rappels automatiques sur les relances et entretiens',
  'Vues enregistrees et filtres avances sur toutes les pages',
]

const premiumPillars = [
  {
    title: 'Pilotage avance',
    description: 'Des tableaux de bord plus profonds pour identifier ce qui convertit le mieux et ou concentrer vos efforts.',
    icon: 'i-heroicons-presentation-chart-line',
    iconBackground: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)',
  },
  {
    title: 'Automatisation',
    description: 'Des rappels et suggestions intelligentes pour fiabiliser vos relances et eviter les oublis critiques.',
    icon: 'i-heroicons-bolt',
    iconBackground: 'linear-gradient(135deg,#b45309 0%,#f59e0b 100%)',
  },
  {
    title: 'Collaboration future',
    description: 'Une base ideale pour ouvrir demain des usages equipe, partage de dossiers et reporting premium.',
    icon: 'i-heroicons-user-group',
    iconBackground: 'linear-gradient(135deg,#be123c 0%,#fb7185 100%)',
  },
]

watchEffect(() => {
  if (!user.value) {
    navigateTo('/auth/login')
  }
})

const handleSignOut = async () => {
  try {
    isSigningOut.value = true
    await supabase.auth.signOut()
    await navigateTo('/auth/login')
  } finally {
    isSigningOut.value = false
  }
}
</script>
