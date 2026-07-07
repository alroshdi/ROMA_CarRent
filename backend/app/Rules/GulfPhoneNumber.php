<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class GulfPhoneNumber implements ValidationRule
{
    private const PATTERN = '/^\+(968|971|966|965|973|974)\d{7,10}$/';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match(self::PATTERN, $value)) {
            $fail('The :attribute must be a valid Gulf country phone number.');
        }
    }
}
