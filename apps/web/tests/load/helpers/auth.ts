export function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${__ENV.TESTLENS_API_KEY}`,
    "Content-Type": "application/json",
  };
}
