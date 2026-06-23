import { auth } from '@clerk/nextjs/server'
import { vi, type Mock } from 'vitest'

export function mockClerkAuth(userId: string) {
  ;(auth as unknown as Mock).mockResolvedValue({ userId })
}

export function mockClerkUnauth() {
  ;(auth as unknown as Mock).mockResolvedValue({ userId: null })
}
