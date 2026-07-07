<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ContractTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = ContractTemplate::latest()->get();

        return response()->json(['templates' => $templates]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $template = ContractTemplate::create($validated);
        $this->logActivity($request, 'contract_template.created', $template);

        return response()->json(['message' => 'Template created.', 'template' => $template], 201);
    }

    public function show(ContractTemplate $contractTemplate): JsonResponse
    {
        return response()->json(['template' => $contractTemplate]);
    }

    public function update(Request $request, ContractTemplate $contractTemplate): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $contractTemplate->update($validated);
        $this->logActivity($request, 'contract_template.updated', $contractTemplate);

        return response()->json(['message' => 'Template updated.', 'template' => $contractTemplate]);
    }

    public function destroy(Request $request, ContractTemplate $contractTemplate): JsonResponse
    {
        $contractTemplate->delete();
        $this->logActivity($request, 'contract_template.deleted', $contractTemplate);

        return response()->json(['message' => 'Template deleted.']);
    }

    protected function logActivity(Request $request, string $action, ContractTemplate $template): void
    {
        ActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => ContractTemplate::class,
            'subject_id' => $template->id,
            'metadata' => ['title' => $template->title],
        ]);
    }
}
