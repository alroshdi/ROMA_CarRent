<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ThawaniService
{
    public function createCheckoutSession(Booking $booking): array
    {
        if (config('carrent.thawani.mock')) {
            $sessionId = 'mock_session_'.Str::uuid();

            return [
                'session_id' => $sessionId,
                'checkout_url' => config('carrent.frontend_url').'/payment/success?session_id='.$sessionId,
                'raw_response' => [
                    'mock' => true,
                    'session_id' => $sessionId,
                ],
            ];
        }

        $response = Http::withHeaders([
            'thawani-api-key' => config('carrent.thawani.secret_key'),
        ])->post(config('carrent.thawani.base_url').'/checkout/session', [
            'client_reference_id' => (string) $booking->id,
            'mode' => 'payment',
            'products' => [
                [
                    'name' => 'Car Rental Booking #'.$booking->id,
                    'quantity' => 1,
                    'unit_amount' => (int) ($booking->total_price * 1000),
                ],
            ],
            'success_url' => config('carrent.frontend_url').'/payment/success',
            'cancel_url' => config('carrent.frontend_url').'/payment/cancel',
            'metadata' => [
                'booking_id' => $booking->id,
            ],
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Failed to create Thawani checkout session.');
        }

        $data = $response->json('data');

        return [
            'session_id' => $data['session_id'],
            'checkout_url' => config('carrent.thawani.checkout_url').'/pay/'.$data['session_id'].'?key='.config('carrent.thawani.publishable_key'),
            'raw_response' => $response->json(),
        ];
    }

    public function verifyWebhook(array $payload, ?string $signature = null): bool
    {
        if (config('carrent.thawani.mock')) {
            return true;
        }

        $secret = config('carrent.thawani.webhook_secret');
        if (! $secret || ! $signature) {
            return false;
        }

        $computed = hash_hmac('sha256', json_encode($payload), $secret);

        return hash_equals($computed, $signature);
    }

    public function refund(Payment $payment): array
    {
        if (config('carrent.thawani.mock')) {
            return [
                'status' => 'refunded',
                'raw_response' => [
                    'mock' => true,
                    'payment_id' => $payment->id,
                ],
            ];
        }

        $response = Http::withHeaders([
            'thawani-api-key' => config('carrent.thawani.secret_key'),
        ])->post(config('carrent.thawani.base_url').'/refunds', [
            'payment_id' => $payment->thawani_session_id,
            'amount' => (int) ($payment->amount * 1000),
            'reason' => 'Booking cancellation refund',
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Failed to process Thawani refund.');
        }

        return [
            'status' => 'refunded',
            'raw_response' => $response->json(),
        ];
    }
}
