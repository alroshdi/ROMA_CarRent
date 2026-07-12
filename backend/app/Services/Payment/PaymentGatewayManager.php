<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Services\Payment\Gateways\ThawaniGateway;
use InvalidArgumentException;

class PaymentGatewayManager
{
    /** @var array<string, PaymentGatewayInterface> */
    private array $gateways = [];

    public function __construct()
    {
        $this->register(new ThawaniGateway);
    }

    public function register(PaymentGatewayInterface $gateway): void
    {
        $this->gateways[$gateway->key()] = $gateway;
    }

    public function gateway(?string $key = null): PaymentGatewayInterface
    {
        $key ??= config('carrent.payment.default_gateway', 'thawani');

        if (! isset($this->gateways[$key])) {
            throw new InvalidArgumentException("Payment gateway [{$key}] is not registered.");
        }

        $gateway = $this->gateways[$key];

        if (! $gateway->isEnabled()) {
            throw new InvalidArgumentException("Payment gateway [{$key}] is not enabled.");
        }

        return $gateway;
    }

    public function default(): PaymentGatewayInterface
    {
        return $this->gateway();
    }

    /**
     * @return array<int, array{key: string, name: string}>
     */
    public function available(): array
    {
        return collect($this->gateways)
            ->filter(fn (PaymentGatewayInterface $gateway) => $gateway->isEnabled())
            ->map(fn (PaymentGatewayInterface $gateway) => [
                'key' => $gateway->key(),
                'name' => $gateway->name(),
            ])
            ->values()
            ->all();
    }

    public function has(string $key): bool
    {
        return isset($this->gateways[$key]) && $this->gateways[$key]->isEnabled();
    }
}
