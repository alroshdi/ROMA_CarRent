<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use Illuminate\Http\JsonResponse;

class DriverController extends Controller
{
    public function index(): JsonResponse
    {
        $drivers = Driver::where('status', 'active')->orderBy('name')->get();

        return response()->json(['drivers' => $drivers]);
    }
}
