<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->time('pickup_time')->nullable()->after('pickup_date');
            $table->time('return_time')->nullable()->after('return_date');
            $table->text('additional_notes')->nullable()->after('dropoff_location');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['pickup_time', 'return_time', 'additional_notes']);
        });
    }
};
