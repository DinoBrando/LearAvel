import { LaravelModel, LaravelField } from '../types';

// Helper to get field type for Laravel Migrations
function getMigrationType(field: LaravelField): string {
  const defaults: { [key: string]: string } = {
    string: `$table->string('${field.name}');`,
    text: `$table->text('${field.name}');`,
    boolean: `$table->boolean('${field.name}')->default(false);`,
    integer: `$table->integer('${field.name}');`,
    decimal: `$table->decimal('${field.name}', 8, 2);`,
  };
  return defaults[field.type] || `$table->string('${field.name}');`;
}

// Helper to get cast type for Eloquent Model
function getCastType(field: LaravelField): string | null {
  if (field.type === 'boolean') return `'${field.name}' => 'boolean'`;
  if (field.type === 'integer') return `'${field.name}' => 'integer'`;
  if (field.type === 'decimal') return `'${field.name}' => 'decimal:2'`;
  return null;
}

export function generateMigration(model: LaravelModel): string {
  const fieldsStr = model.fields
    .map(f => `            ${getMigrationType(f)}`)
    .join('\n');

  return `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This defines the database structure for the "${model.pluralName}" table.
     */
    public function up(): void
    {
        Schema::create('${model.pluralName}', function (Blueprint $table) {
            $table->id(); // Autoincrementing primary key
${fieldsStr}
            $table->timestamps(); // Generates nullable 'created_at' and 'updated_at' columns
        });
    }

    /**
     * Reverse the migrations.
     * Drop the table if we roll it back.
     */
    public function down(): void
    {
        Schema::dropIfExists('${model.pluralName}');
    }
};`;
}

export function generateModel(model: LaravelModel): string {
  const fillableFields = model.fields.map(f => `'${f.name}'`).join(', ');
  const castList = model.fields
    .map(f => getCastType(f))
    .filter(Boolean);

  let castsBlock = '';
  if (castList.length > 0) {
    castsBlock = `\n    /**\n     * The attributes that should be cast to native types.\n     * This automatically handles database type conversions!\n     */\n    protected $casts = [\n        ` + castList.join(',\n        ') + `\n    ];\n`;
  }

  return `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

/**
 * Representing the Eloquent Model for the ${model.name}.
 * Think of this as the PHP equivalent of an ORM Entity or Schema (like Prisma/Sequelize).
 */
class ${model.name} extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * Keeps your DB safe against malicious parameter injection!
     */
    protected $fillable = [
        ${fillableFields}
    ];
${castsBlock}
    /**
     * Scope helper or Helper functions could go here!
     * e.g., public function scopeActive($query) { return $query->where('is_active', true); }
     */
}`;
}

export function generateRequest(model: LaravelModel): string {
  const rulesStr = model.fields
    .map(f => {
      const parts = [];
      if (f.isRequired) {
        parts.push('required');
      } else {
        parts.push('nullable');
      }

      if (f.type === 'boolean') parts.push('boolean');
      else if (f.type === 'integer') parts.push('integer');
      else if (f.type === 'decimal') parts.push('numeric');
      else if (f.type === 'text') parts.push('string');
      else parts.push('string|max:255');

      return `            '${f.name}' => '${parts.join('|')}',`;
    })
    .join('\n');

  return `<?php

namespace App\\Http\\Requests;

use Illuminate\\Foundation\\Http\\FormRequest;

/**
 * Handles authorization and validation rules for ${model.name} modifications.
 * This segregates validation concern out of the main Controller!
 */
class Store${model.name}Request extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Return true to allow any authenticated or public viewer to complete this action
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     * Laravel automatically validates inputs against these rules and handles failure!
     */
    public function rules(): array
    {
        return [
${rulesStr}
        ];
    }

    /**
     * Custom-formatted error messages (Optional)
     */
    public function messages(): array
    {
        return [
            // e.g. 'title.required' => 'You must input a title for this item!',
        ];
    }
}`;
}

