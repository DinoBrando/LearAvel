import { useState, useRef, useEffect, FormEvent } from 'react';
import { LaravelModel, DbRecord, LogEntry } from '../types';
import { Terminal, ArrowRight, Play } from 'lucide-react';

interface TerminalProps {
  model: LaravelModel;
  records: DbRecord[];
  onAddLog: (type: LogEntry['type'], msg: string) => void;
  onSeedDatabase: () => void;
  onMigrateDatabase: () => void;
}

export default function LaravelTerminal({
  model,
  records,
  onAddLog,
  onSeedDatabase,
  onMigrateDatabase
}: TerminalProps) {
  const [history, setHistory] = useState<string[]>([
    'Laravel Developer Terminal (v11.x) - Active SSH Sandbox',
    'Type "help" to list available Laravel Artisan commands.',
    ''
  ]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isTinkerMode, setIsTinkerMode] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Autoscroll to bottom of CLI console on logs update
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommandSubmit = (e: FormEvent) => {
    e.preventDefault();
    const command = inputVal.trim();
    if (!command) return;

    const newHistory = [...history, `${isTinkerMode ? '>>>' : '$'} ${command}`];
    setInputVal('');

    // TINKER MODE SHELL LOOP
    if (isTinkerMode) {
      if (command === 'exit' || command === 'quit') {
        setIsTinkerMode(false);
        setHistory([...newHistory, 'Exiting Tinker REPL shell console...', '']);
        onAddLog('artisan', 'Exited php artisan tinker REPL');
        return;
      }

      const lowerCmd = command.toLowerCase().replace(/\s+/g, '');
      const modelLower = model.name.toLowerCase();

      let reply = '';
      if (lowerCmd === `${modelLower}::count()`) {
        reply = `=> ${records.length}`;
        onAddLog('eloquent', `Tinker queried SQL COUNT on ${model.pluralName}`);
      } else if (lowerCmd === `${modelLower}::all()`) {
        reply = `=> Illumina\\Database\\Eloquent\\Collection {\n` + 
          records.map(r => `     [id: ${r.id}, ${model.fields.slice(0, 2).map(f => `${f.name}: "${r[f.name]}"`).join(', ')}]\n`).join('') +
          `   }`;
        onAddLog('eloquent', `Tinker SELECT * queried on ${model.pluralName}`);
      } else if (lowerCmd === `${modelLower}::first()`) {
        if (records.length > 0) {
          const r = records[0];
          reply = `=> App\\Models\\${model.name} {\n` +
            `     id: ${r.id},\n` +
            model.fields.map(f => `     ${f.name}: "${r[f.name]}"`).join(',\n') + `\n` +
            `     created_at: "${r.created_at}",\n` +
            `     updated_at: "${r.updated_at}"\n` +
            `   }`;
        } else {
          reply = '=> null';
        }
        onAddLog('eloquent', `Tinker SELECT * LIMIT 1 queried on ${model.pluralName}`);
      } else if (lowerCmd.startsWith('php')) {
        reply = 'Error: You are already inside tinker PHP REPL console. Type "exit" to run standard shell commands!';
      } else {
        reply = `=> Column details: [${model.name} properties]\n` +
          `   Try typing: \n` +
          `   - ${model.name}::all() \n` +
          `   - ${model.name}::count() \n` +
          `   - ${model.name}::first()`;
      }

      setHistory([...newHistory, reply, '']);
      return;
    }

    // REGULAR DEVELOPER SHELL LOOP
    const cmdArgs = command.split(' ');
    const baseCmd = cmdArgs[0];

    if (baseCmd === 'help') {
      const helper = [
        'Available CLI commands:',
        '========================================',
        '  help                             - List this command list assistance manual.',
        '  php artisan route:list           - Display entire Laravel Router table.',
        '  php artisan migrate              - Build/re-run migration files dynamically.',
        '  php artisan db:seed              - Generate 3 mock records inside the active table.',
        '  php artisan tinker               - Boot Laravels PHP shell to run Eloquent commands.',
        '  php artisan model:show           - Inspect columns, datatypes, validation details.',
        '  clear                            - Terminate log metrics buffers.'
      ];
      setHistory([...newHistory, ...helper, '']);
      onAddLog('artisan', 'Printed help utility menu');
      return;
    }

    if (command === 'clear') {
      setHistory(['Laravel Developer Terminal (v11.x) - Active Session', '']);
      return;
    }

    if (command === 'php artisan route:list') {
      const routesInfo = [
        '+--------+----------+---------------------------------+-------------------------+----------------------------------------------+',
        '| Domain | Method   | URI                             | Name                    | Action                                       |',
        '+--------+----------+---------------------------------+-------------------------+----------------------------------------------+',
        `|        | GET|HEAD | /                               |                         | Redirect to index                            |`,
        `|        | GET|HEAD | /${model.pluralName}              | ${model.pluralName}.index  | App\\Http\\Controllers\\${model.name}Controller@index |`,
        `|        | POST     | /${model.pluralName}              | ${model.pluralName}.store  | App\\Http\\Controllers\\${model.name}Controller@store |`,
        `|        | GET|HEAD | /${model.pluralName}/create       | ${model.pluralName}.create | App\\Http\\Controllers\\${model.name}Controller@create|`,
        `|        | GET|HEAD | /${model.pluralName}/{id}         | ${model.pluralName}.show   | App\\Http\\Controllers\\${model.name}Controller@show  |`,
        `|        | PUT|PATCH| /${model.pluralName}/{id}         | ${model.pluralName}.update | App\\Http\\Controllers\\${model.name}Controller@update|`,
        `|        | DELETE   | /${model.pluralName}/{id}         | ${model.pluralName}.destroy| App\\Http\\Controllers\\${model.name}Controller@destroy|`,
        '+--------+----------+---------------------------------+-------------------------+----------------------------------------------+'
      ];
      setHistory([...newHistory, ...routesInfo, '']);
      onAddLog('artisan', 'Run php artisan route:list mapping');
      return;
    }

    if (command === 'php artisan migrate') {
      onMigrateDatabase();
      const migrateInfo = [
        'Migrated database table structure schemas successfully:',
        `  - Migrating: ${new Date().toISOString().slice(0,10).replace(/-/g, '_')}_create_${model.pluralName}_table`,
        `  - Migrated:  ${new Date().toISOString().slice(0,10).replace(/-/g, '_')}_create_${model.pluralName}_table (14.28ms)`,
        'Database structures updated to latest version.',
      ];
      setHistory([...newHistory, ...migrateInfo, '']);
      onAddLog('artisan', 'Run php artisan migrate schemas update');
      return;
    }

    if (command === 'php artisan db:seed') {
      onSeedDatabase();
      const seedInfo = [
        'Seeding Database records:',
        `  - DatabaseSeeder running on table ${model.pluralName}...`,
        `  - Seeded: 3 mock rows populated inside active schema successfully!`
      ];
      setHistory([...newHistory, ...seedInfo, '']);
      onAddLog('artisan', 'Populated seed records via db:seed');
      return;
    }

    if (command === 'php artisan tinker') {
      setIsTinkerMode(true);
      const tinkerIntro = [
        'Interactive shell tinker running...',
        `Booted Laravel Tinker PHP shell CLI.`,
        `You can query your Model using Eloquent commands!`,
        `Type "${model.name}::all()", "${model.name}::count()", or type "exit" to quit.`,
      ];
      setHistory([...newHistory, ...tinkerIntro, '']);
      onAddLog('artisan', 'Booted php artisan tinker shell CLI');
      return;
    }

    if (command === 'php artisan model:show') {
      const showInfo = [
        `Eloquent Model: App\\Models\\${model.name}`,
        `Database Table: ${model.pluralName}`,
        '--------------------------------------------',
        '  Column         | Database Type | PHP Type',
        '--------------------------------------------',
        '  id             | bigint        | integer  (PK/Primary Key)',
        ...model.fields.map(f => `  ${f.name.padEnd(14)} | ${f.type.padEnd(13)} | ${f.type === 'boolean' ? 'boolean' : 'string'}`),
        '  created_at     | timestamp     | Carbon\\CarbonDatetime',
        '  updated_at     | timestamp     | Carbon\\CarbonDatetime',
        '--------------------------------------------'
      ];
      setHistory([...newHistory, ...showInfo, '']);
      onAddLog('artisan', 'Run modal columns analysis details');
      return;
    }

    // Fallbacks
    setHistory([
      ...newHistory,
      `Command "${command}" not recognized in artisan environment.`,
      'Type "help" to read available Laravel commands list.',
      ''
    ]);
  };

  return (
    <div className="bg-zinc-950 border-2 border-zinc-900 overflow-hidden flex flex-col h-[340px] shadow-md" id="laravel-terminal">
      {/* Shell Title Header */}
      <div className="px-4 py-3 bg-zinc-900 border-b-2 border-zinc-950 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-zinc-400">
          <Terminal className="w-4 h-4 text-[#FF2D20] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-105 font-sans">Laravel Artisan Terminal Shell</span>
        </div>
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF2D20]" />
          <div className="w-2 h-2 rounded-full bg-zinc-750" />
        </div>
      </div>

      {/* Terminal History Container */}
      <div className="flex-grow p-4 overflow-y-auto space-y-1.5 font-mono text-[11px] leading-relaxed text-zinc-300">
        {history.map((ln, idx) => (
          <div key={idx} className="whitespace-pre-wrap">
            {ln}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input field */}
      <form onSubmit={handleCommandSubmit} className="bg-zinc-950 shrink-0 border-t-2 border-zinc-900 p-2.5 px-4 flex items-center space-x-2">
        <span className="font-mono text-xs select-none">
          {isTinkerMode ? (
            <span className="text-violet-400 font-extrabold">{">>>"}</span>
          ) : (
            <span className="text-emerald-500 font-extrabold">$</span>
          )}
        </span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={isTinkerMode ? "e.g. Task::all() or exit" : "e.g. php artisan route:list"}
          className="flex-grow bg-transparent text-zinc-100 font-mono text-xs focus:outline-none focus:ring-0 caret-[#FF2D20]"
        />
        <button
          type="submit"
          className="p-1 px-3 bg-zinc-90 w-auto hover:bg-[#FF2D20] hover:text-white text-zinc-400 text-[10px] uppercase font-black tracking-wider flex items-center space-x-1 cursor-pointer transition"
        >
          <Play className="w-2.5 h-2.5" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
}
