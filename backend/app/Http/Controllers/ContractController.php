<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Services\ContractService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContractController extends Controller
{
    public function __construct(private ContractService $contractService) {}

    public function generate(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeCustomerBooking($request, $booking);

        try {
            $contract = $this->contractService->generatePdf($booking);
            $contract->load('contractTemplate');

            return response()->json([
                'message' => 'Contract generated successfully.',
                'contract' => $contract,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to generate contract. Please try again.',
            ], 500);
        }
    }

    public function sign(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeCustomerBooking($request, $booking);

        $validated = $request->validate([
            'signature_data' => 'required|string|starts_with:data:image/',
        ]);

        try {
            $contract = $booking->contract;
            if (! $contract) {
                $contract = $this->contractService->generatePdf($booking);
            }

            $contract = $this->contractService->mergeSignature($contract, $validated['signature_data']);

            return response()->json([
                'message' => 'Contract signed successfully.',
                'contract' => $contract,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to sign contract. Please try again.',
            ], 500);
        }
    }

    public function downloadPdf(Request $request, Booking $booking): StreamedResponse|JsonResponse
    {
        $this->authorizeCustomerBooking($request, $booking);

        $contract = $booking->contract;
        if (! $contract) {
            return response()->json(['message' => 'Contract not found.'], 404);
        }

        $path = $contract->signed_pdf_path ?? $contract->pdf_path;

        if (! Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'PDF file not found.'], 404);
        }

        return Storage::disk('local')->download($path, 'contract_booking_'.$booking->id.'.pdf');
    }

    protected function authorizeCustomerBooking(Request $request, Booking $booking): void
    {
        $user = $request->user();

        if (! $user instanceof Customer || $booking->customer_id !== $user->id) {
            abort(403, 'Unauthorized access to booking.');
        }
    }
}
