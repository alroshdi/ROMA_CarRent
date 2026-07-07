<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Car;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CarController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cars = Car::when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->get();

        return response()->json(['cars' => $cars]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'plate_number' => 'required|string|max:50',
            'daily_price' => 'required|numeric|min:0',
            'images' => 'nullable|array',
            'status' => 'in:available,maintenance,inactive',
            'features' => 'nullable|array',
        ]);

        $car = Car::create($validated);
        $this->logActivity($request, 'car.created', $car);

        return response()->json(['message' => 'Car created.', 'car' => $car], 201);
    }

    public function show(Car $car): JsonResponse
    {
        return response()->json(['car' => $car->load('bookings')]);
    }

    public function update(Request $request, Car $car): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'brand' => 'sometimes|string|max:255',
            'model' => 'sometimes|string|max:255',
            'plate_number' => 'sometimes|string|max:50',
            'daily_price' => 'sometimes|numeric|min:0',
            'images' => 'nullable|array',
            'status' => 'sometimes|in:available,maintenance,inactive',
            'features' => 'nullable|array',
        ]);

        $car->update($validated);
        $this->logActivity($request, 'car.updated', $car);

        return response()->json(['message' => 'Car updated.', 'car' => $car]);
    }

    public function destroy(Request $request, Car $car): JsonResponse
    {
        $car->delete();
        $this->logActivity($request, 'car.deleted', $car);

        return response()->json(['message' => 'Car deleted.']);
    }

    protected function logActivity(Request $request, string $action, Car $car): void
    {
        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => Car::class,
            'subject_id' => $car->id,
            'metadata' => ['plate_number' => $car->plate_number],
        ]);
    }
}
