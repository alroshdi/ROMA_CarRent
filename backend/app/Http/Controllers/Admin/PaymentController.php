<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Payment;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function index(Request $request): JsonResponse
    {
        $payments = Payment::with(['booking.customer', 'booking.car'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->gateway, fn ($q, $gateway) => $q->where('gateway', $gateway))
            ->latest()
            ->paginate(20);

        return response()->json($payments);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json([
            'payment' => $payment->load(['booking.customer', 'booking.car']),
        ]);
    }

    public function refund(Request $request, Payment $payment): JsonResponse
    {
        try {
            $payment = $this->paymentService->refund($payment, $request->input('reason'));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            report($e);

            return response()->json(['message' => 'Failed to process refund.'], 502);
        }

        $this->logActivity($request, 'payment.refunded', $payment);

        return response()->json([
            'message' => 'Refund processed.',
            'payment' => $payment,
        ]);
    }

    protected function logActivity(Request $request, string $action, Payment $payment): void
    {
        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => Payment::class,
            'subject_id' => $payment->id,
            'metadata' => [
                'amount' => $payment->amount,
                'gateway' => $payment->gateway,
            ],
        ]);
    }
}
