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
          <div class="flex flex-col gap-6 border-b border-[var(--dashboard-line)] pb-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 class="text-2xl font-bold tracking-tight text-[var(--dashboard-ink)] sm:text-3xl">
                Graphe de Relations
              </h2>
              <p class="mt-1 max-w-2xl text-sm text-[var(--dashboard-muted)]">
                Visualisation des connexions entre entreprises et contacts de votre reseau.
              </p>
            </div>

            <aside class="w-full rounded-[22px] border border-[#cfe0ff] bg-[linear-gradient(180deg,#edf4ff_0%,#f8fbff_100%)] p-4 shadow-sm xl:max-w-[300px]">
              <div>
                <label for="graph-search" class="text-sm font-semibold text-[var(--dashboard-ink)]">
                  Recherche
                </label>
                <div class="mt-2 flex items-center gap-2">
                  <div class="relative flex-1">
                    <UIcon name="i-heroicons-magnifying-glass" class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--dashboard-muted)]" />
                    <input
                      id="graph-search"
                      v-model="graphSearchQuery"
                      type="text"
                      placeholder="Entreprise ou contact"
                      class="w-full rounded-2xl border border-[#d9e6ff] bg-white px-10 py-2.5 text-sm text-[var(--dashboard-ink)] outline-none transition focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[#dbeafe]"
                    >
                  </div>

                  <UButton
                    v-if="graphSearchQuery"
                    color="neutral"
                    variant="soft"
                    icon="i-heroicons-x-mark"
                    class="rounded-xl"
                    @click="graphSearchQuery = ''"
                  >
                    Effacer
                  </UButton>
                </div>

                <p class="mt-2 text-xs text-[var(--dashboard-muted)]">
                  {{ graphSearchStatus }}
                </p>
              </div>

              <div class="mt-5 flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-ink)]">
                <UIcon name="i-heroicons-information-circle" class="h-4 w-4 text-[var(--dashboard-accent)]" />
                <span>Legende</span>
              </div>

              <div class="mt-4 space-y-3 text-sm text-[var(--dashboard-muted)]">
                <div
                  v-for="item in legendItems"
                  :key="item.label"
                  class="flex items-center gap-3"
                >
                  <span class="h-3 w-3 rounded-full" :class="item.dotClass" />
                  <span>{{ item.label }}</span>
                </div>
              </div>

              <div class="mt-4 border-t border-[#d9e6ff] pt-4 text-xs text-[var(--dashboard-muted)]">
                <div
                  v-for="item in legendLines"
                  :key="item.label"
                  class="flex items-center gap-3 py-1.5"
                >
                  <span
                    class="block h-0 w-10 border-t-2"
                    :class="item.lineClass"
                    :style="item.lineStyle"
                  />
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </aside>
          </div>

          <div class="mt-6 overflow-hidden rounded-[26px] border border-[#1d2a7a] bg-[linear-gradient(180deg,#000533_0%,#03104f_100%)] p-3 shadow-[0_25px_70px_-42px_rgba(0,5,51,0.8)]">
            <div class="relative">
              <div
                ref="graphStageRef"
                class="graph-stage h-[560px] overflow-auto rounded-[20px]"
                :class="isPanning ? 'cursor-grabbing select-none' : canPanGraph ? 'cursor-grab' : 'cursor-default'"
                @dragstart.prevent
                @pointerdown="startGraphPan"
                @pointermove="handleGraphPan"
                @pointerup="stopGraphPan"
                @pointercancel="stopGraphPan"
              >
                <div
                  class="relative min-h-full min-w-full"
                  :style="graphCanvasStyle"
                >
                  <div
                    class="relative overflow-hidden rounded-[20px] bg-[#000533] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] origin-top-left transition-transform duration-200 ease-out"
                    :style="graphSurfaceStyle"
                  >
                    <div class="graph-surface-ambient pointer-events-none absolute inset-0" aria-hidden="true">
                      <div class="graph-surface-orb graph-surface-orb-mint" />
                      <div class="graph-surface-orb graph-surface-orb-blue" />
                      <div class="graph-surface-orb graph-surface-orb-purple" />
                    </div>

                    <div
                      v-if="graphStateMessage"
                      class="absolute inset-0 z-10 flex items-center justify-center px-6"
                    >
                      <div class="max-w-md rounded-2xl border border-white/20 bg-white/12 px-5 py-4 text-center text-sm text-white/90 shadow-lg backdrop-blur">
                        {{ graphStateMessage }}
                      </div>
                    </div>

                    <svg
                      class="pointer-events-none absolute inset-0 h-full w-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <defs>
                        <marker id="graph-arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                          <path d="M0,0 L8,4 L0,8 Z" fill="#7ab1ff" />
                        </marker>
                        <marker id="graph-arrow-gold" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                          <path d="M0,0 L8,4 L0,8 Z" fill="#f5b83d" />
                        </marker>
                        <marker id="graph-arrow-green" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                          <path d="M0,0 L8,4 L0,8 Z" fill="#25d48a" />
                        </marker>
                        <marker id="graph-arrow-purple" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                          <path d="M0,0 L8,4 L0,8 Z" fill="#c47cff" />
                        </marker>
                      </defs>

                      <line
                        v-for="connection in graphConnections"
                        :key="connection.id"
                        :x1="connection.from.x"
                        :y1="connection.from.y"
                        :x2="connection.to.x"
                        :y2="connection.to.y"
                        :stroke="connection.color"
                        stroke-width="0.45"
                        stroke-linecap="round"
                        :stroke-dasharray="connection.dashArray ?? undefined"
                        :marker-end="`url(#${connection.markerId})`"
                        :opacity="connection.opacity"
                      />
                    </svg>

                    <div
                      v-for="connection in graphConnections"
                      :key="`${connection.id}-label`"
                      class="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border border-white/30 px-2 py-1 text-[10px] font-semibold whitespace-nowrap shadow-sm backdrop-blur"
                      :class="connection.labelClass"
                      :style="{ left: `${connection.labelX}%`, top: `${connection.labelY}%`, opacity: connection.opacity }"
                    >
                      {{ connection.label }}
                    </div>

                    <UTooltip
                      v-for="node in graphNodes"
                      :key="node.id"
                      :content="{ side: 'top', align: 'center', sideOffset: 40, collisionPadding: 32, avoidCollisions: false }"
                      :delay-duration="90"
                      :ui="{ content: 'bg-transparent p-0 shadow-none ring-0 border-0' }"
                    >
                      <template #content>
                        <div
                          class="relative max-w-[280px] rounded-[20px] border border-slate-200/90 bg-white/98 px-4 py-3 text-left shadow-[0_22px_45px_-26px_rgba(15,23,42,0.35)] backdrop-blur"
                          :class="node.type === 'company' ? '-translate-y-[2.7rem]' : '-translate-y-[2.85rem]'"
                        >
                          <div class="flex items-start gap-3">
                            <div
                              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                              :class="node.type === 'company'
                                ? 'bg-[linear-gradient(180deg,#6cb0ff_0%,#4088ff_100%)]'
                                : 'bg-[linear-gradient(180deg,#ffbf00_0%,#d9a300_100%)] text-white'"
                            >
                              <UIcon :name="node.type === 'company' ? 'i-heroicons-building-office-2' : 'i-heroicons-user'" class="h-5 w-5" />
                            </div>

                            <div class="min-w-0">
                              <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                {{ nodeTypeLabels[node.type] }}
                              </p>
                              <p class="mt-1 text-sm font-semibold text-slate-800">
                                {{ node.label }}
                              </p>
                              <p class="mt-1 text-xs leading-relaxed text-slate-500">
                                {{ node.type === 'contact'
                                  ? (node.details?.role || node.subtitle || 'Contact')
                                  : (node.subtitle || 'Aucune information complementaire') }}
                              </p>
                            </div>
                          </div>

                          <div v-if="node.type === 'company'" class="mt-3 space-y-2 text-xs text-slate-600">
                            <div v-if="node.details?.website" class="flex items-start gap-2">
                              <UIcon name="i-heroicons-globe-alt" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <span class="break-all">{{ formatExternalLink(node.details.website) }}</span>
                            </div>
                            <div v-if="node.details?.linkedin" class="flex items-start gap-2">
                              <UIcon name="i-heroicons-link" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <a
                                :href="normalizeExternalLink(node.details.linkedin)"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="break-all text-[#2563eb] transition hover:text-[#1d4ed8] hover:underline"
                              >
                                {{ formatExternalLink(node.details.linkedin) }}
                              </a>
                            </div>
                            <div v-if="nodeTooltipMeta[node.id]?.relatedContacts.length" class="flex items-start gap-2">
                              <UIcon name="i-heroicons-user-group" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <span>{{ nodeTooltipMeta[node.id].relatedContacts.slice(0, 3).join(' • ') }}</span>
                            </div>
                          </div>

                          <div v-else-if="node.type === 'contact'" class="mt-3 space-y-2 text-xs text-slate-600">
                            <div v-if="node.details?.email" class="flex items-start gap-2">
                              <UIcon name="i-heroicons-envelope" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <span class="break-all">{{ node.details.email }}</span>
                            </div>
                            <div v-if="node.details?.linkedin" class="flex items-start gap-2">
                              <UIcon name="i-heroicons-link" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <a
                                :href="normalizeExternalLink(node.details.linkedin)"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="break-all text-[#2563eb] transition hover:text-[#1d4ed8] hover:underline"
                              >
                                {{ formatExternalLink(node.details.linkedin) }}
                              </a>
                            </div>
                            <div v-if="nodeTooltipMeta[node.id]?.relatedCompanies.length" class="flex items-start gap-2">
                              <UIcon name="i-heroicons-briefcase" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <span>{{ nodeTooltipMeta[node.id].relatedCompanies.slice(0, 3).join(' • ') }}</span>
                            </div>
                          </div>
                          <span class="absolute left-1/2 bottom-[-7px] h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-slate-200/90 bg-white/98" />
                        </div>
                      </template>

                      <article
                        class="graph-node absolute -translate-x-1/2 -translate-y-1/2 select-none transition duration-200"
                        :class="[
                          draggedNodeId === node.id ? 'z-20 cursor-grabbing' : 'cursor-grab',
                          hasActiveGraphSearch
                            ? (isGraphSearchMatch(node)
                              ? 'opacity-100 scale-105'
                              : 'opacity-30')
                            : '',
                        ]"
                        :style="{ left: `${node.x}%`, top: `${node.y}%` }"
                        tabindex="0"
                        @pointerdown.stop="startNodeDrag(node, $event)"
                        @pointermove.stop="handleNodeDrag"
                        @pointerup.stop="stopNodeDrag"
                        @pointercancel.stop="stopNodeDrag"
                      >
                        <div
                          v-if="node.type === 'company'"
                          class="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full border border-white/65 bg-[linear-gradient(180deg,rgba(108,176,255,0.95)_0%,rgba(64,136,255,0.92)_100%)] text-center text-white shadow-[0_0_0_4px_rgba(255,255,255,0.12),0_18px_40px_-24px_rgba(111,177,255,0.95)]"
                        >
                          <UIcon name="i-heroicons-building-office-2" class="h-6 w-6" />
                          <p class="mt-1 px-2 text-xs font-semibold leading-tight">{{ node.label }}</p>
                        </div>

                        <div
                          v-else-if="node.type === 'contact'"
                          class="flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full border border-[#ffd65a] bg-[linear-gradient(180deg,rgba(255,191,0,0.98)_0%,rgba(217,163,0,0.94)_100%)] text-center text-white shadow-[0_0_0_4px_rgba(255,191,0,0.16),0_16px_34px_-22px_rgba(255,191,0,0.72)]"
                        >
                          <UIcon name="i-heroicons-user" class="h-5 w-5" />
                          <p class="mt-1 px-2 text-[11px] font-semibold leading-tight">{{ node.label }}</p>
                        </div>
                      </article>
                    </UTooltip>

                  </div>
                </div>
              </div>

              <div class="pointer-events-none absolute right-4 bottom-4 z-20">
                <div class="pointer-events-auto flex items-center gap-3 rounded-[22px] border border-white/20 bg-[linear-gradient(180deg,rgba(14,23,49,0.82)_0%,rgba(16,27,58,0.72)_100%)] px-3 py-3 text-white shadow-[0_22px_45px_-30px_rgba(15,23,42,0.9)] backdrop-blur-xl">
                  <div class="flex flex-col items-start">
                    <span class="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">Zoom</span>
                    <span class="mt-1 text-lg font-semibold tabular-nums">{{ zoomPercentage }}%</span>
                  </div>

                  <div class="h-10 w-px bg-white/12" />

                  <div class="flex items-center gap-2">
                    <button
                      v-for="control in graphControls"
                      :key="control.id"
                      type="button"
                      class="graph-control-button"
                      :class="control.className"
                      :aria-label="control.label"
                      :disabled="control.disabled"
                      @click="control.onClick"
                    >
                      <UIcon :name="control.icon" class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
              <p class="mt-4 text-4xl font-bold tracking-tight text-[var(--dashboard-ink)]">{{ card.value }}</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { dashboardTabs } from '~/utils/dashboard-tabs'

