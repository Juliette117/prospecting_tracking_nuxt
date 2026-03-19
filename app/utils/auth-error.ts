type AuthLikeError = {
  code?: string
  message?: string
  status?: number
}

const AUTH_ERROR_TRANSLATIONS = [
  {
    codes: ['invalid_credentials'],
    messages: ['invalid login credentials'],
    translation: 'Email ou mot de passe incorrect.',
  },
  {
    codes: ['email_not_confirmed'],
    messages: ['email not confirmed'],
    translation: "Veuillez confirmer votre adresse e-mail avant de vous connecter.",
  },
  {
    codes: ['user_already_exists', 'email_exists'],
    messages: ['user already registered', 'user already exists'],
    translation: 'Un compte existe deja avec cette adresse e-mail.',
  },
  {
    codes: ['weak_password'],
    messages: ['password should be at least', 'weak password'],
    translation: 'Le mot de passe est trop faible.',
  },
  {
    codes: ['validation_failed'],
    messages: ['unable to validate email address', 'invalid email', 'email address is invalid'],
    translation: "L'adresse e-mail saisie n'est pas valide.",
  },
  {
    codes: ['signup_disabled'],
    messages: ['signups not allowed for this instance', 'signup is disabled'],
    translation: "L'inscription est actuellement desactivee.",
  },
  {
    codes: ['over_email_send_rate_limit', 'over_request_rate_limit'],
    messages: ['email rate limit exceeded', 'too many requests'],
    translation: 'Trop de tentatives. Veuillez patienter avant de reessayer.',
  },
]

export const getFrenchAuthErrorMessage = (
  error: AuthLikeError | null | undefined,
  fallback = "Une erreur est survenue.",
) => {
  if (!error) {
    return fallback
  }

  const code = error.code?.toLowerCase() ?? ''
  const message = error.message?.toLowerCase() ?? ''

  const match = AUTH_ERROR_TRANSLATIONS.find((entry) =>
    entry.codes.some((item) => item === code) ||
    entry.messages.some((item) => message.includes(item)),
  )

  if (match) {
    return match.translation
  }

  if (error.status === 429) {
    return 'Trop de tentatives. Veuillez patienter avant de reessayer.'
  }

  return fallback
}
