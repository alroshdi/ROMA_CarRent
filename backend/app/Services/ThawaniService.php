<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ThawaniService
{
    public function shouldAutoConfirmMock(): bool
    {
        return config('carrent.thawani.mock') && app()->environment('local');
    }

    public function buildCheckoutUrl(string $sessionId): string
    {
        if (config('carrent.thawani.mock')) {
            return config('carrent.frontend_url').'/payment/success?session_id='.$sessionId;
        }

        return config('carrent.thawani.checkout_url').'/pay/'.$sessionId.'?key='.config('carrent.thawani.publishable_key');
    }

    public function createCheckoutSession(Booking $booking): array
    {
        if (config('carrent.thawani.mock')) {
            $sessionId = 'mock_session_'.Str::uuid();

            return [
                'session_id' => $sessionId,
                'checkout_url' => $this->buildCheckoutUrl($sessionId),
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
            'checkout_url' => $this->buildCheckoutUrl($data['session_id']),
            'raw_response' => $response->json(),
        ];
    }

    public function verifyWebhook(array $payload, ?string $signature = null): bool
    {
        if (config('carrent.thawani.mock')) {
            if (! app()->environment('local')) {
                return false;
            }

            $mockSecret = config('carrent.thawani.mock_webhook_secret');

            return $mockSecret && $signature && hash_equals($mockSecret, $signature);
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
