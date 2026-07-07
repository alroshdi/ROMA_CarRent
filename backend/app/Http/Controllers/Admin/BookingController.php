<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookingService) {}

    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::with(['customer', 'car', 'driver', 'payments', 'contract'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->payment_status, fn ($q, $ps) => $q->where('payment_status', $ps))
            ->latest()
            ->get();

        return response()->json(['bookings' => $bookings]);
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
            'with_driver' => 'sometimes|boolean',
            'rental_days' => 'sometimes|integer|min:1|max:365',
            'driver_id' => 'nullable|exists:drivers,id',
        ]);

        $booking->load('car');
        $car = $booking->car;
        $recalculate = false;
        $returnDate = $booking->return_date->format('Y-m-d');
        $pickupDate = $booking->pickup_date->format('Y-m-d');

        if (isset($validated['rental_days'])) {
            $days = $validated['rental_days'];
            unset($validated['rental_days']);
            $returnDate = Carbon::parse($pickupDate)->addDays($days - 1)->toDateString();
            $validated['return_date'] = $returnDate;
            $recalculate = true;

            if (! $this->bookingService->isAvailable($car->id, $pickupDate, $returnDate, $booking->id)) {
                return response()->json(['message' => 'Car is not available for the selected dates.'], 422);
            }
        }

        if (array_key_exists('with_driver', $validated)) {
            $recalculate = true;
            if (! $validated['with_driver']) {
                $validated['driver_id'] = null;
            }
        }

        if ($recalculate) {
            $withDriver = array_key_exists('with_driver', $validated)
                ? (bool) $validated['with_driver']
                : $booking->with_driver;

            $pricing = $this->bookingService->calculatePrice($car, $pickupDate, $returnDate, $withDriver);
            $validated['car_cost'] = $pricing['car_cost'];
            $validated['driver_cost'] = $pricing['driver_cost'];
            $validated['total_price'] = $pricing['total_price'];
            $validated['driver_hours'] = $withDriver ? $pricing['days'] : null;
        }

        if (isset($validated['status']) && $validated['status'] === 'cancelled' && $booking->status !== 'cancelled') {
            $validated['cancelled_at'] = now();
        }

        $booking->update($validated);
        $this->logActivity($request, 'booking.updated', $booking);

        return response()->json([
            'message' => 'Booking updated.',
            'booking' => $booking->fresh(['customer', 'car', 'driver', 'payments', 'contract']),
        ]);
    }

    public function downloadContract(Booking $booking): StreamedResponse|JsonResponse
    {
        $contract = $booking->contract;
        if (! $contract) {
            return response()->json(['message' => 'Contract not found.'], 404);
        }

        $path = $contract->signed_pdf_path ?? $contract->pdf_path;

        if (! Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'PDF file not found.'], 404);
        }

        $suffix = $contract->signed_pdf_path ? 'signed' : 'draft';

        return Storage::disk('local')->download($path, "contract_booking_{$booking->id}_{$suffix}.pdf");
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
