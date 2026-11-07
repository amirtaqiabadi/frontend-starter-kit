export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyui",
  "qwerty123",
  "11111111",
  "00000000",
  "abcdefgh",
  "letmein1",
  "iloveyou",
  "admin123",
  "12341234",
])

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
  const lengthIssue = passwordLengthError(password)
  if (lengthIssue) {
    return lengthIssue
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "این رمز عبور خیلی ساده است. رمز دیگری انتخاب کنید."
  }

  return ""
}
