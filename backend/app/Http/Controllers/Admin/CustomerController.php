<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Customer;
use App\Rules\GulfPhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $paginator = Customer::when($request->has('is_active'), function ($q) use ($request) {
            $q->where('is_active', $request->boolean('is_active'));
        })
            ->withCount('bookings')
            ->latest()
            ->paginate(20);

        return response()->json([
            'customers' => collect($paginator->items())->map(fn (Customer $customer) => $this->formatCustomer($customer)),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['bookings.car', 'bookings.driver'])->loadCount('bookings');

        return response()->json([
            'customer' => $this->formatCustomer($customer, includeBookings: true),
        ]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|nullable|email|max:255|unique:customers,email,'.$customer->id,
            'phone' => ['sometimes', 'required', 'string', 'max:20', 'unique:customers,phone,'.$customer->id, new GulfPhoneNumber],
            'pin' => 'sometimes|required|string|min:4|max:6',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['name'])) {
            $customer->name = $validated['name'];
        }

        if (array_key_exists('email', $validated)) {
            $customer->email = $validated['email'] ? strtolower($validated['email']) : null;
        }

        if (isset($validated['phone'])) {
            $customer->phone = $validated['phone'];
        }

        if (isset($validated['pin'])) {
            $customer->pin = $validated['pin'];
            $customer->tokens()->delete();
        }

        if (isset($validated['is_active'])) {
            $customer->is_active = $validated['is_active'];
        }

        $customer->save();
        $customer->loadCount('bookings');
        $this->logActivity($request, 'customer.updated', $customer);

        return response()->json([
            'message' => 'Customer updated.',
            'customer' => $this->formatCustomer($customer),
        ]);
    }

    public function resetPin(Request $request, Customer $customer): JsonResponse
    {
        $newPin = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $customer->pin = $newPin;
        $customer->tokens()->delete();
        $customer->save();
        $customer->loadCount('bookings');

        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'customer.pin_reset',
            'subject_type' => Customer::class,
            'subject_id' => $customer->id,
            'metadata' => ['phone' => $customer->phone],
        ]);

        return response()->json([
            'message' => 'PIN reset successfully. Share this PIN with the customer via WhatsApp.',
            'new_pin' => $newPin,
            'customer' => $this->formatCustomer($customer),
        ]);
    }

    public function downloadLicense(Customer $customer): StreamedResponse|JsonResponse
    {
        if (! $customer->driving_license_path) {
            return response()->json(['message' => 'Driving license not found.'], 404);
        }

        $disk = Storage::disk('local')->exists($customer->driving_license_path) ? 'local' : 'public';
        if (! Storage::disk($disk)->exists($customer->driving_license_path)) {
            return response()->json(['message' => 'Driving license not found.'], 404);
        }

        return Storage::disk($disk)->download(
            $customer->driving_license_path,
            'license_'.$customer->id.'.'.pathinfo($customer->driving_license_path, PATHINFO_EXTENSION),
        );
    }

    protected function formatCustomer(Customer $customer, bool $includeBookings = false): array
    {
        $data = $customer->toArray();

        if (! $includeBookings) {
            unset($data['bookings']);
        }

        return $data;
    }

    protected function logActivity(Request $request, string $action, Customer $customer): void
    {
        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => Customer::class,
            'subject_id' => $customer->id,
            'metadata' => ['phone' => $customer->phone],
        ]);
    }
}
