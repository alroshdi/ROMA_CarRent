<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Payment;
use App\Services\ThawaniService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private ThawaniService $thawaniService) {}

    public function index(Request $request): JsonResponse
    {
        $payments = Payment::with(['booking.customer', 'booking.car'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
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
        if ($payment->status !== 'paid') {
            return response()->json(['message' => 'Only paid payments can be refunded.'], 422);
        }

        $result = $this->thawaniService->refund($payment);

        $payment->update([
            'status' => 'refunded',
            'raw_response' => array_merge($payment->raw_response ?? [], $result['raw_response']),
        ]);

        $payment->booking->update([
            'payment_status' => 'refunded',
            'refund_status' => 'refunded',
        ]);

        $this->logActivity($request, 'payment.refunded', $payment);

        return response()->json([
            'message' => 'Refund processed.',
            'payment' => $payment->fresh(),
        ]);
    }

    protected function logActivity(Request $request, string $action, Payment $payment): void
    {
        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => Payment::class,
            'subject_id' => $payment->id,
            'metadata' => ['amount' => $payment->amount],
        ]);
    }
}
