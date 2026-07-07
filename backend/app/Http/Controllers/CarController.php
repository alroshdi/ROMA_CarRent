<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CarController extends Controller
{
    public function __construct(private BookingService $bookingService) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'pickup_date' => 'nullable|date',
            'return_date' => 'nullable|date|after_or_equal:pickup_date',
        ]);

        $query = Car::where('status', 'available');

        if ($request->filled('pickup_date') && $request->filled('return_date')) {
            $cars = $query->get()->filter(function (Car $car) use ($request) {
                return $this->bookingService->isAvailable(
                    $car->id,
                    $request->input('pickup_date'),
                    $request->input('return_date')
                );
            })->values();
        } else {
            $cars = $query->get();
        }

        return response()->json(['cars' => $cars]);
    }

    public function show(Car $car): JsonResponse
    {
        return response()->json(['car' => $car]);
    }
}
