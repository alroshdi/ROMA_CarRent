<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Driver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $paginator = Driver::when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate(20);

        return response()->json([
            'drivers' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'license_number' => 'required|string|max:50',
            'status' => 'in:active,inactive',
        ]);

        $driver = Driver::create($validated);
        $this->logActivity($request, 'driver.created', $driver);

        return response()->json(['message' => 'Driver created.', 'driver' => $driver], 201);
    }

    public function show(Driver $driver): JsonResponse
    {
        return response()->json(['driver' => $driver->load('bookings')]);
    }

    public function update(Request $request, Driver $driver): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'license_number' => 'sometimes|string|max:50',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $driver->update($validated);
        $this->logActivity($request, 'driver.updated', $driver);

        return response()->json(['message' => 'Driver updated.', 'driver' => $driver]);
    }

    public function destroy(Request $request, Driver $driver): JsonResponse
    {
        $driver->delete();
        $this->logActivity($request, 'driver.deleted', $driver);

        return response()->json(['message' => 'Driver deleted.']);
    }

    protected function logActivity(Request $request, string $action, Driver $driver): void
    {
        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => Driver::class,
            'subject_id' => $driver->id,
            'metadata' => ['name' => $driver->name],
        ]);
    }
}
