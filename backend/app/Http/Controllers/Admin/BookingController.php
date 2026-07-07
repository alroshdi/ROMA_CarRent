<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::with(['customer', 'car', 'driver', 'payments', 'contract'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->payment_status, fn ($q, $ps) => $q->where('payment_status', $ps))
            ->latest()
            ->paginate(20);

        return response()->json($bookings);
    }

    public function show(Booking $booking): JsonResponse
    {
        return response()->json([
            'booking' => $booking->load(['customer', 'car', 'driver', 'payments', 'contract']),
        ]);
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,active,completed,cancelled',
            'payment_status' => 'sometimes|in:unpaid,paid,refunded',
            'refund_status' => 'sometimes|in:none,requested,refunded,rejected',
            'driver_id' => 'nullable|exists:drivers,id',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'cancelled') {
            $validated['cancelled_at'] = now();
        }

        $booking->update($validated);
        $this->logActivity($request, 'booking.updated', $booking);

        return response()->json([
            'message' => 'Booking updated.',
            'booking' => $booking->fresh(['customer', 'car', 'driver', 'payments']),
        ]);
    }

    protected function logActivity(Request $request, string $action, Booking $booking): void
    {
        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'metadata' => ['status' => $booking->status],
        ]);
    }
}
