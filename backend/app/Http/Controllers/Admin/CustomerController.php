<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customers = Customer::when($request->has('is_active'), function ($q) use ($request) {
            $q->where('is_active', $request->boolean('is_active'));
        })
            ->withCount('bookings')
            ->latest()
            ->get();

        return response()->json(['customers' => $customers]);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json([
            'customer' => $customer->load(['bookings.car', 'bookings.driver']),
        ]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20|unique:customers,phone,'.$customer->id,
            'is_active' => 'sometimes|boolean',
        ]);

        $customer->update($validated);
        $this->logActivity($request, 'customer.updated', $customer);

        return response()->json(['message' => 'Customer updated.', 'customer' => $customer]);
    }

    public function resetPin(Request $request, Customer $customer): JsonResponse
    {
        $newPin = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $customer->update(['pin' => $newPin]);

        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'customer.pin_reset',
            'subject_type' => Customer::class,
            'subject_id' => $customer->id,
            'metadata' => ['phone' => $customer->phone],
        ]);

        return response()->json([
            'message' => 'PIN reset successfully. Share this PIN with the customer via WhatsApp.',
            'new_pin' => $newPin,
            'customer' => $customer,
        ]);
    }

    protected function logActivity(Request $request, string $action, Customer $customer): void
    {
        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => Customer::class,
            'subject_id' => $customer->id,
            'metadata' => ['phone' => $customer->phone],
        ]);
    }
}
