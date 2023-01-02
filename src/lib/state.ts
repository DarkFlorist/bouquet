import { browser } from "$app/environment"
import { derived, writable } from "svelte/store"
import type { ImportPayload } from "./types"

export const ssr = false

export const wallets = writable<string[]>([])
export const payload = writable<ImportPayload | null>(null)
export const activeSession = derived([wallets, payload], ([$wallets, $payload]) => $wallets.length > 0)

if (browser) {
  wallets.set(JSON.parse(localStorage.getItem('wallets') ?? '[]'))
  payload.set(JSON.parse(localStorage.getItem('payload') ?? 'null'))

  // @dev: Automatically update localStorage on state change, manually update payload
  wallets.subscribe((data) => localStorage.setItem('wallets', JSON.stringify(data)))
}
