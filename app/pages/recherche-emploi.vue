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
                Candidatures
              </h2>
              <p class="mt-1 text-sm text-[var(--dashboard-muted)]">
                {{ activeApplicationsLabel }}
              </p>
            </div>

            <div class="flex flex-col items-start gap-3 sm:items-end">
              <UButton
                color="primary"
                icon="i-heroicons-plus"
                class="rounded-xl px-4"
                @click="openCreateEditor"
              >
                Nouvelle candidature
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
            title="Impossible de charger les candidatures."
            :description="pageError"
          />

          <div v-if="data.applications.length > 0" class="mt-6 space-y-4">
            <article
              v-for="application in data.applications"
              :key="application.id"
              class="rounded-[18px] border border-[var(--dashboard-line)] bg-white p-4 shadow-[0_14px_32px_-30px_rgba(31,42,68,0.35)]"
            >
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-3">
                      <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-document-text" class="h-5 w-5 text-[var(--dashboard-subtle)]" />
                        <p class="text-xl font-semibold text-[var(--dashboard-ink)]">
                          {{ application.companyName }}
                        </p>
                      </div>

                      <span
                        class="rounded-full px-3 py-1 text-xs font-semibold"
                        :class="statusBadgeClass[application.statusKey]"
                      >
                        {{ application.status }}
                      </span>
                    </div>

                    <p class="mt-2 text-lg text-[var(--dashboard-muted)]">
                      {{ application.position }}
                    </p>
                  </div>

                  <div class="flex items-center gap-1 self-end lg:self-start">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-heroicons-pencil-square"
                      class="rounded-lg"
                      :disabled="isSubmitting || Boolean(deletingId)"
                      @click="openEditEditor(application)"
                    />
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      class="rounded-lg"
                      :loading="deletingId === application.id"
                      :disabled="isSubmitting"
                      @click="deleteApplication(application)"
                    />
                  </div>
                </div>

                <div class="grid gap-4 text-sm text-[var(--dashboard-muted)] md:grid-cols-2">
                  <div class="space-y-3">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-heroicons-calendar-days" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <span>{{ formatDate(application.appliedAt ?? application.createdAt) }}</span>
                    </div>

                    <div v-if="application.primaryContact?.email" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-envelope" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <span>{{ application.primaryContact.email }}</span>
                    </div>

                    <div v-else-if="application.companyWebsite" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-globe-alt" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <a
                        :href="application.companyWebsite"
                        target="_blank"
                        rel="noreferrer"
                        class="hover:text-[var(--dashboard-accent)]"
                      >
                        {{ formatLinkLabel(application.companyWebsite) }}
                      </a>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div v-if="application.primaryContact" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-identification" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <span>
                        {{ application.primaryContact.name }}
                        <template v-if="application.primaryContact.role">
                          · {{ application.primaryContact.role }}
                        </template>
                      </span>
                    </div>

                    <div v-if="application.primaryContact?.linkedin" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-link" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <a
                        :href="application.primaryContact.linkedin"
                        target="_blank"
                        rel="noreferrer"
                        class="hover:text-[var(--dashboard-accent)]"
                      >
                        Profil LinkedIn
                      </a>
                    </div>

                    <div v-else-if="application.nextInterviewAt" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-clock" class="h-4 w-4 text-[var(--dashboard-subtle)]" />
                      <span>Prochain entretien {{ formatDateTime(application.nextInterviewAt) }}</span>
                    </div>
                  </div>
                </div>

                <div class="rounded-xl bg-slate-50 px-4 py-3 text-sm text-[var(--dashboard-muted)]">
                  {{ application.notes || defaultNote(application) }}
                </div>
              </div>
            </article>
          </div>

          <div
            v-else
            class="mt-6 rounded-[18px] border border-dashed border-[var(--dashboard-line)] bg-slate-50 px-5 py-10 text-center text-sm text-[var(--dashboard-muted)]"
          >
            Aucune candidature disponible pour le moment.
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
              Renseignez l'entreprise, le statut et le contact principal de la candidature.
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

        <form class="space-y-5 px-5 py-5 sm:px-6" @submit.prevent="submitApplication">
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
                placeholder="Ex. TechCorp"
                icon="i-heroicons-building-office-2"
                class="mt-2"
              />
            </UFormField>

            <UFormField label="Poste" name="position" required>
              <UInput
                v-model="form.position"
                placeholder="Ex. Developpeur Full-Stack"
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

            <UFormField label="Date de candidature" name="appliedAt">
              <UInput
                v-model="form.appliedAt"
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
                  placeholder="Ex. Marie Dubois"
                  icon="i-heroicons-user"
                  class="mt-2"
                />
              </UFormField>

              <UFormField label="Role" name="contactRole">
                <UInput
                  v-model="form.contactRole"
                  placeholder="Ex. Talent Acquisition"
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
              placeholder="Contexte, prochaines etapes, retour de recruteur..."
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