type GraphNodeType = 'company' | 'contact'
type GraphEntityType = 'company' | 'contact' | 'jobApplication' | 'freelanceMission' | 'interview'
type GraphConnectionVariant = 'hierarchy' | 'intercompany' | 'opportunity' | 'network'

interface GraphNodeDetails {
  website?: string | null
  linkedin?: string | null
  email?: string | null
  role?: string | null
  companyName?: string | null
}

interface GraphNode {
  id: string
  label: string
  subtitle: string
  type: GraphNodeType
  entityType: GraphEntityType
  details?: GraphNodeDetails
  x: number
  y: number
}

interface GraphApiNode {
  id: string
  label: string
  subtitle: string
  visualType: GraphNodeType
  entityType: GraphEntityType
  details?: GraphNodeDetails
}

interface GraphApiConnection {
  id: string
  fromId: string
  toId: string
  relationship: string
  variant: GraphConnectionVariant
}

interface GraphConnection {
  id: string
  fromId: string
  from: Pick<GraphNode, 'x' | 'y'>
  toId: string
  to: Pick<GraphNode, 'x' | 'y'>
  label: string
  fromLabel: string
  fromTypeLabel: string
  toLabel: string
  toTypeLabel: string
  variantLabel: string
  labelX: number
  labelY: number
  color: string
  markerId: string
  opacity: number
  isSearchMatch: boolean
  dashArray?: string
  labelClass: string
}

