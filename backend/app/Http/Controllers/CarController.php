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
            $pickupDate = $request->input('pickup_date');
            $returnDate = $request->input('return_date');

            $query->whereDoesntHave('bookings', function ($q) use ($pickupDate, $returnDate) {
                $this->bookingService->applyOverlapConstraints($q, $pickupDate, $returnDate);
            });
        }

        return response()->json(['cars' => $query->get()]);
    }

    public function show(Car $car): JsonResponse
    {
        if ($car->status !== 'available') {
            return response()->json(['message' => 'Car not found.'], 404);
        }

        return response()->json(['car' => $car]);
    }
}
