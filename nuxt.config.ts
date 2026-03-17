export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,
  modules: [
    '@nuxtjs/supabase',
    '@nuxt/ui',
  ],
  css: ['~/assets/css/main.css'],

  supabase: {
    redirectOptions: {
      login: "/auth/login",
      callback: "/confirm",
      exclude: ["/auth/register"],
    },
  },
})