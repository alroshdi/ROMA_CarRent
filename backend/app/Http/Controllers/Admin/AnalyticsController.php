<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $totalRevenue = Payment::where('status', 'paid')->sum('amount');
        $monthlyRevenue = Payment::where('status', 'paid')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        $bookingsByStatus = Booking::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json([
            'summary' => [
                'total_cars' => Car::count(),
                'available_cars' => Car::where('status', 'available')->count(),
                'total_customers' => Customer::count(),
                'active_customers' => Customer::where('is_active', true)->count(),
                'total_drivers' => Driver::count(),
                'active_drivers' => Driver::where('status', 'active')->count(),
                'total_bookings' => Booking::count(),
                'pending_bookings' => Booking::where('status', 'pending')->count(),
                'active_bookings' => Booking::where('status', 'active')->count(),
                'total_revenue' => (float) $totalRevenue,
                'monthly_revenue' => (float) $monthlyRevenue,
            ],
            'bookings_by_status' => $bookingsByStatus,
            'recent_bookings' => Booking::with(['customer', 'car'])
                ->latest()
                ->limit(10)
                ->get(),
        ]);
    }
}
