<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Contract;
use App\Models\ContractTemplate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ContractService
{
    public function renderTemplate(ContractTemplate $template, Booking $booking): string
    {
        if ($template->usesPdf()) {
            return '<p>See attached rental agreement PDF.</p>';
        }

        $variables = $this->buildVariables($booking);

        $content = $template->content;
        foreach ($variables as $key => $value) {
            $content = str_replace('{{'.$key.'}}', (string) $value, $content);
        }

        return $content;
    }

    public function generatePdf(Booking $booking, ?ContractTemplate $template = null): Contract
    {
        $template = $template ?? ContractTemplate::where('is_active', true)->firstOrFail();

        Storage::disk('local')->makeDirectory('contracts');
        $filename = 'contracts/booking_'.$booking->id.'_'.time().'.pdf';

        if ($template->usesPdf() && Storage::disk('local')->exists($template->pdf_path)) {
            Storage::disk('local')->copy($template->pdf_path, $filename);
        } else {
            $html = $this->wrapHtml($this->renderTemplate($template, $booking));
            $pdf = Pdf::loadHTML($html);
            Storage::disk('local')->put($filename, $pdf->output());
        }

        return Contract::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'contract_template_id' => $template->id,
                'pdf_path' => $filename,
            ]
        );
    }

    public function mergeSignature(Contract $contract, string $signatureData): Contract
    {
        $booking = $contract->booking()->with(['customer', 'car', 'driver'])->firstOrFail();
        $template = $contract->contractTemplate ?? ContractTemplate::where('is_active', true)->firstOrFail();

        $this->storeSignatureImage($booking->id, $signatureData);

        $signedFilename = 'contracts/booking_'.$booking->id.'_signed_'.time().'.pdf';

        if ($template->usesPdf() && $contract->pdf_path && Storage::disk('local')->exists($contract->pdf_path)) {
            Storage::disk('local')->copy($contract->pdf_path, $signedFilename);
        } else {
            $html = $this->wrapHtml(
                $this->renderTemplate($template, $booking),
                $signatureData,
                $booking->customer->name
            );
            $pdf = Pdf::loadHTML($html);
            Storage::disk('local')->makeDirectory('contracts');
            Storage::disk('local')->put($signedFilename, $pdf->output());
        }

        $contract->update([
            'signature_data' => $signatureData,
            'signed_pdf_path' => $signedFilename,
            'signed_at' => now(),
        ]);

        return $contract->fresh();
    }

    protected function storeSignatureImage(int $bookingId, string $signatureData): void
    {
        $base64 = preg_replace('#^data:image/\w+;base64,#i', '', $signatureData);
        $decoded = base64_decode($base64, true);

        if ($decoded !== false) {
            Storage::disk('local')->makeDirectory('signatures');
            Storage::disk('local')->put('signatures/booking_'.$bookingId.'.png', $decoded);
        }
    }

    protected function formatTime(mixed $time): string
    {
        if (is_string($time)) {
            return strlen($time) >= 5 ? substr($time, 0, 5) : $time;
        }

        return (string) $time;
    }

    protected function buildVariables(Booking $booking): array
    {
        $booking->loadMissing(['customer', 'car', 'driver']);

        return [
            'customer_name' => $booking->customer->name,
            'customer_phone' => $booking->customer->phone,
            'car_name' => $booking->car->name,
            'car_brand' => $booking->car->brand,
            'car_model' => $booking->car->model,
            'plate_number' => $booking->car->plate_number,
            'pickup_date' => $booking->pickup_date->format('Y-m-d').($booking->pickup_time ? ' '.$this->formatTime($booking->pickup_time) : ''),
            'return_date' => $booking->return_date->format('Y-m-d').($booking->return_time ? ' '.$this->formatTime($booking->return_time) : ''),
            'pickup_time' => $booking->pickup_time ? $this->formatTime($booking->pickup_time) : '—',
            'return_time' => $booking->return_time ? $this->formatTime($booking->return_time) : '—',
            'pickup_location' => $booking->pickup_location,
            'dropoff_location' => $booking->dropoff_location,
            'additional_notes' => $booking->additional_notes ?: '—',
            'with_driver' => $booking->with_driver ? 'Yes' : 'No',
            'driver_name' => $booking->driver?->name ?? 'N/A',
            'total_price' => number_format((float) $booking->total_price, 2),
            'company_name' => config('carrent.company_name'),
        ];
    }

    protected function wrapHtml(string $content, ?string $signatureData = null, ?string $customerName = null): string
    {
        $signatureHtml = '';
        if ($signatureData) {
            $signedAt = now()->format('Y-m-d H:i');
            $name = htmlspecialchars($customerName ?? 'Customer', ENT_QUOTES, 'UTF-8');

            if (extension_loaded('gd')) {
                $signatureHtml = '<div style="margin-top:40px;border-top:1px solid #ccc;padding-top:20px;">'
                    .'<p><strong>Customer Signature:</strong></p>'
                    .'<img src="'.$signatureData.'" style="max-width:300px;height:auto;" />'
                    .'<p>Signed by: '.$name.' on '.$signedAt.'</p></div>';
            } else {
                $signatureHtml = '<div style="margin-top:40px;border-top:1px solid #ccc;padding-top:20px;">'
                    .'<p><strong>Electronic Signature</strong></p>'
                    .'<p>Signed by: <strong>'.$name.'</strong></p>'
                    .'<p>Date: '.$signedAt.'</p>'
                    .'<p style="color:#666;font-size:11px;">Signature captured digitally and stored on file.</p>'
                    .'</div>';
            }
        }

        return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            body { font-family: DejaVu Sans, sans-serif; font-size: 12px; line-height: 1.6; }
            h1 { font-size: 18px; }
        </style></head><body>'.$content.$signatureHtml.'</body></html>';
    }
}
