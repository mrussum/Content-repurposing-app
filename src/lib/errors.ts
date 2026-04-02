export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'AuthError'
  }
}

export class UsageLimitError extends Error {
  constructor(message = 'Daily generation limit reached') {
    super(message)
    this.name = 'UsageLimitError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class PlanRequiredError extends Error {
  requiredPlan: 'pro' | 'agency'

  constructor(requiredPlan: 'pro' | 'agency', feature?: string) {
    super(feature ? `${feature} requires ${requiredPlan} plan` : `${requiredPlan} plan required`)
    this.name = 'PlanRequiredError'
    this.requiredPlan = requiredPlan
  }
}