export function generateController(model: LaravelModel): string {
  const lowerPlural = model.pluralName;
  const lowerSingular = model.name.toLowerCase();

  return `<?php

namespace App\\Http\\Controllers;

use App\\Models\\${model.name};
use App\\Http\\Requests\\Store${model.name}Request;
use Illuminate\\Http\\Request;

/**
 * Handles incoming HTTP requests for ${model.pluralName} CRUD operations.
 */
class ${model.name}Controller extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /${lowerPlural}
     */
    public function index()
    {
        // Eloquent ORM: Feeds all records from database ordered newest first
        $${lowerPlural} = ${model.name}::latest()->get();

        // Pass the records onto the index Blade view template
        return view('${lowerPlural}.index', compact('${lowerPlural}'));
    }

    /**
     * Show the form for creating a new resource.
     * GET /${lowerPlural}/create
     */
    public function create()
    {
        return view('${lowerPlural}.create');
    }

    /**
     * Store a newly created resource in storage.
     * POST /${lowerPlural}
     */
    public function store(Store${model.name}Request $request)
    {
        // $request->validated() contains ONLY safe validated parameters passed rules check
        ${model.name}::create($request->validated());

        // Redirect back to main page with a successful flash notification
        return redirect()
            ->route('${lowerPlural}.index')
            ->with('success', '${model.name} created successfully!');
    }

    /**
     * Display the specified resource.
     * GET /${lowerPlural}/{${lowerSingular}}
     * (Laravel automatically executes implicit Route Model Binding to fetch matching ID!)
     */
    public function show(${model.name} $${lowerSingular})
    {
        return view('${lowerPlural}.show', compact('${lowerSingular}'));
    }

    /**
     * Show the form for editing the specified resource.
     * GET /${lowerPlural}/{${lowerSingular}}/edit
     */
    public function edit(${model.name} $${lowerSingular})
    {
        return view('${lowerPlural}.edit', compact('${lowerSingular}'));
    }

    /**
     * Update the specified resource in storage.
     * PUT /${lowerPlural}/{${lowerSingular}}
     */
    public function update(Store${model.name}Request $request, ${model.name} $${lowerSingular})
    {
        // Update the bound record details securely
        $${lowerSingular}->update($request->validated());

        return redirect()
            ->route('${lowerPlural}.index')
            ->with('success', '${model.name} updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     * DELETE /${lowerPlural}/{${lowerSingular}}
     */
    public function destroy(${model.name} $${lowerSingular})
    {
        // Removes record from DB
        $${lowerSingular}->delete();

        return redirect()
            ->route('${lowerPlural}.index')
            ->with('success', '${model.name} deleted successfully!');
    }
}`;
}

export function generateWebRoutes(model: LaravelModel): string {
  return `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\${model.name}Controller;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Set the home route to redirect to the CRUD indexes page
Route::get('/', function () {
    return redirect()->route('${model.pluralName}.index');
});

/**
 * Registering RESTful CRUD resource route pathways.
 * This single line registers all 7 standard Laravel resource routes automatically:
 *
 * HTTP Method | URI                         | Controller Method  | Route Name
 * ------------|-----------------------------|--------------------|---------------------
 * GET         | /${model.pluralName}              | index              | ${model.pluralName}.index
 * GET         | /${model.pluralName}/create       | create             | ${model.pluralName}.create
 * POST        | /${model.pluralName}              | store              | ${model.pluralName}.store
 * GET         | /${model.pluralName}/{id}         | show               | ${model.pluralName}.show
 * GET         | /${model.pluralName}/{id}/edit    | edit               | ${model.pluralName}.edit
 * PUT/PATCH   | /${model.pluralName}/{id}         | update             | ${model.pluralName}.update
 * DELETE      | /${model.pluralName}/{id}         | destroy            | ${model.pluralName}.destroy
 */
Route::resource('${model.pluralName}', ${model.name}Controller::class);
`;
}

export function generateLayout(model: LaravelModel): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Laravel Learning App' }}</title>
    <!-- Use Tailwind CSS in Laravel (via Vite bundling directives) -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans antialiased">

    <!-- Header Navigation bar -->
    <header class="bg-white shadow-xs border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <!-- Laravel Logo mockup -->
                <div class="bg-red-500 text-white font-bold p-1 px-2.5 rounded-lg text-sm tracking-tighter">
                    L
                </div>
                <span class="font-semibold text-slate-900 text-lg">My Laravel CRUD App</span>
            </div>
            
            <nav class="flex space-x-6">
                <a href="{{ route('${model.pluralName}.index') }}" class="text-sm font-medium text-slate-600 hover:text-red-500 transition">
                    Manage ${model.name}s
                </a>
            </nav>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Display global flash feedback values -->
        @if (session('success'))
            <div class="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-lg text-sm shadow-xs flex items-center justify-between">
                <div>{{ session('success') }}</div>
            </div>
        @endif

        @yield('content')
    </main>

    <!-- Footer copyright info -->
    <footer class="bg-white border-t border-slate-200 py-6 mt-12">
        <div class="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
            &copy; {{ date('Y') }} Laravel Framework. Powering elegant PHP backend development.
        </div>
    </footer>

