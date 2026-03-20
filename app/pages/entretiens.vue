<template>
  <div class="dashboard-shell min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 class="dashboard-tight-title text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Plateforme de Suivi de Prospection
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            Gerez vos recherches d'emploi et missions freelance
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
          <div class="flex flex-col gap-4 border-b border-[var(--dashboard-line)] pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-2xl font-bold tracking-tight text-[var(--dashboard-ink)] sm:text-3xl">
                Entretiens
              </h2>
              <p class="mt-1 text-sm text-[var(--dashboard-muted)]">
                {{ upcomingInterviewsLabel }}
              </p>
            </div>

            <div class="flex flex-col items-start gap-3 sm:items-end">
              <UButton
                color="primary"
                icon="i-heroicons-plus"
                class="rounded-xl px-4"
                :disabled="data.applications.length === 0"
                @click="openCreateEditor"
              >
                Nouvel entretien
              </UButton>

              <div class="flex items-center gap-2 text-sm text-[var(--dashboard-muted)]">
                <UIcon
                  v-if="isPagePending"
                  name="i-heroicons-arrow-path"
                  class="h-4 w-4 animate-spin"
                />
                <span>{{ pageStatusText }}</span>
              </div>
            </div>
          </div>

          <UAlert
            v-if="pageError"
            color="error"
            variant="subtle"
            class="mt-5"
            title="Impossible de charger les entretiens."
            :description="pageError"
          />

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <article
              v-for="card in summaryCards"
              :key="card.label"
              class="rounded-[22px] border px-5 py-4 shadow-sm"
              :class="card.className"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm" :class="card.iconBg">
                  <UIcon :name="card.icon" class="h-5 w-5" />
                </div>
                <div>
                  <p class="text-lg font-semibold text-[var(--dashboard-ink)]">{{ card.label }}</p>
                  <p class="text-sm text-[var(--dashboard-muted)]">{{ card.caption }}</p>
                </div>
              </div>
              <p class="dashboard-stat-value mt-4 text-3xl font-bold tracking-tight text-[var(--dashboard-ink)] sm:text-4xl">{{ card.value }}</p>
            </article>
          </div>

          <section class="mt-6 rounded-[22px] border border-[var(--dashboard-line)] bg-slate-50/80 p-4">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-calendar" class="h-5 w-5 text-[var(--dashboard-accent)]" />
                  <h3 class="text-lg font-semibold text-[var(--dashboard-ink)]">Google Calendar</h3>
                </div>
                <p class="mt-1 text-sm text-[var(--dashboard-muted)]">
                  {{ !isGoogleCalendarAvailable
                    ? 'Google Calendar sera disponible une fois la migration Prisma appliquee.'
                    : !isGoogleCalendarConfigured
                      ? 'Ajoutez la configuration OAuth Google pour activer la connexion Calendar.'
                      : isGoogleCalendarConnected
                      ? 'Votre compte Google est connecte. Vous pouvez exporter chaque entretien a venir.'
                      : 'Connectez votre compte Google pour envoyer vos entretiens dans votre agenda.' }}
                </p>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row">
                <UButton
                  v-if="isGoogleCalendarAvailable && isGoogleCalendarConfigured && !isGoogleCalendarConnected"
                  color="primary"
                  icon="i-heroicons-link"
                  class="rounded-xl"
                  :loading="isManagingCalendarConnection"
                  @click="connectGoogleCalendar"
                >
                  Connecter Google Calendar
                </UButton>

                <UButton
                  v-else-if="isGoogleCalendarConnected"
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-link-slash"
                  class="rounded-xl"
                  :loading="isManagingCalendarConnection"
                  @click="disconnectGoogleCalendar"
                >
                  Deconnecter
                </UButton>

                <div
                  v-else-if="!isGoogleCalendarAvailable"
                  class="inline-flex items-center rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700"
                >
                  Connectez-vous à votre compte Google pour synchroniser vos entretiens
                </div>

                <div
                  v-else
                  class="inline-flex items-center rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700"
                >
                  Configuration Google requise
                </div>
              </div>
            </div>
          </section>

          <section class="mt-8">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-calendar-days" class="h-5 w-5 text-[var(--dashboard-accent)]" />
              <h3 class="text-xl font-semibold text-[var(--dashboard-ink)]">Entretiens a venir</h3>
            </div>

            <div v-if="upcomingInterviews.length > 0" class="mt-4 space-y-4">
              <article
                v-for="interview in upcomingInterviews"
                :key="interview.id"
                class="rounded-[22px] border border-[#f6d869] bg-white p-4 shadow-[0_20px_40px_-36px_rgba(234,179,8,0.6)]"
              >
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-3">
                        <div class="flex items-center gap-2">
                          <UIcon name="i-heroicons-building-office-2" class="h-5 w-5 text-[var(--dashboard-subtle)]" />
                          <p class="text-xl font-semibold text-[var(--dashboard-ink)]">
                            {{ interview.companyName }}
                          </p>
                        </div>

                        <span
                          class="rounded-full px-3 py-1 text-xs font-semibold"
                          :class="typeBadgeClass[normalizeInterviewType(interview.type)] ?? defaultTypeBadgeClass"
                        >
                          {{ formatInterviewType(interview.type) }}
                        </span>
                      </div>

                      <p class="mt-2 text-base text-[var(--dashboard-muted)]">
                        {{ interview.position }}
                      </p>
                    </div>

                    <div class="flex flex-wrap items-center justify-end gap-1 self-start lg:self-start">
                      <UButton
                        color="primary"
                        variant="soft"
                        icon="i-heroicons-calendar"
                        class="rounded-lg"
                        :loading="syncingCalendarId === interview.id"
                        :disabled="isSubmitting || deletingId === interview.id || !isGoogleCalendarAvailable || !isGoogleCalendarConfigured || !isGoogleCalendarConnected"
                        @click="syncInterviewToGoogleCalendar(interview)"
                      >
                        {{ interview.googleCalendarEventUrl ? 'Mettre a jour Agenda' : 'Ajouter a Agenda' }}
                      </UButton>
                      <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-pencil-square"
                        class="rounded-lg"
                        :disabled="isSubmitting || Boolean(deletingId)"
                        @click="openEditEditor(interview)"
                      />
                      <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-trash"
                        class="rounded-lg"
                        :loading="deletingId === interview.id"
                        :disabled="isSubmitting"
                        @click="deleteInterview(interview)"
                      />
                    </div>
                  </div>

                  <div class="grid gap-3 text-sm text-[var(--dashboard-muted)] md:grid-cols-3">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-heroicons-calendar-days" class="h-4 w-4 text-[var(--dashboard-accent)]" />
                      <span class="dashboard-break-text">{{ formatDate(interview.scheduledAt) }}</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <UIcon name="i-heroicons-clock" class="h-4 w-4 text-[var(--dashboard-accent)]" />
                      <span class="dashboard-break-text">{{ formatTime(interview.scheduledAt) }}</span>
                    </div>

                    <div v-if="interview.primaryContact" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-user" class="h-4 w-4 text-[#a855f7]" />
                      <span class="dashboard-break-text">
                        {{ interview.primaryContact.name }}
                        <template v-if="interview.primaryContact.role">
                          - {{ interview.primaryContact.role }}
                        </template>
                      </span>
                    </div>
                  </div>

                  <div class="rounded-2xl bg-[#eef5ff] px-4 py-3 text-sm text-[var(--dashboard-muted)]">
                    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-accent)]">
                      Preparation
                    </p>
                    <p class="mt-2">
                      {{ interview.notes || defaultPreparationText(interview) }}
                    </p>
                  </div>

                  <div
                    v-if="interview.googleCalendarEventUrl"
                    class="flex flex-col gap-2 rounded-2xl border border-[#dbeafe] bg-white px-4 py-3 text-sm text-[var(--dashboard-muted)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p class="font-medium text-[var(--dashboard-ink)]">Synchronise avec Google Calendar</p>
                      <p v-if="interview.googleCalendarSyncedAt" class="mt-1">
                        Derniere synchro le {{ formatSyncDateTime(interview.googleCalendarSyncedAt) }}
                      </p>
                    </div>

                    <a
                      :href="interview.googleCalendarEventUrl"
                      target="_blank"
                      rel="noreferrer"
                      class="inline-flex items-center gap-2 text-[var(--dashboard-accent)] hover:opacity-80"
                    >
                      <UIcon name="i-heroicons-arrow-top-right-on-square" class="h-4 w-4" />
                      Ouvrir dans Google Calendar
                    </a>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-else
              class="mt-4 rounded-[18px] border border-dashed border-[var(--dashboard-line)] bg-slate-50 px-5 py-8 text-center text-sm text-[var(--dashboard-muted)]"
            >
              Aucun entretien a venir pour le moment.
            </div>
          </section>

          <section v-if="completedInterviews.length > 0" class="mt-8">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-badge" class="h-5 w-5 text-[#16a34a]" />
              <h3 class="text-xl font-semibold text-[var(--dashboard-ink)]">Entretiens passes</h3>
            </div>

            <div class="mt-4 grid gap-4 xl:grid-cols-2">
              <article
                v-for="interview in completedInterviews"
                :key="interview.id"
                class="rounded-[22px] border border-[#bbf7d0] bg-white p-4 shadow-[0_16px_36px_-34px_rgba(34,197,94,0.45)]"
              >
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-3">
                        <p class="text-lg font-semibold text-[var(--dashboard-ink)]">
                          {{ interview.companyName }}
                        </p>
                        <span
                          class="rounded-full px-3 py-1 text-xs font-semibold"
                          :class="typeBadgeClass[normalizeInterviewType(interview.type)] ?? defaultTypeBadgeClass"
                        >
                          {{ formatInterviewType(interview.type) }}
                        </span>
                      </div>
                      <p class="mt-1 text-sm text-[var(--dashboard-muted)]">{{ interview.position }}</p>
                    </div>

                    <div class="flex items-center gap-2 self-start">
                      <p class="text-sm text-[var(--dashboard-subtle)]">{{ formatDateTime(interview.scheduledAt) }}</p>
                      <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-pencil-square"
                        class="rounded-lg"
                        :disabled="isSubmittingFeedback && editingFeedbackId !== interview.id"
                        @click="openFeedbackEditor(interview)"
                      >
                        {{ editingFeedbackId === interview.id ? 'Edition en cours' : 'Modifier' }}
                      </UButton>
                    </div>
                  </div>

                  <div class="rounded-2xl bg-[#ecfdf5] px-4 py-3 text-sm text-[var(--dashboard-muted)]">
                    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#15803d]">Feedback</p>

                    <template v-if="editingFeedbackId === interview.id">
                      <textarea
                        v-model="feedbackDraft"
                        rows="4"
                        class="mt-2 w-full rounded-2xl border border-[#bbf7d0] bg-white px-3 py-3 text-sm text-[var(--dashboard-ink)] outline-none transition focus:border-[#22c55e] focus:ring-2 focus:ring-[#dcfce7]"
                        placeholder="Ajoutez votre retour post-entretien, ressenti, prochaines etapes..."
                      />

                      <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <UButton
                          color="neutral"
                          variant="outline"
                          class="rounded-xl"
                          :disabled="isSubmittingFeedback"
                          @click="cancelFeedbackEditor"
                        >
                          Annuler
                        </UButton>
                        <UButton
                          color="success"
                          class="rounded-xl px-4"
                          :loading="isSubmittingFeedback"
                          @click="saveFeedback(interview)"
                        >
                          Enregistrer le feedback
                        </UButton>
                      </div>
                    </template>

                    <p v-else class="mt-2">
                      {{ interview.feedback || interview.notes || 'Aucun retour renseigne pour cet entretien.' }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <div
            v-if="data.interviews.length === 0 && !isPagePending && !pageError"
            class="mt-6 rounded-[18px] border border-dashed border-[var(--dashboard-line)] bg-slate-50 px-5 py-10 text-center text-sm text-[var(--dashboard-muted)]"
          >
            <p>Aucun entretien enregistre pour le moment.</p>
            <p class="mt-1">Ajoutez un entretien depuis une candidature pour commencer votre suivi.</p>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="isEditorOpen"
      class="dashboard-modal-overlay fixed inset-0 z-50 flex justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm"
    >
      <div class="dashboard-modal-panel max-h-[92vh] w-full overflow-y-auto rounded-[28px] border border-white/10 bg-white shadow-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-[var(--dashboard-line)] px-5 py-4 sm:px-6">
          <div>
            <h3 class="text-2xl font-bold text-[var(--dashboard-ink)]">
              {{ editorTitle }}
            </h3>
            <p class="mt-1 text-sm text-[var(--dashboard-muted)]">
              Planifiez vos entretiens, anticipez votre preparation et conservez vos retours.
            </p>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            class="rounded-full"
            :disabled="isSubmitting"
            @click="closeEditor"
          />
        </div>

        <form class="space-y-5 px-5 py-5 sm:px-6" @submit.prevent="submitInterview">
          <UAlert
            v-if="formError"
            color="error"
            variant="subtle"
            :title="formError"
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Candidature liee" name="applicationId" required>
              <select
                v-model="form.applicationId"
                class="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2.5 text-sm text-[var(--dashboard-ink)] outline-none transition focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[#dbeafe]"
              >
                <option disabled value="">
                  Selectionner une candidature
                </option>
                <option v-for="application in data.applications" :key="application.id" :value="application.id">
                  {{ application.companyName }} · {{ application.position }}
                </option>
              </select>
            </UFormField>

            <UFormField label="Type d'entretien" name="type" required>
              <select
                v-model="form.type"
                class="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2.5 text-sm text-[var(--dashboard-ink)] outline-none transition focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[#dbeafe]"
              >
                <option v-for="option in interviewTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Date et heure" name="scheduledAt" required>
              <UInput
                v-model="form.scheduledAt"
                type="datetime-local"
                icon="i-heroicons-calendar-days"
                class="mt-2"
              />
            </UFormField>

            <UFormField label="Candidature selectionnee" name="applicationPreview">
              <div class="mt-2 rounded-2xl border border-[var(--dashboard-line)] bg-slate-50 px-4 py-3 text-sm text-[var(--dashboard-muted)]">
                {{ selectedApplicationLabel }}
              </div>
            </UFormField>
          </div>

          <UFormField label="Preparation" name="notes">
            <textarea
              v-model="form.notes"
              rows="4"
              class="mt-2 w-full rounded-2xl border border-[var(--dashboard-line)] bg-white px-3 py-3 text-sm text-[var(--dashboard-ink)] outline-none transition focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[#dbeafe]"
              placeholder="Ex. revoir le portfolio, preparer des cas concrets, anticiper les questions..."
            />
          </UFormField>

          <UFormField v-if="editorMode === 'edit'" label="Feedback" name="feedback">
            <textarea
              v-model="form.feedback"
              rows="4"
              class="mt-2 w-full rounded-2xl border border-[var(--dashboard-line)] bg-white px-3 py-3 text-sm text-[var(--dashboard-ink)] outline-none transition focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[#dbeafe]"
              placeholder="Retour post-entretien, ressenti, prochaines etapes..."
            />
          </UFormField>

          <div class="flex flex-col-reverse gap-3 border-t border-[var(--dashboard-line)] pt-5 sm:flex-row sm:justify-end">
            <UButton
              color="neutral"
              variant="outline"
              class="rounded-xl"
              :disabled="isSubmitting"
              @click="closeEditor"
            >
              Annuler
            </UButton>
            <UButton
              type="submit"
              color="primary"
              class="rounded-xl px-5"
              :loading="isSubmitting"
            >
              {{ submitLabel }}
            </UButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import { dashboardTabs } from '~/utils/dashboard-tabs'

type EditorMode = 'create' | 'edit'
type InterviewTypeKey = 'rh' | 'visioconference' | 'technique' | 'managerial' | 'final'

interface InterviewsResponse {
  calendarConnection: {
    isAvailable: boolean
    isConfigured: boolean
    isConnected: boolean
  }
  summary: {
    totalCount: number
    upcomingCount: number
    completedCount: number
    companyCount: number
  }
  applications: Array<{
    id: string
    companyName: string
    position: string
    status: string
  }>
  interviews: Array<{
    id: string
    applicationId: string
    companyName: string
    companyWebsite: string | null
    companyLinkedin: string | null
    position: string
    applicationStatus: string
    type: string
    scheduledAt: string
    notes: string | null
    feedback: string | null
    googleCalendarEventUrl: string | null
    googleCalendarSyncedAt: string | null
    isUpcoming: boolean
    primaryContact: {
      id: string
      name: string
      role: string | null
      email: string | null
      linkedin: string | null
    } | null
  }>
}

type InterviewItem = InterviewsResponse['interviews'][number]

type InterviewForm = {
  applicationId: string
  type: string
  scheduledAt: string
  notes: string
  feedback: string
}

const interviewTypeOptions = [
  { value: 'RH', label: 'RH' },
  { value: 'visioconference', label: 'Visioconference' },
  { value: 'technique', label: 'Technique' },
  { value: 'managerial', label: 'Managerial' },
  { value: 'final', label: 'Final' },
] as const

const emptyData: InterviewsResponse = {
  calendarConnection: {
    isAvailable: false,
    isConfigured: false,
    isConnected: false,
  },
  summary: {
    totalCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    companyCount: 0,
  },
  applications: [],
  interviews: [],
}

const createEmptyForm = (): InterviewForm => ({
  applicationId: '',
  type: interviewTypeOptions[0].value,
  scheduledAt: '',
  notes: '',
  feedback: '',
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const toast = useToast()
const isSigningOut = ref(false)

const data = ref<InterviewsResponse>(emptyData)
const error = ref<unknown>(null)
const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const isSubmitting = ref(false)
const isSubmittingFeedback = ref(false)
const syncingCalendarId = ref<string | null>(null)
const isManagingCalendarConnection = ref(false)
const deletingId = ref<string | null>(null)
const isEditorOpen = ref(false)
const editorMode = ref<EditorMode>('create')
const editingInterviewId = ref('')
const editingFeedbackId = ref('')
const feedbackDraft = ref('')
const formError = ref('')
const form = reactive<InterviewForm>(createEmptyForm())

const tabs = computed(() =>
  dashboardTabs.map((tab) => ({
    ...tab,
    isActive: tab.activePaths.includes(route.path),
  })),
)

const currentUserKey = computed(() => user.value?.id ?? user.value?.sub ?? user.value?.email ?? '')
const isPagePending = computed(() => status.value === 'pending')
const pageError = computed(() => error.value ? 'Verifiez la connexion Supabase et rechargez la page.' : '')
const pageStatusText = computed(() => {
  if (isPagePending.value) {
    return 'Actualisation des entretiens...'
  }

  if (pageError.value) {
    return 'Synchronisation indisponible'
  }

  if (!data.value.calendarConnection.isAvailable) {
    return 'Google Calendar indisponible tant que la migration Prisma n est pas appliquee'
  }

  if (!data.value.calendarConnection.isConfigured) {
    return 'Configuration Google Calendar manquante'
  }

  if (data.value.applications.length === 0) {
    return 'Ajoutez d\'abord une candidature pour planifier un entretien'
  }

  if (!data.value.calendarConnection.isConnected) {
    return 'Connectez Google Calendar pour synchroniser vos entretiens'
  }

  return 'Entretiens synchronises'
})

const upcomingInterviewsLabel = computed(() => `${data.value.summary.upcomingCount} entretien(s) a venir`)
const summaryCards = computed(() => [
  {
    label: 'A venir',
    value: data.value.summary.upcomingCount,
    caption: 'Entretiens planifies',
    icon: 'i-heroicons-calendar-days',
    iconBg: 'bg-[#d97706]',
    className: 'border-[#f7df8a] bg-[linear-gradient(135deg,#fff8db_0%,#fffdf0_100%)]',
  },
  {
    label: 'Termines',
    value: data.value.summary.completedCount,
    caption: 'Entretiens passes',
    icon: 'i-heroicons-check-circle',
    iconBg: 'bg-[#22c55e]',
    className: 'border-[#bbf7d0] bg-[linear-gradient(135deg,#ecfdf5_0%,#f3fff8_100%)]',
  },
])

const editorTitle = computed(() =>
  editorMode.value === 'create' ? 'Nouvel entretien' : 'Modifier l\'entretien',
)
const submitLabel = computed(() =>
  editorMode.value === 'create' ? 'Creer l\'entretien' : 'Enregistrer les modifications',
)

const upcomingInterviews = computed(() =>
  data.value.interviews.filter(interview => interview.isUpcoming),
)
const completedInterviews = computed(() =>
  [...data.value.interviews]
    .filter(interview => !interview.isUpcoming)
    .sort((left, right) => new Date(right.scheduledAt).getTime() - new Date(left.scheduledAt).getTime()),
)

const selectedApplication = computed(() =>
  data.value.applications.find(application => application.id === form.applicationId) ?? null,
)
const selectedApplicationLabel = computed(() => {
  if (!selectedApplication.value) {
    return 'Selectionnez une candidature pour associer l\'entretien a une entreprise et un poste.'
  }

  return `${selectedApplication.value.companyName} · ${selectedApplication.value.position}`
})

const userDisplayName = computed(() => {
  const firstName = user.value?.user_metadata?.firstName

  if (typeof firstName === 'string' && firstName.trim().length > 0) {
    return firstName
  }

  return user.value?.email ?? 'utilisateur inconnu'
})

const isGoogleCalendarAvailable = computed(() => data.value.calendarConnection.isAvailable)
const isGoogleCalendarConfigured = computed(() => data.value.calendarConnection.isConfigured)
const isGoogleCalendarConnected = computed(() => data.value.calendarConnection.isConnected)

const typeBadgeClass: Record<InterviewTypeKey, string> = {
  rh: 'bg-[#dbeafe] text-[#2563eb]',
  visioconference: 'bg-[#f3e8ff] text-[#9333ea]',
  technique: 'bg-[#ffedd5] text-[#ea580c]',
  managerial: 'bg-[#dcfce7] text-[#15803d]',
  final: 'bg-[#fee2e2] text-[#dc2626]',
}

const defaultTypeBadgeClass = 'bg-slate-100 text-slate-600'

const normalizeInterviewType = (value: string): InterviewTypeKey => {
  const normalizedValue = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  if (normalizedValue.includes('visio')) {
    return 'visioconference'
  }

  if (normalizedValue.includes('tech')) {
    return 'technique'
  }

  if (normalizedValue.includes('manag')) {
    return 'managerial'
  }

  if (normalizedValue.includes('final')) {
    return 'final'
  }

  return 'rh'
}

const formatInterviewType = (value: string) => {
  const typeKey = normalizeInterviewType(value)

  switch (typeKey) {
    case 'visioconference':
      return 'Visioconference'
    case 'technique':
      return 'Technique'
    case 'managerial':
      return 'Managerial'
    case 'final':
      return 'Final'
    default:
      return 'RH'
  }
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const formatSyncDateTime = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const toDatetimeLocalValue = (value: string) => {
  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - timezoneOffset * 60_000)

  return localDate.toISOString().slice(0, 16)
}

const defaultPreparationText = (interview: InterviewItem) =>
  `Preparer des exemples concrets pour ${interview.position.toLowerCase()} chez ${interview.companyName}.`

const resetForm = () => {
  Object.assign(form, createEmptyForm())
  formError.value = ''
  editingInterviewId.value = ''
}

const openCreateEditor = () => {
  if (data.value.applications.length === 0) {
    toast.add({
      title: 'Aucune candidature disponible',
      description: 'Creez d\'abord une candidature avant de planifier un entretien.',
      color: 'warning',
    })
    return
  }

  editorMode.value = 'create'
  resetForm()
  form.applicationId = data.value.applications[0]?.id ?? ''
  isEditorOpen.value = true
}

const openEditEditor = (interview: InterviewItem) => {
  editorMode.value = 'edit'
  editingInterviewId.value = interview.id
  formError.value = ''

  Object.assign(form, {
    applicationId: interview.applicationId,
    type: interview.type,
    scheduledAt: toDatetimeLocalValue(interview.scheduledAt),
    notes: interview.notes ?? '',
    feedback: interview.feedback ?? '',
  })

  isEditorOpen.value = true
}

const closeEditor = (force = false) => {
  if (isSubmitting.value && !force) {
    return
  }

  isEditorOpen.value = false
  resetForm()
}

const openFeedbackEditor = (interview: InterviewItem) => {
  editingFeedbackId.value = interview.id
  feedbackDraft.value = interview.feedback ?? ''
}

const cancelFeedbackEditor = (force = false) => {
  if (isSubmittingFeedback.value && !force) {
    return
  }

  editingFeedbackId.value = ''
  feedbackDraft.value = ''
}

const validateForm = () => {
  if (!form.applicationId) {
    return 'La candidature associee est requise.'
  }

  if (form.type.trim().length < 2) {
    return 'Le type d\'entretien est requis.'
  }

  if (!form.scheduledAt) {
    return 'La date et l\'heure sont requises.'
  }

  return ''
}

const getAccessToken = async () => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error('Session Supabase introuvable.')
  }

  return accessToken
}

const requestInterviews = async (path: string, options: {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
} = {}) => {
  // Comme pour les autres pages metier, on centralise ici l'appel API
  // afin d'eviter de recopier la recuperation du token partout.
  const accessToken = await getAccessToken()

  return await $fetch<InterviewsResponse>(path, {
    method: options.method,
    body: options.body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

const requestCalendarAuthorizationUrl = async () => {
  const accessToken = await getAccessToken()

  // Cette route ne connecte pas encore Google : elle renvoie simplement
  // l'URL OAuth vers laquelle rediriger l'utilisateur.
  return await $fetch<{ authorizationUrl: string }>('/api/google-calendar/connect', {
    method: 'POST',
    body: {
      returnTo: '/entretiens',
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

const loadInterviews = async () => {
  if (!user.value) {
    data.value = emptyData
    error.value = null
    status.value = 'idle'
    cancelFeedbackEditor()
    return
  }

  status.value = 'pending'

  try {
    data.value = await requestInterviews('/api/interviews')
    error.value = null
    status.value = 'success'
  } catch (loadError) {
    console.error('Erreur lors du chargement des entretiens :', loadError)
    data.value = emptyData
    error.value = loadError
    status.value = 'error'
    cancelFeedbackEditor()
  }
}

const updateInterview = async (interview: InterviewItem, overrides: Partial<InterviewForm> = {}) => {
  // Ce helper est reutilise a la fois pour l'edition complete d'un entretien
  // et pour la mise a jour rapide du feedback.
  return await requestInterviews(`/api/interviews/${interview.id}`, {
    method: 'PATCH',
    body: {
      applicationId: overrides.applicationId ?? interview.applicationId,
      type: overrides.type ?? interview.type,
      scheduledAt: overrides.scheduledAt ?? interview.scheduledAt,
      notes: overrides.notes ?? interview.notes ?? '',
      feedback: overrides.feedback ?? interview.feedback ?? '',
    },
  })
}

const submitInterview = async () => {
  const validationMessage = validateForm()

  if (validationMessage) {
    formError.value = validationMessage
    return
  }

  isSubmitting.value = true
  formError.value = ''

  try {
    const payload = {
      applicationId: form.applicationId,
      type: form.type,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      notes: form.notes,
      feedback: form.feedback,
    }

    data.value = editorMode.value === 'create'
      ? await requestInterviews('/api/interviews', {
          method: 'POST',
          body: payload,
        })
      : await requestInterviews(`/api/interviews/${editingInterviewId.value}`, {
          method: 'PATCH',
          body: payload,
        })

    error.value = null
    status.value = 'success'
    toast.add({
      title: editorMode.value === 'create' ? 'Entretien cree' : 'Entretien mis a jour',
      description: 'Le planning des entretiens a ete actualise avec succes.',
      color: 'success',
    })
    closeEditor(true)
  } catch (submitError: any) {
    console.error("Erreur lors de l'enregistrement de l'entretien :", submitError)
    formError.value = submitError?.data?.message ?? submitError?.statusMessage ?? 'Impossible d\'enregistrer l\'entretien.'
  } finally {
    isSubmitting.value = false
  }
}

const connectGoogleCalendar = async () => {
  if (!isGoogleCalendarAvailable.value) {
    toast.add({
      title: 'Google Calendar indisponible',
      description: 'Appliquez la migration Prisma pour activer cette fonctionnalite.',
      color: 'warning',
    })
    return
  }

  if (!isGoogleCalendarConfigured.value) {
    toast.add({
      title: 'Configuration Google manquante',
      description: 'Ajoutez GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET et GOOGLE_CALENDAR_REDIRECT_URI.',
      color: 'warning',
    })
    return
  }

  isManagingCalendarConnection.value = true

  try {
    const response = await requestCalendarAuthorizationUrl()
    // La suite du flux se fait chez Google, puis revient sur /entretiens
    // avec un parametre de query pour afficher le bon toast de retour.
    window.location.assign(response.authorizationUrl)
  } catch (error: any) {
    toast.add({
      title: 'Connexion impossible',
      description: error?.data?.detail ?? error?.data?.message ?? error?.statusMessage ?? 'Impossible de lancer la connexion Google Calendar.',
      color: error?.status === 503 ? 'warning' : 'error',
    })
  } finally {
    isManagingCalendarConnection.value = false
  }
}

const disconnectGoogleCalendar = async () => {
  if (!isGoogleCalendarAvailable.value) {
    toast.add({
      title: 'Google Calendar indisponible',
      description: 'Appliquez la migration Prisma pour activer cette fonctionnalite.',
      color: 'warning',
    })
    return
  }

  const shouldDisconnect = window.confirm('Deconnecter Google Calendar pour ce compte ?')

  if (!shouldDisconnect) {
    return
  }

  isManagingCalendarConnection.value = true

  try {
    data.value = await requestInterviews('/api/google-calendar/disconnect', {
      method: 'POST',
    })
    error.value = null
    status.value = 'success'
    toast.add({
      title: 'Google Calendar deconnecte',
      description: 'La synchronisation automatique des entretiens a ete retiree.',
      color: 'success',
    })
  } catch (disconnectError: any) {
    console.error('Erreur lors de la deconnexion Google Calendar :', disconnectError)
    toast.add({
      title: 'Deconnexion impossible',
      description: disconnectError?.data?.message ?? disconnectError?.statusMessage ?? 'Google Calendar n a pas pu etre deconnecte.',
      color: 'error',
    })
  } finally {
    isManagingCalendarConnection.value = false
  }
}

const syncInterviewToGoogleCalendar = async (interview: InterviewItem) => {
  if (!isGoogleCalendarAvailable.value) {
    toast.add({
      title: 'Google Calendar indisponible',
      description: 'Appliquez la migration Prisma pour activer cette fonctionnalite.',
      color: 'warning',
    })
    return
  }

  if (!isGoogleCalendarConfigured.value) {
    toast.add({
      title: 'Configuration Google manquante',
      description: 'Ajoutez GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET et GOOGLE_CALENDAR_REDIRECT_URI.',
      color: 'warning',
    })
    return
  }

  if (!isGoogleCalendarConnected.value) {
    toast.add({
      title: 'Google Calendar non connecte',
      description: 'Connectez votre compte Google avant de synchroniser un entretien.',
      color: 'warning',
    })
    return
  }

  syncingCalendarId.value = interview.id

  try {
    // Le back decide s'il faut creer ou mettre a jour l'evenement Google
    // selon la presence d'un eventId deja enregistre.
    data.value = await requestInterviews(`/api/google-calendar/interviews/${interview.id}`, {
      method: 'POST',
    })
    error.value = null
    status.value = 'success'
    toast.add({
      title: interview.googleCalendarEventUrl ? 'Evenement mis a jour' : 'Evenement cree',
      description: `${interview.companyName} a ete synchronise avec Google Calendar.`,
      color: 'success',
    })
  } catch (syncError: any) {
    console.error('Erreur lors de la synchronisation Google Calendar :', syncError)
    toast.add({
      title: 'Synchronisation impossible',
      description: syncError?.data?.detail ?? syncError?.data?.message ?? syncError?.statusMessage ?? 'L entretien n a pas pu etre synchronise.',
      color: 'error',
    })
  } finally {
    syncingCalendarId.value = null
  }
}

const saveFeedback = async (interview: InterviewItem) => {
  isSubmittingFeedback.value = true

  try {
    data.value = await updateInterview(interview, {
      feedback: feedbackDraft.value,
    })
    error.value = null
    status.value = 'success'
    toast.add({
      title: 'Feedback mis a jour',
      description: `Le retour pour ${interview.companyName} a bien ete enregistre.`,
      color: 'success',
    })
    cancelFeedbackEditor(true)
  } catch (submitError: any) {
    console.error("Erreur lors de la mise a jour du feedback de l'entretien :", submitError)
    toast.add({
      title: 'Mise a jour impossible',
      description: submitError?.data?.message ?? submitError?.statusMessage ?? 'Le feedback n\'a pas pu etre enregistre.',
      color: 'error',
    })
  } finally {
    isSubmittingFeedback.value = false
  }
}

const deleteInterview = async (interview: InterviewItem) => {
  const shouldDelete = window.confirm(`Supprimer l'entretien prevu avec ${interview.companyName} ?`)

  if (!shouldDelete) {
    return
  }

  deletingId.value = interview.id

  try {
    data.value = await requestInterviews(`/api/interviews/${interview.id}`, {
      method: 'DELETE',
    })
    error.value = null
    status.value = 'success'
    toast.add({
      title: 'Entretien supprime',
      description: `${interview.companyName} a ete retire de votre planning.`,
      color: 'success',
    })
  } catch (deleteError: any) {
    console.error("Erreur lors de la suppression de l'entretien :", deleteError)
    toast.add({
      title: 'Suppression impossible',
      description: deleteError?.data?.message ?? deleteError?.statusMessage ?? 'L\'entretien n\'a pas pu etre supprime.',
      color: 'error',
    })
  } finally {
    deletingId.value = null
  }
}

watch(currentUserKey, () => {
  loadInterviews()
}, { immediate: true })

watch(
  () => route.query.googleCalendar,
  async (value) => {
    // Le callback OAuth revient sur cette page avec un statut en query string.
    // On transforme ce statut en toast puis on nettoie l'URL.
    if (typeof value !== 'string') {
      return
    }

    if (value === 'connected') {
      toast.add({
        title: 'Google Calendar connecte',
        description: 'Vous pouvez maintenant synchroniser vos entretiens.',
        color: 'success',
      })
      await loadInterviews()
    } else if (value === 'error') {
      toast.add({
        title: 'Connexion Google Calendar impossible',
        description: 'Verifiez vos identifiants OAuth Google et reessayez.',
        color: 'error',
      })
    }

    await navigateTo('/entretiens', { replace: true })
  },
  { immediate: true },
)

const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.access_token) {
    data.value = emptyData
    error.value = null
    status.value = 'idle'
    return
  }

  loadInterviews()
})

onMounted(() => {
  loadInterviews()
})

onBeforeUnmount(() => {
  authListener.subscription.unsubscribe()
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
