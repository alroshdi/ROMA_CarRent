<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('gateway', 32)->default('thawani')->after('booking_id');
            $table->string('currency', 3)->default('OMR')->after('amount');
            $table->string('external_session_id')->nullable()->after('gateway');
            $table->string('external_payment_id')->nullable()->after('external_session_id');
        });

        DB::table('payments')->update([
            'external_session_id' => DB::raw('thawani_session_id'),
            'gateway' => 'thawani',
            'currency' => 'OMR',
        ]);

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('thawani_session_id');
            $table->index(['gateway', 'external_session_id']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('thawani_session_id')->nullable()->after('booking_id');
        });

        DB::table('payments')->update([
            'thawani_session_id' => DB::raw('external_session_id'),
        ]);

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['gateway', 'external_session_id']);
            $table->dropColumn(['gateway', 'currency', 'external_session_id', 'external_payment_id']);
        });
    }
};