</body>
</html>`;
}

export function generateIndexView(model: LaravelModel): string {
  const plural = model.pluralName;
  const singular = model.name.toLowerCase();

  const headers = model.fields.map(f => `<th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">${f.name}</th>`).join('\n                            ');
  const cells = model.fields
    .map(f => {
      if (f.type === 'boolean') {
        return `<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                @if($item->${f.name})
                                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">True</span>
                                @else
                                    <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">False</span>
                                @endif
                            </td>`;
      }
      return `<td class="px-6 py-4 text-sm text-slate-800">{{ $item->${f.name} }}</td>`;
    })
    .join('\n                            ');

  return `@extends('layouts.app')

@section('content')
<div class="md:flex md:items-center md:justify-between mb-8">
    <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate tracking-tight">
            ${model.name} Repository
        </h2>
        <p class="text-sm text-slate-500 mt-1">
            Browse, manage, and edit records dynamically via Eloquent ORM interface.
        </p>
    </div>
    <div class="mt-4 flex md:mt-0 md:ml-4">
        <!-- Laravel Blade Route binding directs to the Creation Page -->
        <a href="{{ route('${plural}.create') }}" class="btn inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-lg font-medium text-white text-sm hover:bg-red-700 transition">
            Add New ${model.name}
        </a>
    </div>
</div>

<div class="bg-white shadow-xs border border-slate-200 rounded-xl overflow-hidden">
    @if($${plural}->isEmpty())
        <div class="p-12 text-center">
            <p class="text-slate-500 text-sm">No ${plural} records found in database.</p>
            <a href="{{ route('${plural}.create') }}" class="mt-4 inline-block text-xs text-red-600 hover:underline">
                Create your first record &rarr;
            </a>
        </div>
    @else
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">ID</th>
                        ${headers}
                        <th class="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 bg-white">
                    @foreach($${plural} as $item)
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{{ $item->id }}</td>
                            ${cells}
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                <!-- Details link -->
                                <a href="{{ route('${plural}.show', $item->id) }}" class="text-slate-500 hover:text-slate-800 transition">View</a>
                                <!-- Edit link -->
                                <a href="{{ route('${plural}.edit', $item->id) }}" class="text-blue-500 hover:text-blue-700 transition">Edit</a>
                                
                                <!-- Destroy Action Form (using @csrf and @method directives!) -->
                                <form action="{{ route('${plural}.destroy', $item->id) }}" method="POST" class="inline-block" onsubmit="return confirm('Are you sure you want to delete this?');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="text-red-500 hover:text-red-700 transition cursor-pointer">
                                        Delete
                                    </button>
                                </form>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
</div>
@endsection`;
}

