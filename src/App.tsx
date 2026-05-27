import { useState } from 'react';
import { LaravelModel, DbRecord, LogEntry } from './types';
import ModelBuilder from './components/ModelBuilder';
import LaravelFileViewer from './components/LaravelFileViewer';
import LaravelSimulator from './components/LaravelSimulator';
import LaravelTerminal from './components/LaravelTerminal';
import LaravelTutor from './components/LaravelTutor';
import { Layers, Database, Terminal as TermIcon, GraduationCap, ChevronRight, BookOpen, AlertCircle, BookMarked } from 'lucide-react';

const INITIAL_MODEL: LaravelModel = {
  name: 'Task',
  pluralName: 'tasks',
  fields: [
    {
      name: 'title',
      type: 'string',
      isRequired: true,
      validationRules: 'required|string|max:255',
      description: 'The title description of the active task'
    },
    {
      name: 'description',
      type: 'text',
      isRequired: false,
      validationRules: 'nullable|string',
      description: 'Extended descriptive instructions'
    },
    {
      name: 'is_completed',
      type: 'boolean',
      isRequired: false,
      validationRules: 'boolean',
      description: 'Tracks completion status checks'
    }
  ]
};

const INITIAL_RECORDS: DbRecord[] = [
  {
    id: 1,
    title: 'Learn Laravel Routing',
    description: 'Read web.php structures and understand Route::resource mapping rules.',
    is_completed: true,
    created_at: '2026-05-27 10:14:02',
    updated_at: '2026-05-27 10:14:02'
  },
  {
    id: 2,
    title: 'Configure Eloquent Models',
    description: 'Declare mass-assignment protection with a secure $fillable columns array.',
    is_completed: false,
    created_at: '2026-05-27 11:21:40',
    updated_at: '2026-05-27 11:21:40'
  }
];

