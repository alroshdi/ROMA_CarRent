<?php

return [
    'whatsapp_number' => env('WHATSAPP_NUMBER', '+96812345678'),
    'company_name' => env('COMPANY_NAME', 'CarRent Oman'),
    'company_email' => env('COMPANY_EMAIL', 'info@carrent.om'),
    'company_address' => env('COMPANY_ADDRESS', 'Muscat, Oman'),
    'driver_daily_rate' => (float) env('DRIVER_DAILY_RATE', 25),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    'payment' => [
        'default_gateway' => env('PAYMENT_DEFAULT_GATEWAY', 'thawani'),
    ],
    'thawani' => [
        'mock' => env('THAWANI_MOCK', false),
        'mock_webhook_secret' => env('THAWANI_MOCK_WEBHOOK_SECRET', 'local-mock-secret'),
        'secret_key' => env('THAWANI_SECRET_KEY'),
        'publishable_key' => env('THAWANI_PUBLISHABLE_KEY'),
        'webhook_secret' => env('THAWANI_WEBHOOK_SECRET'),
        'base_url' => env('THAWANI_BASE_URL', 'https://checkout.thawani.om/api/v1'),
        'checkout_url' => env('THAWANI_CHECKOUT_URL', 'https://checkout.thawani.om'),
    ],
];
