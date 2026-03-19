<template>
  <div class="dashboard-shell min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950">
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
          <div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-200 shadow-sm backdrop-blur">
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

        <div class="px-4 py-6 sm:px-6">
          <div class="flex flex-col gap-4 border-b border-[var(--dashboard-line)] pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-2xl font-bold tracking-tight text-[var(--dashboard-ink)] sm:text-3xl">
                Missions Freelance
              </h2>
              <p class="mt-1 text-sm text-[var(--dashboard-muted)]">
                {{ activeMissionsLabel }}
              </p>
            </div>

            <div class="flex flex-col items-start gap-3 sm:items-end">
              <UButton
                color="primary"
                icon="i-heroicons-plus"
                class="rounded-xl px-4"
                @click="openCreateEditor"
              >
                Nouvelle mission
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
            title="Impossible de charger les missions freelance."
            :description="pageError"
          />

          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <article
              v-for="item in topStats"
              :key="item.label"
              class="rounded-2xl border border-[var(--dashboard-line)] bg-white px-4 py-4 shadow-sm"
            >
              <p class="text-xs uppercase tracking-[0.18em] text-[var(--dashboard-subtle)]">{{ item.label }}</p>
              <p class="mt-2 text-3xl font-bold" :class="item.color">{{ item.value }}</p>
            </article>
          </div>

          <div v-if="data.missions.length > 0" class="mt-6 space-y-4">
            <article
              v-for="mission in data.missions"
              :key="mission.id"
              class="rounded-[18px] border border-[var(--dashboard-line)] bg-white p-4 shadow-[0_14px_32px_-30px_rgba(31,42,68,0.35)]"
            >
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-3">
                      <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-document-text" class="h-5 w-5 text-[var(--dashboard-subtle)]" />
                        <p class="text-xl font-semibold text-[var(--dashboard-ink)]">
                          {{ mission.companyName }}
                        </p>
                      </div>

                      <span
                        class="rounded-full px-3 py-1 text-xs font-semibold"
                        :class="statusBadgeClass[mission.statusKey]"
                      >
                        {{ mission.status }}
                      </span>
                    </div>

                    <p class="mt-2 text-lg text-[var(--dashboard-muted)]">
                      {{ mission.title }}
                    </p>
                  </div>

                  <div class="flex items-center gap-1 self-end lg:self-start">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-heroicons-pencil-square"
                      class="rounded-lg"
                      :disabled="isSubmitting || Boolean(deletingId)"
                      @click="openEditEditor(mission)"
                    />
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      class="rounded-lg"
                      :loading="deletingId === mission.id"
                      :disabled="isSubmitting"
                      @click="deleteMission(mission)"
                    />
                  </div>
                </div>

                <div class="grid gap-4 text-sm text-[var(--dashboard-muted)] md:grid-cols-2">
                  <div class="space-y-3">
                    <div v-if="mission.budget !== null" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-banknotes" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <span>{{ formatCurrency(mission.budget) }}</span>
                    </div>

                    <div v-if="mission.startDate" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-calendar-days" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <span>Debut: {{ formatDate(mission.startDate) }}</span>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div v-if="mission.durationLabel" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-clock" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <span>{{ mission.durationLabel }}</span>
                    </div>

                    <div v-if="mission.primaryContact?.linkedin" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-link" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <a
                        :href="mission.primaryContact.linkedin"
                        target="_blank"
                        rel="noreferrer"
                        class="hover:text-[var(--dashboard-accent)]"
                      >
                        Profil LinkedIn
                      </a>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div class="rounded-xl bg-slate-50 px-4 py-3 text-sm text-[var(--dashboard-muted)]">
                    <div v-if="mission.primaryContact" class="space-y-2">
                      <p class="font-medium text-[var(--dashboard-ink)]">
                        {{ mission.primaryContact.name }}
                        <span v-if="mission.primaryContact.role" class="font-normal text-[var(--dashboard-muted)]">
                          · {{ mission.primaryContact.role }}
                        </span>
                      </p>
                      <p v-if="mission.primaryContact.email">{{ mission.primaryContact.email }}</p>
                      <p v-else>{{ fallbackContactText(mission) }}</p>
                    </div>
                    <p v-else>{{ fallbackContactText(mission) }}</p>
                  </div>

                  <div class="rounded-xl bg-[#eef5ff] px-4 py-3 text-sm text-[var(--dashboard-muted)]">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f7cff]">Contexte</p>
                    <p class="mt-2">{{ contextText(mission) }}</p>
                  </div>
                </div>

                <div class="rounded-xl bg-[#fff8db] px-4 py-3 text-sm text-[var(--dashboard-muted)]">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#d97706]">Notes</p>
                  <p class="mt-2">{{ notesText(mission) }}</p>
                </div>
              </div>
            </article>
          </div>

          <div
            v-else
            class="mt-6 rounded-[18px] border border-dashed border-[var(--dashboard-line)] bg-slate-50 px-5 py-10 text-center text-sm text-[var(--dashboard-muted)]"
          >
            Aucune mission freelance disponible pour le moment.
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="isEditorOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm"
    >
      <div class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-white shadow-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-[var(--dashboard-line)] px-5 py-4 sm:px-6">
          <div>
            <h3 class="text-2xl font-bold text-[var(--dashboard-ink)]">
              {{ editorTitle }}
            </h3>
            <p class="mt-1 text-sm text-[var(--dashboard-muted)]">
              Renseignez le client, le budget, les dates et le contact principal de la mission.
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

        <form class="space-y-5 px-5 py-5 sm:px-6" @submit.prevent="submitMission">
          <UAlert
            v-if="formError"
            color="error"
            variant="subtle"
            :title="formError"
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Entreprise" name="companyName" required>
              <UInput
                v-model="form.companyName"
                placeholder="Ex. Digital Agency"
                icon="i-heroicons-building-office-2"
                class="mt-2"
              />
            </UFormField>

            <UFormField label="Mission" name="title" required>
              <UInput
                v-model="form.title"
                placeholder="Ex. Refonte site e-commerce"
                icon="i-heroicons-briefcase"
                class="mt-2"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Statut" name="status" required>
              <select
                v-model="form.status"
                class="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2.5 text-sm text-[var(--dashboard-ink)] outline-none transition focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[#dbeafe]"
              >
                <option v-for="option in statusOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </UFormField>

            <UFormField label="Budget" name="budget">
              <UInput
                v-model="form.budget"
                type="number"
                min="0"
                placeholder="Ex. 5000"
                icon="i-heroicons-banknotes"
                class="mt-2"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Debut" name="startDate">
              <UInput
                v-model="form.startDate"
                type="date"
                icon="i-heroicons-calendar-days"
                class="mt-2"
              />
            </UFormField>

            <UFormField label="Fin" name="endDate">
              <UInput
                v-model="form.endDate"
                type="date"
                icon="i-heroicons-calendar-days"
                class="mt-2"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Site entreprise" name="companyWebsite">
              <UInput
                v-model="form.companyWebsite"
                placeholder="https://entreprise.com"
                icon="i-heroicons-globe-alt"
                class="mt-2"
              />
            </UFormField>

            <UFormField label="LinkedIn entreprise" name="companyLinkedin">
              <UInput
                v-model="form.companyLinkedin"
                placeholder="https://linkedin.com/company/..."
                icon="i-heroicons-link"
                class="mt-2"
              />
            </UFormField>
          </div>

          <div class="rounded-[22px] border border-[var(--dashboard-line)] bg-slate-50/80 p-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-user-circle" class="h-5 w-5 text-[var(--dashboard-accent)]" />
              <h4 class="text-base font-semibold text-[var(--dashboard-ink)]">Contact principal</h4>
            </div>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <UFormField label="Nom du contact" name="contactName">
                <UInput
                  v-model="form.contactName"
                  placeholder="Ex. Sophie Laurent"
                  icon="i-heroicons-user"
                  class="mt-2"
                />
              </UFormField>

              <UFormField label="Role" name="contactRole">
                <UInput
                  v-model="form.contactRole"
                  placeholder="Ex. Chef de projet"
                  icon="i-heroicons-identification"
                  class="mt-2"
                />
              </UFormField>

              <UFormField label="Email" name="contactEmail">
                <UInput
                  v-model="form.contactEmail"
                  type="email"
                  placeholder="contact@entreprise.com"
                  icon="i-heroicons-envelope"
                  class="mt-2"
                />
              </UFormField>

              <UFormField label="LinkedIn" name="contactLinkedin">
                <UInput
                  v-model="form.contactLinkedin"
                  placeholder="https://linkedin.com/in/..."
                  icon="i-heroicons-link"
                  class="mt-2"
                />
              </UFormField>
            </div>
          </div>

          <UFormField label="Notes" name="notes">
            <textarea
              v-model="form.notes"
              rows="4"
              class="mt-2 w-full rounded-2xl border border-[var(--dashboard-line)] bg-white px-3 py-3 text-sm text-[var(--dashboard-ink)] outline-none transition focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[#dbeafe]"
              placeholder="Contexte, perimetre, relances et prochaines etapes..."
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
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { dashboardTabs } from '~/utils/dashboard-tabs'

