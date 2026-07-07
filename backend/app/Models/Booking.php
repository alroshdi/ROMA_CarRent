<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Carbon\Carbon;

class Booking extends Model
{
    protected $fillable = [
        'customer_id',
        'car_id',
        'driver_id',
        'pickup_date',
        'pickup_time',
        'return_date',
        'return_time',
        'pickup_location',
        'dropoff_location',
        'additional_notes',
        'with_driver',
        'driver_hours',
        'driver_cost',
        'car_cost',
        'total_price',
        'status',
        'payment_status',
        'cancelled_at',
        'refund_status',
    ];

    protected $appends = [
        'rental_days',
    ];

    protected function casts(): array
    {
        return [
            'pickup_date' => 'date',
            'return_date' => 'date',
            'with_driver' => 'boolean',
            'driver_cost' => 'decimal:2',
            'car_cost' => 'decimal:2',
            'total_price' => 'decimal:2',
            'cancelled_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function contract(): HasOne
    {
        return $this->hasOne(Contract::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    protected function rentalDays(): Attribute
    {
        return Attribute::get(function (): int {
            if (! $this->pickup_date || ! $this->return_date) {
                return 1;
            }

            $days = Carbon::parse($this->pickup_date)->diffInDays(Carbon::parse($this->return_date)) + 1;

            return max(1, (int) $days);
        });
    }
}
