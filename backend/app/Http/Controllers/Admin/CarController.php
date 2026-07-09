<?php



namespace App\Http\Controllers\Admin;



use App\Http\Controllers\Controller;

use App\Models\ActivityLog;

use App\Models\Car;

use Illuminate\Http\JsonResponse;

use Illuminate\Http\Request;

use Illuminate\Http\UploadedFile;

use Illuminate\Support\Facades\Storage;



class CarController extends Controller

{

    public function index(Request $request): JsonResponse

    {

        $paginator = Car::when($request->status, fn ($q, $status) => $q->where('status', $status))

            ->latest()

            ->paginate(20);



        return response()->json([

            'cars' => $paginator->items(),

            'pagination' => [

                'current_page' => $paginator->currentPage(),

                'last_page' => $paginator->lastPage(),

                'per_page' => $paginator->perPage(),

                'total' => $paginator->total(),

            ],

        ]);

    }



    public function store(Request $request): JsonResponse

    {

        $validated = $request->validate([

            'name' => 'required|string|max:255',

            'brand' => 'required|string|max:255',

            'model' => 'required|string|max:255',

            'plate_number' => 'required|string|max:50',

            'daily_price' => 'required|numeric|min:0',

            'status' => 'in:available,maintenance,inactive',

            'features' => 'nullable',

            'image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',

        ]);



        $car = Car::create([

            'name' => $validated['name'],

            'brand' => $validated['brand'],

            'model' => $validated['model'],

            'plate_number' => $validated['plate_number'],

            'daily_price' => $validated['daily_price'],

            'status' => $validated['status'] ?? 'available',

            'features' => $this->parseFeatures($request->input('features')),

            'images' => null,

        ]);



        if ($request->hasFile('image')) {

            $car->update(['images' => [$this->storeCarImage($car, $request->file('image'))]]);

        }



        $this->logActivity($request, 'car.created', $car);



        return response()->json(['message' => 'Car created.', 'car' => $car->fresh()], 201);

    }



    public function show(Car $car): JsonResponse

    {

        return response()->json(['car' => $car->load('bookings')]);

    }



    public function update(Request $request, Car $car): JsonResponse

    {

        $validated = $request->validate([

            'name' => 'sometimes|required|string|max:255',

            'brand' => 'sometimes|required|string|max:255',

            'model' => 'sometimes|required|string|max:255',

            'plate_number' => 'sometimes|required|string|max:50',

            'daily_price' => 'sometimes|numeric|min:0',

            'status' => 'sometimes|in:available,maintenance,inactive',

            'features' => 'nullable',

            'image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',

        ]);



        $updates = collect($validated)->except('image')->all();



        if ($request->has('features')) {

            $updates['features'] = $this->parseFeatures($request->input('features'));

        }



        $car->update($updates);



        if ($request->hasFile('image')) {

            $this->deleteCarImages($car);

            $car->update(['images' => [$this->storeCarImage($car, $request->file('image'))]]);

        }



        $this->logActivity($request, 'car.updated', $car);



        return response()->json(['message' => 'Car updated.', 'car' => $car->fresh()]);

    }



    public function destroy(Request $request, Car $car): JsonResponse

    {

        $this->deleteCarImages($car);

        $car->delete();

        $this->logActivity($request, 'car.deleted', $car);



        return response()->json(['message' => 'Car deleted.']);

    }



    protected function parseFeatures(mixed $features): array

    {

        if (is_string($features)) {

            $decoded = json_decode($features, true);



            return is_array($decoded) ? $decoded : [];

        }



        return is_array($features) ? $features : [];

    }



    protected function storeCarImage(Car $car, UploadedFile $file): string

    {

        $path = $file->store("cars/{$car->id}", 'public');



        return Storage::disk('public')->url($path);

    }



    protected function deleteCarImages(Car $car): void

    {

        foreach ($car->images ?? [] as $image) {

            if (! is_string($image)) {

                continue;

            }



            $path = parse_url($image, PHP_URL_PATH);

            if ($path && str_starts_with($path, '/storage/')) {

                Storage::disk('public')->delete(ltrim(str_replace('/storage/', '', $path), '/'));

            }

        }

    }



    protected function logActivity(Request $request, string $action, Car $car): void

    {

        ActivityLog::create([

            'admin_id' => $request->user()->id,

            'action' => $action,

            'subject_type' => Car::class,

            'subject_id' => $car->id,

            'metadata' => ['plate_number' => $car->plate_number],

        ]);

    }

}