type FreelanceStatusKey = 'prospecting' | 'proposals' | 'negotiations' | 'won'
type EditorMode = 'create' | 'edit'

interface FreelanceResponse {
  summary: {
    totalCount: number
    activeCount: number
    prospectingCount: number
    proposalsCount: number
    negotiationsCount: number
    wonCount: number
    totalBudget: number
  }
  missions: Array<{
    id: string
    companyName: string
    companyWebsite: string | null
    companyLinkedin: string | null
    title: string
    status: string
    statusKey: FreelanceStatusKey
    budget: number | null
    startDate: string | null
    endDate: string | null
    durationLabel: string | null
    notes: string | null
    isActive: boolean
    primaryContact: {
      id: string
      name: string
      role: string | null
      email: string | null
      linkedin: string | null
    } | null
  }>
}

type FreelanceMissionItem = FreelanceResponse['missions'][number]

type FreelanceMissionForm = {
  companyName: string
  companyWebsite: string
  companyLinkedin: string
  title: string
  status: string
  budget: string
  startDate: string
  endDate: string
  notes: string
  contactName: string
  contactRole: string
  contactEmail: string
  contactLinkedin: string
}

const statusOptions = [
  'prospection',
  'proposition envoyee',
  'negociation',
  'gagnee',
] as const

