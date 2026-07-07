<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'driver_daily_rate' => Setting::getFloat('driver_daily_rate', config('carrent.driver_daily_rate')),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'driver_daily_rate' => 'required|numeric|min:0',
        ]);

        Setting::set('driver_daily_rate', $validated['driver_daily_rate']);

        return response()->json([
            'message' => 'Settings updated successfully.',
            'driver_daily_rate' => (float) $validated['driver_daily_rate'],
        ]);
    }
}
