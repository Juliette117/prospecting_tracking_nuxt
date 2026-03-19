<template>
  <div class="dashboard-shell min-h-screen bg-linear-to-br from-blue-950 via-slate-900 to-blue-950">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Plateforme de Suivi de Prospection
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            Gerez vos candidatures et missions freelance
          </p>
        </div>

        <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div class="rounded-2xl bg-white/10 px-4 py-2 text-sm text-slate-200 shadow-sm backdrop-blur">
            Bonjour <span class="font-bold text-white">{{ userDisplayName }}</span>
          </div>

          <UButton
            color="primary"
            variant="soft"
            icon="i-heroicons-arrow-right-on-rectangle"
            :loading="isSigningOut"
            class="rounded-2xl"
            @click="handleSignOut"
          >
            Se deconnecter
          </UButton>
        </div>
      </header>

      <section class="mt-6 overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[rgba(255,255,255,0.92)] shadow-[0_24px_80px_-40px_rgba(41,72,152,0.28)] backdrop-blur">
        <div class="border-b border-[var(--dashboard-line)] px-4 pt-3 sm:px-6">
          <div class="flex min-w-max gap-1 overflow-x-auto pb-0">
            <NuxtLink
              v-for="tab in tabs"
              :key="tab.to"
              :to="tab.to"
              class="inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition"
              :class="tab.isActive
                ? 'border-[var(--dashboard-accent)] text-[var(--dashboard-accent)]'
                : 'border-transparent text-[var(--dashboard-muted)] hover:text-[var(--dashboard-ink)]'"
            >
              <UIcon :name="tab.icon" class="h-4 w-4" />
              <span class="whitespace-nowrap">{{ tab.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <div class="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <div class="dashboard-reveal flex flex-col gap-3 md:flex-row md:items-end md:justify-between" :class="{ 'is-visible': hasEntered }" :style="getRevealStyle(0)">
            <div>
              <h2 class="text-2xl font-bold tracking-tight text-[var(--dashboard-ink)] sm:text-3xl">
                Tableau de Bord
              </h2>
              <p class="mt-1 text-sm text-[var(--dashboard-muted)]">
                Vue d'ensemble de votre activite de prospection
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 text-sm text-[var(--dashboard-muted)]">
              <UButton
                color="neutral"
                variant="soft"
                icon="i-heroicons-arrow-path"
                :loading="isManualRefreshing"
                class="rounded-full"
                @click="handleManualRefresh"
              >
                Actualiser
              </UButton>
            </div>
          </div>

          <UAlert
            v-if="dashboardError"
            color="error"
            variant="subtle"
            title="Impossible de charger les donnees du dashboard."
            :description="dashboardError"
          />

          <div class="dashboard-reveal grid gap-4 md:grid-cols-3" :class="{ 'is-visible': hasEntered }" :style="getRevealStyle(1)">
            <div
              v-for="card in overviewCards"
              :key="card.label"
              class="dashboard-focus-ring group rounded-2xl bg-white p-4 text-left shadow-sm transition duration-300"
              :class="cardButtonClass(card.key)"
              tabindex="0"
              @mouseenter="setDashboardFocus(card.key)"
              @mouseleave="clearDashboardFocus(card.key)"
              @focus="setDashboardFocus(card.key)"
              @blur="clearDashboardFocus(card.key)"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl transition duration-300" :class="card.iconBg">
                  <UIcon :name="card.icon" class="h-5 w-5 transition duration-300" :class="card.iconColor" />
                </div>
                <div>
                  <p class="text-sm font-medium text-[var(--dashboard-ink)]">{{ card.label }}</p>
                  <p class="text-xs text-[var(--dashboard-muted)]">{{ card.caption }}</p>
                </div>
              </div>

              <div class="mt-4">
                <p class="text-3xl font-bold tracking-tight text-[var(--dashboard-ink)]">
                  {{ getAnimatedMetric(card.metricKey) }}
                </p>
              </div>
            </div>
          </div>

          <div
            id="dashboard-pipeline"
            class="dashboard-reveal rounded-[26px] p-1 transition duration-300 xl:grid xl:grid-cols-2 xl:gap-4"
            :class="[
              { 'is-visible': hasEntered },
              activeOverviewFocus === 'pipeline'
                ? 'bg-[rgba(79,124,255,0.08)] shadow-[0_18px_50px_-30px_rgba(79,124,255,0.6)]'
                : '',
            ]"
            :style="getRevealStyle(2)"
          >
            <section
              id="dashboard-job"
              class="dashboard-focus-ring rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition duration-300"
              :class="[
                activeOverviewFocus === 'job'
                  ? 'bg-[linear-gradient(135deg,#dfeeff_0%,#e7f0ff_100%)] shadow-[0_20px_55px_-35px_rgba(37,99,235,0.75)]'
                  : 'bg-[linear-gradient(135deg,#edf5ff_0%,#e7f0ff_100%)]',
              ]"
              tabindex="0"
              @mouseenter="setDashboardFocus('job')"
              @mouseleave="clearDashboardFocus('job')"
              @focus="setDashboardFocus('job')"
              @blur="clearDashboardFocus('job')"
            >
              <div class="flex items-start gap-4">
                <div class="flex items-start gap-4">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563eb] text-white shadow-sm transition duration-300">
                    <UIcon name="i-heroicons-briefcase" class="h-5 w-5" />
                  </div>

                  <div>
                    <h3 class="text-lg font-semibold text-[var(--dashboard-ink)] sm:text-xl">
                      Candidatures
                    </h3>
                    <p class="text-sm text-[var(--dashboard-muted)]">
                      {{ getAnimatedMetric('jobActiveCount') }} candidatures actives
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <article
                  v-for="stat in jobStats"
                  :key="stat.label"
                  class="dashboard-focus-ring rounded-2xl bg-white/92 p-4 text-left shadow-[0_16px_40px_-34px_rgba(37,99,235,0.6)] transition duration-300 hover:shadow-[0_18px_45px_-28px_rgba(37,99,235,0.45)]"
                >
                  <p class="text-sm text-[var(--dashboard-muted)]">{{ stat.label }}</p>
                  <p class="mt-1 text-3xl font-bold" :class="stat.color">
                    {{ getAnimatedMetric(stat.metricKey) }}
                  </p>
                </article>
              </div>
            </section>

            <section
              id="dashboard-freelance"
              class="dashboard-focus-ring mt-4 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition duration-300 xl:mt-0"
              :class="[
                activeOverviewFocus === 'freelance'
                  ? 'bg-[linear-gradient(135deg,#f8e9ff_0%,#f6ecff_100%)] shadow-[0_20px_55px_-35px_rgba(147,51,234,0.75)]'
                  : 'bg-[linear-gradient(135deg,#fbf3ff_0%,#f6ecff_100%)]',
              ]"
              tabindex="0"
              @mouseenter="setDashboardFocus('freelance')"
              @mouseleave="clearDashboardFocus('freelance')"
              @focus="setDashboardFocus('freelance')"
              @blur="clearDashboardFocus('freelance')"
            >
              <div class="flex items-start gap-4">
                <div class="flex items-start gap-4">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#9333ea] text-white shadow-sm transition duration-300">
                    <UIcon name="i-heroicons-computer-desktop" class="h-5 w-5" />
                  </div>

                  <div>
                    <h3 class="text-lg font-semibold text-[var(--dashboard-ink)] sm:text-xl">
                      Missions Freelance
                    </h3>
                    <p class="text-sm text-[var(--dashboard-muted)]">
                      {{ getAnimatedMetric('freelanceActiveCount') }} missions en cours
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <article
                  v-for="stat in freelanceStats"
                  :key="stat.label"
                  class="dashboard-focus-ring rounded-2xl bg-white/92 p-4 text-left shadow-[0_16px_40px_-34px_rgba(147,51,234,0.45)] transition duration-300 hover:shadow-[0_18px_45px_-28px_rgba(147,51,234,0.38)]"
                >
                  <p class="text-sm text-[var(--dashboard-muted)]">{{ stat.label }}</p>
                  <p class="mt-1 text-3xl font-bold" :class="stat.color">
                    {{ getAnimatedMetric(stat.metricKey) }}
                  </p>
                </article>
              </div>
            </section>
          </div>

          <div class="dashboard-reveal grid gap-4 xl:grid-cols-2" :class="{ 'is-visible': hasEntered }" :style="getRevealStyle(3)">
            <section class="rounded-2xl bg-white p-5 shadow-sm transition duration-300 hover:shadow-[0_18px_45px_-35px_rgba(79,124,255,0.45)]">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5edff] text-[#4f7cff]">
                  <UIcon name="i-heroicons-bolt" class="h-4 w-4" />
                </div>
                <h3 class="text-lg font-semibold text-[var(--dashboard-ink)]">Objectif mensuel</h3>
              </div>

              <p class="mt-5 text-4xl font-bold tracking-tight text-[var(--dashboard-ink)]">
                {{ getAnimatedMetric('monthlyGoalCurrent') }} / {{ dashboard.overview.monthlyGoalTarget }}
              </p>
              <p class="mt-1 text-sm text-[var(--dashboard-muted)]">Opportunites creees ce mois-ci</p>

              <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-[#4f7cff] to-[#7dd3fc] transition-[width] duration-700 ease-out"
                  :style="{ width: animatedMonthlyGoalProgress }"
                />
              </div>
            </section>

            <section class="rounded-2xl bg-white p-5 shadow-sm transition duration-300 hover:shadow-[0_18px_45px_-35px_rgba(34,197,94,0.3)]">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcfce7] text-[#22c55e]">
                  <UIcon name="i-heroicons-clock" class="h-4 w-4" />
                </div>
                <h3 class="text-lg font-semibold text-[var(--dashboard-ink)]">Reactivite moyenne</h3>
              </div>

              <p class="mt-5 text-4xl font-bold tracking-tight text-[var(--dashboard-ink)]">
                {{ averageFirstInterviewDelayLabel }}
              </p>
              <p class="mt-1 text-sm text-[var(--dashboard-muted)]">
                Delai moyen avant premier entretien
              </p>
            </section>
          </div>

          <div id="dashboard-timeline" class="dashboard-reveal grid gap-4 xl:grid-cols-2" :class="{ 'is-visible': hasEntered }" :style="getRevealStyle(4)">
            <section
              id="dashboard-activity"
              class="rounded-2xl bg-white p-5 shadow-sm transition duration-300"
              :class="activitySectionClass"
            >
              <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div class="flex items-center gap-2 text-[var(--dashboard-ink)]">
                  <UIcon name="i-heroicons-clock" class="h-4 w-4 text-[var(--dashboard-muted)]" />
                  <h3 class="whitespace-nowrap text-lg font-semibold">Activite recente</h3>
                </div>

                <div class="grid w-full grid-cols-3 gap-2 sm:max-w-[420px]">
                  <button
                    v-for="filter in activityFilters"
                    :key="filter.value"
                    type="button"
                    class="dashboard-focus-ring w-full min-w-0 rounded-full px-3 py-1.5 text-center text-xs font-semibold transition duration-200"
                    :class="activityFilter === filter.value
                      ? 'bg-[rgba(79,124,255,0.1)] text-[var(--dashboard-accent)] shadow-sm'
                      : 'bg-[rgba(15,23,42,0.04)] text-[var(--dashboard-muted)] hover:bg-[rgba(79,124,255,0.08)] hover:text-[var(--dashboard-accent)]'"
                    :aria-pressed="activityFilter === filter.value"
                    @click="activityFilter = filter.value"
                  >
                    {{ filter.label }}
                  </button>
                </div>
              </div>

              <TransitionGroup
                v-if="filteredRecentActivity.length > 0"
                name="dashboard-list"
                tag="div"
                class="mt-4 divide-y divide-[var(--dashboard-line)]"
              >
                <article
                  v-for="item in filteredRecentActivity"
                  :key="item.id"
                  class="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div
                    class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    :class="activityStyles[item.kind].iconBg"
                  >
                    <UIcon
                      :name="activityStyles[item.kind].icon"
                      class="h-4 w-4"
                      :class="activityStyles[item.kind].iconColor"
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-[var(--dashboard-ink)]">{{ item.title }}</p>
                    <p class="text-sm text-[var(--dashboard-muted)]">{{ item.company }}</p>
                    <p class="mt-1 text-xs text-[var(--dashboard-subtle)]">{{ item.date }}</p>
                  </div>
                </article>
              </TransitionGroup>

              <div
                v-else
                class="mt-4 rounded-2xl border border-dashed border-[var(--dashboard-line)] bg-slate-50 px-4 py-6 text-sm text-[var(--dashboard-muted)]"
              >
                {{ activityEmptyState }}
              </div>
            </section>

            <section
              id="dashboard-actions"
              class="rounded-2xl bg-white p-5 shadow-sm transition duration-300"
              :class="actionsSectionClass"
            >
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-2 text-[var(--dashboard-ink)]">
                  <UIcon name="i-heroicons-information-circle" class="h-4 w-4 text-[var(--dashboard-muted)]" />
                  <h3 class="text-lg font-semibold">Prochaines actions</h3>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="filter in actionFilters"
                    :key="filter.value"
                    type="button"
                    class="dashboard-focus-ring rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200"
                    :class="actionFilter === filter.value
                      ? 'bg-[#e0f2fe] text-[#0369a1] shadow-sm'
                      : 'bg-[rgba(15,23,42,0.04)] text-[var(--dashboard-muted)] hover:bg-[#e0f2fe] hover:text-[#0369a1]'"
                    :aria-pressed="actionFilter === filter.value"
                    @click="actionFilter = filter.value"
                  >
                    {{ filter.label }}
                  </button>
                </div>
              </div>

              <TransitionGroup
                v-if="filteredUpcomingActions.length > 0"
                name="dashboard-list"
                tag="div"
                class="mt-4 divide-y divide-[var(--dashboard-line)]"
              >
                <article
                  v-for="action in filteredUpcomingActions"
                  :key="action.id"
                  class="flex items-start gap-3 py-4 first:pt-0 last:pb-0 transition duration-200"
                >
                  <button
                    type="button"
                    class="dashboard-focus-ring mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-white transition duration-200"
                    :class="isActionChecked(action.id)
                      ? 'bg-[#ecfdf5] text-[#0f766e] shadow-[inset_0_0_0_1.5px_rgba(15,118,110,0.45)]'
                      : 'shadow-[inset_0_0_0_1px_rgba(203,213,225,0.7)] hover:bg-slate-50'"
                    :aria-pressed="isActionChecked(action.id)"
                    :aria-label="`${isActionChecked(action.id) ? 'Decocher' : 'Cocher'} l'action ${action.title}`"
                    @click="toggleActionChecked(action.id)"
                  >
                    <UIcon
                      v-if="isActionChecked(action.id)"
                      name="i-heroicons-check"
                      class="h-3.5 w-3.5"
                    />
                  </button>

                  <div class="min-w-0 flex-1">
                    <p
                      class="font-medium transition duration-200"
                      :class="isActionChecked(action.id)
                        ? 'text-[var(--dashboard-muted)] line-through'
                        : 'text-[var(--dashboard-ink)]'"
                    >
                      {{ action.title }}
                    </p>
                    <div class="mt-1 inline-flex flex-wrap items-center">
                      <span class="text-xs text-[var(--dashboard-subtle)]">{{ action.date }}</span>
                      <div
                        :class="[
                          'inline-flex flex-wrap items-center gap-2',
                          'ml-2.5',
                        ]"
                      >
                        <span
                          v-if="action.priority === 'Urgent'"
                          class="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          :class="[
                            priorityBadgeClass[action.priority],
                            isActionChecked(action.id) ? 'opacity-70' : '',
                          ]"
                        >
                          {{ action.priority }}
                        </span>
                        <span
                          v-if="isActionChecked(action.id)"
                          class="inline-flex items-center whitespace-nowrap rounded-full bg-[rgba(15,118,110,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[#0f766e]"
                        >
                          Termine
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </TransitionGroup>

              <div
                v-else
                class="mt-4 rounded-2xl border border-dashed border-[var(--dashboard-line)] bg-slate-50 px-4 py-6 text-sm text-[var(--dashboard-muted)]"
              >
                {{ actionEmptyState }}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { dashboardTabs } from '~/utils/dashboard-tabs'

type DashboardActivityKind = 'job' | 'freelance' | 'interview' | 'contact'
type DashboardActionPriority = 'Urgent' | 'Non urgent'
type OverviewFocus = 'pipeline' | 'contacts' | 'interviews' | 'job' | 'freelance'
type ActivityFilter = 'all' | DashboardActivityKind
type ActionFilter = 'all' | DashboardActionPriority

interface DashboardResponse {
  overview: {
    targetedCompanies: number
    activeContacts: number
    futureInterviews: number
    monthlyGoalCurrent: number
    monthlyGoalTarget: number
    averageFirstInterviewDelayDays: number | null
  }
  job: {
    activeCount: number
    stats: {
      sent: number
      interviews: number
      offers: number
      rejected: number
    }
  }
  freelance: {
    activeCount: number
    stats: {
      prospecting: number
      proposals: number
      negotiations: number
      won: number
    }
  }
  recentActivity: Array<{
    id: string
    title: string
    company: string
    date: string
    kind: DashboardActivityKind
  }>
  upcomingActions: Array<{
    id: string
    title: string
    date: string
    priority: DashboardActionPriority
  }>
}

// Le template peut s'afficher immediatement grace a une structure vide
// mais completement typee, meme avant la premiere reponse API.
const emptyDashboard: DashboardResponse = {
  overview: {
    targetedCompanies: 0,
    activeContacts: 0,
    futureInterviews: 0,
    monthlyGoalCurrent: 0,
    monthlyGoalTarget: 10,
    averageFirstInterviewDelayDays: null,
  },
  job: {
    activeCount: 0,
    stats: {
      sent: 0,
      interviews: 0,
      offers: 0,
      rejected: 0,
    },
  },
  freelance: {
    activeCount: 0,
    stats: {
      prospecting: 0,
      proposals: 0,
      negotiations: 0,
      won: 0,
    },
  },
  recentActivity: [],
  upcomingActions: [],
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const isSigningOut = ref(false)
const isManualRefreshing = ref(false)
const hasEntered = ref(false)
const prefersReducedMotion = ref(false)
const activeOverviewFocus = ref<OverviewFocus | null>(null)
const activityFilter = ref<ActivityFilter>('all')
const actionFilter = ref<ActionFilter>('all')
const checkedActionIds = ref<string[]>([])
const data = ref<DashboardResponse>(emptyDashboard)
const error = ref<unknown>(null)
const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const animatedMetrics = ref<Record<string, number>>({})

const animationFrameIds = new Map<string, number>()
let reducedMotionMediaQuery: MediaQueryList | null = null
let reducedMotionChangeHandler: ((event: MediaQueryListEvent) => void) | null = null
let revealAnimationFrame = 0

const tabs = computed(() =>
  dashboardTabs.map((tab) => ({
    ...tab,
    isActive: tab.activePaths.some((path) => route.path.startsWith(path)),
  })),
)

const activityStyles: Record<DashboardActivityKind, { icon: string, iconBg: string, iconColor: string }> = {
  job: {
    icon: 'i-heroicons-briefcase',
    iconBg: 'bg-[#e8f0ff]',
    iconColor: 'text-[#4f7cff]',
  },
  freelance: {
    icon: 'i-heroicons-computer-desktop',
    iconBg: 'bg-[#f3e8ff]',
    iconColor: 'text-[#9333ea]',
  },
  interview: {
    icon: 'i-heroicons-calendar-days',
    iconBg: 'bg-[#dcfce7]',
    iconColor: 'text-[#16a34a]',
  },
  contact: {
    icon: 'i-heroicons-user-group',
    iconBg: 'bg-[#ede9fe]',
    iconColor: 'text-[#7c3aed]',
  },
}

const priorityBadgeClass: Record<DashboardActionPriority, string> = {
  Urgent: 'bg-[#fee2e2] text-[#ef4444]',
  'Non urgent': 'bg-[#e0f2fe] text-[#0369a1]',
}

const activityFilters: Array<{ label: string, value: ActivityFilter }> = [
  { label: 'Tous', value: 'all' },
  { label: 'Candidatures', value: 'job' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Entretiens', value: 'interview' },
  { label: 'Contacts', value: 'contact' },
]

const actionFilters: Array<{ label: string, value: ActionFilter }> = [
  { label: 'Toutes', value: 'all' },
  { label: 'Urgent', value: 'Urgent' },
  { label: 'Non urgent', value: 'Non urgent' },
]

const dashboard = computed(() => data.value ?? emptyDashboard)
const dashboardError = computed(() => {
  if (!error.value) {
    return ''
  }

})

const overviewCards = computed(() => [
  {
    key: 'pipeline' as const,
    metricKey: 'targetedCompanies',
    label: 'Entreprises ciblees',
    caption: 'liees a vos opportunites',
    icon: 'i-heroicons-building-office-2',
    iconBg: activeOverviewFocus.value === 'pipeline' ? 'bg-blue-100' : 'bg-blue-50',
    iconColor: activeOverviewFocus.value === 'pipeline' ? 'text-blue-700' : 'text-blue-600',
  },
  {
    key: 'contacts' as const,
    metricKey: 'activeContacts',
    label: 'Contacts',
    caption: 'dans votre reseau',
    icon: 'i-heroicons-user-group',
    iconBg: activeOverviewFocus.value === 'contacts' ? 'bg-violet-100' : 'bg-violet-50',
    iconColor: activeOverviewFocus.value === 'contacts' ? 'text-violet-700' : 'text-violet-600',
  },
  {
    key: 'interviews' as const,
    metricKey: 'futureInterviews',
    label: 'Entretiens a venir',
    caption: 'a venir',
    icon: 'i-heroicons-calendar-days',
    iconBg: activeOverviewFocus.value === 'interviews' ? 'bg-emerald-100' : 'bg-emerald-50',
    iconColor: activeOverviewFocus.value === 'interviews' ? 'text-emerald-700' : 'text-emerald-600',
  },
])

const jobStats = computed(() => [
  { label: 'Envoyees', value: dashboard.value.job.stats.sent, color: 'text-[#2563eb]', metricKey: 'jobSent' },
  { label: 'Entretiens', value: dashboard.value.job.stats.interviews, color: 'text-[#f59e0b]', metricKey: 'jobInterviews' },
  { label: 'Offres', value: dashboard.value.job.stats.offers, color: 'text-[#16a34a]', metricKey: 'jobOffers' },
  { label: 'Refusees', value: dashboard.value.job.stats.rejected, color: 'text-[#ef4444]', metricKey: 'jobRejected' },
])

const freelanceStats = computed(() => [
  { label: 'Prospection', value: dashboard.value.freelance.stats.prospecting, color: 'text-[#334155]', metricKey: 'freelanceProspecting' },
  { label: 'Propositions', value: dashboard.value.freelance.stats.proposals, color: 'text-[#2563eb]', metricKey: 'freelanceProposals' },
  { label: 'Negociations', value: dashboard.value.freelance.stats.negotiations, color: 'text-[#f59e0b]', metricKey: 'freelanceNegotiations' },
  { label: 'Acceptées', value: dashboard.value.freelance.stats.won, color: 'text-[#16a34a]', metricKey: 'freelanceWon' },
])

const monthlyGoalProgressTarget = computed(() => {
  const target = dashboard.value.overview.monthlyGoalTarget || 1
  const progress = Math.min(100, Math.round((dashboard.value.overview.monthlyGoalCurrent / target) * 100))

  return progress
})

const animatedMonthlyGoalProgress = computed(() => `${getAnimatedMetric('monthlyGoalProgress')}%`)

const averageFirstInterviewDelayLabel = computed(() => {
  const value = dashboard.value.overview.averageFirstInterviewDelayDays

  if (value === null) {
    return '-'
  }

  return `${getAnimatedMetric('averageFirstInterviewDelayDays')} jours`
})

const recentActivity = computed(() => dashboard.value.recentActivity)
const upcomingActions = computed(() => dashboard.value.upcomingActions)

const filteredRecentActivity = computed(() => {
  if (activityFilter.value === 'all') {
    return recentActivity.value
  }

  return recentActivity.value.filter(item => item.kind === activityFilter.value)
})

const filteredUpcomingActions = computed(() => {
  if (actionFilter.value === 'all') {
    return upcomingActions.value
  }

  return upcomingActions.value.filter(action => action.priority === actionFilter.value)
})

const activityEmptyState = computed(() => {
  if (recentActivity.value.length === 0) {
    return 'Aucune activite enregistree pour le moment.'
  }

  return 'Aucune activite ne correspond au filtre selectionne.'
})

const actionEmptyState = computed(() => {
  if (upcomingActions.value.length === 0) {
    return 'Aucune action imminente. Vos opportunites sont a jour.'
  }

  return 'Aucune action ne correspond au filtre selectionne.'
})

const activitySectionClass = computed(() => {
  if (activeOverviewFocus.value === 'contacts' || activeOverviewFocus.value === 'interviews') {
    return 'bg-[linear-gradient(180deg,rgba(79,124,255,0.04)_0%,#ffffff_100%)] shadow-[0_20px_60px_-40px_rgba(79,124,255,0.65)]'
  }

  return 'hover:shadow-[0_18px_45px_-35px_rgba(79,124,255,0.28)]'
})

const actionsSectionClass = computed(() => {
  if (activeOverviewFocus.value === 'interviews') {
    return 'bg-[linear-gradient(180deg,rgba(34,197,94,0.04)_0%,#ffffff_100%)] shadow-[0_20px_60px_-40px_rgba(34,197,94,0.55)]'
  }

  return 'hover:shadow-[0_18px_45px_-35px_rgba(3,105,161,0.24)]'
})

const currentUserKey = computed(() => user.value?.id ?? user.value?.sub ?? user.value?.email ?? '')
// On sauvegarde les cases cochees du dashboard par utilisateur dans le navigateur.
const actionStorageKey = computed(() =>
  currentUserKey.value.length > 0
    ? `dashboard-checked-actions:${currentUserKey.value}`
    : 'dashboard-checked-actions:anonymous',
)

const userDisplayName = computed(() => {
  const firstName = user.value?.user_metadata?.firstName

  if (typeof firstName === 'string' && firstName.trim().length > 0) {
    return firstName
  }

  return user.value?.email ?? 'utilisateur inconnu'
})

const getRevealStyle = (index: number) => {
  if (prefersReducedMotion.value) {
    return {}
  }

  return {
    transitionDelay: `${index * 90}ms`,
  }
}

const cardButtonClass = (key: OverviewFocus) => {
  if (activeOverviewFocus.value === key) {
    return 'bg-[linear-gradient(180deg,rgba(79,124,255,0.08)_0%,#ffffff_100%)] shadow-[0_18px_45px_-32px_rgba(79,124,255,0.5)]'
  }

  return 'hover:bg-[linear-gradient(180deg,rgba(79,124,255,0.04)_0%,#ffffff_100%)] hover:shadow-[0_16px_40px_-30px_rgba(79,124,255,0.35)]'
}

const getAnimatedMetric = (key: string) => Math.round(animatedMetrics.value[key] ?? 0)

const isActionChecked = (actionId: string) => checkedActionIds.value.includes(actionId)

const persistCheckedActions = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(actionStorageKey.value, JSON.stringify(checkedActionIds.value))
}

const loadCheckedActions = () => {
  if (typeof window === 'undefined') {
    return
  }

  const rawValue = window.localStorage.getItem(actionStorageKey.value)

  if (!rawValue) {
    checkedActionIds.value = []
    return
  }

  try {
    const parsedValue = JSON.parse(rawValue)
    checkedActionIds.value = Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    checkedActionIds.value = []
  }
}

const toggleActionChecked = (actionId: string) => {
  checkedActionIds.value = isActionChecked(actionId)
    ? checkedActionIds.value.filter(id => id !== actionId)
    : [...checkedActionIds.value, actionId]
}

const cancelMetricAnimation = (key: string) => {
  const frameId = animationFrameIds.get(key)

  if (frameId) {
    cancelAnimationFrame(frameId)
    animationFrameIds.delete(key)
  }
}

const animateMetric = (key: string, target: number) => {
  cancelMetricAnimation(key)

  if (typeof window === 'undefined' || prefersReducedMotion.value) {
    animatedMetrics.value = {
      ...animatedMetrics.value,
      [key]: target,
    }
    return
  }

  const startValue = animatedMetrics.value[key] ?? 0
  const startTime = performance.now()
  const duration = 700

  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration)
    const easedProgress = 1 - (1 - progress) * (1 - progress)

    animatedMetrics.value = {
      ...animatedMetrics.value,
      [key]: startValue + (target - startValue) * easedProgress,
    }

    if (progress < 1) {
      const frameId = requestAnimationFrame(step)
      animationFrameIds.set(key, frameId)
      return
    }

    animationFrameIds.delete(key)
    animatedMetrics.value = {
      ...animatedMetrics.value,
      [key]: target,
    }
  }

  const frameId = requestAnimationFrame(step)
  animationFrameIds.set(key, frameId)
}