const emptyData: FreelanceResponse = {
  summary: {
    totalCount: 0,
    activeCount: 0,
    prospectingCount: 0,
    proposalsCount: 0,
    negotiationsCount: 0,
    wonCount: 0,
    totalBudget: 0,
  },
  missions: [],
}

const createEmptyForm = (): FreelanceMissionForm => ({
  companyName: '',
  companyWebsite: '',
  companyLinkedin: '',
  title: '',
  status: statusOptions[0],
  budget: '',
  startDate: '',
  endDate: '',
  notes: '',
  contactName: '',
  contactRole: '',
  contactEmail: '',
  contactLinkedin: '',
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const toast = useToast()
const isSigningOut = ref(false)

const data = ref<FreelanceResponse>(emptyData)
const error = ref<unknown>(null)
const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const isSubmitting = ref(false)
const deletingId = ref<string | null>(null)
const isEditorOpen = ref(false)
const editorMode = ref<EditorMode>('create')
const editingMissionId = ref('')
const formError = ref('')
const form = reactive<FreelanceMissionForm>(createEmptyForm())

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
    return 'Actualisation des missions...'
  }

  if (pageError.value) {
    return 'Synchronisation indisponible'
  }

  return 'Missions synchronisees'
})

const activeMissionsLabel = computed(() => `${data.value.summary.activeCount} mission(s) en cours de suivi`)
const editorTitle = computed(() =>
  editorMode.value === 'create' ? 'Nouvelle mission freelance' : 'Modifier la mission freelance',
)
const submitLabel = computed(() =>
  editorMode.value === 'create' ? 'Creer la mission' : 'Enregistrer les modifications',
)

