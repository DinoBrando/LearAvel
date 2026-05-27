import { useState } from 'react';
import { LaravelModel } from '../types';
import { getLaravelFileContents } from '../data/laravelTemplates';
import { Folder, FileCode, Copy, Check, Sparkles, Code2, AlertCircle } from 'lucide-react';

interface FileViewerProps {
  model: LaravelModel;
}

export default function LaravelFileViewer({ model }: FileViewerProps) {
  const files = getLaravelFileContents(model);
  const filePaths = Object.keys(files);
  const [selectedPath, setSelectedPath] = useState<string>(filePaths[0] || 'routes/web.php');
  const [copied, setCopied] = useState<boolean>(false);

  // If selectedPath no longer exists (e.g., model name changed and directory paths updated)
  const activePath = files[selectedPath] ? selectedPath : filePaths[0] || 'routes/web.php';
  const fileContent = files[activePath] || '';

  // Copy helper
  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Directory visualizer structural groups
  const folderStructure = [
    {
      name: 'routes',
      iconColor: 'text-amber-500',
      files: ['routes/web.php']
    },
    {
      name: 'database/migrations',
      iconColor: 'text-rose-500',
      files: filePaths.filter(p => p.startsWith('database/migrations'))
    },
    {
      name: 'app/Models',
      iconColor: 'text-violet-500',
      files: filePaths.filter(p => p.startsWith('app/Models'))
    },
    {
      name: 'app/Http/Requests',
      iconColor: 'text-emerald-500',
      files: filePaths.filter(p => p.startsWith('app/Http/Requests'))
    },
    {
      name: 'app/Http/Controllers',
      iconColor: 'text-blue-500',
      files: filePaths.filter(p => p.startsWith('app/Http/Controllers'))
    },
    {
      name: 'resources/views/layouts',
      iconColor: 'text-sky-500',
      files: ['resources/views/layouts/app.blade.php']
    },
    {
      name: `resources/views/${model.pluralName}`,
      iconColor: 'text-sky-500',
      files: filePaths.filter(p => p.startsWith(`resources/views/${model.pluralName}`))
    }
  ];

  // Map file names with helpful concept guides
  const getFileHighlightInfo = (pathName: string) => {
    if (pathName.includes('routes/web.php')) {
      return {
        title: 'Laravel Routing (web.php)',
        explanation: 'This handles browser URLs and matches them to actions. Route::resource(...) dynamically maps 7 rest routes to controllers with clean names, handling mapping variables automatically.',
        badges: ['RESTful Routing', 'Web Middleware']
      };
    }
    if (pathName.includes('database/migrations')) {
      return {
        title: 'Database Migrations Schema',
        explanation: 'Laravel migrations create and alter database structures inside SQLite/MySQL without writing raw SQL. Runs model schema changes seamlessly as code.',
        badges: ['DB Columns', 'Blueprints Schema']
      };
    }
    if (pathName.includes('app/Models')) {
      return {
        title: 'Eloquent ORM Model Class',
        explanation: 'Maps this PHP model directly with the database using Active Record rules. Defines attribute cast properties and safeguards database records via strict $fillable attributes validation.',
        badges: ['Eloquent Active Record', '$fillable Safety']
      };
    }
    if (pathName.includes('Http/Requests')) {
      return {
        title: 'Form Request Validators',
        explanation: 'Enforces strict parameters rules on inputs before controllers receive them. On validation checks failure, Laravel redirects users back and handles error messages automatically.',
        badges: ['Form Validation Rules', 'Authorization Logic']
      };
    }
    if (pathName.includes('Http/Controllers')) {
      return {
        title: 'RESTful Resource Controllers',
        explanation: 'This file binds Model methods with Blade View templates. Manages requests, queries database models (using Eloquent), handles redirection, and populates responsive tables with records.',
        badges: ['Controller Actions', 'Route-Model Binding']
      };
    }
    if (pathName.includes('layouts/app.blade.php')) {
      return {
        title: 'Blade Layout Inheritance',
        explanation: 'Serves as the root HTML template for the application. Child Blade files extend this using @extends and inject custom panels inside designated @yield slots.',
        badges: ['HTML Scaffold', 'Blade Directives']
      };
    }
    return {
      title: 'Blade Views Template',
      explanation: 'Compiles HTML dynamically. Utilizes safe bindings like {{ $item->name }} and security measures like @csrf. Displays lists inside @foreach cycles and errors bags with @error.',
      badges: ['Template Bindings', 'CSRF Protection']
    };
  };

  const highlight = getFileHighlightInfo(activePath);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="laravel-files">
      {/* File Tree Explorer (Left Side) - 4 Cols */}
      <div className="lg:col-span-4 bg-zinc-900 border-2 border-zinc-900 overflow-hidden text-zinc-300 shadow-sm flex flex-col justify-between">
        <div>
          <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center space-x-1.5 justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 rounded-full bg-[#FF2D20]" />
              <span className="w-2 rounded-full bg-zinc-550" />
              <span className="w-2 rounded-full bg-zinc-550" />
              <span className="text-[10px] font-black text-zinc-400 ml-2 font-mono uppercase tracking-widest">FILES PACK</span>
            </div>
            <span className="text-[8px] bg-[#FF2D20] text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">Laravel 11</span>
          </div>

          <div className="p-3 space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar">
            {folderStructure.map((folder, folderIdx) => (
              <div key={folderIdx} className="space-y-11">
                <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-[#FF2D20] px-1">
                  <Folder className="w-3.5 h-3.5 shrink-0 fill-current" />
                  <span className="font-mono truncate">{folder.name}</span>
                </div>
                <div className="pl-3.5 border-l border-zinc-850 space-y-0.5 mt-1">
                  {folder.files.map((p, fileIdx) => {
                    const parts = p.split('/');
                    const displayName = parts[parts.length - 1];
                    const isSelected = activePath === p;
                    return (
                      <button
                        key={fileIdx}
                        onClick={() => setSelectedPath(p)}
                        className={`w-full text-left font-mono text-[11px] p-1.5 px-2.5 transition flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-[#FF2D20]/15 text-white font-black border-l-2 border-[#FF2D20]'
                            : 'hover:bg-zinc-800 text-zinc-450 hover:text-white'
                        }`}
                      >
                        <FileCode className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="truncate">{displayName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Code Editor and Commentary (Right Side) - 8 Cols */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        {/* Code Block Container */}
        <div className="bg-zinc-950 border-2 border-zinc-900 overflow-hidden flex flex-col shadow-md">
          <div className="px-4 py-3 bg-zinc-950 border-b-2 border-zinc-900 flex items-center justify-between text-xs">
            <span className="font-mono text-[#FF2D20] font-black truncate max-w-xs sm:max-w-md">
              {activePath}
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-[#FF2D20] text-white text-[10px] font-black uppercase tracking-widest transition flex items-center space-x-1.5 cursor-pointer font-sans"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-450" />
                  <span>Copy PHP Code</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 overflow-x-auto max-h-[385px] bg-zinc-950 font-mono text-xs leading-relaxed text-zinc-205">
            <pre>
              <code>
                {fileContent.split('\n').map((line, ix) => (
                  <div key={ix} className="flex hover:bg-zinc-900/40 py-0.5 rounded">
                    <span className="w-8 text-right text-zinc-600 select-none pr-3.5 border-r border-zinc-850 mr-4 text-[10px]">
                      {ix + 1}
                    </span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>

        {/* Dynamic Context Explanation */}
        <div className="bg-white border-2 border-zinc-900 p-6 flex flex-col space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 text-zinc-900">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-800">{highlight.title}</h4>
            </div>
            <div className="flex space-x-1.5">
              {highlight.badges.map((b, bIdx) => (
                <span key={bIdx} className="bg-zinc-900 text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded uppercase font-sans">
                  {b}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-zinc-650 leading-relaxed font-sans mt-0.5 font-medium">
            {highlight.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
