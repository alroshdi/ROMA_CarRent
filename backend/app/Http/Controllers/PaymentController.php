<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Services\Payment\PaymentGatewayManager;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private PaymentGatewayManager $gatewayManager,
    ) {}

    public function gateways(): JsonResponse
    {
        return response()->json([
            'default_gateway' => config('carrent.payment.default_gateway', 'thawani'),
            'gateways' => $this->gatewayManager->available(),
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'gateway' => 'nullable|string|max:32',
            'embedded' => 'nullable|boolean',
        ]);

        $booking = Booking::where('id', $validated['booking_id'])
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        try {
            $result = $this->paymentService->checkout($booking, $validated['gateway'] ?? null);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (RuntimeException $e) {
            report($e);

            return response()->json([
                'message' => $e->getMessage() ?: 'Failed to create checkout session.',
            ], 502);
        }

        return response()->json($result);
    }

    public function webhook(Request $request, ?string $gateway = null): JsonResponse
    {
        $gateway ??= config('carrent.payment.default_gateway', 'thawani');

        try {
            $result = $this->paymentService->processWebhook($gateway, $request);
        } catch (RuntimeException $e) {
            $status = str_contains($e->getMessage(), 'signature') ? 401 : 404;

            return response()->json(['message' => $e->getMessage()], $status);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($result);
    }

    public function success(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        $sessionId = $request->query('session_id');
        if (! $sessionId) {
            return response()->json(['message' => 'Missing session ID.'], 422);
        }

        try {
            $result = $this->paymentService->verifySuccess($customer, $sessionId);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json($result);
    }

    protected function getCustomer(Request $request): Customer
    {
        $customer = $request->user();

        if (! $customer instanceof Customer) {
            abort(403, 'Customer authentication required.');
        }

        return $customer;
    }
}