const userDisplayName = computed(() => {
  const firstName = user.value?.user_metadata?.firstName

  if (typeof firstName === 'string' && firstName.trim().length > 0) {
    return firstName
  }

  return user.value?.email ?? 'utilisateur inconnu'
})

const statusBadgeClass: Record<FreelanceStatusKey, string> = {
  prospecting: 'bg-slate-100 text-slate-700',
  proposals: 'bg-[#e5edff] text-[#2563eb]',
  negotiations: 'bg-[#fff2cc] text-[#d97706]',
  won: 'bg-[#dcfce7] text-[#15803d]',
}

const topStats = computed(() => [
  { label: 'Prospection', value: data.value.summary.prospectingCount, color: 'text-slate-700' },
  { label: 'Propositions', value: data.value.summary.proposalsCount, color: 'text-[#2563eb]' },
  { label: 'Negociations', value: data.value.summary.negotiationsCount, color: 'text-[#d97706]' },
  { label: 'Gain', value: formatCurrency(data.value.summary.totalBudget), color: 'text-[#15803d]' },
])

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)

const toDateInputValue = (value: string | null) => value?.slice(0, 10) ?? ''

const fallbackContactText = (mission: FreelanceMissionItem) => {
  if (mission.companyWebsite) {
    return mission.companyWebsite
  }

  return 'Contact principal non renseigne.'
}

const contextText = (mission: FreelanceMissionItem) => {
  if (mission.notes && mission.notes.trim().length > 0) {
    return mission.notes
  }

  return `Mission ${mission.title.toLowerCase()} pour ${mission.companyName}.`
}

const notesText = (mission: FreelanceMissionItem) => {
  if (mission.endDate) {
    return `Point de suivi recommande avant la fin estimee du ${formatDate(mission.endDate)}.`
  }

  if (mission.statusKey === 'proposals') {
    return 'Relancer le client sur la proposition envoyee.'
  }

  if (mission.statusKey === 'negotiations') {
    return 'Maintenir le rythme des echanges et verrouiller le perimetre.'
  }

  if (mission.statusKey === 'won') {
    return 'Mission remportee, preparer la phase de lancement.'
  }

  return 'Continuer la prospection et qualifier le besoin du client.'
}

const resetForm = () => {
  Object.assign(form, createEmptyForm())
  formError.value = ''
  editingMissionId.value = ''
}

const openCreateEditor = () => {
  editorMode.value = 'create'
  resetForm()
  isEditorOpen.value = true
}