type JobStatusKey = 'sent' | 'interviews' | 'offers' | 'rejected'
type EditorMode = 'create' | 'edit'

interface JobSearchResponse {
  summary: {
    totalCount: number
    activeCount: number
    sentCount: number
    interviewsCount: number
    offersCount: number
    rejectedCount: number
    thisMonthCount: number
    upcomingInterviewsCount: number
  }
  applications: Array<{
    id: string
    companyName: string
    companyWebsite: string | null
    companyLinkedin: string | null
    position: string
    status: string
    statusKey: JobStatusKey
    appliedAt: string | null
    createdAt: string
    notes: string | null
    interviewCount: number
    nextInterviewAt: string | null
    lastInterviewAt: string | null
    isActive: boolean
    primaryContact: {
      id: string
      name: string
      role: string | null
      email: string | null
      linkedin: string | null
    } | null
  }>
  upcomingInterviews: Array<{
    id: string
    companyName: string
    position: string
    type: string
    scheduledAt: string
  }>
}

type JobApplicationItem = JobSearchResponse['applications'][number]

type JobApplicationForm = {
  companyName: string
  companyWebsite: string
  companyLinkedin: string
  position: string
  status: string
  appliedAt: string
  notes: string
  contactName: string
  contactRole: string
  contactEmail: string
  contactLinkedin: string
}

const statusOptions = [
  'envoyee',
  'entretien RH',
  'entretien technique',
  'entretien final',
  'offre recue',
  'refusee',
] as const

const emptyData: JobSearchResponse = {
  summary: {
    totalCount: 0,
    activeCount: 0,
    sentCount: 0,
    interviewsCount: 0,
    offersCount: 0,
    rejectedCount: 0,
    thisMonthCount: 0,
    upcomingInterviewsCount: 0,
  },
  applications: [],
  upcomingInterviews: [],
}

const createEmptyForm = (): JobApplicationForm => ({
  companyName: '',
  companyWebsite: '',
  companyLinkedin: '',
  position: '',
  status: statusOptions[0],
  appliedAt: '',
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

const data = ref<JobSearchResponse>(emptyData)
const error = ref<unknown>(null)
const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const isSubmitting = ref(false)
const deletingId = ref<string | null>(null)
const isEditorOpen = ref(false)
const editorMode = ref<EditorMode>('create')
const editingApplicationId = ref('')
const formError = ref('')
const form = reactive<JobApplicationForm>(createEmptyForm())

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
    return 'Actualisation des candidatures...'
  }

  if (pageError.value) {
    return 'Synchronisation indisponible'
  }

  return 'Candidatures synchronisees'
})

const activeApplicationsLabel = computed(() => `${data.value.summary.activeCount} candidature(s) en cours`)
const editorTitle = computed(() =>
  editorMode.value === 'create' ? 'Nouvelle candidature' : 'Modifier la candidature',
)
const submitLabel = computed(() =>
  editorMode.value === 'create' ? 'Creer la candidature' : 'Enregistrer les modifications',
)

const userDisplayName = computed(() => {
  const firstName = user.value?.user_metadata?.firstName

  if (typeof firstName === 'string' && firstName.trim().length > 0) {
    return firstName
  }

  return user.value?.email ?? 'utilisateur inconnu'
})

