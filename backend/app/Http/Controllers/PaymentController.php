<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Payment;
use App\Services\ThawaniService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $session = $this->thawaniService->createCheckoutSession($booking);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'thawani_session_id' => $session['session_id'],
            'amount' => $booking->total_price,
            'status' => 'initiated',
            'raw_response' => $session['raw_response'],
        ]);

        return response()->json([
            'message' => 'Checkout session created.',
            'checkout_url' => $session['checkout_url'],
            'session_id' => $session['session_id'],
            'payment' => $payment,
        ]);
    }

    public function webhook(Request $request): JsonResponse
    {
        $signature = $request->header('thawani-signature');
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

        if ($status === 'paid' || ($payload['mock'] ?? false)) {
            $payment->update([
                'status' => 'paid',
                'raw_response' => array_merge($payment->raw_response ?? [], $payload),
            ]);

            $payment->booking->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);
        } elseif ($status === 'failed') {
            $payment->update([
                'status' => 'failed',
                'raw_response' => array_merge($payment->raw_response ?? [], $payload),
            ]);
        }

        return response()->json(['message' => 'Webhook processed.']);
    }

    public function success(Request $request): JsonResponse
    {
        $sessionId = $request->query('session_id');

        if (! $sessionId) {
            return response()->json(['message' => 'Missing session ID.'], 422);
        }

        $payment = Payment::where('thawani_session_id', $sessionId)->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment not found.'], 404);
        }

        if (config('carrent.thawani.mock') && $payment->status === 'initiated') {
            $payment->update(['status' => 'paid']);
            $payment->booking->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);
        }

        return response()->json([
            'message' => 'Payment processed.',
            'payment' => $payment->fresh(),
            'booking' => $payment->booking->fresh(['car']),
        ]);
    }
}
