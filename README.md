# Amplitude SaaS — Back-office admin

Interface web pour piloter l'app mobile **Amplitude** : contenu (méthodes, séances Vimeo, exercices), utilisateurs, abonnements et modération communauté.

Même palette sombre que l'app (`#0B0B0B`, accent `#EEDC9A`).

## Prérequis

- Node.js 20+
- Le même projet **Supabase** que l'app mobile
- Un compte Supabase Auth pour vous connecter (email listé dans `ADMIN_EMAILS`)

## Installation

```bash
cd amplitude-saas
cp .env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (auth admin) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role — **serveur uniquement** |
| `ADMIN_EMAILS` | Emails autorisés, séparés par des virgules |

## Fonctionnalités

| Section | Actions |
|---------|---------|
| **Dashboard** | Stats utilisateurs, abos actifs, séances du mois |
| **Méthodes** | CRUD programmes (`programs`) — premium, liens séances |
| **Séances** | CRUD vidéos Vimeo — statut `draft` / `published` / `archived` |
| **Exercices** | Prescription trainings complémentaires (`video_exercises`) |
| **Utilisateurs** | Profils, override abonnement manuel |
| **Abonnements** | Liste `subscriptions` + MRR estimé |
| **Communauté** | Suppression de posts |

## Architecture

```
Admin (Next.js)
  │  Auth Supabase (emails ADMIN_EMAILS)
  │  Mutations via service role (Server Actions)
  ▼
Supabase (même base que l'app)
  │  programs, videos, video_exercises (écriture admin)
  │  profiles, subscriptions (lecture + override)
  ▼
App mobile Amplitude (lecture anon + RLS)
```

Voir aussi `../supabase/CONTENT_SYNC.md` pour le workflow Vimeo.

## Sécurité

- La **service role key** ne doit jamais être exposée côté client
- Seuls les emails `ADMIN_EMAILS` accèdent au back-office
- Créez un utilisateur admin dans Supabase Auth (Dashboard → Authentication → Users)

## Prochaines étapes suggérées

- Webhook RevenueCat → sync automatique des abonnements
- Upload covers / thumbnails via Supabase Storage
- Prévisualisation lecteur Vimeo dans l'admin
- Rôle `admin_users` en base plutôt qu'une liste d'emails en env