interface RelationshipsResponse {
  nodes: GraphApiNode[]
  connections: GraphApiConnection[]
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const isSigningOut = ref(false)
const graphStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const graphError = ref<unknown>(null)
const zoomLevel = ref(1)
const graphStageRef = ref<HTMLDivElement | null>(null)
const isPanning = ref(false)
const draggedNodeId = ref<string | null>(null)
const nodePositionOverrides = ref<Record<string, Pick<GraphNode, 'x' | 'y'>>>({})
const graphViewportWidth = ref(980)
const graphViewportHeight = ref(560)
const graphSearchQuery = ref('')

const MIN_ZOOM = 0.7
const MAX_ZOOM = 1.8
const ZOOM_STEP = 0.15
const DEFAULT_GRAPH_WIDTH = 980
const DEFAULT_GRAPH_HEIGHT = 560

const panState = {
  pointerId: -1,
  startX: 0,
  startY: 0,
  scrollLeft: 0,
  scrollTop: 0,
}

const nodeDragState = {
  pointerId: -1,
  nodeId: '',
  startClientX: 0,
  startClientY: 0,
  startX: 0,
  startY: 0,
}

const emptyGraphData: RelationshipsResponse = {
  nodes: [],
  connections: [],
}

let graphResizeObserver: ResizeObserver | null = null

const graphData = ref<RelationshipsResponse>(emptyGraphData)
const nodeTypeLabels: Record<GraphNodeType, string> = {
  company: 'Entreprise',
  contact: 'Contact',
}
const connectionVariantLabels: Record<GraphConnectionVariant, string> = {
  hierarchy: 'Relation hierarchique',
  intercompany: 'Relation inter-entreprise',
  opportunity: 'Opportunite',
  network: 'Mise en relation',
}

const tabs = computed(() =>
  dashboardTabs.map((tab) => ({
    ...tab,
    isActive: tab.activePaths.includes(route.path),
  })),
)

const graphWidth = computed(() => Math.max(1, Math.round(graphViewportWidth.value)))
const graphHeight = computed(() => Math.max(1, Math.round(graphViewportHeight.value)))

const graphCanvasStyle = computed(() => ({
  width: `${Math.max(graphWidth.value, Math.round(graphWidth.value * zoomLevel.value))}px`,
  height: `${Math.max(graphHeight.value, Math.round(graphHeight.value * zoomLevel.value))}px`,
}))

const graphSurfaceStyle = computed(() => ({
  width: `${graphWidth.value}px`,
  height: `${graphHeight.value}px`,
  transform: `scale(${zoomLevel.value})`,
}))

const userDisplayName = computed(() => {
  const firstName = user.value?.user_metadata?.firstName

  if (typeof firstName === 'string' && firstName.trim().length > 0) {
    return firstName
  }

  return user.value?.email ?? 'utilisateur inconnu'
})

const normalizeSearchValue = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const companySlots = [
  { x: 50, y: 12 },
  { x: 82, y: 28 },
  { x: 26, y: 76 },
  { x: 53, y: 92 },
  { x: 18, y: 22 },
  { x: 86, y: 76 },
  { x: 12, y: 52 },
  { x: 72, y: 10 },
]

const contactSlots = [
  { x: 11, y: 50 },
  { x: 34, y: 28 },
  { x: 82, y: 66 },
  { x: 69, y: 86 },
  { x: 24, y: 16 },
  { x: 91, y: 48 },
  { x: 42, y: 90 },
  { x: 9, y: 78 },
]

const getCircularPosition = (
  index: number,
  total: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  startAngle: number,
) => {
  const angle = startAngle + ((Math.PI * 2) / Math.max(total, 1)) * index

  return {
    x: Number((centerX + Math.cos(angle) * radiusX).toFixed(2)),
    y: Number((centerY + Math.sin(angle) * radiusY).toFixed(2)),
  }
}

const assignPositions = (
  nodes: GraphApiNode[],
  slots: Array<{ x: number, y: number }>,
  fallback: (index: number, total: number) => { x: number, y: number },
): GraphNode[] =>
  nodes.map((node, index) => {
    const position = slots[index] ?? fallback(index, nodes.length)

    return {
      id: node.id,
      label: node.label,
      subtitle: node.subtitle,
      type: node.visualType,
      entityType: node.entityType,
      details: node.details,
      x: position.x,
      y: position.y,
    }
  })

const positionedGraphNodes = computed<GraphNode[]>(() => {
  const companies = graphData.value.nodes
    .filter(node => node.visualType === 'company')
    .sort((left, right) => left.label.localeCompare(right.label, 'fr', { sensitivity: 'base' }))
  const contacts = graphData.value.nodes
    .filter(node => node.visualType === 'contact')
    .sort((left, right) => left.label.localeCompare(right.label, 'fr', { sensitivity: 'base' }))

  return [
    ...assignPositions(
      companies,
      companySlots,
      (index, total) => getCircularPosition(index, total, 50, 50, 37, 39, -Math.PI / 2),
    ),
    ...assignPositions(
      contacts,
      contactSlots,
      (index, total) => getCircularPosition(index, total, 50, 50, 44, 28, Math.PI),
    ),
  ]
})

const graphNodes = computed<GraphNode[]>(() =>
  positionedGraphNodes.value.map((node) => {
    const override = nodePositionOverrides.value[node.id]

    if (!override) {
      return node
    }

    return {
      ...node,
      x: override.x,
      y: override.y,
    }
  }),
)

const normalizedGraphSearchQuery = computed(() => normalizeSearchValue(graphSearchQuery.value))

const matchingGraphNodeIds = computed(() => {
  if (!normalizedGraphSearchQuery.value) {
    return new Set(graphNodes.value.map(node => node.id))
  }

  const matches = graphNodes.value
    .filter((node) => {
      const searchableParts = [
        node.label,
        node.subtitle,
        node.details?.role,
        node.details?.email,
        node.details?.companyName,
        node.details?.website,
        node.details?.linkedin,
      ]

      return searchableParts.some(part =>
        normalizeSearchValue(part).includes(normalizedGraphSearchQuery.value),
      )
    })
    .map(node => node.id)

  return new Set(matches)
})

const hasActiveGraphSearch = computed(() => normalizedGraphSearchQuery.value.length > 0)
const matchingGraphNodesCount = computed(() => matchingGraphNodeIds.value.size)

const graphSearchStatus = computed(() => {
  if (!hasActiveGraphSearch.value) {
    return `${graphNodes.value.length} noeud(s) disponibles`
  }

  if (matchingGraphNodesCount.value === 0) {
    return 'Aucun resultat pour cette recherche'
  }

  return `${matchingGraphNodesCount.value} resultat(s) correspond(ent)`
})

const nodeById = computed<Record<string, GraphNode>>(() =>
  Object.fromEntries(graphNodes.value.map(node => [node.id, node])),
)

const formatExternalLink = (value: string | null | undefined) => {
  if (!value) {
    return ''
  }

  const normalizedValue = /^https?:\/\//i.test(value) ? value : `https://${value}`

  try {
    const url = new URL(normalizedValue)
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')

    return `${url.hostname.replace(/^www\./i, '')}${path}`
  } catch {
    return value
  }
}

const normalizeExternalLink = (value: string | null | undefined) => {
  if (!value) {
    return '#'
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

const getConnectionVisual = (variant: GraphConnectionVariant) => {
  switch (variant) {
    case 'intercompany':
      return {
        color: '#f5b83d',
        markerId: 'graph-arrow-gold',
        opacity: 0.9,
        dashArray: '2 1.8',
        labelClass: 'bg-[#ffefc2] text-[#ab6d00]',
      }
    case 'network':
      return {
        color: '#25d48a',
        markerId: 'graph-arrow-green',
        opacity: 0.95,
        dashArray: '1.3 1.3',
        labelClass: 'bg-[#dafbe9] text-[#0f8c56]',
      }
    case 'opportunity':
      return {
        color: '#c47cff',
        markerId: 'graph-arrow-purple',
        opacity: 0.78,
        dashArray: '1 1.2',
        labelClass: 'bg-[#f3ddff] text-[#8847cb]',
      }
    default:
      return {
        color: '#7ab1ff',
        markerId: 'graph-arrow-blue',
        opacity: 0.68,
        dashArray: undefined,
        labelClass: 'bg-white/90 text-[#415dba]',
      }
  }
}

const graphConnections = computed<GraphConnection[]>(() =>
  graphData.value.connections.flatMap((connection) => {
    const from = nodeById.value[connection.fromId]
    const to = nodeById.value[connection.toId]

    if (!from || !to) {
      return []
    }

    const visual = getConnectionVisual(connection.variant)
    const isSearchMatch = matchingGraphNodeIds.value.has(connection.fromId) || matchingGraphNodeIds.value.has(connection.toId)
    const opacity = hasActiveGraphSearch.value
      ? (isSearchMatch ? Math.min(1, visual.opacity + 0.08) : 0.14)
      : visual.opacity

    return [{
      id: connection.id,
      fromId: connection.fromId,
      from,
      toId: connection.toId,
      to,
      label: connection.relationship,
      fromLabel: from.label,
      fromTypeLabel: nodeTypeLabels[from.type],
      toLabel: to.label,
      toTypeLabel: nodeTypeLabels[to.type],
      variantLabel: connectionVariantLabels[connection.variant],
      labelX: Number(((from.x + to.x) / 2).toFixed(2)),
      labelY: Number(((from.y + to.y) / 2).toFixed(2)),
      color: visual.color,
      markerId: visual.markerId,
      opacity,
      isSearchMatch,
      dashArray: visual.dashArray,
      labelClass: visual.labelClass,
    }]
  }),
)

const nodeTooltipMeta = computed<Record<string, {
  totalConnections: number
  relatedCompanies: string[]
  relatedContacts: string[]
  relationLabels: string[]
}>>(() => {
  const summary = Object.fromEntries(
    graphNodes.value.map(node => [node.id, {
      totalConnections: 0,
      relatedCompanies: [] as string[],
      relatedContacts: [] as string[],
      relationLabels: [] as string[],
    }]),
  )

  const pushUnique = (items: string[], value: string) => {
    if (value && !items.includes(value)) {
      items.push(value)
    }
  }

  for (const connection of graphConnections.value) {
    const fromNode = nodeById.value[connection.fromId]
    const toNode = nodeById.value[connection.toId]

    if (!fromNode || !toNode) {
      continue
    }

    summary[fromNode.id].totalConnections += 1
    summary[toNode.id].totalConnections += 1

    pushUnique(summary[fromNode.id].relationLabels, connection.label)
    pushUnique(summary[toNode.id].relationLabels, connection.label)

    if (toNode.type === 'company') {
      pushUnique(summary[fromNode.id].relatedCompanies, toNode.label)
    } else {
      pushUnique(summary[fromNode.id].relatedContacts, toNode.label)
    }

    if (fromNode.type === 'company') {
      pushUnique(summary[toNode.id].relatedCompanies, fromNode.label)
    } else {
      pushUnique(summary[toNode.id].relatedContacts, fromNode.label)
    }
  }

  return summary
})

const currentUserKey = computed(() => user.value?.id ?? '')

const graphStateMessage = computed(() => {
  if (graphStatus.value === 'pending') {
    return 'Chargement des relations en cours...'
  }

  if (graphStatus.value === 'error') {
    return 'Impossible de charger le graphe pour le moment.'
  }

  if (graphNodes.value.length === 0) {
    return 'Aucune relation disponible pour ce compte.'
  }

  if (hasActiveGraphSearch.value && matchingGraphNodesCount.value === 0) {
    return 'Aucun noeud ne correspond a cette recherche.'
  }

  return ''
})

const isGraphSearchMatch = (node: GraphNode) =>
  matchingGraphNodeIds.value.has(node.id)

const getAccessToken = async () => {
  const sessionResponse = await supabase.auth.getSession()
  const accessToken = sessionResponse.data.session?.access_token

  if (!accessToken) {
    throw new Error('Session Supabase introuvable.')
  }

  return accessToken
}

const requestRelationships = async () => {
  const accessToken = await getAccessToken()

  return await $fetch<RelationshipsResponse>('/api/relationships', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

const loadRelationships = async () => {
  if (!user.value) {
    graphData.value = emptyGraphData
    graphError.value = null
    graphStatus.value = 'idle'
    return
  }

  graphStatus.value = 'pending'

  try {
    graphData.value = await requestRelationships()
    graphError.value = null
    graphStatus.value = 'success'
  } catch (loadError) {
    console.error('Erreur lors du chargement du graphe de relations :', loadError)
    graphData.value = emptyGraphData
    graphError.value = loadError
    graphStatus.value = 'error'
  }
}

const legendItems = [
  {
    label: 'Entreprise',
    dotClass: 'bg-[#4f7cff]',
  },
  {
    label: 'Contact',
    dotClass: 'bg-[#ffbf00]',
  },
]

const legendLines = [
  {
    label: 'Lien hierarchique',
    lineClass: 'border-[#7ab1ff]',
    lineStyle: undefined,
  },
  {
    label: 'Relation inter-entreprise',
    lineClass: 'border-[#f5b83d]',
    lineStyle: { borderTopStyle: 'dashed' },
  },
]

const clampZoom = (value: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))))

const clampGraphCoordinate = (value: number, min: number, max: number) =>
  Number(Math.min(max, Math.max(min, value)).toFixed(2))

const getNodeBounds = (node: GraphNode) => {
  const nodeWidth = node.type === 'company' ? 86 : 74
  const nodeHeight = node.type === 'company' ? 86 : 74
  const xPadding = (nodeWidth / 2 / graphWidth.value) * 100
  const yPadding = (nodeHeight / 2 / graphHeight.value) * 100

  return {
    minX: xPadding,
    maxX: 100 - xPadding,
    minY: yPadding,
    maxY: 100 - yPadding,
  }
}

const clampNodePosition = (node: GraphNode, x: number, y: number) => {
  const bounds = getNodeBounds(node)

  return {
    x: clampGraphCoordinate(x, bounds.minX, bounds.maxX),
    y: clampGraphCoordinate(y, bounds.minY, bounds.maxY),
  }
}

const zoomIn = () => {
  zoomLevel.value = clampZoom(zoomLevel.value + ZOOM_STEP)
}

const zoomOut = () => {
  zoomLevel.value = clampZoom(zoomLevel.value - ZOOM_STEP)
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const startNodeDrag = (node: GraphNode, event: PointerEvent) => {
  if (event.button !== 0) {
    return
  }

  const target = event.currentTarget as HTMLElement | null

  if (!target) {
    return
  }

  event.preventDefault()

  draggedNodeId.value = node.id
  nodeDragState.pointerId = event.pointerId
  nodeDragState.nodeId = node.id
  nodeDragState.startClientX = event.clientX
  nodeDragState.startClientY = event.clientY
  nodeDragState.startX = node.x
  nodeDragState.startY = node.y

  target.setPointerCapture(event.pointerId)
}

const handleNodeDrag = (event: PointerEvent) => {
  if (draggedNodeId.value === null || event.pointerId !== nodeDragState.pointerId) {
    return
  }

  const node = nodeById.value[nodeDragState.nodeId]

  if (!node) {
    return
  }

  event.preventDefault()

  const deltaX = ((event.clientX - nodeDragState.startClientX) / zoomLevel.value / graphWidth.value) * 100
  const deltaY = ((event.clientY - nodeDragState.startClientY) / zoomLevel.value / graphHeight.value) * 100
  const nextPosition = clampNodePosition(node, nodeDragState.startX + deltaX, nodeDragState.startY + deltaY)

  nodePositionOverrides.value = {
    ...nodePositionOverrides.value,
    [node.id]: nextPosition,
  }
}

const stopNodeDrag = (event: PointerEvent) => {
  if (draggedNodeId.value === null || event.pointerId !== nodeDragState.pointerId) {
    return
  }

  const target = event.currentTarget as HTMLElement | null

  if (target?.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }

  draggedNodeId.value = null
  nodeDragState.pointerId = -1
  nodeDragState.nodeId = ''
}

const startGraphPan = (event: PointerEvent) => {
  if (event.button !== 0 || !canPanGraph.value) {
    return
  }

  const stage = event.currentTarget as HTMLDivElement | null

  if (!stage) {
    return
  }

  panState.pointerId = event.pointerId
  panState.startX = event.clientX
  panState.startY = event.clientY
  panState.scrollLeft = stage.scrollLeft
  panState.scrollTop = stage.scrollTop
  isPanning.value = true

  stage.setPointerCapture(event.pointerId)
}

const handleGraphPan = (event: PointerEvent) => {
  if (!isPanning.value || event.pointerId !== panState.pointerId) {
    return
  }

  const stage = event.currentTarget as HTMLDivElement | null

  if (!stage) {
    return
  }

  event.preventDefault()

  const deltaX = event.clientX - panState.startX
  const deltaY = event.clientY - panState.startY

  stage.scrollLeft = panState.scrollLeft - deltaX
  stage.scrollTop = panState.scrollTop - deltaY
}

const stopGraphPan = (event: PointerEvent) => {
  if (!isPanning.value || event.pointerId !== panState.pointerId) {
    return
  }

  const stage = event.currentTarget as HTMLDivElement | null

  if (stage?.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId)
  }

  isPanning.value = false
  panState.pointerId = -1
}

const zoomPercentage = computed(() => Math.round(zoomLevel.value * 100))
const canPanGraph = computed(() => zoomLevel.value > 1)

const graphControls = computed(() => [
  {
    id: 'zoom-in',
    icon: 'i-heroicons-plus',
    label: 'Zoom avant',
    disabled: zoomLevel.value >= MAX_ZOOM,
    className: 'graph-control-button-accent',
    onClick: zoomIn,
  },
  {
    id: 'zoom-out',
    icon: 'i-heroicons-minus',
    label: 'Zoom arriere',
    disabled: zoomLevel.value <= MIN_ZOOM,
    className: 'graph-control-button-neutral',
    onClick: zoomOut,
  },
  {
    id: 'zoom-reset',
    icon: 'i-heroicons-arrow-path',
    label: 'Reinitialiser le zoom',
    disabled: zoomLevel.value === 1,
    className: 'graph-control-button-neutral',
    onClick: resetZoom,
  },
])

const syncGraphViewportSize = () => {
  const stage = graphStageRef.value

  if (!stage) {
    return
  }

  graphViewportWidth.value = Math.max(1, Math.round(stage.clientWidth || DEFAULT_GRAPH_WIDTH))
  graphViewportHeight.value = Math.max(1, Math.round(stage.clientHeight || DEFAULT_GRAPH_HEIGHT))
}

const summaryCards = computed(() => [
  {
    label: 'Entreprises',
    value: graphNodes.value.filter(node => node.type === 'company').length,
    caption: 'Organisations dans votre reseau',
    icon: 'i-heroicons-building-office-2',
    iconBg: 'bg-[#4f7cff]',
    className: 'border-[#bfdbfe] bg-[linear-gradient(135deg,#edf4ff_0%,#f7faff_100%)]',
  },
  {
    label: 'Contacts',
    value: graphNodes.value.filter(node => node.type === 'contact').length,
    caption: 'Personnes cles identifiees',
    icon: 'i-heroicons-user-group',
    iconBg: 'bg-[#ffbf00]',
    className: 'border-[#ffd65a] bg-[linear-gradient(135deg,#fff4cc_0%,#fff9e6_100%)]',
  },
])

watch(positionedGraphNodes, (nodes) => {
  const validIds = new Set(nodes.map(node => node.id))
  const nextOverrides = Object.fromEntries(
    Object.entries(nodePositionOverrides.value).filter(([nodeId]) => validIds.has(nodeId)),
  )

  if (Object.keys(nextOverrides).length !== Object.keys(nodePositionOverrides.value).length) {
    nodePositionOverrides.value = nextOverrides
  }

  if (draggedNodeId.value && !validIds.has(draggedNodeId.value)) {
    draggedNodeId.value = null
    nodeDragState.pointerId = -1
    nodeDragState.nodeId = ''
  }
}, { immediate: true })

watch(currentUserKey, () => {
  loadRelationships()
}, { immediate: true })

const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.access_token) {
    graphData.value = emptyGraphData
    graphError.value = null
    graphStatus.value = 'idle'
    return
  }