const animateDashboardMetrics = () => {
  animateMetric('targetedCompanies', dashboard.value.overview.targetedCompanies)
  animateMetric('activeContacts', dashboard.value.overview.activeContacts)
  animateMetric('futureInterviews', dashboard.value.overview.futureInterviews)
  animateMetric('monthlyGoalCurrent', dashboard.value.overview.monthlyGoalCurrent)
  animateMetric('monthlyGoalProgress', monthlyGoalProgressTarget.value)
  animateMetric('jobActiveCount', dashboard.value.job.activeCount)
  animateMetric('jobSent', dashboard.value.job.stats.sent)
  animateMetric('jobInterviews', dashboard.value.job.stats.interviews)
  animateMetric('jobOffers', dashboard.value.job.stats.offers)
  animateMetric('jobRejected', dashboard.value.job.stats.rejected)
  animateMetric('freelanceActiveCount', dashboard.value.freelance.activeCount)
  animateMetric('freelanceProspecting', dashboard.value.freelance.stats.prospecting)
  animateMetric('freelanceProposals', dashboard.value.freelance.stats.proposals)
  animateMetric('freelanceNegotiations', dashboard.value.freelance.stats.negotiations)
  animateMetric('freelanceWon', dashboard.value.freelance.stats.won)
  animateMetric('averageFirstInterviewDelayDays', dashboard.value.overview.averageFirstInterviewDelayDays ?? 0)
}

