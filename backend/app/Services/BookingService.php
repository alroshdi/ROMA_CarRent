<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class BookingService
{
    public function isAvailable(int $carId, string $pickupDate, string $returnDate, ?int $excludeBookingId = null): bool
    {
        return ! $this->hasOverlap($carId, $pickupDate, $returnDate, $excludeBookingId);
    }

    public function hasOverlap(int $carId, string $pickupDate, string $returnDate, ?int $excludeBookingId = null): bool
    {
        $query = Booking::where('car_id', $carId);
        $this->applyOverlapConstraints($query, $pickupDate, $returnDate, $excludeBookingId);

        return $query->exists();
    }

    public function applyOverlapConstraints(Builder $query, string $pickupDate, string $returnDate, ?int $excludeBookingId = null): Builder
    {
        $query->whereNotIn('status', ['cancelled', 'completed'])
            ->where('pickup_date', '<=', $returnDate)
            ->where('return_date', '>=', $pickupDate);

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query;
    }

    public function calculatePrice(Car $car, string $pickupDate, string $returnDate, bool $withDriver = false): array
    {
        $days = max(1, Carbon::parse($pickupDate)->diffInDays(Carbon::parse($returnDate)) + 1);
        $carCost = round((float) $car->daily_price * $days, 2);

        $driverCost = 0;
        if ($withDriver) {
            $driverDailyRate = Setting::getFloat('driver_daily_rate', config('carrent.driver_daily_rate'));
            $driverCost = round($days * $driverDailyRate, 2);
        }

        $totalPrice = round($carCost + $driverCost, 2);

        return [
            'days' => $days,
            'car_cost' => $carCost,
            'driver_cost' => $driverCost,
            'total_price' => $totalPrice,
        ];
    }

    public function validateDates(string $pickupDate, string $returnDate): void
    {
        $pickup = Carbon::parse($pickupDate);
        $return = Carbon::parse($returnDate);

        if ($return->lt($pickup)) {
            throw new \InvalidArgumentException('Return date must be on or after pickup date.');
        }
    }
}
