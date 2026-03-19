export default defineNuxtConfig({
  compatibilityDate: "2026-03-17",
  devtools: { enabled: false },
  ssr: false,
  nitro: {
    preset: process.env.VERCEL ? 'vercel' : undefined,
  },
  runtimeConfig: {
    googleCalendarClientId: process.env.GOOGLE_CALENDAR_CLIENT_ID ?? '',
    googleCalendarClientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? '',
    googleCalendarRedirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? '',
  },
  modules: [
    '@nuxtjs/supabase',
    '@nuxt/ui',
  ],
  css: ['~/assets/css/main.css'],
  ui: {
    fonts: false,
  },

  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY ?? process.env.SUPABASE_KEY ?? '',
    secretKey: process.env.NUXT_SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SECRET_KEY ?? '',
    types: '~~/database.types.ts',
    redirectOptions: {
      login: "/auth/login",
      callback: "/confirm",
      exclude: ["/auth/register"],
    },
  },
})
