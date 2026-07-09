<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Payment;
use App\Services\ThawaniService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function __construct(private ThawaniService $thawaniService) {}

    public function checkout(Request $request): JsonResponse
    {
        $customer = $request->user();
        if (! $customer instanceof Customer) {
            abort(403, 'Customer authentication required.');
        }

        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
        ]);

        $booking = Booking::where('id', $validated['booking_id'])
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'Booking is already paid.'], 422);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Cannot pay for a cancelled booking.'], 422);
        }

        $existingPayment = Payment::where('booking_id', $booking->id)
            ->where('status', 'initiated')
            ->latest()
            ->first();

        if ($existingPayment) {
            return response()->json([
                'message' => 'Checkout session already exists.',
                'checkout_url' => $this->thawaniService->buildCheckoutUrl($existingPayment->thawani_session_id),
                'session_id' => $existingPayment->thawani_session_id,
                'payment' => $existingPayment,
            ]);
        }

        $session = $this->thawaniService->createCheckoutSession($booking);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'thawani_session_id' => $session['session_id'],
            'amount' => $booking->total_price,
            'status' => 'initiated',
            'raw_response' => $session['raw_response'],
        ]);

        if ($this->thawaniService->shouldAutoConfirmMock()) {
            $this->markAsPaid($payment, ['mock' => true, 'source' => 'checkout']);
        }

        return response()->json([
            'message' => 'Checkout session created.',
            'checkout_url' => $session['checkout_url'],
            'session_id' => $session['session_id'],
            'payment' => $payment->fresh(),
        ]);
    }

    public function webhook(Request $request): JsonResponse
    {
        $signature = $request->header('thawani-signature') ?? $request->header('X-Thawani-Mock-Secret');
        $payload = $request->all();

        if (! $this->thawaniService->verifyWebhook($payload, $signature)) {
            return response()->json(['message' => 'Invalid webhook signature.'], 401);
        }

        $sessionId = $payload['session_id'] ?? $payload['data']['session_id'] ?? null;
        $status = $payload['payment_status'] ?? $payload['data']['payment_status'] ?? null;

        if (! $sessionId) {
            return response()->json(['message' => 'Missing session ID.'], 422);
        }

        $payment = Payment::where('thawani_session_id', $sessionId)->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment not found.'], 404);
        }

        if ($status === 'paid') {
            if ($payment->status !== 'paid') {
                $this->markAsPaid($payment, $payload);
            }
        } elseif ($status === 'failed' && $payment->status === 'initiated') {
            $payment->update([
                'status' => 'failed',
                'raw_response' => array_merge($payment->raw_response ?? [], $payload),
            ]);
        }

        return response()->json(['message' => 'Webhook processed.']);
    }

    public function success(Request $request): JsonResponse
    {
        $customer = $request->user();
        if (! $customer instanceof Customer) {
            abort(403, 'Customer authentication required.');
        }

        $sessionId = $request->query('session_id');

        if (! $sessionId) {
            return response()->json(['message' => 'Missing session ID.'], 422);
        }

        $payment = Payment::where('thawani_session_id', $sessionId)
            ->whereHas('booking', fn ($q) => $q->where('customer_id', $customer->id))
            ->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment not found.'], 404);
        }

        return response()->json([
            'message' => 'Payment status retrieved.',
            'payment' => $payment->fresh(),
            'booking' => $payment->booking->fresh(['car']),
        ]);
    }

    protected function markAsPaid(Payment $payment, array $payload = []): void
    {
        DB::transaction(function () use ($payment, $payload) {
            $payment->refresh();

            if ($payment->status === 'paid') {
                return;
            }

            $payment->update([
                'status' => 'paid',
                'raw_response' => array_merge($payment->raw_response ?? [], $payload),
            ]);

            $payment->booking->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);
        });
    }
}
