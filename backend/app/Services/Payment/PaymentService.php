<?php

namespace App\Services\Payment;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class PaymentService
{
    public function __construct(private PaymentGatewayManager $gatewayManager) {}

    /**
     * @return array{message: string, checkout_url: string, session_id: string, gateway: string, payment: Payment}
     */
    public function checkout(Booking $booking, ?string $gatewayKey = null): array
    {
        if ($booking->payment_status === 'paid') {
            throw new InvalidArgumentException('Booking is already paid.');
        }

        if ($booking->status === 'cancelled') {
            throw new InvalidArgumentException('Cannot pay for a cancelled booking.');
        }

        $booking->loadMissing('contract');
        if (! $booking->contract?->signed_at) {
            throw new InvalidArgumentException('Contract must be signed before payment.');
        }

        $gateway = $this->gatewayManager->gateway($gatewayKey);
        $gatewayKey = $gateway->key();

        $existingPayment = Payment::where('booking_id', $booking->id)
            ->where('gateway', $gatewayKey)
            ->where('status', 'initiated')
            ->latest()
            ->first();

        if ($existingPayment && $existingPayment->external_session_id) {
            $session = $gateway->retrieveSession($existingPayment->external_session_id);

            if ($session && ($session['payment_status'] ?? '') === 'paid') {
                $this->markAsPaid($existingPayment, $session['raw_response'], $session['payment_id'] ?? null);

                return [
                    'message' => 'Payment already completed.',
                    'checkout_url' => config('carrent.frontend_url').'/payment/success?session_id='.$existingPayment->external_session_id,
                    'session_id' => $existingPayment->external_session_id,
                    'gateway' => $gatewayKey,
                    'payment' => $existingPayment->fresh(),
                ];
            }

            if ($session && ($session['payment_status'] ?? 'unpaid') === 'unpaid') {
                return [
                    'message' => 'Checkout session already exists.',
                    'checkout_url' => $gateway->buildCheckoutUrl($existingPayment->external_session_id),
                    'session_id' => $existingPayment->external_session_id,
                    'gateway' => $gatewayKey,
                    'payment' => $existingPayment,
                ];
            }

            $existingPayment->update(['status' => 'failed']);
        }

        $session = $gateway->createCheckoutSession($booking);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'gateway' => $gatewayKey,
            'external_session_id' => $session['session_id'],
            'amount' => $booking->total_price,
            'currency' => 'OMR',
            'status' => 'initiated',
            'raw_response' => $session['raw_response'],
        ]);

        if ($gateway->shouldAutoConfirmMock()) {
            $this->markAsPaid($payment, ['mock' => true, 'source' => 'checkout']);
            $payment = $payment->fresh();
        }

        return [
            'message' => 'Checkout session created.',
            'checkout_url' => $session['checkout_url'],
            'session_id' => $session['session_id'],
            'gateway' => $gatewayKey,
            'payment' => $payment,
        ];
    }

    public function processWebhook(string $gatewayKey, Request $request): array
    {
        $gateway = $this->gatewayManager->gateway($gatewayKey);

        if (! $gateway->verifyWebhookSignature($request)) {
            throw new RuntimeException('Invalid webhook signature.');
        }

        $event = $gateway->parseWebhookPayload($request->all());
        if (! $event) {
            throw new InvalidArgumentException('Unsupported webhook payload.');
        }

        $payment = Payment::where('gateway', $gatewayKey)
            ->where('external_session_id', $event['session_id'])
            ->first();

        if (! $payment) {
            throw new RuntimeException('Payment not found.');
        }

        if ($event['status'] === 'paid') {
            if ($payment->status !== 'paid') {
                $this->markAsPaid($payment, $event['payload'], $event['payment_id']);
            }
        } elseif ($event['status'] === 'failed' && $payment->status === 'initiated') {
            $payment->update([
                'status' => 'failed',
                'raw_response' => array_merge($payment->raw_response ?? [], $event['payload']),
            ]);
        }

        return [
            'message' => 'Webhook processed.',
            'payment' => $payment->fresh(),
        ];
    }

    /**
     * @return array{message: string, payment: Payment, booking: Booking}
     */
    public function verifySuccess(Customer $customer, string $sessionId): array
    {
        $payment = Payment::where('external_session_id', $sessionId)
            ->whereHas('booking', fn ($q) => $q->where('customer_id', $customer->id))
            ->first();

        if (! $payment) {
            throw new RuntimeException('Payment not found.');
        }

        if ($payment->status === 'initiated') {
            $gateway = $this->gatewayManager->gateway($payment->gateway);
            $session = $gateway->retrieveSession($sessionId);

            if ($session && ($session['payment_status'] ?? null) === 'paid') {
                $this->markAsPaid($payment, $session['raw_response'], $session['payment_id'] ?? null);
                $payment = $payment->fresh();
            }
        }

        return [
            'message' => 'Payment status retrieved.',
            'payment' => $payment,
            'booking' => $payment->booking->fresh(['car']),
        ];
    }

    public function refund(Payment $payment, ?string $reason = null): Payment
    {
        if ($payment->status !== 'paid') {
            throw new InvalidArgumentException('Only paid payments can be refunded.');
        }

        $gateway = $this->gatewayManager->gateway($payment->gateway);
        $result = $gateway->refund($payment, $reason);

        $payment->update([
            'status' => 'refunded',
            'raw_response' => array_merge($payment->raw_response ?? [], $result['raw_response']),
        ]);

        $payment->booking->update([
            'payment_status' => 'refunded',
            'refund_status' => 'refunded',
        ]);

        return $payment->fresh();
    }

    protected function markAsPaid(Payment $payment, array $payload = [], ?string $externalPaymentId = null): void
    {
        DB::transaction(function () use ($payment, $payload, $externalPaymentId) {
            $payment->refresh();

            if ($payment->status === 'paid') {
                return;
            }

            $updates = [
                'status' => 'paid',
                'raw_response' => array_merge($payment->raw_response ?? [], $payload),
            ];

            if ($externalPaymentId) {
                $updates['external_payment_id'] = $externalPaymentId;
            }

            $payment->update($updates);

            $payment->booking->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);
        });
    }
}
