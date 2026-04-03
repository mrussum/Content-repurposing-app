import { describe, it, expect } from 'vitest'
import {
  cn,
  truncate,
  wordCount,
  estimateTokens,
  formatDate,
} from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('deduplicates conflicting tailwind classes', () => {
    // tailwind-merge should keep the last bg- class
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('handles undefined and falsy values', () => {
    expect(cn('a', undefined, false, null as unknown as string, 'b')).toBe('a b')
  })
})

describe('truncate', () => {
  it('returns the string unchanged when shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and appends ellipsis when over limit', () => {
    expect(truncate('hello world', 5)).toBe('hello…')
  })

  it('returns string unchanged when exactly at limit', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})

describe('wordCount', () => {
  it('counts words correctly', () => {
    expect(wordCount('hello world foo')).toBe(3)
  })

  it('handles extra whitespace', () => {
    expect(wordCount('  hello   world  ')).toBe(2)
  })

  it('returns 0 for empty string', () => {
    expect(wordCount('')).toBe(0)
  })
})

describe('estimateTokens', () => {
  it('returns ceil(length / 4)', () => {
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('abcde')).toBe(2)
    expect(estimateTokens('')).toBe(0)
  })

  it('estimates correctly for typical content length', () => {
    const text = 'a'.repeat(1000)
    expect(estimateTokens(text)).toBe(250)
  })
})

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2024-01-15T00:00:00.000Z')
    // Value varies by locale, just verify it's a non-empty string containing the year
    expect(result).toContain('2024')
  })
})
