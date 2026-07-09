<?php



namespace App\Http\Controllers\Admin;



use App\Http\Controllers\Controller;

use App\Models\ActivityLog;

use App\Models\ContractTemplate;

use Illuminate\Http\JsonResponse;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Storage;

use Symfony\Component\HttpFoundation\StreamedResponse;



class ContractTemplateController extends Controller

{

    public function index(): JsonResponse

    {

        $templates = ContractTemplate::latest()->get()->map(fn (ContractTemplate $t) => $this->formatTemplate($t));



        return response()->json(['templates' => $templates]);

    }



    public function store(Request $request): JsonResponse

    {

        $validated = $request->validate([

            'title' => 'required|string|max:255',

            'pdf' => 'required|file|mimes:pdf|max:10240',

            'is_active' => 'sometimes|boolean',

        ]);



        $path = $request->file('pdf')->store('contract-templates', 'local');



        $template = ContractTemplate::create([

            'title' => $validated['title'],

            'pdf_path' => $path,

            'content' => null,

            'is_active' => $request->boolean('is_active', true),

        ]);



        $this->logActivity($request, 'contract_template.created', $template);



        return response()->json(['message' => 'Template created.', 'template' => $this->formatTemplate($template)], 201);

    }



    public function show(ContractTemplate $contractTemplate): JsonResponse

    {

        return response()->json(['template' => $this->formatTemplate($contractTemplate)]);

    }



    public function update(Request $request, ContractTemplate $contractTemplate): JsonResponse

    {

        $validated = $request->validate([

            'title' => 'sometimes|required|string|max:255',

            'pdf' => 'sometimes|file|mimes:pdf|max:10240',

            'is_active' => 'sometimes|boolean',

        ]);



        if (isset($validated['title'])) {

            $contractTemplate->title = $validated['title'];

        }



        if ($request->hasFile('pdf')) {

            $this->deletePdfFile($contractTemplate);

            $contractTemplate->pdf_path = $request->file('pdf')->store('contract-templates', 'local');

            $contractTemplate->content = null;

        }



        if ($request->has('is_active')) {

            $contractTemplate->is_active = $request->boolean('is_active');

        }



        $contractTemplate->save();

        $this->logActivity($request, 'contract_template.updated', $contractTemplate);



        return response()->json(['message' => 'Template updated.', 'template' => $this->formatTemplate($contractTemplate)]);

    }



    public function destroy(Request $request, ContractTemplate $contractTemplate): JsonResponse

    {

        $this->deletePdfFile($contractTemplate);

        $contractTemplate->delete();

        $this->logActivity($request, 'contract_template.deleted', $contractTemplate);



        return response()->json(['message' => 'Template deleted.']);

    }



    public function downloadPdf(ContractTemplate $contractTemplate): StreamedResponse|JsonResponse

    {

        if (! $contractTemplate->pdf_path || ! Storage::disk('local')->exists($contractTemplate->pdf_path)) {

            return response()->json(['message' => 'PDF file not found.'], 404);

        }



        $filename = str($contractTemplate->title)->slug().'.pdf';



        return Storage::disk('local')->download($contractTemplate->pdf_path, $filename);

    }



    protected function formatTemplate(ContractTemplate $template): array

    {

        return [

            ...$template->toArray(),

            'has_pdf' => $template->usesPdf(),

        ];

    }



    protected function deletePdfFile(ContractTemplate $template): void

    {

        if ($template->pdf_path && Storage::disk('local')->exists($template->pdf_path)) {

            Storage::disk('local')->delete($template->pdf_path);

        }

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