const setDashboardFocus = (focus: OverviewFocus) => {
  activeOverviewFocus.value = focus
}

const clearDashboardFocus = (focus: OverviewFocus) => {
  if (activeOverviewFocus.value === focus) {
    activeOverviewFocus.value = null
  }
}

const loadDashboard = async () => {
  if (!user.value) {
    data.value = emptyDashboard
    error.value = null
    status.value = 'idle'
    return
  }

  status.value = 'pending'

  try {
    // Chaque chargement repart de la session Supabase courante pour recuperer
    // un token frais avant d'appeler l'API Nitro protegee.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      data.value = emptyDashboard
      error.value = null
      status.value = 'idle'
      return
    }

    data.value = await $fetch<DashboardResponse>('/api/dashboard', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    error.value = null
    status.value = 'success'
  } catch (loadError) {
    console.error('Erreur lors du chargement du dashboard :', loadError)

    data.value = emptyDashboard
    error.value = loadError
    status.value = 'error'
  }
}

const handleManualRefresh = async () => {
  try {
    isManualRefreshing.value = true
    await loadDashboard()
  } finally {
    isManualRefreshing.value = false
  }
}

watch(currentUserKey, () => {
  loadDashboard()
}, { immediate: true })

watch(data, () => {
  animateDashboardMetrics()
}, { immediate: true })