export function generateCreateView(model: LaravelModel): string {
  const plural = model.pluralName;

  const formFields = model.fields
    .map(f => {
      let inputField = '';
      if (f.type === 'boolean') {
        inputField = `<div class="flex items-center">
                    <input id="${f.name}" name="${f.name}" type="checkbox" value="1" {{ old('${f.name}') ? 'checked' : '' }} class="h-4 w-4 text-red-600 border-slate-300 rounded focus:ring-red-500">
                    <label for="${f.name}" class="ml-2 block text-sm text-slate-800">
                        Is true / enable
                    </label>
                </div>`;
      } else if (f.type === 'text') {
        inputField = `<textarea id="${f.name}" name="${f.name}" rows="3" class="mt-1 block w-full rounded-lg border-slate-300 shadow-xs focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 bg-white border border-slate-200">{{ old('${f.name}') }}</textarea>`;
      } else if (f.type === 'integer') {
        inputField = `<input type="number" id="${f.name}" name="${f.name}" value="{{ old('${f.name}') }}" class="mt-1 block w-full rounded-lg border-slate-300 shadow-xs focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 bg-white border border-slate-200">`;
      } else if (f.type === 'decimal') {
        inputField = `<input type="number" step="0.01" id="${f.name}" name="${f.name}" value="{{ old('${f.name}') }}" class="mt-1 block w-full rounded-lg border-slate-300 shadow-xs focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 bg-white border border-slate-200">`;
      } else {
        inputField = `<input type="text" id="${f.name}" name="${f.name}" value="{{ old('${f.name}') }}" class="mt-1 block w-full rounded-lg border-slate-300 shadow-xs focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 bg-white border border-slate-200">`;
      }

      return `            <!-- Field: ${f.name} -->
            <div class="mb-5">
                <label for="${f.name}" class="block text-sm font-semibold text-slate-700 justify-between items-center mb-1">
                    ${f.name} ${f.isRequired ? '<span class="text-red-500">*</span>' : ''}
                </label>
                ${inputField}
                <!-- Dynamic Blade error feedback binding -->
                @error('${f.name}')
                    <p class="mt-1.5 text-xs text-red-500 font-medium">{{ $message }}</p>
                @enderror
            </div>`;
    })
    .join('\n\n');

  return `@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="mb-6 flex items-center space-x-2 text-sm text-slate-500">
        <a href="{{ route('${plural}.index') }}" class="hover:text-red-500 transition">Index</a>
        <span>&rarr;</span>
        <span class="text-slate-800">Create</span>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 class="text-lg font-bold text-slate-900">Add New ${model.name}</h3>
            <p class="text-xs text-slate-500">Fires a POST request mapped to ${model.name}Controller@store</p>
        </div>
        
        <!-- Standard HTTP Post directing back into our store route -->
        <form action="{{ route('${plural}.store') }}" method="POST" class="p-6">
            <!-- @csrf is absolutely MANDATORY for Laravel forms to secure against cross-site scripting! -->
            @csrf

${formFields}

            <div class="mt-8 border-t border-slate-100 pt-5 flex justify-end space-x-3">
                <a href="{{ route('${plural}.index') }}" class="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                    Cancel
                </a>
                <button type="submit" class="px-4 py-2 bg-red-600 border border-transparent rounded-lg font-medium text-white text-sm hover:bg-red-700 transition cursor-pointer">
                    Save Record
                </button>
            </div>
        </form>
    </div>
</div>
@endsection`;
}

export function generateEditView(model: LaravelModel): string {
  const plural = model.pluralName;
  const singular = model.name.toLowerCase();

  const formFields = model.fields
    .map(f => {
      let inputField = '';
      if (f.type === 'boolean') {
        inputField = `<div class="flex items-center">
                    <input id="${f.name}" name="${f.name}" type="checkbox" value="1" {{ old('${f.name}', $${singular}->${f.name}) ? 'checked' : '' }} class="h-4 w-4 text-red-600 border-slate-300 rounded focus:ring-red-500">
                    <label for="${f.name}" class="ml-2 block text-sm text-slate-800">
                        Is true / enable
                    </label>
                </div>`;
      } else if (f.type === 'text') {
        inputField = `<textarea id="${f.name}" name="${f.name}" rows="3" class="mt-1 block w-full rounded-lg border-slate-300 shadow-xs focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 bg-white border border-slate-200">{{ old('${f.name}', $${singular}->${f.name}) }}</textarea>`;
      } else if (f.type === 'integer') {
        inputField = `<input type="number" id="${f.name}" name="${f.name}" value="{{ old('${f.name}', $${singular}->${f.name}) }}" class="mt-1 block w-full rounded-lg border-slate-300 shadow-xs focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 bg-white border border-slate-200">`;
      } else if (f.type === 'decimal') {
        inputField = `<input type="number" step="0.01" id="${f.name}" name="${f.name}" value="{{ old('${f.name}', $${singular}->${f.name}) }}" class="mt-1 block w-full rounded-lg border-slate-300 shadow-xs focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 bg-white border border-slate-200">`;
      } else {
        inputField = `<input type="text" id="${f.name}" name="${f.name}" value="{{ old('${f.name}', $${singular}->${f.name}) }}" class="mt-1 block w-full rounded-lg border-slate-300 shadow-xs focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 bg-white border border-slate-200">`;
      }

      return `            <!-- Field: ${f.name} -->
            <div class="mb-5">
                <label for="${f.name}" class="block text-sm font-semibold text-slate-700 justify-between items-center mb-1">
                    ${f.name} ${f.isRequired ? '<span class="text-red-500">*</span>' : ''}
                </label>
                ${inputField}
                <!-- Dynamic Blade error feedback binding -->
                @error('${f.name}')
                    <p class="mt-1.5 text-xs text-red-500 font-medium">{{ $message }}</p>
                @enderror
            </div>`;
    })
    .join('\n\n');

  return `@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="mb-6 flex items-center space-x-2 text-sm text-slate-500">
        <a href="{{ route('${plural}.index') }}" class="hover:text-red-500 transition">Index</a>
        <span>&rarr;</span>
        <span class="text-slate-800">Edit #{{ $${singular}->id }}</span>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 class="text-lg font-bold text-slate-900">Edit ${model.name}</h3>
            <p class="text-xs text-slate-500">Fires a PUT request mapped to ${model.name}Controller@update</p>
        </div>
        
        <!-- Standard HTML Form mapped to PUT method using Laravels spoofing -->
        <form action="{{ route('${plural}.update', $${singular}->id) }}" method="POST" class="p-6">
            <!-- @csrf is absolutely MANDATORY for Laravel forms! -->
            @csrf
            <!-- Spoofs a PUT request since browsers only natively register GET/POST -->
            @method('PUT')

${formFields}

            <div class="mt-8 border-t border-slate-100 pt-5 flex justify-end space-x-3">
                <a href="{{ route('${plural}.index') }}" class="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                    Cancel
                </a>
                <button type="submit" class="px-4 py-2 bg-red-600 border border-transparent rounded-lg font-medium text-white text-sm hover:bg-red-700 transition cursor-pointer">
                    Update Record
                </button>
            </div>
        </form>
    </div>
</div>
@endsection`;
}

