# Contributing Guide

**Help improve ChainChirp CLI with your contributions.**

## Getting Started

ChainChirp welcomes contributions from developers of all skill levels. Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/TristanBietsch/chainchirp.git
cd chainchirp

# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Build project
bun run build
```

## Development Environment

### Prerequisites

- **Bun**: 1.0+ (primary runtime)
- **Node.js**: 18+ (alternative runtime)
- **Git**: For version control
- **Terminal**: Modern terminal with UTF-8 support

### Recommended Tools

- **VS Code**: With TypeScript and ESLint extensions
- **GitHub CLI**: For managing pull requests
- **jq**: For testing JSON output

### Project Setup

```bash
# Fork the repository on GitHub
gh repo fork TristanBietsch/chainchirp

# Clone your fork
git clone https://github.com/YOUR_USERNAME/chainchirp.git
cd chainchirp

# Add upstream remote
git remote add upstream https://github.com/TristanBietsch/chainchirp.git

# Install dependencies
bun install

# Verify setup
bun run dev price
```

## Development Workflow

### 1. Branch Naming

Use descriptive branch names with prefixes:

```bash
# Features
git checkout -b feature/lightning-network-support
git checkout -b feature/add-ethereum-commands

# Bug fixes
git checkout -b fix/api-timeout-handling
git checkout -b fix/sparkline-rendering

# Documentation
git checkout -b docs/update-installation-guide
git checkout -b docs/add-examples

# Refactoring
git checkout -b refactor/service-layer-cleanup
git checkout -b refactor/improve-error-handling
```

### 2. Development Commands

```bash
# Development with hot reload
bun run dev [command] [options]

# Run specific command
bun run dev price --detailed
bun run dev spark --timeframe 7d

# Run tests
bun test                    # All tests
bun test services          # Service tests only
bun test --watch           # Watch mode

# Linting and formatting
bun run lint              # ESLint
bun run lint --fix        # Auto-fix issues

# Type checking
tsc --noEmit             # TypeScript check

# Build
bun run build            # Production build
```

### 3. Testing Your Changes

```bash
# Test basic functionality
bun run dev price
bun run dev volume --watch
bun run dev spark --timeframe 7d

# Test JSON output
bun run dev price --json | jq

# Test error handling
bun run dev price --currency invalid

# Test with different APIs
export DEBUG=1
bun run dev price
```

## Code Style & Standards

### TypeScript Standards

- **Strict mode**: All code must pass TypeScript strict checks
- **Explicit types**: Prefer explicit types over `any`
- **Interfaces over types**: Use interfaces for object shapes
- **Enums for constants**: Use enums for fixed value sets

```typescript
// Good
interface PriceData {
  price: number
  currency: Currency
  timestamp: Date
}

// Avoid
type PriceData = {
  price: any
  currency: string
  timestamp: any
}
```

### Code Organization

```typescript
// File structure pattern
export class ServiceName {
  // Public methods first
  async publicMethod(): Promise<ReturnType> {
    // Implementation
  }
  
  // Private methods last
  private privateHelper(): void {
    // Implementation
  }
}
```

### Error Handling

```typescript
// Always use specific error types
throw new ValidationError('Invalid currency: xyz')

// Handle errors gracefully
try {
  const data = await service.fetchData()
  return data
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API-specific errors
  }
  throw error
}
```

### Async/Await

```typescript
// Good - use async/await
async function fetchPrice(): Promise<number> {
  const response = await api.getPrice()
  return response.price
}

// Avoid - promise chains
function fetchPrice(): Promise<number> {
  return api.getPrice().then(response => response.price)
}
```

## Adding New Features

### 1. Adding a New Command

Create a new market command example:

```bash
# 1. Create command file
touch src/commands/market/sentiment.ts

# 2. Implement command
cat > src/commands/market/sentiment.ts << 'EOF'
export async function sentiment(options: SentimentOptions): Promise<void> {
  // Implementation
}
EOF

# 3. Add to index
# Edit src/commands/market/index.ts

# 4. Register in CLI
# Edit src/index.ts

# 5. Add tests
touch tests/commands/market/sentiment.test.ts
```

### 2. Adding a New Service

```typescript
// src/services/market/sentimentService.ts
export class SentimentService extends BaseService {
  async getSentiment(): Promise<SentimentData> {
    return this.fetchWithCache('sentiment', async () => {
      const response = await this.client.request('/sentiment')
      return this.transformSentimentData(response)
    }, 300) // 5 minute cache
  }
  
  private transformSentimentData(data: any): SentimentData {
    return {
      score: data.fear_greed_index,
      classification: data.value_classification,
      timestamp: new Date(data.timestamp)
    }
  }
}
```

### 3. Adding a New API Provider

```typescript
// src/services/providers/newProvider.ts
export class NewProvider implements ApiProvider {
  name = 'newprovider'
  baseUrl = 'https://api.newprovider.com'
  rateLimit = { requests: 100, window: 60000 }
  
  async fetchPrice(): Promise<RawPriceData> {
    const response = await this.request('/price/btc')
    return this.transformPrice(response)
  }
  
