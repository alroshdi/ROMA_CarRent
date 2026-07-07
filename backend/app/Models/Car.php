<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Car extends Model
{
    protected $fillable = [
        'name',
        'brand',
        'model',
        'plate_number',
        'daily_price',
        'images',
        'status',
        'features',
    ];

    protected function casts(): array
    {
        return [
            'daily_price' => 'decimal:2',
            'images' => 'array',
            'features' => 'array',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
