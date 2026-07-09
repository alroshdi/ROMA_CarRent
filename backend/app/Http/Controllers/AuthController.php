<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\LoginAttempt;
use App\Rules\GulfPhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    private const LOCK_MINUTES = 15;

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:customers,email',
            'phone' => ['required', 'string', 'max:20', 'unique:customers,phone', new GulfPhoneNumber],
            'pin' => 'required|string|min:4|max:6|confirmed',
        ]);

        $customer = Customer::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'],
            'pin' => $validated['pin'],
        ]);

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'customer' => $customer,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20', new GulfPhoneNumber],
            'pin' => 'required|string',
        ]);

        $this->checkLockout($validated['phone']);

        $customer = Customer::where('phone', $validated['phone'])->first();

        if (! $customer || ! Hash::check($validated['pin'], $customer->pin)) {
            $this->recordFailedAttempt($validated['phone']);

            throw ValidationException::withMessages([
                'phone' => ['Invalid phone number or PIN.'],
            ]);
        }

        if (! $customer->is_active) {
            throw ValidationException::withMessages([
                'phone' => ['Your account has been deactivated.'],
            ]);
        }

        $this->clearAttempts($validated['phone']);

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'customer' => $customer,
            'token' => $token,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        return response()->json(['customer' => $customer]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:customers,email,'.$customer->id,
            'phone' => ['sometimes', 'required', 'string', 'max:20', 'unique:customers,phone,'.$customer->id, new GulfPhoneNumber],
            'current_pin' => 'required_with:pin|string',
            'pin' => 'sometimes|required|string|min:4|max:6|confirmed',
        ]);

        if (isset($validated['pin'])) {
            if (! Hash::check($validated['current_pin'], $customer->pin)) {
                throw ValidationException::withMessages([
                    'current_pin' => ['Current PIN is incorrect.'],
                ]);
            }
            $customer->pin = $validated['pin'];
            $customer->tokens()->delete();
        }

        if (isset($validated['name'])) {
            $customer->name = $validated['name'];
        }

        if (isset($validated['phone'])) {
            $customer->phone = $validated['phone'];
        }

        if (isset($validated['email'])) {
            $customer->email = strtolower($validated['email']);
        }

        $customer->save();

        $response = ['message' => 'Profile updated successfully.', 'customer' => $customer->fresh()];

        if (isset($validated['pin'])) {
            $response['token'] = $customer->createToken('customer-token')->plainTextToken;
        }

        return response()->json($response);
    }

    public function uploadDrivingLicense(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        $request->validate([
            'license' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        if ($customer->driving_license_path) {
            if (Storage::disk('local')->exists($customer->driving_license_path)) {
                Storage::disk('local')->delete($customer->driving_license_path);
            } elseif (Storage::disk('public')->exists($customer->driving_license_path)) {
                Storage::disk('public')->delete($customer->driving_license_path);
            }
        }

        $path = $request->file('license')->store("customers/{$customer->id}", 'local');
        $customer->update(['driving_license_path' => $path]);

        return response()->json([
            'message' => 'Driving license uploaded successfully.',
            'customer' => $customer->fresh(),
        ]);
    }

    public function downloadDrivingLicense(Request $request): StreamedResponse|JsonResponse
    {
        $customer = $this->getCustomer($request);

        if (! $customer->driving_license_path) {
            return response()->json(['message' => 'Driving license not found.'], 404);
        }

        $disk = Storage::disk('local')->exists($customer->driving_license_path) ? 'local' : 'public';
        if (! Storage::disk($disk)->exists($customer->driving_license_path)) {
            return response()->json(['message' => 'Driving license not found.'], 404);
        }

        return Storage::disk($disk)->download(
            $customer->driving_license_path,
            'driving_license_'.$customer->id.'.'.pathinfo($customer->driving_license_path, PATHINFO_EXTENSION),
        );
    }

    public function deleteDrivingLicense(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        if ($customer->driving_license_path) {
            if (Storage::disk('local')->exists($customer->driving_license_path)) {
                Storage::disk('local')->delete($customer->driving_license_path);
            } elseif (Storage::disk('public')->exists($customer->driving_license_path)) {
                Storage::disk('public')->delete($customer->driving_license_path);
            }
            $customer->update(['driving_license_path' => null]);
        }

        return response()->json([
            'message' => 'Driving license removed.',
            'customer' => $customer->fresh(),
        ]);
    }

    protected function getCustomer(Request $request): Customer
    {
        $user = $request->user();

        if (! $user instanceof Customer) {
            abort(403, 'Customer authentication required.');
        }

        return $user;
    }

    protected function checkLockout(string $phone): void
    {
        $attempt = LoginAttempt::where('phone', $phone)->first();

        if ($attempt && $attempt->locked_until && $attempt->locked_until->isFuture()) {
            throw ValidationException::withMessages([
                'phone' => ['Too many failed attempts. Try again after '.$attempt->locked_until->diffForHumans().'.'],
            ]);
        }
    }

    protected function recordFailedAttempt(string $phone): void
    {
        $attempt = LoginAttempt::firstOrCreate(['phone' => $phone], ['attempts' => 0]);
        $attempt->increment('attempts');

        if ($attempt->attempts >= self::MAX_ATTEMPTS) {
            $attempt->update([
                'locked_until' => now()->addMinutes(self::LOCK_MINUTES),
                'attempts' => 0,
            ]);
        }
    }

    protected function clearAttempts(string $phone): void
    {
        LoginAttempt::where('phone', $phone)->delete();
    }
}