const openEditEditor = (mission: FreelanceMissionItem) => {
  editorMode.value = 'edit'
  editingMissionId.value = mission.id
  formError.value = ''

  Object.assign(form, {
    companyName: mission.companyName,
    companyWebsite: mission.companyWebsite ?? '',
    companyLinkedin: mission.companyLinkedin ?? '',
    title: mission.title,
    status: mission.status,
    budget: mission.budget !== null ? String(mission.budget) : '',
    startDate: toDateInputValue(mission.startDate),
    endDate: toDateInputValue(mission.endDate),
    notes: mission.notes ?? '',
    contactName: mission.primaryContact?.name ?? '',
    contactRole: mission.primaryContact?.role ?? '',
    contactEmail: mission.primaryContact?.email ?? '',
    contactLinkedin: mission.primaryContact?.linkedin ?? '',
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

const validateForm = () => {
  if (form.companyName.trim().length < 2) {
    return "Le nom de l'entreprise est requis."
  }

  if (form.title.trim().length < 2) {
    return 'Le nom de la mission est requis.'
  }

  if (form.status.trim().length < 2) {
    return 'Le statut est requis.'
  }

  if (form.budget.trim().length > 0 && Number(form.budget) < 0) {
    return 'Le budget doit etre positif.'
  }

  const hasContactDetails = [
    form.contactName,
    form.contactRole,
    form.contactEmail,
    form.contactLinkedin,
  ].some(value => value.trim().length > 0)

  if (hasContactDetails && form.contactName.trim().length === 0) {
    return 'Le nom du contact est requis si vous renseignez ses informations.'
  }

  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    return 'La date de fin doit etre posterieure a la date de debut.'
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

const requestFreelance = async (path: string, options: {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
} = {}) => {
  const accessToken = await getAccessToken()

  return await $fetch<FreelanceResponse>(path, {
    method: options.method,
    body: options.body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

const loadFreelance = async () => {
  if (!user.value) {
    data.value = emptyData
    error.value = null
    status.value = 'idle'
    return
  }

  status.value = 'pending'

  try {
    data.value = await requestFreelance('/api/freelance')
    error.value = null
    status.value = 'success'
  } catch (loadError) {
    console.error('Erreur lors du chargement des missions freelance :', loadError)
    data.value = emptyData
    error.value = loadError
    status.value = 'error'
  }
}

const submitMission = async () => {
  const validationMessage = validateForm()

  if (validationMessage) {
    formError.value = validationMessage
    return
  }

  isSubmitting.value = true
  formError.value = ''

  try {
    const payload = {
      companyName: form.companyName,
      companyWebsite: form.companyWebsite,
      companyLinkedin: form.companyLinkedin,
      title: form.title,
      status: form.status,
      budget: form.budget,
      startDate: form.startDate,
      endDate: form.endDate,
      notes: form.notes,
      contactName: form.contactName,
      contactRole: form.contactRole,
      contactEmail: form.contactEmail,
      contactLinkedin: form.contactLinkedin,
    }

    data.value = editorMode.value === 'create'
      ? await requestFreelance('/api/freelance', {
          method: 'POST',
          body: payload,
        })
      : await requestFreelance(`/api/freelance/${editingMissionId.value}`, {
          method: 'PATCH',
          body: payload,
        })

    error.value = null
    status.value = 'success'
    toast.add({
      title: editorMode.value === 'create' ? 'Mission creee' : 'Mission mise a jour',
      description: 'La liste a ete actualisee avec succes.',
      color: 'success',
    })
    closeEditor(true)
  } catch (submitError: any) {
    console.error("Erreur lors de l'enregistrement de la mission freelance :", submitError)
    formError.value = submitError?.data?.message ?? submitError?.statusMessage ?? "Impossible d'enregistrer la mission freelance."
  } finally {
    isSubmitting.value = false
  }
}

const deleteMission = async (mission: FreelanceMissionItem) => {
  const shouldDelete = window.confirm(`Supprimer la mission pour ${mission.companyName} ?`)

  if (!shouldDelete) {
    return
  }

  deletingId.value = mission.id

  try {
    data.value = await requestFreelance(`/api/freelance/${mission.id}`, {
      method: 'DELETE',
    })
    error.value = null
    status.value = 'success'
    toast.add({
      title: 'Mission supprimee',
      description: `${mission.companyName} a ete retire de votre suivi freelance.`,
      color: 'success',
    })
  } catch (deleteError: any) {
    console.error("Erreur lors de la suppression de la mission freelance :", deleteError)
    toast.add({
      title: 'Suppression impossible',
      description: deleteError?.data?.message ?? deleteError?.statusMessage ?? "La mission n'a pas pu etre supprimee.",
      color: 'error',
    })
  } finally {
    deletingId.value = null
  }
}

watch(currentUserKey, () => {
  loadFreelance()
}, { immediate: true })

const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.access_token) {
    data.value = emptyData
    error.value = null
    status.value = 'idle'
    return
  }

  loadFreelance()
})

onMounted(() => {
  loadFreelance()
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
