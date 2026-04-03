import { describe, it, expect } from 'vitest'
import {
  AuthError,
  UsageLimitError,
  ValidationError,
  PlanRequiredError,
} from '@/lib/errors'

describe('AuthError', () => {
  it('has the correct name', () => {
    expect(new AuthError().name).toBe('AuthError')
  })

  it('has a default message', () => {
    expect(new AuthError().message).toBe('Unauthorized')
  })

  it('accepts a custom message', () => {
    expect(new AuthError('Custom msg').message).toBe('Custom msg')
  })

  it('is an instance of Error', () => {
    expect(new AuthError()).toBeInstanceOf(Error)
  })
})

describe('UsageLimitError', () => {
  it('has the correct name', () => {
    expect(new UsageLimitError().name).toBe('UsageLimitError')
  })

  it('has a default message', () => {
    expect(new UsageLimitError().message).toContain('limit')
  })
})

describe('ValidationError', () => {
  it('stores the message', () => {
    expect(new ValidationError('Bad input').message).toBe('Bad input')
  })

  it('has the correct name', () => {
    expect(new ValidationError('x').name).toBe('ValidationError')
  })
})

describe('PlanRequiredError', () => {
  it('stores the required plan', () => {
    const err = new PlanRequiredError('pro', 'Brand Voice')
    expect(err.requiredPlan).toBe('pro')
  })

  it('includes the feature name in the message', () => {
    const err = new PlanRequiredError('pro', 'Brand Voice')
    expect(err.message).toContain('Brand Voice')
  })

  it('includes the plan name in the message', () => {
    const err = new PlanRequiredError('agency', 'API Access')
    expect(err.message).toContain('agency')
  })

  it('works without a feature name', () => {
    expect(() => new PlanRequiredError('pro')).not.toThrow()
  })
})