  loadRelationships()
})

onMounted(() => {
  syncGraphViewportSize()

  if (typeof ResizeObserver !== 'undefined' && graphStageRef.value) {
    graphResizeObserver = new ResizeObserver(() => {
      syncGraphViewportSize()
    })
    graphResizeObserver.observe(graphStageRef.value)
  }

  loadRelationships()
})

onBeforeUnmount(() => {
  graphResizeObserver?.disconnect()
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

<style scoped>
.graph-stage {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.92) rgba(255, 255, 255, 0.18);
  touch-action: none;
}

.graph-stage::-webkit-scrollbar {
  height: 10px;
}

.graph-stage::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.18);
}

.graph-stage::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
}

.graph-stage::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 1);
}

.graph-node {
  touch-action: none;
}

.graph-surface-ambient {
  overflow: hidden;
}

.graph-surface-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(26px);
  opacity: 0.85;
  will-change: transform;
  animation: graph-orb-drift 18s ease-in-out infinite alternate;
}

.graph-surface-orb-mint {
  top: 10%;
  left: 8%;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle at 35% 35%, rgba(117, 238, 205, 0.28), transparent 62%);
}

.graph-surface-orb-blue {
  top: 14%;
  right: 10%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle at 45% 45%, rgba(117, 182, 255, 0.24), transparent 64%);
  animation-duration: 22s;
  animation-delay: -4s;
}

.graph-surface-orb-purple {
  right: 26%;
  bottom: 10%;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle at 45% 45%, rgba(196, 120, 255, 0.22), transparent 64%);
  animation-duration: 20s;
  animation-delay: -9s;
}

@keyframes graph-orb-drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(18px, -12px, 0) scale(1.05);
  }

  100% {
    transform: translate3d(-14px, 16px, 0) scale(0.97);
  }
}

.graph-control-button {
  display: inline-flex;
  height: 2.75rem;
  width: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 14px 28px -18px rgba(15, 23, 42, 0.95);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.graph-control-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 30px -18px rgba(15, 23, 42, 0.9);
}

.graph-control-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.68);
  outline-offset: 2px;
}

.graph-control-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
}

.graph-control-button-accent {
  background: linear-gradient(180deg, rgba(122, 177, 255, 0.95) 0%, rgba(79, 124, 255, 0.92) 100%);
  color: #ffffff;
}

.graph-control-button-accent:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.28);
}

.graph-control-button-neutral {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
}

.graph-control-button-neutral:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.26);
  background: rgba(255, 255, 255, 0.16);
}

@media (prefers-reduced-motion: reduce) {
  .graph-surface-orb {
    animation: none;
  }
}
</style>
