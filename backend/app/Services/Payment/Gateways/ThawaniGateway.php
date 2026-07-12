<?php

namespace App\Services\Payment\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class ThawaniGateway implements PaymentGatewayInterface
{
    public function key(): string
    {
        return 'thawani';
    }

    public function name(): string
    {
        return 'Thawani';
    }

    public function isEnabled(): bool
    {
        if ($this->isMock()) {
            return true;
        }

        return (bool) $this->apiKey() && (bool) $this->publishableKey();
    }

    public function shouldAutoConfirmMock(): bool
    {
        return $this->isMock() && app()->environment('local');
    }

    public function buildCheckoutUrl(string $sessionId): string
    {
        if ($this->isMock()) {
            return config('carrent.frontend_url').'/payment/embed/success?session_id='.$sessionId;
        }

        return config('carrent.thawani.checkout_url').'/pay/'.$sessionId.'?key='.$this->publishableKey();
    }

    public function createCheckoutSession(Booking $booking): array
    {
        if ($this->isMock()) {
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

        $response = $this->request('post', '/checkout/session', [
            'client_reference_id' => (string) $booking->id,
            'mode' => 'payment',
            'products' => [
                [
                    'name' => 'Car Rental Booking #'.$booking->id,
                    'quantity' => 1,
                    'unit_amount' => $this->toBaisa($booking->total_price),
                ],
            ],
            'success_url' => config('carrent.frontend_url').'/payment/embed/success',
            'cancel_url' => config('carrent.frontend_url').'/payment/embed/cancel',
            'metadata' => [
                'booking_id' => $booking->id,
            ],
        ]);

        $data = $response['data'] ?? [];
        $sessionId = $data['session_id'] ?? null;

        if (! $sessionId) {
            throw new RuntimeException('Thawani checkout session did not return a session ID.');
        }

        return [
            'session_id' => $sessionId,
            'checkout_url' => $this->buildCheckoutUrl($sessionId),
            'raw_response' => $response,
        ];
    }

    public function retrieveSession(string $sessionId): ?array
    {
        if ($this->isMock()) {
            return [
                'payment_status' => 'paid',
                'payment_id' => 'mock_payment_'.$sessionId,
                'raw_response' => ['mock' => true, 'session_id' => $sessionId],
            ];
        }

        try {
            $response = $this->request('get', '/checkout/session/'.$sessionId);
            $data = $response['data'] ?? [];

            return [
                'payment_status' => $data['payment_status'] ?? 'unpaid',
                'payment_id' => $this->extractPaymentIdFromSession($data),
                'raw_response' => $response,
            ];
        } catch (RuntimeException $e) {
            Log::warning('Thawani session retrieval failed.', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function verifyWebhookSignature(Request $request): bool
    {
        if ($this->isMock()) {
            if (! app()->environment('local')) {
                return false;
            }

            $mockSecret = config('carrent.thawani.mock_webhook_secret');
            $signature = $request->header('X-Thawani-Mock-Secret');

            return $mockSecret && $signature && hash_equals($mockSecret, $signature);
        }

        $secret = config('carrent.thawani.webhook_secret');
        $signature = $request->header('thawani-signature');

        if (! $secret || ! $signature) {
            return false;
        }

        $rawBody = $request->getContent();
        $computed = hash_hmac('sha256', $rawBody, $secret);

        return hash_equals($computed, $signature);
    }

    public function parseWebhookPayload(array $payload): ?array
    {
        $data = $payload['data'] ?? $payload;
        $sessionId = $data['session_id'] ?? $payload['session_id'] ?? null;
        $status = $data['payment_status'] ?? $payload['payment_status'] ?? null;

        if (! $sessionId || ! $status) {
            return null;
        }

        $normalizedStatus = match ($status) {
            'paid', 'succeeded', 'success' => 'paid',
            'failed', 'cancelled', 'canceled' => 'failed',
            default => $status,
        };

        return [
            'session_id' => $sessionId,
            'status' => $normalizedStatus,
            'payment_id' => $this->extractPaymentIdFromSession($data),
            'payload' => $payload,
        ];
    }

    public function refund(Payment $payment, ?string $reason = null): array
    {
        if ($this->isMock()) {
            return [
                'status' => 'refunded',
                'raw_response' => [
                    'mock' => true,
                    'payment_id' => $payment->external_payment_id,
                ],
            ];
        }

        $paymentId = $this->resolvePaymentId($payment);

        $response = $this->request('post', '/refunds', [
            'payment_id' => $paymentId,
            'amount' => $this->toBaisa($payment->amount),
            'reason' => $reason ?? 'Booking cancellation refund',
            'metadata' => [
                'booking_id' => $payment->booking_id,
                'payment_record_id' => $payment->id,
            ],
        ]);

        return [
            'status' => 'refunded',
            'raw_response' => $response,
        ];
    }

    protected function resolvePaymentId(Payment $payment): string
    {
        if ($payment->external_payment_id) {
            return $payment->external_payment_id;
        }

        $sessionId = $payment->external_session_id;
        if (! $sessionId) {
            throw new RuntimeException('Payment is missing an external session ID.');
        }

        $session = $this->retrieveSession($sessionId);
        if (! empty($session['payment_id'])) {
            return $session['payment_id'];
        }

        $invoice = $session['raw_response']['data']['invoice'] ?? null;
        if ($invoice) {
            $remotePaymentId = $this->findPaymentIdByInvoice($invoice);
            if ($remotePaymentId) {
                return $remotePaymentId;
            }
        }

        $remotePaymentId = $this->findPaymentIdByClientReference((string) $payment->booking_id);
        if ($remotePaymentId) {
            return $remotePaymentId;
        }

        throw new RuntimeException('Unable to resolve Thawani payment ID for refund.');
    }

    protected function findPaymentIdByInvoice(string $invoice): ?string
    {
        $response = $this->request('get', '/payments', [
            'checkout_invoice' => $invoice,
            'limit' => 10,
        ]);

        return $this->firstPaymentIdFromList($response);
    }

    protected function findPaymentIdByClientReference(string $clientReferenceId): ?string
    {
        $response = $this->request('get', '/payments', [
            'client_reference_id' => $clientReferenceId,
            'limit' => 10,
        ]);

        return $this->firstPaymentIdFromList($response);
    }

    protected function firstPaymentIdFromList(array $response): ?string
    {
        $payments = $response['data'] ?? [];

        if (! is_array($payments)) {
            return null;
        }

        foreach ($payments as $payment) {
            if (! empty($payment['payment_id'])) {
                return $payment['payment_id'];
            }

            if (! empty($payment['id'])) {
                return $payment['id'];
            }
        }

        return null;
    }

    protected function extractPaymentIdFromSession(array $data): ?string
    {
        return $data['payment_id']
            ?? $data['payment']['payment_id']
            ?? $data['payment']['id']
            ?? null;
    }

    protected function toBaisa(float|string $amount): int
    {
        return (int) round(((float) $amount) * 1000);
    }

    protected function isMock(): bool
    {
        if (config('carrent.thawani.mock')) {
            return true;
        }

        // Local dev without Thawani credentials — use mock checkout automatically.
        if (app()->environment('local') && ! $this->apiKey()) {
            return true;
        }

        return false;
    }

    protected function apiKey(): ?string
    {
        return config('carrent.thawani.secret_key') ?: null;
    }

    protected function publishableKey(): ?string
    {
        return config('carrent.thawani.publishable_key') ?: null;
    }

    /**
     * @return array<string, mixed>
     */
    protected function request(string $method, string $path, array $payload = []): array
    {
        $url = rtrim(config('carrent.thawani.base_url'), '/').$path;

        $pending = Http::withHeaders([
            'thawani-api-key' => $this->apiKey(),
            'Accept' => 'application/json',
        ])->timeout(30);

        $response = match (strtolower($method)) {
            'get' => $pending->get($url, $payload),
            'post' => $pending->post($url, $payload),
            default => throw new RuntimeException("Unsupported HTTP method [{$method}]."),
        };

        if (! $response->successful()) {
            Log::error('Thawani API request failed.', [
                'method' => $method,
                'path' => $path,
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);

            throw new RuntimeException('Thawani API request failed: '.($response->json('description') ?? $response->status()));
        }

        return $response->json() ?? [];
    }
}