  private transformPrice(data: any): RawPriceData {
    return {
      price: data.current_price,
      change24h: data.price_change_24h,
      timestamp: data.last_updated
    }
  }
}
```

## Testing Guidelines

### Unit Tests

Write tests for all new functionality:

```typescript
// tests/services/priceService.test.ts
describe('PriceService', () => {
  let service: PriceService
  let mockClient: jest.Mocked<ApiClient>
  
  beforeEach(() => {
    mockClient = createMockClient()
    service = new PriceService(mockClient)
  })
  
  describe('getPrice', () => {
    it('should return price data', async () => {
      // Arrange
      mockClient.request.mockResolvedValue({
        current_price: 50000,
        price_change_percentage_24h: 2.5
      })
      
      // Act
      const result = await service.getPrice('usd')
      
      // Assert
      expect(result).toEqual({
        price: 50000,
        currency: 'usd',
        change24h: 2.5
      })
    })
    
    it('should handle API errors gracefully', async () => {
      // Arrange
      mockClient.request.mockRejectedValue(new ApiError('API failed'))
      
      // Act & Assert
      await expect(service.getPrice('usd')).rejects.toThrow('API failed')
    })
  })
})
```

### Integration Tests

Test command integration:

```typescript
// tests/integration/commands.test.ts
describe('Price Command Integration', () => {
  it('should display price information', async () => {
    const consoleSpy = jest.spyOn(console, 'log')
    
    await priceCommand({ currency: 'usd' })
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Bitcoin')
    )
  })
})
```

### Manual Testing

```bash
# Test new command
bun run dev newcommand --option value

# Test with different currencies
bun run dev price --currency eur
bun run dev price --currency btc

# Test error scenarios
bun run dev price --currency invalid
bun run dev price --interval 0

# Test JSON output
bun run dev price --json | jq '.price'
```

## Commit Guidelines

### Commit Message Format

Use conventional commits:

```
type(scope): description

body (optional)

footer (optional)
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code formatting
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

```bash
# Good commit messages
git commit -m "feat(market): add sentiment analysis command"
git commit -m "fix(api): handle rate limit errors gracefully"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(services): improve error handling"

# Multi-line commit
git commit -m "feat(lightning): add Lightning Network support

- Add ln-capacity command for network capacity
- Add ln-nodes command for node statistics
- Implement 1ML API integration
- Add comprehensive tests

Closes #123"
```

## Pull Request Process

### 1. Before Submitting

```bash
# Update from upstream
git fetch upstream
git rebase upstream/main

# Run full test suite
bun test

# Lint and format
bun run lint

# Build successfully
bun run build

# Test manually
bun run dev price
bun run dev --help
```

### 2. PR Description Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] New tests added for new functionality

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Documentation updated if needed
- [ ] No breaking changes (or clearly documented)
```

### 3. Review Process

1. **Automated checks**: All CI checks must pass
2. **Code review**: At least one maintainer review
3. **Testing**: Manual testing of new features
4. **Documentation**: Ensure docs are updated
5. **Merge**: Squash merge to main branch

## Documentation Guidelines

### Code Documentation

```typescript
/**
 * Fetches Bitcoin price data from multiple providers
 * @param currency - Target currency for price conversion
 * @param options - Additional options for data fetching
 * @returns Promise resolving to price data
 * @throws {ValidationError} When currency is invalid
 * @throws {ApiError} When all providers fail
 */
async function getPrice(
  currency: Currency,
  options: PriceOptions = {}
): Promise<PriceData> {
  // Implementation
}
```

### README Updates

When adding new commands or features:

1. Update feature list in main README
2. Add examples to documentation
3. Update command reference
4. Add to changelog

### API Documentation

Document all public interfaces:

```typescript
/**
 * Configuration for API rate limiting
 */
interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Enable request queuing */
  queue?: boolean
}
```

## Performance Guidelines

### Optimization Principles

1. **Cache effectively**: Use appropriate TTL for different data types
2. **Minimize API calls**: Batch requests when possible
3. **Handle errors gracefully**: Don't fail on single provider errors
4. **Optimize for common cases**: Fast path for frequently used commands

### Performance Testing

```bash
# Measure command performance
time bun run dev price
time bun run dev price --json

# Test with multiple providers
export DEBUG=1
bun run dev price  # Check which provider is used

# Test cache effectiveness
bun run dev price  # First call
bun run dev price  # Should be cached
```

## Release Process

### Version Bumping

```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

### Changelog

Update CHANGELOG.md with:
- New features
- Bug fixes
- Breaking changes
- Migration notes

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers learn
- Assume positive intent

### Getting Help

1. **Documentation**: Check existing docs first
2. **Issues**: Search existing issues
3. **Discussions**: Use GitHub Discussions for questions
4. **Discord**: Join community chat (if available)

### Reporting Issues

Use the issue template:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Minimal reproduction case

## Advanced Topics

### Debugging

```bash
# Enable debug logging
export DEBUG=1
bun run dev price

# Debug specific modules
export DEBUG=api,cache
bun run dev price

# Debug with Node.js inspector
node --inspect dist/index.js price
```

### Profiling

```bash
# Profile memory usage
node --inspect --prof dist/index.js price

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

### Adding Internationalization

```typescript
// Future: i18n support
const messages = {
  en: { price: 'Bitcoin Price' },
  es: { price: 'Precio de Bitcoin' },
  fr: { price: 'Prix du Bitcoin' }
}
```

---

**Thank you for contributing to ChainChirp! Your efforts help make Bitcoin data more accessible to everyone.**