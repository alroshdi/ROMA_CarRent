<?php

use App\Http\Controllers\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\CarController as AdminCarController;
use App\Http\Controllers\Admin\ContractTemplateController as AdminContractTemplateController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\DriverController as AdminDriverController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/settings', [SettingsController::class, 'index']);
Route::get('/cars', [CarController::class, 'index']);
Route::get('/cars/{car}', [CarController::class, 'show']);
Route::get('/drivers', [DriverController::class, 'index']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/payments/webhook', [PaymentController::class, 'webhook']);
Route::get('/payments/success', [PaymentController::class, 'success']);

// Customer authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
    Route::post('/bookings/{booking}/contract', [ContractController::class, 'generate']);
    Route::post('/bookings/{booking}/sign', [ContractController::class, 'sign']);
    Route::get('/bookings/{booking}/contract/pdf', [ContractController::class, 'downloadPdf']);
    Route::post('/payments/checkout', [PaymentController::class, 'checkout']);
});

// Admin routes
Route::prefix('admin')->group(function () {
    Route::post('/auth/login', [AdminAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
        Route::get('/auth/me', [AdminAuthController::class, 'me']);

        Route::get('/analytics', [AdminAnalyticsController::class, 'index']);

        Route::apiResource('cars', AdminCarController::class);
        Route::apiResource('drivers', AdminDriverController::class);
        Route::apiResource('customers', AdminCustomerController::class)->only(['index', 'show', 'update']);
        Route::post('/customers/{customer}/reset-pin', [AdminCustomerController::class, 'resetPin']);
        Route::apiResource('bookings', AdminBookingController::class)->only(['index', 'show', 'update']);
        Route::apiResource('contract-templates', AdminContractTemplateController::class);

        Route::get('/payments', [AdminPaymentController::class, 'index']);
        Route::get('/payments/{payment}', [AdminPaymentController::class, 'show']);
        Route::post('/payments/{payment}/refund', [AdminPaymentController::class, 'refund']);

        Route::get('/settings', [AdminSettingsController::class, 'index']);
        Route::put('/settings', [AdminSettingsController::class, 'update']);
    });
});
