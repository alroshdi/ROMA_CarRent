<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'whatsapp_number' => config('carrent.whatsapp_number'),
            'company' => [
                'name' => config('carrent.company_name'),
                'email' => config('carrent.company_email'),
                'address' => config('carrent.company_address'),
            ],
            'driver_daily_rate' => Setting::getFloat('driver_daily_rate', config('carrent.driver_daily_rate')),
        ]);
    }
}
