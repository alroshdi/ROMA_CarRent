<?php

namespace App\Policies;

use App\Models\Booking;
use Carbon\Carbon;

class BookingCancellationPolicy
{
    public function hoursUntilPickup(Booking $booking): float
    {
        $pickup = Carbon::parse($booking->pickup_date)->startOfDay();

        return now()->diffInHours($pickup, false);
    }

    public function isMoreThan48HoursBeforePickup(Booking $booking): bool
    {
        return $this->hoursUntilPickup($booking) >= 48;
    }

    public function canRequestRefund(Booking $booking): bool
    {
        return $this->isMoreThan48HoursBeforePickup($booking)
            && $booking->payment_status === 'paid';
    }

    public function getRefundAmount(Booking $booking): float
    {
        if (! $this->canRequestRefund($booking)) {
            return 0;
        }

        return (float) $booking->total_price;
    }

    public function getCancellationMessage(Booking $booking): string
    {
        $outsideWindow = $this->isMoreThan48HoursBeforePickup($booking);
        $wasPaid = $booking->payment_status === 'paid';

        if ($outsideWindow) {
            if ($wasPaid) {
                return 'Booking cancelled. A full refund of '.number_format((float) $booking->total_price, 2).' OMR will be processed within 48 hours.';
            }

            return 'Booking cancelled successfully. Your pickup is more than 48 hours away — no charges apply.';
        }

        if ($wasPaid) {
            return 'Booking cancelled. No refund is available because cancellation is within 48 hours of pickup.';
        }

        return 'Booking cancelled successfully.';
    }
}