export default function App() {
  const [model, setModel] = useState<LaravelModel>(INITIAL_MODEL);
  const [records, setRecords] = useState<DbRecord[]>(INITIAL_RECORDS);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'artisan',
      message: 'Laravel bootstrapped into active workspace memory.'
    },
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'eloquent',
      message: 'Connection verified on sqlite::memory database.'
    }
  ]);

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'build' | 'simulate' | 'terminal' | 'academy'>('build');

  // Logs append helper
  const addLog = (type: LogEntry['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, type, message }]);
  };

  const handleModelChange = (updatedModel: LaravelModel) => {
    setModel(updatedModel);
    
    // Changing model entity schema wipes previous mock records and resets database context
    setRecords([]);
    addLog('artisan', `Re-compiled structure schemas. Table "${updatedModel.pluralName}" instantiated.`);
  };

  const handleResetToDefault = () => {
    setModel(INITIAL_MODEL);
    setRecords(INITIAL_RECORDS);
    addLog('artisan', 'Reset configurations back to classic Task CRUD defaults.');
  };

  // Add Record CRUD action and validation rules inspector
  const addRecord = (formData: any) => {
    const errors: { [key: string]: string } = {};

    model.fields.forEach(f => {
      const val = formData[f.name];
      if (f.isRequired && (val === undefined || val === null || val === '')) {
        errors[f.name] = `The ${f.name} column parameter is required.`;
      }
      if (val) {
        if (f.type === 'integer' && isNaN(Number(val))) {
          errors[f.name] = `The ${f.name} columns must be a valid integer number.`;
        }
        if (f.type === 'decimal' && isNaN(Number(val))) {
          errors[f.name] = `The ${f.name} column field must be a floating decimal point factor.`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const newId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    const newRecord: DbRecord = {
      id: newId,
      created_at: timestamp,
      updated_at: timestamp,
      ...formData
    };

    setRecords(prev => [...prev, newRecord]);
    return { success: true };
  };

  const updateRecord = (id: number, formData: any) => {
    const errors: { [key: string]: string } = {};

    model.fields.forEach(f => {
      const val = formData[f.name];
      if (f.isRequired && (val === undefined || val === null || val === '')) {
        errors[f.name] = `The updated ${f.name} column cannot be empty.`;
      }
    });

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

    setRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        return {
          ...rec,
          ...formData,
          updated_at: timestamp
        };
      }
      return rec;
    }));

    return { success: true };
  };

  const deleteRecord = (id: number) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  // Seeder helper to add 3 records dynamically based on model attributes
  const seedDatabase = () => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const mockSeedTitles = ['Tutorial Checklist', 'Verify Auths', 'Review Deployment logs'];
    const mockSeedDescs = ['Test Eloquent triggers', 'Enable CSRF features', 'Optimize cache rules'];

    const newSeeds: DbRecord[] = [];
    const baseId = records.length > 0 ? Math.max(...records.map(r => r.id)) : 0;

    for (let i = 1; i <= 3; i++) {
      const rec: DbRecord = {
        id: baseId + i,
        created_at: timestamp,
        updated_at: timestamp
      };

      model.fields.forEach(f => {
        if (f.type === 'boolean') {
          rec[f.name] = i % 2 === 0;
        } else if (f.type === 'integer') {
          rec[f.name] = i * 15;
        } else if (f.type === 'decimal') {
          rec[f.name] = (i * 12.50);
        } else if (f.name === 'title' || f.name === 'name' || f.name === 'label') {
          rec[f.name] = `${mockSeedTitles[i - 1]} for ${model.name}`;
        } else if (f.type === 'text') {
          rec[f.name] = `${mockSeedDescs[i - 1]} and inspect active features step-by-step.`;
        } else {
          rec[f.name] = `Value ${i}`;
        }
      });

      newSeeds.push(rec);
    }

    setRecords(prev => [...prev, ...newSeeds]);
  };

  const migrateDatabase = () => {
    setRecords([]);
  };

  return (
    <div className="bg-zinc-50 min-h-screen flex flex-col font-sans text-zinc-900 antialiased selection:bg-[#FF2D20] selection:text-white pb-12">
      
      {/* Visual Navigation Dashboard Header */}
      <header className="px-6 md:px-12 py-8 bg-white border-b-4 border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shadow-xs">
        <div className="leading-none">
          <h1 className="text-5xl sm:text-6xl md:text-[80px] lg:text-[96px] font-black tracking-tighter text-[#FF2D20] leading-[0.8] font-display">
            LearAvel
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] font-bold mt-4 text-zinc-500">
            Learning CRUD Sandbox / v11.x
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <span className="text-3xl md:text-[42px] font-black leading-none text-zinc-800 font-display">2026</span>
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF2D20] animate-pulse"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-350"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-350"></span>
            </div>
          </div>
          
          {/* Core Navigation Selector Tabs */}
          <nav className="flex flex-wrap gap-1.5 bg-zinc-100 p-1.5 rounded-xl w-full md:w-auto border border-zinc-200">
            <button
              onClick={() => setActiveWorkspaceTab('build')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                activeWorkspaceTab === 'build' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Design & Code</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('simulate')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                activeWorkspaceTab === 'simulate' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>2. Simulator & MySQL</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('terminal')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                activeWorkspaceTab === 'terminal' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <TermIcon className="w-3.5 h-3.5" />
              <span>3. Artisan CLI API</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('academy')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                activeWorkspaceTab === 'academy' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 animate-bounce" />
              <span>4. Study & AI Chat</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Primary Workspace container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex-grow flex flex-col">
        
        {/* TAB 1: DESIGN COLUMNS AND GENERATE CODEFILES */}
        {activeWorkspaceTab === 'build' && (
          <div className="flex flex-col space-y-6">
            <div className="bg-white p-6 border-l-4 border-[#FF2D20] shadow-xs flex items-start space-x-3.5 text-xs text-zinc-700">
              <BookMarked className="w-5 h-5 text-[#FF2D20] shrink-0 mt-0.5" />
              <div>
                <strong>TRAINING PHASE 01:</strong> Customize your DB Columns on the left Model Builder (e.g. changing column names or models to <code>Post</code>, <code>Contact</code> or <code>Product</code>) and immediately browse the created <strong>Laravel web files package</strong> on the right container! Learn where validations are structured and how Blade rendering displays inputs.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <ModelBuilder
                  model={model}
                  onModelChange={handleModelChange}
                  onResetToDefault={handleResetToDefault}
                />
              </div>
              <div className="lg:col-span-8">
                <LaravelFileViewer model={model} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE SIMULATOR & BACKEND DATA RUNS */}
        {activeWorkspaceTab === 'simulate' && (
          <div className="flex flex-col space-y-6">
            <div className="bg-white p-6 border-l-4 border-emerald-500 shadow-xs flex items-start space-x-3.5 text-xs text-zinc-700">
              <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong>TRAINING PHASE 02:</strong> Interact with the visual mock web application browser frame in real-time! Create entries (testing input validation criteria), edit items, or execute deletions. View SQL queries and events matched synchronously inside the database monitor!
              </div>
            </div>

            <div className="max-w-5xl mx-auto w-full">
              <LaravelSimulator
                model={model}
                records={records}
                onAddRecord={addRecord}
                onUpdateRecord={updateRecord}
                onDeleteRecord={deleteRecord}
                logs={logs}
                onAddLog={addLog}
              />
            </div>
          </div>
        )}

        {/* TAB 3: ARTISAN CONSOLE TERMINAL SHELL */}
        {activeWorkspaceTab === 'terminal' && (
          <div className="flex flex-col space-y-6">
            <div className="bg-white p-6 border-l-4 border-amber-500 shadow-xs flex items-start space-x-3 text-xs text-zinc-700">
              <ChevronRight className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong>TRAINING PHASE 03:</strong> Click the terminal line prompt and interact with Laravels console. Try typing <code>php artisan route:list</code> to view resource wildcards, <code>php artisan db:seed</code> to fill MySQL lines, or enter <code>php artisan tinker</code> to query records natively!
              </div>
            </div>

            <div className="max-w-3xl mx-auto w-full">
              <LaravelTerminal
                model={model}
                records={records}
                onAddLog={addLog}
                onSeedDatabase={seedDatabase}
                onMigrateDatabase={migrateDatabase}
              />
            </div>
          </div>
        )}

        {/* TAB 4: CURRICULUM ACADEMY & PRIVATE AI MENTOR CHAT */}
        {activeWorkspaceTab === 'academy' && (
          <div className="flex flex-col space-y-6">
            <div className="bg-white p-6 border-l-4 border-violet-500 shadow-xs flex items-start space-x-3 text-xs text-zinc-700">
              <BookOpen className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <strong>TRAINING PHASE 04:</strong> Browse structured textbook chapters explaining full routing wildcard bindings and CSRF securities side-by-side with Express analogy tables. Take active quiz tests to validate your skills, or chat directly with our AI Tutor on anything Laravel!
              </div>
            </div>

            <div className="max-w-4xl mx-auto w-full">
              <LaravelTutor model={model} />
            </div>
          </div>
        )}

      </main>

      {/* Styled Bottom Sync Footer */}
      <footer className="h-14 bg-zinc-900 text-white flex items-center px-6 md:px-12 mt-12 justify-between shrink-0 font-sans border-t border-zinc-850">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-350">Status: Synchronized</span>
          <div className="flex gap-1.5">
            <div className="h-1 w-4 bg-[#FF2D20]"></div>
            <div className="h-1 w-4 bg-zinc-700"></div>
            <div className="h-1 w-4 bg-zinc-700"></div>
          </div>
        </div>
        <span className="text-[10px] font-mono opacity-60 tracking-wider">PHP v8.3.0 // Laravel v11.x Sandbox Environment</span>
      </footer>

    </div>
  );
}
