<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Storage;
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
        'pin_plain',
        'is_active',
    ];

    protected $hidden = [
        'pin',
        'pin_plain',
    ];

    protected $appends = [
        'driving_license_url',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'pin' => 'hashed',
        ];
    }

    protected function drivingLicenseUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->driving_license_path) {
                return null;
            }

            return Storage::disk('public')->url($this->driving_license_path);
        });
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
