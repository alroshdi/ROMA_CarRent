<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'driving_license_path',
        'pin',
        'is_active',
    ];

    protected $hidden = [
        'pin',
        'driving_license_path',
    ];

    protected $appends = [
        'has_driving_license',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'pin' => 'hashed',
        ];
    }

    protected function hasDrivingLicense(): Attribute
    {
        return Attribute::get(fn (): bool => ! empty($this->driving_license_path));
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
