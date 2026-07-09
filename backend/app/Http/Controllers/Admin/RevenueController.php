<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RevenueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $period = $request->input('period', 'month');
        if (! in_array($period, ['day', 'month', 'year'], true)) {
            $period = 'month';
        }

        $from = $request->filled('from') ? Carbon::parse($request->input('from'))->startOfDay() : null;
        $to = $request->filled('to') ? Carbon::parse($request->input('to'))->endOfDay() : null;

        $paymentsQuery = Payment::query();
        if ($from) {
            $paymentsQuery->where('created_at', '>=', $from);
        }
        if ($to) {
            $paymentsQuery->where('created_at', '<=', $to);
        }

        $totalCollected = (float) (clone $paymentsQuery)->where('status', 'paid')->sum('amount');
        $totalRefunded = (float) (clone $paymentsQuery)->where('status', 'refunded')->sum('amount');
        $pendingAmount = (float) (clone $paymentsQuery)->where('status', 'initiated')->sum('amount');
        $failedAmount = (float) (clone $paymentsQuery)->where('status', 'failed')->sum('amount');
        $paidCount = (clone $paymentsQuery)->where('status', 'paid')->count();
        $refundedCount = (clone $paymentsQuery)->where('status', 'refunded')->count();

        $todayStart = now()->startOfDay();
        $monthStart = now()->startOfMonth();
        $yearStart = now()->startOfYear();

        $bookingsPaidQuery = Booking::where('payment_status', 'paid');
        if ($from) {
            $bookingsPaidQuery->where('created_at', '>=', $from);
        }
        if ($to) {
            $bookingsPaidQuery->where('created_at', '<=', $to);
        }

        $carRevenue = (float) (clone $bookingsPaidQuery)->sum('car_cost');
        $driverRevenue = (float) (clone $bookingsPaidQuery)->sum('driver_cost');

        $statusBreakdown = (clone $paymentsQuery)
            ->select('status', DB::raw('count(*) as count'), DB::raw('sum(amount) as total'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($row) => [
                $row->status => [
                    'count' => (int) $row->count,
                    'total' => (float) $row->total,
                ],
            ]);

        $periodBreakdown = $this->buildPeriodBreakdown($period, $from, $to);

        $topCars = Booking::query()
            ->select('car_id', DB::raw('sum(total_price) as revenue'), DB::raw('count(*) as bookings'))
            ->where('payment_status', 'paid')
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('created_at', '<=', $to))
            ->groupBy('car_id')
            ->orderByDesc('revenue')
            ->limit(5)
            ->with('car:id,name')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->car?->name ?? '—',
                'revenue' => (float) $row->revenue,
                'bookings' => (int) $row->bookings,
            ]);

        $recentTransactions = Payment::with(['booking.customer', 'booking.car'])
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('created_at', '<=', $to))
            ->latest()
            ->limit(15)
            ->get();

        return response()->json([
            'filters' => [
                'period' => $period,
                'from' => $from?->toDateString(),
                'to' => $to?->toDateString(),
            ],
            'summary' => [
                'total_collected' => $totalCollected,
                'total_refunded' => $totalRefunded,
                'net_revenue' => round($totalCollected - $totalRefunded, 2),
                'pending_amount' => $pendingAmount,
                'failed_amount' => $failedAmount,
                'paid_count' => $paidCount,
                'refunded_count' => $refundedCount,
                'avg_transaction' => $paidCount > 0 ? round($totalCollected / $paidCount, 2) : 0,
                'today_revenue' => (float) Payment::where('status', 'paid')->where('created_at', '>=', $todayStart)->sum('amount'),
                'month_revenue' => (float) Payment::where('status', 'paid')->where('created_at', '>=', $monthStart)->sum('amount'),
                'year_revenue' => (float) Payment::where('status', 'paid')->where('created_at', '>=', $yearStart)->sum('amount'),
                'car_revenue' => $carRevenue,
                'driver_revenue' => $driverRevenue,
            ],
            'status_breakdown' => $statusBreakdown,
            'period_breakdown' => $periodBreakdown,
            'top_cars' => $topCars,
            'recent_transactions' => $recentTransactions,
        ]);
    }

    protected function buildPeriodBreakdown(string $period, ?Carbon $from, ?Carbon $to): array
    {
        $rangeStart = $from ?? now()->subMonths(11)->startOfMonth();
        $rangeEnd = $to ?? now()->endOfDay();
        $driver = DB::connection()->getDriverName();

        $labelExpr = match (true) {
            $period === 'day' => 'DATE(created_at)',
            $period === 'year' && $driver === 'mysql' => "DATE_FORMAT(created_at, '%Y')",
            $period === 'year' => "strftime('%Y', created_at)",
            $driver === 'mysql' => "DATE_FORMAT(created_at, '%Y-%m')",
            default => "strftime('%Y-%m', created_at)",
        };

        $rows = Payment::query()
            ->selectRaw("{$labelExpr} as label")
            ->selectRaw("SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as collected")
            ->selectRaw("SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as refunded")
            ->selectRaw('COUNT(*) as count')
            ->where('created_at', '>=', $rangeStart)
            ->where('created_at', '<=', $rangeEnd)
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return $rows->map(fn ($row) => [
            'label' => $row->label,
            'collected' => (float) $row->collected,
            'refunded' => (float) $row->refunded,
            'net' => round((float) $row->collected - (float) $row->refunded, 2),
            'count' => (int) $row->count,
        ])->values()->all();
    }
}
