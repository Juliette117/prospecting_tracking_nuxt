# Prospecting Tracking Platform

Application Nuxt de suivi de prospection professionnelle.

Le projet permet a un utilisateur authentifie de centraliser :

- ses candidatures
- ses missions freelance
- ses entretiens
- son graphe de relations entreprises / contacts
- ses indicateurs de suivi dans un dashboard unique

## Apercu

Le produit est organise autour de 6 ecrans metier :

- `dashboard` : KPIs, pipeline, activites recentes et prochaines actions
- `recherche-emploi` : suivi CRUD des candidatures
- `missions-freelance` : suivi CRUD des opportunites et missions freelance
- `entretiens` : gestion des entretiens passes et a venir
- `graphe-relations` : visualisation relationnelle entreprises / contacts / opportunites
- `premium` : vitrine produit pour une future offre Pro

L'application utilise `Supabase Auth` pour la session utilisateur et `Prisma` pour l'acces aux donnees PostgreSQL.

## Stack technique

- `Nuxt 4`
- `Vue 3`
- `@nuxt/ui`
- `@nuxtjs/supabase`
- `Prisma`
- `PostgreSQL`
- `Zod`

Notes techniques importantes :

- rendu en `SSR: false`
- couche API dans `server/api`
- logique metier partagee dans `server/utils`
- schema Prisma dans `prisma/schema.prisma`
- integration Google Calendar cote serveur

## Fonctionnalites

### Authentification

- inscription via `Supabase Auth`
- connexion email / mot de passe
- redirection depuis `/` vers `/dashboard` ou `/auth/login`
- deconnexion depuis les pages metier

### Dashboard

- KPIs globaux
- synthese candidatures / freelance / entretiens
- timeline d'activite
- prochaines actions avec priorisation urgent / non urgent

### Candidatures

- creation, edition et suppression
- suivi du poste, du statut, de l'entreprise et des notes

### Missions freelance

- creation, edition et suppression
- suivi du titre, du budget, du statut et des periodes

### Entretiens

- creation, edition et suppression
- distinction entre entretiens a venir et passes
- edition du feedback
- synchronisation Google Calendar quand la configuration OAuth est disponible

### Graphe de relations

- affichage visuel des entreprises et contacts
- liens de relation entre les noeuds
- zoom, pan et repositionnement manuel

## Structure du projet

```text
app/
  app.vue
  assets/css/
  composables/
  pages/
  utils/
prisma/
  migrations/
  schema.prisma
  seed.mjs
server/
  api/
  utils/
nuxt.config.ts
prisma.config.ts
```

## Installation

### 1. Installer les dependances

```bash
npm install
```

### 2. Renseigner les variables d'environnement

Variables minimales pour demarrer :

```env
DIRECT_URL=postgresql://...
DATABASE_URL=postgresql://...

NUXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
NUXT_SUPABASE_SECRET_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Variables optionnelles pour Google Calendar :

```env
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```


### 3. Appliquer les migrations Prisma

```bash
npx prisma migrate deploy
```

En local, si tu initialises une base de dev depuis zero, tu peux aussi utiliser :

```bash
npx prisma migrate dev
```

### 4. Lancer le seed de donnees de demo

```bash
npm run db:seed
```

Le seed :

- cree ou met a jour un utilisateur Supabase
- peuple les entreprises
- ajoute des candidatures
- ajoute des missions freelance
- ajoute des entretiens
- prepare des donnees de demo coherentes pour le dashboard

### 5. Demarrer l'application

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Scripts utiles

```bash
npm run dev
npm run build
npm run preview
npm run generate
npm run db:seed
```

Point d'attention :

- `db:sync-user` est declare dans `package.json`, mais le fichier cible n'est pas present dans le depot actuel

## Base de donnees

Le schema Prisma couvre notamment :

- `User`
- `Company`
- `JobApplication`
- `FreelanceMission`
- `Interviews`
- `Contacts`
- `Relationship`
- `GoogleCalendarConnection`
- `GoogleOAuthState`

Migrations presentes :

- `20260318143300_init`
- `20260319091500_google_calendar_integration`

## Google Calendar

L'integration Google Calendar est branchee cote application.

Ce qui est en place :

- connexion OAuth Google cote serveur
- stockage des tokens en base
- creation ou mise a jour d'un evenement Google a partir d'un entretien
- deconnexion Google Calendar
- messages UI explicites si la migration Prisma ou la configuration Google manque

Configuration a prevoir dans Google Cloud :

1. Activer `Google Calendar API`
2. Creer un client OAuth de type `Web application`
3. Ajouter l'URI de redirection :

```text
http://localhost:3000/api/google-calendar/callback
```

4. Si l'application est en mode `Testing`, ajouter un compte Google dans les `Test users`

## API serveur

Routes principales exposees :

- `POST /api/auth/register`
- `GET /api/dashboard`
- `GET /api/job-search`
- `POST /api/job-search`
- `PATCH /api/job-search/:id`
- `DELETE /api/job-search/:id`
- `GET /api/freelance`
- `POST /api/freelance`
- `PATCH /api/freelance/:id`
- `DELETE /api/freelance/:id`
- `GET /api/interviews`
- `POST /api/interviews`
- `PATCH /api/interviews/:id`
- `DELETE /api/interviews/:id`
- `GET /api/relationships`
- `POST /api/google-calendar/connect`
- `GET /api/google-calendar/callback`
- `POST /api/google-calendar/disconnect`
- `POST /api/google-calendar/interviews/:id`

## Build production

```bash
npm run build
npm run preview
```

## Deploiement Vercel

Le projet est maintenant prepare pour un deploiement sur `Vercel` avec :

- un `vercel.json`
- un preset `Nitro` adapte quand l'environnement `VERCEL` est present
- une generation explicite du client Prisma au `postinstall`
- un pool PostgreSQL plus prudent pour un contexte serverless

Variables a definir dans Vercel :

- `DIRECT_URL`
- `DATABASE_URL`
- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_KEY`
- `NUXT_SUPABASE_SECRET_KEY`
- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`

Variable optionnelle :

- `PG_POOL_MAX`
  conseil de depart : `1`

Point d'attention pour Google Calendar :

- en production Vercel, `GOOGLE_CALENDAR_REDIRECT_URI` doit pointer vers ton domaine Vercel, par exemple :
  `https://ton-app.vercel.app/api/google-calendar/callback`

## Etat du projet

Le projet couvre un flux de suivi de prospection avec authentification, dashboard, CRUD metier, graphe relationnel et integration calendrier.

## Futur du projet

Pistes d'evolution envisagees pour les prochaines iterations :

- ajout d'un assistant IA pour proposer des relances, resumer des feedbacks d'entretien et aider a prioriser les actions
- scoring automatique des candidatures et missions selon le statut, l'anciennete et le niveau de priorite
- filtres et recherches avances sur toutes les pages
- exports `CSV` ou `PDF`
- rappels intelligents pour les relances et les deadlines
- enrichissement du graphe de relations avec plus de vues et de regroupements
- ouverture progressive de l'offre `Premium`
