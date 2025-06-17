import chalk from 'chalk'

// =============================================================================
// Version Decorator Types
// =============================================================================

export interface VersionOptions {
  version?: boolean
}

export interface VersionInfo {
  name        : string
  version     : string
  description?: string
  author?     : string
  license?    : string
  homepage?   : string
}

// =============================================================================
// Version Formatting Functions
// =============================================================================

export function formatVersionInfo(versionInfo: VersionInfo): string {
  const lines: string[] = []
  
  lines.push(chalk.cyan.bold(`${versionInfo.name} v${versionInfo.version}`))
  
  if (versionInfo.description) {
    lines.push('')
    lines.push(chalk.white(versionInfo.description))
  }
  
  lines.push('')
  
  if (versionInfo.author) {
    lines.push(chalk.gray(`Author: ${versionInfo.author}`))
  }
  
  if (versionInfo.license) {
    lines.push(chalk.gray(`License: ${versionInfo.license}`))
  }
  
  if (versionInfo.homepage) {
    lines.push(chalk.gray(`Homepage: ${versionInfo.homepage}`))
  }
  
  lines.push('')
  
  return lines.join('\n')
}

export function createDefaultVersionInfo(): VersionInfo {
  return {
    name       : 'ChainChirp CLI',
    version    : '0.3.0',
    description: 'A comprehensive Bitcoin ecosystem command-line tool',
    author     : 'ChainChirp Team',
    license    : 'MIT',
    homepage   : 'https://github.com/chainchirp/chainchirp-cli'
  }
}

// =============================================================================
// Version Decorator
// =============================================================================

export function withVersion<T extends VersionOptions>(
  versionInfo?: VersionInfo
) {
  const info = versionInfo || createDefaultVersionInfo()
  
  return function(target: (options: Omit<T, 'version'>) => Promise<void>) {
    return async function(options: T) {
      // Show version if requested
      if (options.version) {
        console.log(formatVersionInfo(info))
        return
      }
      
      // Execute original command
      const { version: _, ...commandOptions } = options
      return target(commandOptions as Omit<T, 'version'>)
    }
  }
}

// =============================================================================
// Version Utilities
// =============================================================================

export function getVersionString(versionInfo?: VersionInfo): string {
  const info = versionInfo || createDefaultVersionInfo()
  return `${info.name} v${info.version}`
}

export function showVersion(versionInfo?: VersionInfo): void {
  console.log(formatVersionInfo(versionInfo || createDefaultVersionInfo()))
}
