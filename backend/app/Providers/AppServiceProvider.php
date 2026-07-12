<?php

namespace App\Providers;

use App\Services\Payment\PaymentGatewayManager;
use App\Services\Payment\PaymentService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentGatewayManager::class);
        $this->app->singleton(PaymentService::class);
    }

    public function boot(): void
    {
        //
    }
}