const statusBadgeClass: Record<JobStatusKey, string> = {
  sent: 'bg-[#e5edff] text-[#2563eb]',
  interviews: 'bg-[#fef3c7] text-[#b45309]',
  offers: 'bg-[#dcfce7] text-[#15803d]',
  rejected: 'bg-[#fee2e2] text-[#dc2626]',
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const formatLinkLabel = (value: string) => {
  try {
    return new URL(value).hostname.replace('www.', '')
  } catch {
    return value
  }
}

const toDateInputValue = (value: string | null) => value?.slice(0, 10) ?? ''

const defaultNote = (application: JobApplicationItem) => {
  if (application.nextInterviewAt) {
    return `Prochain entretien prevu le ${formatDateTime(application.nextInterviewAt)}.`
  }

  if (application.primaryContact?.name) {
    return `Point de contact principal: ${application.primaryContact.name}.`
  }

  return 'Aucune note complementaire pour cette candidature.'
}

const resetForm = () => {
  Object.assign(form, createEmptyForm())
  formError.value = ''
  editingApplicationId.value = ''
}

const openCreateEditor = () => {
  editorMode.value = 'create'
  resetForm()
  isEditorOpen.value = true
}

const openEditEditor = (application: JobApplicationItem) => {
  editorMode.value = 'edit'
  editingApplicationId.value = application.id
  formError.value = ''

  Object.assign(form, {
    companyName: application.companyName,
    companyWebsite: application.companyWebsite ?? '',
    companyLinkedin: application.companyLinkedin ?? '',
    position: application.position,
    status: application.status,
    appliedAt: toDateInputValue(application.appliedAt),
    notes: application.notes ?? '',
    contactName: application.primaryContact?.name ?? '',
    contactRole: application.primaryContact?.role ?? '',
    contactEmail: application.primaryContact?.email ?? '',
    contactLinkedin: application.primaryContact?.linkedin ?? '',
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
  // La validation UI reste volontairement simple.
  // La validation "de reference" est refaite cote serveur avec Zod.
  if (form.companyName.trim().length < 2) {
    return "Le nom de l'entreprise est requis."
  }

  if (form.position.trim().length < 2) {
    return 'Le poste est requis.'
  }

  if (form.status.trim().length < 2) {
    return 'Le statut est requis.'
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

const requestJobSearch = async (path: string, options: {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
} = {}) => {
  // Toutes les actions CRUD passent par ce helper afin de centraliser
  // l'ajout du token Supabase dans l'en-tete Authorization.
  const accessToken = await getAccessToken()

  return await $fetch<JobSearchResponse>(path, {
    method: options.method,
    body: options.body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

const loadJobSearch = async () => {
  if (!user.value) {
    data.value = emptyData
    error.value = null
    status.value = 'idle'
    return
  }

  status.value = 'pending'

  try {
    data.value = await requestJobSearch('/api/job-search')
    error.value = null
    status.value = 'success'
  } catch (loadError) {
    console.error('Erreur lors du chargement des candidatures :', loadError)
    data.value = emptyData
    error.value = loadError
    status.value = 'error'
  }
}

const submitApplication = async () => {
  const validationMessage = validateForm()

  if (validationMessage) {
    formError.value = validationMessage
    return
  }

  isSubmitting.value = true
  formError.value = ''

  try {
    // Le meme formulaire sert a la creation et a la modification.
    // Seule l'URL et la methode HTTP changent selon le mode en cours.
    const payload = {
      companyName: form.companyName,
      companyWebsite: form.companyWebsite,
      companyLinkedin: form.companyLinkedin,
      position: form.position,
      status: form.status,
      appliedAt: form.appliedAt,
      notes: form.notes,
      contactName: form.contactName,
      contactRole: form.contactRole,
      contactEmail: form.contactEmail,
      contactLinkedin: form.contactLinkedin,
    }

    data.value = editorMode.value === 'create'
      ? await requestJobSearch('/api/job-search', {
          method: 'POST',
          body: payload,
        })
      : await requestJobSearch(`/api/job-search/${editingApplicationId.value}`, {
          method: 'PATCH',
          body: payload,
        })

    error.value = null
    status.value = 'success'
    toast.add({
      title: editorMode.value === 'create' ? 'Candidature creee' : 'Candidature mise a jour',
      description: 'La liste a ete actualisee avec succes.',
      color: 'success',
    })
    closeEditor(true)
  } catch (submitError: any) {
    console.error("Erreur lors de l'enregistrement de la candidature :", submitError)
    formError.value = submitError?.data?.message ?? submitError?.statusMessage ?? "Impossible d'enregistrer la candidature."
  } finally {
    isSubmitting.value = false
  }
}

const deleteApplication = async (application: JobApplicationItem) => {
  const shouldDelete = window.confirm(`Supprimer la candidature pour ${application.companyName} ?`)

  if (!shouldDelete) {
    return
  }

  deletingId.value = application.id

  try {
    data.value = await requestJobSearch(`/api/job-search/${application.id}`, {
      method: 'DELETE',
    })
    error.value = null
    status.value = 'success'
    toast.add({
      title: 'Candidature supprimee',
      description: `${application.companyName} a ete retire de votre pipeline.`,
      color: 'success',
    })
  } catch (deleteError: any) {
    console.error("Erreur lors de la suppression de la candidature :", deleteError)
    toast.add({
      title: 'Suppression impossible',
      description: deleteError?.data?.message ?? deleteError?.statusMessage ?? "La candidature n'a pas pu etre supprimee.",
      color: 'error',
    })
  } finally {
    deletingId.value = null
  }
}

watch(currentUserKey, () => {
  loadJobSearch()
}, { immediate: true })

const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.access_token) {
    data.value = emptyData
    error.value = null
    status.value = 'idle'
    return
  }

  loadJobSearch()
})

onMounted(() => {
  // Le chargement initial est rejoue ici pour couvrir aussi un refresh navigateur.
  loadJobSearch()
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
