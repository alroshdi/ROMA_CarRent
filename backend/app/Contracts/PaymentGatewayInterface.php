<?php

namespace App\Contracts;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    public function key(): string;

    public function name(): string;

    public function isEnabled(): bool;

    /**
     * @return array{session_id: string, checkout_url: string, raw_response: array}
     */
    public function createCheckoutSession(Booking $booking): array;

    public function buildCheckoutUrl(string $sessionId): string;

    /**
     * @return array{payment_status: string, payment_id: ?string, raw_response: array}|null
     */
    public function retrieveSession(string $sessionId): ?array;

    public function verifyWebhookSignature(Request $request): bool;

    /**
     * @return array{session_id: string, status: string, payment_id: ?string, payload: array}|null
     */
    public function parseWebhookPayload(array $payload): ?array;

    /**
     * @return array{status: string, raw_response: array}
     */
    public function refund(Payment $payment, ?string $reason = null): array;

    public function shouldAutoConfirmMock(): bool;
}
