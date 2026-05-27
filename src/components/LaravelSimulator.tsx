import { useState, useEffect, FormEvent } from 'react';
import { LaravelModel, DbRecord, LogEntry } from '../types';
import { AppWindow, RotateCw, Globe, ArrowLeft, Plus, Eye, Edit3, Trash2, ShieldAlert, Terminal, HelpCircle, CheckCircle, Database } from 'lucide-react';

interface SimulatorProps {
  model: LaravelModel;
  records: DbRecord[];
  onAddRecord: (data: any) => { success: boolean; errors?: { [key: string]: string } };
  onUpdateRecord: (id: number, data: any) => { success: boolean; errors?: { [key: string]: string } };
  onDeleteRecord: (id: number) => void;
  logs: LogEntry[];
  onAddLog: (type: LogEntry['type'], msg: string) => void;
}

export default function LaravelSimulator({
  model,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  logs,
  onAddLog
}: SimulatorProps) {
  const [view, setView] = useState<'index' | 'create' | 'edit' | 'show'>('index');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [csrfToken] = useState<string>(() => 'csrf_' + Math.random().toString(36).substring(2, 10));
  const [flashSuccess, setFlashSuccess] = useState<string | null>(null);
  
  // Highlight of active framework steps in lifecycle
  const [lifecycleSteps, setLifecycleSteps] = useState<string[]>([]);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(-1);

  // Trigger lifecycle visual logs highlight
  const triggerLifecycleAnimation = (steps: string[]) => {
    setLifecycleSteps(steps);
    setActiveStepIdx(0);
  };

  useEffect(() => {
    if (activeStepIdx !== -1 && activeStepIdx < lifecycleSteps.length) {
      const timer = setTimeout(() => {
        setActiveStepIdx(prev => prev + 1);
      }, 500); // Step tick speed
      return () => clearTimeout(timer);
    } else if (activeStepIdx === lifecycleSteps.length) {
      const timer = setTimeout(() => {
        setLifecycleSteps([]);
        setActiveStepIdx(-1);
      }, 2000); // Keep complete highlight for 2s
      return () => clearTimeout(timer);
    }
  }, [activeStepIdx, lifecycleSteps]);

  // Handle Navigation URL
  const getMockUrl = () => {
    const base = `http://localhost:8000/${model.pluralName}`;
    if (view === 'create') return `${base}/create`;
    if (view === 'edit') return `${base}/${selectedId}/edit`;
    if (view === 'show') return `${base}/${selectedId}`;
    return base;
  };

  // Reset form status when transitioning
  const handleNavigate = (targetView: 'index' | 'create' | 'edit' | 'show', id: number | null = null) => {
    setView(targetView);
    setSelectedId(id);
    setFormErrors({});
    if (targetView === 'create') {
      const cleared: any = {};
      model.fields.forEach(f => {
        cleared[f.name] = f.type === 'boolean' ? false : '';
      });
      setFormData(cleared);
      onAddLog('routing', `GET /${model.pluralName}/create matched resource route -> ${model.name}Controller@create`);
      triggerLifecycleAnimation([
        `1. Routing matches: GET /${model.pluralName}/create`,
        `2. ${model.name}Controller@create executes`,
        `3. Renders ${model.pluralName}/create.blade.php template`
      ]);
    } else if (targetView === 'edit' && id !== null) {
      const rec = records.find(r => r.id === id);
      if (rec) {
        setFormData({ ...rec });
        onAddLog('routing', `GET /${model.pluralName}/${id}/edit matched Route model routing -> ${model.name}Controller@edit`);
        triggerLifecycleAnimation([
          `1. Route matches wildcards: GET /${model.pluralName}/{id}/edit`,
          `2. Laravel Implicit Route Model Binding retrieves record #${id}`,
          `3. ${model.name}Controller@edit renders edit.blade.php filled with model data`
        ]);
      }
    } else if (targetView === 'show' && id !== null) {
      onAddLog('routing', `GET /${model.pluralName}/${id} matched -> ${model.name}Controller@show`);
      triggerLifecycleAnimation([
        `1. Route Matches: GET /${model.pluralName}/{id}`,
        `2. Eloquent queries DB for Record ID #${id}`,
        `3. Controller passes matching object to show.blade.php template`
      ]);
    } else {
      onAddLog('routing', `GET /${model.pluralName} matched -> ${model.name}Controller@index`);
      triggerLifecycleAnimation([
        `1. Route matches: GET /${model.pluralName}`,
        `2. ${model.name}Controller@index executes`,
        `3. Eloquent: ${model.name}::latest()->get() runs`,
        `4. Renders index.blade.php table`
      ]);
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAddLog('routing', `POST /${model.pluralName} request dispatched with headers`);
    
    // Simulate validation request and creation
    const rulesCheck = onAddRecord(formData);
    
    if (!rulesCheck.success && rulesCheck.errors) {
      setFormErrors(rulesCheck.errors);
      onAddLog('validation', `Store${model.name}Request validation block FAILED: ${Object.keys(rulesCheck.errors).length} violations`);
      triggerLifecycleAnimation([
        '1. POST URL matched routes/web.php',
        '2. StoreTaskRequest validating incoming request values',
        '3. VALIDATION RULES FAILED! Redirect back with error bags (displayed in @error)'
      ]);
    } else {
      setFlashSuccess(`Success: ${model.name} saved successfully!`);
      setView('index');
      setFormErrors({});
      onAddLog('validation', `Store${model.name}Request passed validation rule parameters`);
      onAddLog('eloquent', `Eloquent Model runs: ${model.name}::create([${Object.keys(formData).map(k => `'${k}' => '${formData[k]}'`).join(', ')}])`);
      triggerLifecycleAnimation([
        '1. POST matches routes/web.php -> store()',
        '2. Validation checks PASSED successfully',
        `3. Eloquent: ${model.name}::create() writes record to table`,
        `4. Redirect triggered route('${model.pluralName}.index') with success session message`
      ]);
      setTimeout(() => setFlashSuccess(null), 4000);
    }
  };

  const handleUpdateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedId === null) return;

    onAddLog('routing', `PUT /${model.pluralName}/${selectedId} request routed`);
    const rulesCheck = onUpdateRecord(selectedId, formData);

    if (!rulesCheck.success && rulesCheck.errors) {
      setFormErrors(rulesCheck.errors);
      onAddLog('validation', `Store${model.name}Request validation rules failed during update`);
      triggerLifecycleAnimation([
        `1. URI PUT /${model.pluralName}/{id} matched routes/web.php`,
        '2. validation failed',
        '3. Redirected back to modify parameters edit forms'
      ]);
    } else {
      setFlashSuccess(`Success: ${model.name} updated successfully!`);
      setView('index');
      setFormErrors({});
      onAddLog('eloquent', `Eloquent Model writes: ${model.name}::findOrFail(${selectedId})->update([...])`);
      triggerLifecycleAnimation([
        `1. PUT /${model.pluralName}/{id} matched -> updates()`,
        '2. Parameter validations pass',
        `3. Eloquent Model updates row index #${selectedId}`,
        '4. Redirected back to index repository'
      ]);
      setSelectedId(null);
      setTimeout(() => setFlashSuccess(null), 4000);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Verify: Delete this Laravel record?')) {
      onAddLog('routing', `DELETE /${model.pluralName}/${id} routed`);
      onDeleteRecord(id);
      onAddLog('eloquent', `Eloquent Model triggered: ${model.name}::destroy(${id})`);
      setFlashSuccess(`${model.name} record deleted!`);
      triggerLifecycleAnimation([
        `1. Route matches: DELETE /${model.pluralName}/${id}`,
        `2. Eloquent retrieves bound ID and deletes record`,
        '3. Page redirects back refresh index data'
      ]);
      setTimeout(() => setFlashSuccess(null), 4000);
      if (view === 'show') setView('index');
    }
  };

  return (
    <div className="bg-zinc-100 border-2 border-zinc-900 overflow-hidden flex flex-col shadow-md" id="laravel-simulator">
      {/* Simulation OS Browser Bar */}
      <div className="bg-zinc-900 text-white px-4 py-3.5 flex items-center justify-between border-b-2 border-zinc-900">
        <div className="flex items-center space-x-2 w-1/4 whitespace-nowrap">
          <AppWindow className="text-[#FF2D20] w-5 h-5 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200 hidden sm:inline truncate">SERVER : MOCK</span>
        </div>
        
        {/* Browser Mock URL bar */}
        <div className="bg-white rounded px-3 py-1 text-xs text-zinc-800 font-mono flex items-center space-x-2 w-2/3 max-w-sm border-2 border-zinc-950">
          <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate text-zinc-900 font-bold">{getMockUrl()}</span>
        </div>

        <button 
          onClick={() => handleNavigate('index')} 
          title="Reload Server State"
          className="p-1 px-2 text-zinc-300 hover:text-[#FF2D20] hover:bg-zinc-800 rounded transition cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Simulator Frame Main Canvas */}
      <div className="bg-zinc-50 min-h-[360px] p-4 sm:p-6 flex flex-col justify-between relative">
        
        {/* Dynamic Frame Banner */}
        {flashSuccess && (
          <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-3 rounded-r-lg text-xs shadow-xs flex items-center justify-between font-sans">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{flashSuccess}</span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">Session Flash Passed</span>
          </div>
        )}

        {/* View switching panel */}
        <div className="flex-grow font-sans">
          {/* INDEX LISTING VIEW */}
          {view === 'index' && (
            <div>
              <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{model.name} Dashboard</h3>
                  <p className="text-xs text-slate-400 font-mono">File: resources/views/{model.pluralName}/index.blade.php</p>
                </div>
                <button
                  onClick={() => handleNavigate('create')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {model.name}</span>
                </button>
              </div>

              {records.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200/80">
                  <p className="text-slate-400 text-sm">Table <code className="font-mono bg-slate-100 p-1 px-1.5 rounded">{model.pluralName}</code> is currently empty.</p>
                  <p className="text-xs text-slate-400 mt-1">Submit a record using the button above to begin Eloquent tests!</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left">ID</th>
                          {model.fields.slice(0, 3).map((f, i) => (
                            <th key={i} className="px-4 py-3 text-left">{f.name}</th>
                          ))}
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 text-xs text-slate-800">
                        {records.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3 font-mono font-bold text-slate-400">#{rec.id}</td>
                            {model.fields.slice(0, 3).map((f, i) => (
                              <td key={i} className="px-4 py-3 truncate max-w-[120px]">
                                {f.type === 'boolean' ? (
                                  rec[f.name] ? (
                                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">True</span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full">False</span>
                                  )
                                ) : (
                                  String(rec[f.name] ?? '')
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                              <button onClick={() => handleNavigate('show', rec.id)} className="text-slate-500 hover:text-slate-900 transition underline cursor-pointer">View</button>
                              <button onClick={() => handleNavigate('edit', rec.id)} className="text-blue-500 hover:text-blue-700 transition underline cursor-pointer">Edit</button>
                              <button onClick={() => handleDelete(rec.id)} className="text-red-500 hover:text-red-700 transition underline cursor-pointer">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CREATE RECORD VIEW */}
          {view === 'create' && (
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mb-4">
                <button onClick={() => handleNavigate('index')} className="hover:text-red-500 flex items-center space-x-1 font-bold">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Repository</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800">New {model.name} Formulation</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Blade View: resources/views/{model.pluralName}/create.blade.php</p>
                </div>

                <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
                  {/* CSRF Alert Notice */}
                  <div className="bg-red-50/50 p-2 border border-red-100 rounded text-[10px] text-red-600/90 flex items-center justify-between font-mono">
                    <span>@csrf Token spoofed: [{csrfToken}]</span>
                    <span className="bg-red-100 px-1 py-0.5 rounded text-[8px] font-bold">CSRF ACTIVE</span>
                  </div>

                  {model.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex justify-between">
                        <span>{field.name} {field.isRequired && <span className="text-red-500">*</span>}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({field.type})</span>
                      </label>
                      {field.type === 'boolean' ? (
                        <div className="flex items-center space-x-2 p-2 px-3 border border-slate-200 rounded-lg">
                          <input
                            type="checkbox"
                            checked={!!formData[field.name]}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                            className="accent-red-500 h-4 w-4"
                          />
                          <span className="text-xs text-slate-600">Toggle values status indicator</span>
                        </div>
                      ) : field.type === 'text' ? (
                        <textarea
                          className={`w-full p-2.5 text-xs bg-slate-50 border ${formErrors[field.name] ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 focus:bg-white`}
                          rows={3}
                          value={formData[field.name] ?? ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                        />
                      ) : (
                        <input
                          type={field.type === 'integer' || field.type === 'decimal' ? 'number' : 'text'}
                          step={field.type === 'decimal' ? '0.01' : undefined}
                          className={`w-full p-2.5 text-xs bg-slate-50 border ${formErrors[field.name] ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200'} rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 focus:bg-white`}
                          value={formData[field.name] ?? ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                        />
                      )}
                      
                      {/* Form Error mapping */}
                      {formErrors[field.name] && (
                        <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center space-x-1 font-mono">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>@error('{field.name}'): {formErrors[field.name]}</span>
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2.5">
                    <button
                      type="button"
                      onClick={() => handleNavigate('index')}
                      className="px-3.5 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                    >
                      Save Database Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT RECORD VIEW */}
          {view === 'edit' && (
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mb-4">
                <button onClick={() => handleNavigate('index')} className="hover:text-red-500 flex items-center space-x-1 font-bold">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800">Edit {model.name} Record #{selectedId}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Template: resources/views/{model.pluralName}/edit.blade.php</p>
                </div>

                <form onSubmit={handleUpdateSubmit} className="p-4 space-y-4">
                  {/* CSRF + Spoofed Method */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-2.5 border border-slate-200 rounded text-[10px] text-slate-500 font-mono">
                    <div>@csrf Token: [{csrfToken}]</div>
                    <div className="text-right text-amber-600 font-bold">@method('PUT') Active</div>
                  </div>

                  {model.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex justify-between">
                        <span>{field.name} {field.isRequired && <span className="text-red-500">*</span>}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({field.type})</span>
                      </label>
                      {field.type === 'boolean' ? (
                        <div className="flex items-center space-x-2 p-2 px-3 border border-slate-200 rounded-lg">
                          <input
                            type="checkbox"
                            checked={!!formData[field.name]}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                            className="accent-red-500 h-4 w-4"
                          />
                          <span className="text-xs text-slate-600">Active status toggle checkbox</span>
                        </div>
                      ) : field.type === 'text' ? (
                        <textarea
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 focus:bg-white"
                          rows={3}
                          value={formData[field.name] ?? ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                        />
                      ) : (
                        <input
                          type={field.type === 'integer' || field.type === 'decimal' ? 'number' : 'text'}
                          step={field.type === 'decimal' ? '0.01' : undefined}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 focus:bg-white"
                          value={formData[field.name] ?? ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                        />
                      )}
                      {formErrors[field.name] && (
                        <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center space-x-1 font-mono">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>@error('{field.name}'): {formErrors[field.name]}</span>
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2.5">
                    <button
                      type="button"
                      onClick={() => handleNavigate('index')}
                      className="px-3.5 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-650 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                    >
                      Update Record Schema
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SHOW / VIEW RECORD DETAILS */}
          {view === 'show' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => handleNavigate('index')} className="text-slate-500 hover:text-red-500 flex items-center space-x-1 text-xs font-bold">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to dashboard</span>
                </button>
                <div className="text-right text-[10px] text-slate-400 font-mono">
                  Blade template: resources/views/{model.pluralName}/show.blade.php
                </div>
              </div>

              {(() => {
                const item = records.find(r => r.id === selectedId);
                if (!item) return <div className="text-red-500 italic text-xs">Record deleted or missing!</div>;
                return (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">Record Specifications Detail</h4>
                      <span className="bg-red-50 text-red-600 text-xs font-extrabold p-1 px-2.5 rounded-lg border border-red-100">
                        Implicit route bound ID: #{item.id}
                      </span>
                    </div>

                    <div className="p-5 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {model.fields.map(f => (
                          <div key={f.name} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{f.name}</span>
                            <span className="font-semibold text-slate-800">
                              {f.type === 'boolean' ? (
                                item[f.name] ? 'True 🟢' : 'False ⚪'
                              ) : (
                                String(item[f.name] ?? '')
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100/60 font-mono text-[10px] text-slate-400 leading-relaxed">
                        <div>// Datetime stamps tracked by Eloquent</div>
                        <div>Created At: {item.created_at}</div>
                        <div>Updated At: {item.updated_at}</div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 flex justify-between">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-650 text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          Delete
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleNavigate('index')}
                            className="px-3.5 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                          >
                            Back List
                          </button>
                          <button
                            onClick={() => handleNavigate('edit', item.id)}
                            className="px-4 py-1.5 bg-blue-600 rounded-lg text-white text-xs font-bold hover:bg-blue-700 transition"
                          >
                            Edit Item
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Dynamic Framework Lifecycle Highlighter */}
        {lifecycleSteps.length > 0 && (
          <div className="mt-6 bg-slate-900 text-white rounded-xl p-4 border border-slate-800 text-xs font-mono space-y-2.5 shadow-md">
            <div className="flex items-center space-x-2 text-red-400 font-bold uppercase tracking-wider text-[10px]">
              <Terminal className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Laravel Compilation Pipeline</span>
            </div>
            
            <div className="space-y-1.5">
              {lifecycleSteps.map((step, idx) => {
                const isActive = idx === activeStepIdx;
                const isPassed = idx < activeStepIdx;
                return (
                  <div
                    key={idx}
                    className={`p-1.5 px-2.5 rounded flex items-center justify-between transition-all duration-300 ${
                      isActive 
                        ? 'bg-red-950/80 border-l-2 border-red-500 font-bold text-red-200' 
                        : isPassed 
                        ? 'text-slate-400 line-through decoration-slate-700 opacity-60' 
                        : 'text-slate-600'
                    }`}
                  >
                    <span>{step}</span>
                    {isActive && <span className="text-[9px] bg-red-900 text-white px-1.5 py-0.5 rounded uppercase tracking-widest font-extrabold animate-bounce">Executing</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Database Viewer Sub-Panel inside Simulator Page */}
      <div className="bg-zinc-900 text-zinc-300 p-6 border-t-2 border-zinc-950 flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-100">MySQL Sandbox Database Browser</h4>
          </div>
          <span className="text-[9px] text-emerald-400 font-black tracking-wider uppercase flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>CONNECT: sqlite::memory::</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0">
          {/* Query Logs and Execution Console */}
          <div className="md:col-span-8 bg-zinc-950 p-4 border-2 border-zinc-950 text-[11px] font-mono leading-relaxed h-[135px] overflow-y-auto">
            <div className="text-zinc-500 border-b border-zinc-900 pb-1.5 mb-1.5 flex justify-between items-center text-[9px] uppercase font-black tracking-wider">
              <span>SQL Queries & Laravel Events Logger</span>
              <span className="text-[#FF2D20]">Active Stream</span>
            </div>
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="text-zinc-650 italic font-medium">// Active event stream is currently idle. Trigger actions above or submit custom inputs schema.</div>
              ) : (
                logs.slice().reverse().map((lg, i) => {
                  let typeColor = 'text-zinc-500';
                  if (lg.type === 'eloquent') typeColor = 'text-emerald-400 font-black';
                  if (lg.type === 'routing') typeColor = 'text-sky-400';
                  if (lg.type === 'validation') typeColor = 'text-violet-400';
                  if (lg.type === 'artisan') typeColor = 'text-amber-400';
                  return (
                    <div key={i} className="flex space-x-2">
                      <span className="text-zinc-700 text-[10px] shrink-0">{lg.timestamp}</span>
                      <span className={`${typeColor} shrink-0`}>[{lg.type.toUpperCase()}]</span>
                      <span className="text-zinc-300 truncate">{lg.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Database Metrics and Structures */}
          <div className="md:col-span-4 bg-zinc-950 p-4 border-2 border-zinc-950 text-[11px] flex flex-col justify-between h-[135px]">
            <div>
              <span className="text-zinc-500 text-[9px] block mb-2 font-mono border-b border-zinc-900 pb-1.5 uppercase font-black tracking-wider">SQL Analytics</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-350">
                <div>Table Name:</div>
                <div className="text-right text-emerald-450 font-black">{model.pluralName}</div>
                
                <div>Total Records:</div>
                <div className="text-right text-zinc-100 font-black">{records.length}</div>

                <div>Active IDs:</div>
                <div className="text-right text-zinc-400 truncate font-black">
                  {records.map(r => r.id).join(', ') || 'N/A'}
                </div>
              </div>
            </div>
            <div className="text-[9px] text-zinc-550 font-mono text-center tracking-wide font-black uppercase">
              Eloquent mapping is automated!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