watch(prefersReducedMotion, () => {
  animateDashboardMetrics()
})

watch(currentUserKey, () => {
  loadCheckedActions()
}, { immediate: true })

watch(checkedActionIds, () => {
  persistCheckedActions()
}, { deep: true })

watch(upcomingActions, (actions) => {
  const validActionIds = new Set(actions.map(action => action.id))
  checkedActionIds.value = checkedActionIds.value.filter(actionId => validActionIds.has(actionId))
})

const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.access_token) {
    data.value = emptyDashboard
    error.value = null
    status.value = 'idle'
    return
  }

  loadDashboard()
})

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  // Les animations et localStorage n'existent que dans le navigateur.
  loadCheckedActions()

  reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = reducedMotionMediaQuery.matches

  reducedMotionChangeHandler = (event: MediaQueryListEvent) => {
    prefersReducedMotion.value = event.matches
  }

  reducedMotionMediaQuery.addEventListener('change', reducedMotionChangeHandler)

  revealAnimationFrame = requestAnimationFrame(() => {
    hasEntered.value = true
  })
})

onBeforeUnmount(() => {
  authListener.subscription.unsubscribe()

  cancelAnimationFrame(revealAnimationFrame)

  if (reducedMotionMediaQuery && reducedMotionChangeHandler) {
    reducedMotionMediaQuery.removeEventListener('change', reducedMotionChangeHandler)
  }

  for (const key of animationFrameIds.keys()) {
    cancelMetricAnimation(key)
  }
})

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

<style scoped>
.dashboard-reveal {
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity 420ms ease,
    transform 420ms ease;
}

.dashboard-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.dashboard-focus-ring:focus-visible {
  outline: 3px solid rgba(79, 124, 255, 0.35);
  outline-offset: 3px;
}

.dashboard-list-enter-active,
.dashboard-list-leave-active,
.dashboard-list-move {
  transition: all 240ms ease;
}

.dashboard-list-enter-from,
.dashboard-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-reveal,
  .dashboard-reveal.is-visible,
  .dashboard-list-enter-active,
  .dashboard-list-leave-active,
  .dashboard-list-move {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
