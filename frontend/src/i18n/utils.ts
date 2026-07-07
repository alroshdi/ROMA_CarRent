import type { TranslationDict } from './types'

export function resolveTranslation(dict: TranslationDict, key: string): string | undefined {
  const parts = key.split('.')
  let current: string | TranslationDict = dict
  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return undefined
    }
    current = current[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(vars[name] ?? ''))
}

export function mapCancelResultMessage(
  outsideWindow: boolean,
  refundEligible: boolean,
  wasPaid: boolean,
  t: (key: string, vars?: Record<string, string | number>) => string,
  refundAmount?: number,
): string {
  if (refundEligible && refundAmount) {
    return t('bookings.cancelResult.refundProcessed', { amount: refundAmount.toFixed(2) })
  }
  if (outsideWindow && !wasPaid) {
    return t('bookings.cancelResult.outsideWindowUnpaid')
  }
  if (!outsideWindow && wasPaid) {
    return t('bookings.cancelResult.withinWindowPaid')
  }
  if (outsideWindow && wasPaid) {
    return t('bookings.cancelResult.outsideWindowPaid')
  }
  return t('bookings.cancelResult.default')
}
