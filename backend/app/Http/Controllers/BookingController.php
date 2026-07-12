<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Driver;
use App\Policies\BookingCancellationPolicy;
use App\Services\BookingService;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    public function __construct(
        private BookingService $bookingService,
        private BookingCancellationPolicy $cancellationPolicy,
        private PaymentService $paymentService,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        $validated = $request->validate([
            'car_id' => 'required|exists:cars,id',
            'driver_id' => 'nullable|exists:drivers,id',
            'pickup_date' => 'required|date|after_or_equal:today',
            'pickup_time' => 'nullable|date_format:H:i',
            'return_date' => 'required|date|after_or_equal:pickup_date',
            'return_time' => 'nullable|date_format:H:i',
            'pickup_location' => 'required|string|max:255',
            'dropoff_location' => 'required|string|max:255',
            'additional_notes' => 'nullable|string|max:1000',
            'with_driver' => 'boolean',
            'gcc_license_confirmed' => 'boolean',
        ]);

        $withDriver = $validated['with_driver'] ?? false;

        if (! $withDriver) {
            if (! ($validated['gcc_license_confirmed'] ?? false)) {
                return response()->json([
                    'message' => 'You must confirm that you hold a valid GCC driving license for self-drive rentals.',
                ], 422);
            }

            if (! $customer->has_driving_license) {
                return response()->json([
                    'message' => 'A valid driving license upload is required for self-drive rentals.',
                ], 422);
            }
        }

        $this->bookingService->validateDates($validated['pickup_date'], $validated['return_date']);
        $this->bookingService->validatePickupDateTime($validated['pickup_date'], $validated['pickup_time'] ?? null);

        if ($withDriver) {
            $driverId = $validated['driver_id'] ?? null;
            if (! $driverId) {
                return response()->json(['message' => 'A driver is required when with_driver is true.'], 422);
            }
            $driver = Driver::findOrFail($driverId);
            if ($driver->status !== 'active') {
                return response()->json(['message' => 'Selected driver is not active.'], 422);
            }
        }

        try {
            $booking = DB::transaction(function () use ($customer, $validated, $withDriver) {
                $car = Car::where('id', $validated['car_id'])->lockForUpdate()->firstOrFail();

                if ($car->status !== 'available') {
                    throw new \InvalidArgumentException('Selected car is not available.');
                }

                if (! $this->bookingService->isAvailable($car->id, $validated['pickup_date'], $validated['return_date'])) {
                    throw new \InvalidArgumentException('Car is not available for the selected dates.');
                }

                $customerConflict = Booking::where('customer_id', $customer->id)
                    ->whereNotIn('status', ['cancelled', 'completed'])
                    ->where('pickup_date', '<', $validated['return_date'])
                    ->where('return_date', '>', $validated['pickup_date'])
                    ->exists();

                if ($customerConflict) {
                    throw new \InvalidArgumentException('You already have another booking that overlaps with this period.');
                }

                if ($withDriver) {
                    $driverId = (int) $validated['driver_id'];
                    if (! $this->bookingService->isDriverAvailable($driverId, $validated['pickup_date'], $validated['return_date'])) {
                        throw new \InvalidArgumentException('Selected driver is not available for the selected dates.');
                    }
                }

                $pricing = $this->bookingService->calculatePrice(
                    $car,
                    $validated['pickup_date'],
                    $validated['return_date'],
                    $withDriver,
                );

                return Booking::create([
                    'customer_id' => $customer->id,
                    'car_id' => $car->id,
                    'driver_id' => $withDriver ? ($validated['driver_id'] ?? null) : null,
                    'pickup_date' => $validated['pickup_date'],
                    'pickup_time' => $validated['pickup_time'] ?? null,
                    'return_date' => $validated['return_date'],
                    'return_time' => $validated['return_time'] ?? null,
                    'pickup_location' => $validated['pickup_location'],
                    'dropoff_location' => $validated['dropoff_location'],
                    'additional_notes' => $validated['additional_notes'] ?? null,
                    'with_driver' => $withDriver,
                    'driver_hours' => $withDriver ? $pricing['days'] : null,
                    'driver_cost' => $pricing['driver_cost'],
                    'car_cost' => $pricing['car_cost'],
                    'total_price' => $pricing['total_price'],
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                ]);
            });
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $booking->load(['car', 'driver']);

        return response()->json([
            'message' => 'Booking created successfully.',
            'booking' => $booking,
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        $paginator = Booking::with(['car', 'driver', 'contract', 'payments'])
            ->where('customer_id', $customer->id)
            ->latest()
            ->paginate(20);

        return response()->json([
            'bookings' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, Booking $booking): JsonResponse
    {
        $customer = $this->getCustomer($request);
        $this->authorizeBooking($booking, $customer);

        $booking->load(['car', 'driver', 'contract', 'payments']);

        return response()->json(['booking' => $booking]);
    }

    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $customer = $this->getCustomer($request);
        $this->authorizeBooking($booking, $customer);

        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return response()->json(['message' => 'This booking cannot be cancelled.'], 422);
        }

        $refundEligible = $this->cancellationPolicy->canRequestRefund($booking);
        $refundAmount = $this->cancellationPolicy->getRefundAmount($booking);
        $outsideRefundWindow = $this->cancellationPolicy->isMoreThan48HoursBeforePickup($booking);
        $cancellationMessage = $this->cancellationPolicy->getCancellationMessage($booking);

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'refund_status' => $refundEligible ? 'requested' : 'rejected',
        ]);

        $refundFailed = false;
        if ($refundEligible && $booking->payments()->where('status', 'paid')->exists()) {
            $payment = $booking->payments()->where('status', 'paid')->latest()->first();
            try {
                $this->paymentService->refund($payment);
            } catch (\Exception $e) {
                $refundFailed = true;
                report($e);
                Log::warning('Refund failed for booking cancellation.', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => $cancellationMessage,
            'booking' => $booking->fresh(['car', 'driver', 'payments']),
            'refund_amount' => $refundAmount,
            'refund_eligible' => $refundEligible,
            'outside_refund_window' => $outsideRefundWindow,
            'refund_failed' => $refundFailed,
        ]);
    }

    protected function getCustomer(Request $request): Customer
    {
        $user = $request->user();

        if (! $user instanceof Customer) {
            abort(403, 'Customer authentication required.');
        }

        return $user;
    }

    protected function authorizeBooking(Booking $booking, Customer $customer): void
    {
        if ($booking->customer_id !== $customer->id) {
            abort(403, 'Unauthorized access to booking.');
        }
    }
}
