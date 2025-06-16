import gradient from 'gradient-string'

/**
 * Generate and return the ChainChirp CLI banner
 */
export function banner(): string {
  const logo = `
 ╭─────────────────────────────────────╮
 │                                     │
 │   ⛓️  🐦  ChainChirp CLI  🐦  ⛓️    │
 │                                     │
 │      Bitcoin Ecosystem Tool        │
 │                                     │
 ╰─────────────────────────────────────╯
`

  return gradient([ '#f7931a', '#ffaa00' ])(logo)
}

/**
 * Print the banner to console
 */
export function printBanner(): void {
  console.log(banner())
}

/**
 * Get a simple text version of the banner (no colors)
 */
export function getSimpleBanner(): string {
  return `
 ╭─────────────────────────────────────╮
 │                                     │
 │   ⛓️  🐦  ChainChirp CLI  🐦  ⛓️    │
 │                                     │
 │      Bitcoin Ecosystem Tool        │
 │                                     │
 ╰─────────────────────────────────────╯
`
}
