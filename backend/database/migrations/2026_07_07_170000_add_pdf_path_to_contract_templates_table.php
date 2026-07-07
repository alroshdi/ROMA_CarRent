<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_templates', function (Blueprint $table) {
            $table->string('pdf_path')->nullable()->after('title');
            $table->text('content')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('contract_templates', function (Blueprint $table) {
            $table->dropColumn('pdf_path');
            $table->text('content')->nullable(false)->change();
        });
    }
};
