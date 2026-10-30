const REQUEST_MS = 400

/** Waits for the login request placeholder until a real API is connected. */
async function waitForLoginRequest() {
  await new Promise((resolve) => {
    window.setTimeout(resolve, REQUEST_MS)
  })
}

/** Asks for a one-time code for this mobile number. */
export async function requestLoginOtp(phone: string) {
  if (!phone) {
    throw new Error("شماره موبایل لازم است.")
  }

  await waitForLoginRequest()
}

/** Checks the one-time code for a mobile number. */
export async function verifyLoginOtp(input: { phone: string; code: string }) {
  if (!input.phone || !input.code) {
    throw new Error("شماره و کد لازم است.")
  }

  await waitForLoginRequest()
}
