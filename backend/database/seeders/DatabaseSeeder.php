<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Car;
use App\Models\ContractTemplate;
use App\Models\Driver;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! Admin::where('email', env('ADMIN_EMAIL', 'admin@carrent.om'))->exists()) {
            Admin::create([
                'name' => 'Admin',
                'email' => env('ADMIN_EMAIL', 'admin@carrent.om'),
                'password' => env('ADMIN_PASSWORD', 'password'),
            ]);
        }

        $cars = [
            [
                'name' => 'Toyota Camry 2024',
                'brand' => 'Toyota',
                'model' => 'Camry',
                'plate_number' => 'OM-1234',
                'daily_price' => 25.00,
                'images' => ['https://images.unsplash.com/photo-1621007947382-bb3c3054e175?w=400&h=250&fit=crop'],
                'status' => 'available',
                'features' => ['seats' => 5, 'transmission' => 'Automatic', 'fuel' => 'Petrol'],
            ],
            [
                'name' => 'Nissan Patrol 2023',
                'brand' => 'Nissan',
                'model' => 'Patrol',
                'plate_number' => 'OM-5678',
                'daily_price' => 55.00,
                'images' => ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=250&fit=crop'],
                'status' => 'available',
                'features' => ['seats' => 7, 'transmission' => 'Automatic', 'fuel' => 'Petrol'],
            ],
            [
                'name' => 'Hyundai Accent 2024',
                'brand' => 'Hyundai',
                'model' => 'Accent',
                'plate_number' => 'OM-9012',
                'daily_price' => 18.00,
                'images' => ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=250&fit=crop'],
                'status' => 'available',
                'features' => ['seats' => 5, 'transmission' => 'Automatic', 'fuel' => 'Petrol'],
            ],
            [
                'name' => 'BMW X5 2023',
                'brand' => 'BMW',
                'model' => 'X5',
                'plate_number' => 'OM-3456',
                'daily_price' => 75.00,
                'images' => ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=250&fit=crop'],
                'status' => 'available',
                'features' => ['seats' => 5, 'transmission' => 'Automatic', 'fuel' => 'Petrol'],
            ],
        ];

        foreach ($cars as $car) {
            Car::create($car);
        }

        $drivers = [
            [
                'name' => 'Ahmed Al-Balushi',
                'phone' => '+96891111111',
                'license_number' => 'DL-OM-001',
                'status' => 'active',
            ],
            [
                'name' => 'Mohammed Al-Hinai',
                'phone' => '+96892222222',
                'license_number' => 'DL-OM-002',
                'status' => 'active',
            ],
        ];

        foreach ($drivers as $driver) {
            Driver::create($driver);
        }

        \App\Models\Setting::set('driver_daily_rate', config('carrent.driver_daily_rate'));

        ContractTemplate::create([
            'title' => 'Standard Car Rental Agreement',
            'is_active' => true,
            'content' => <<<'HTML'
<h1>Car Rental Agreement</h1>
<p>This agreement is entered into between <strong>{{company_name}}</strong> and <strong>{{customer_name}}</strong> (Phone: {{customer_phone}}).</p>
<h2>Vehicle Details</h2>
<ul>
    <li>Vehicle: {{car_name}} ({{car_brand}} {{car_model}})</li>
    <li>Plate Number: {{plate_number}}</li>
</ul>
<h2>Rental Period</h2>
<ul>
    <li>Pickup Date: {{pickup_date}}</li>
    <li>Return Date: {{return_date}}</li>
    <li>Pickup Location: {{pickup_location}}</li>
    <li>Drop-off Location: {{dropoff_location}}</li>
</ul>
<h2>Driver Service</h2>
<p>With Driver: {{with_driver}}</p>
<p>Driver Name: {{driver_name}}</p>
<h2>Payment</h2>
<p>Total Price: OMR {{total_price}}</p>
<p>By signing this agreement, the customer agrees to all terms and conditions of {{company_name}}.</p>
HTML,
        ]);
    }
}
