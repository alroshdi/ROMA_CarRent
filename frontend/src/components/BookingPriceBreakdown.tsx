import { useTranslation } from '../i18n/LanguageProvider'

interface BookingPriceBreakdownProps {
  days: number
  dailyCarRate: number
  carCost: number
  withDriver: boolean
  driverDailyRate: number
  driverCost: number
  totalPrice: number
  showTitle?: boolean
  showDepositNote?: boolean
}

export default function BookingPriceBreakdown({
  days,
  dailyCarRate,
  carCost,
  withDriver,
  driverDailyRate,
  driverCost,
  totalPrice,
  showTitle = true,
  showDepositNote = false,
}: BookingPriceBreakdownProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-roma-dark rounded-lg p-4 border border-roma-border">
      {showTitle && (
        <h3
          className="text-sm font-bold text-white uppercase tracking-wide mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('booking.pricingBreakdown')}
        </h3>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-roma-muted">{t('booking.rentalPeriod')}</span>
          <span className="text-white">{t('booking.rentalDaysCount', { days })}</span>
        </div>

        <div className="pt-2 border-t border-roma-border/50 space-y-3">
          <div className="flex justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white font-medium">{t('booking.carRentalSubtotal')}</p>
              <p className="text-xs text-roma-subtle mt-0.5">
                {t('booking.carRentalLine', { days, rate: dailyCarRate.toFixed(2) })}
              </p>
            </div>
            <span className="text-white shrink-0 tabular-nums">
              {carCost.toFixed(2)} {t('common.omr')}
            </span>
          </div>

          {withDriver && (
            <div className="flex justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-medium">{t('booking.driverRentalSubtotal')}</p>
                <p className="text-xs text-roma-subtle mt-0.5">
                  {t('booking.driverRentalLine', { days, rate: driverDailyRate.toFixed(2) })}
                </p>
              </div>
              <span className="text-white shrink-0 tabular-nums">
                {driverCost.toFixed(2)} {t('common.omr')}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between font-bold text-lg pt-2 border-t border-roma-border">
          <span className="text-white">{t('common.total')}</span>
          <span className="text-primary tabular-nums">
            {totalPrice.toFixed(2)} {t('common.omr')}
          </span>
        </div>

        {showDepositNote && (
          <p className="text-xs text-roma-muted pt-2 border-t border-roma-border/50 leading-relaxed">
            {t('booking.securityDepositNote')}
          </p>
        )}
      </div>
    </div>
  )
}
