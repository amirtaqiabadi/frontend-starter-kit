export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const PERSIAN_KEYBOARD_ERROR = "کیبورد خود را انگلیسی کنید."
export const GUESSABLE_PASSWORD_ERROR = "رمز انتخابی شما قابل حدس است."

const PERSIAN_KEYBOARD =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "pssw0rd",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "123123",
  "12341234",
  "111111",
  "11111111",
  "000000",
  "00000000",
  "654321",
  "qwerty",
  "qwerty123",
  "qwertyui",
  "qwertyuiop",
  "qazwsx",
  "zaq12wsx",
  "abcdef",
  "abcdefg",
  "abcdefgh",
  "abc123",
  "abcd1234",
  "letmein",
  "letmein1",
  "iloveyou",
  "admin",
  "admin123",
  "welcome",
  "welcome1",
  "changeme",
  "secret",
  "secret123",
  "monkey",
  "dragon",
  "master",
  "login",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "shadow",
  "trustno1",
  "whatever",
  "mustang",
  "access",
  "flower",
  "hello",
  "charlie",
  "donald",
  "freedom",
])

/** True when the password is a well-known guessable value, ignoring added symbols. */
export function isGuessablePassword(password: string) {
  const key = password.toLowerCase().replace(/[^a-z0-9]/g, "")
  return key.length > 0 && COMMON_PASSWORDS.has(key)
}

/** Removes Persian letters and digits so a Latin keyboard is required. */
export function stripPersianKeyboard(value: string) {
  const next = value.replace(PERSIAN_KEYBOARD, "")

  return {
    value: next,
    rejected: next !== value,
  }
}

/** Returns a length error, or empty when the password is 8 to 128 characters. */
export function passwordLengthError(password: string) {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return "رمز عبور باید بین ۸ تا ۱۲۸ نویسه باشد."
  }

  return ""
}

/** Returns a Persian validation message, or empty when a new password can be sent. */
export function passwordError(password: string) {
  if (isGuessablePassword(password)) {
    return GUESSABLE_PASSWORD_ERROR
  }

  const lengthIssue = passwordLengthError(password)
  if (lengthIssue) {
    return lengthIssue
  }

  if (!passwordRulesMet(password)) {
    return "رمز عبور شرایط لازم را ندارد."
  }

  return ""
}

export type PasswordRule = {
  id: "length" | "letters" | "digit" | "symbol"
  label: string
  met: boolean
}

/** Live checks shown while a new password is typed. */
export function passwordRules(password: string): PasswordRule[] {
  return [
    {
      id: "length",
      label: "حداقل ۸ کارکتر",
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "letters",
      label: "حداقل یک حرف انگلیسی بزرگ و کوچک",
      met: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    {
      id: "digit",
      label: "حداقل یک عدد",
      met: /[0-9]/.test(password),
    },
    {
      id: "symbol",
      label: "حداقل یک کارکتر خاص",
      met: /[^A-Za-z0-9\s]/.test(password),
    },
  ]
}

/** True when every new-password rule is satisfied. */
export function passwordRulesMet(password: string) {
  return passwordRules(password).every((rule) => rule.met)
}

const PASSWORD_STRENGTH_LABELS = ["", "ضعیف", "متوسط", "خوب", "قوی"] as const

export type PasswordStrength = {
  score: number
  label: (typeof PASSWORD_STRENGTH_LABELS)[number]
}

/** Score from 0 to the rule count, based on how many password rules are met. */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "" }
  }

  if (isGuessablePassword(password)) {
    return { score: 1, label: "ضعیف" }
  }

  const met = passwordRules(password).filter((rule) => rule.met).length
  const score = Math.max(met, 1)

  return {
    score,
    label: PASSWORD_STRENGTH_LABELS[score] ?? "",
  }
}