export function generateShowView(model: LaravelModel): string {
  const plural = model.pluralName;
  const singular = model.name.toLowerCase();

  const details = model.fields
    .map(f => {
      let renderCode = `{{ $${singular}->${f.name} }}`;
      if (f.type === 'boolean') {
        renderCode = `@if($${singular}->${f.name})
                        <span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">True</span>
                    @else
                        <span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">False</span>
                    @endif`;
      }
      return `                <div class="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">${f.name}</span>
                    <div class="text-sm text-slate-800 font-medium">${renderCode}</div>
                </div>`;
    })
    .join('\n\n');

  return `@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="mb-6 flex items-center space-x-2 text-sm text-slate-500">
        <a href="{{ route('${plural}.index') }}" class="hover:text-red-500 transition">Index</a>
        <span>&rarr;</span>
        <span class="text-slate-800">Details #{{ $${singular}->id }}</span>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
                <h3 class="text-lg font-bold text-slate-900">${model.name} Detail view</h3>
                <p class="text-xs text-slate-500">Loaded via Implicit Route Model Binding</p>
            </div>
            <span class="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-lg font-bold border border-red-100">
                Id: #{{ $${singular}->id }}
            </span>
        </div>
        
        <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
${details}
            </div>

            <div class="mt-6 bg-slate-50 rounded-lg p-3.5 border border-slate-100 text-xs text-slate-400 space-y-1 font-mono">
                <div>// Datetime stamps</div>
                <div>Created At: {{ $${singular}->created_at->format('Y-m-d H:i:s') }}</div>
                <div>Updated At: {{ $${singular}->updated_at->format('Y-m-d H:i:s') }}</div>
            </div>

            <div class="mt-8 border-t border-slate-100 pt-5 flex justify-between">
                <!-- Delete trigger inside detailed view as well -->
                <form action="{{ route('${plural}.destroy', $${singular}->id) }}" method="POST" onsubmit="return confirm('Delete this record permanently?');">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition cursor-pointer">
                        Delete
                    </button>
                </form>

                <div class="flex space-x-3">
                    <a href="{{ route('${plural}.index') }}" class="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                        Back to List
                    </a>
                    <a href="{{ route('${plural}.edit', $${singular}->id) }}" class="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition">
                        Edit Record
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection`;
}

// Map files for user selection inside LaravelFileViewer
export function getLaravelFileContents(model: LaravelModel): { [path: string]: string } {
  const lowerPlural = model.pluralName;
  const lowerSingular = model.name.toLowerCase();

  return {
    'routes/web.php': generateWebRoutes(model),
    [`database/migrations/xxxx_create_${lowerPlural}_table.php`]: generateMigration(model),
    [`app/Models/${model.name}.php`]: generateModel(model),
    [`app/Http/Requests/Store${model.name}Request.php`]: generateRequest(model),
    [`app/Http/Controllers/${model.name}Controller.php`]: generateController(model),
    'resources/views/layouts/app.blade.php': generateLayout(model),
    [`resources/views/${lowerPlural}/index.blade.php`]: generateIndexView(model),
    [`resources/views/${lowerPlural}/create.blade.php`]: generateCreateView(model),
    [`resources/views/${lowerPlural}/edit.blade.php`]: generateEditView(model),
    [`resources/views/${lowerPlural}/show.blade.php`]: generateShowView(model),
  };
}
