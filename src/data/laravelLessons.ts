import { QuizQuestion } from '../types';

export interface LessonSegment {
  id: string;
  number: number;
  title: string;
  shortDesc: string;
  concepts: {
    term: string;
    definition: string;
    expressAnalogy: string;
  }[];
  detailedContent: string; // Markdown formatted guide
}

export const LARAVEL_LESSONS: LessonSegment[] = [
  {
    id: 'mvc',
    number: 1,
    title: 'The Laravel MVC Lifecycle',
    shortDesc: 'Understand how a request journeys from the browser, through routes and controllers, out to views.',
    concepts: [
      {
        term: 'Router (web.php)',
        definition: 'Directs the incoming HTTP request path specifically to a Controller action.',
        expressAnalogy: 'app.get("/posts", controller.index)'
      },
      {
        term: 'Eloquent Model',
        definition: 'An Active Record ORM database mapper. One PHP class represents one database table.',
        expressAnalogy: 'Sequelize Entity / Prisma Model'
      },
      {
        term: 'Blade Engine',
        definition: 'The native PHP templating compiler allowing modular HTML layout compilation.',
        expressAnalogy: 'JSX / EJS / Handlebars'
      }
    ],
    detailedContent: `### The Laravel Request Lifecycle

When a web browser makes a request to a Laravel application, it follows a strict, highly organized pipeline:

1. **Entry Point (\`public/index.html\` / \`index.php\`)**:
   All requests are first intercepted by the web server (Nginx/Apache) and sent to a single file, bootstrapping the Laravel Application Service container.

2. **Routing (\`routes/web.php\`)**:
   Laravel inspects the HTTP Method and URI and matches it against your route definitions. It can trigger anonymous closures or direct the heavy lifting to a \`Controller\` class.

3. **Middleware**:
   Filters the request (checking authentication, verifying **CSRF tokens**, sanitizing parameters) before letting the controller proceed.

4. **Controller Action (\`app/Http/Controllers/*\`)**:
   The controller acts as the orchestrator. It queries data using the **Eloquent ORM**, runs custom business validation, and returns either a JSON response or compiles a **Blade HTML template** with the retrieved parameters.

5. **Eloquent Model (\`app/Models/*\`)**:
   Provides active methods to query database tables. It converts raw SQL queries into standard PHP object schemas instantly!

6. **Blade Template Compiling (\`resources/views/*\`)**:
   Compiles layouts and blocks with native server-side variables, outputting standard HTML to the browser.`
  },
  {
    id: 'routing',
    number: 2,
    title: 'RESTful Routing & Model Binding',
    shortDesc: 'Master Route::resource and Laravels magic Implicit Route Model Binding.',
    concepts: [
      {
        term: 'Route::resource',
        definition: 'Registers all 7 standard CRUD routes (index, create, store, show, edit, update, destroy) in one line!',
        expressAnalogy: 'Router mapping multiple endpoints per entity'
      },
      {
        term: 'Route Model Binding',
        definition: 'Automatically injects full database records into controllers based on matching route parameters.',
        expressAnalogy: 'Express middleware looking up id, fetching database, and binding to req.user/req.item'
      }
    ],
    detailedContent: `### Advanced RESTful Routings

In traditional JS frameworks, you write endpoints one by one:
\`\`\`js
app.get("/tasks", index);
app.get("/tasks/create", create);
app.post("/tasks", store);
\`\`\`

In Laravel, the command \`Route::resource('tasks', TaskController::class);\` does all of these under the hood, creating standard mappings.

#### Implicit Route Model Binding
Laravel matches route parameters (like \`/tasks/{task}\`) names with controller parameter typehints (like \`public function show(Task $task)\`).
When they match, Laravel **automatically executes** a \`Task::findOrFail($id)\` SQL query before your controller even runs! If the ID is invalid, it skips manual checks and outputs a standard \`404 Not Found\` error immediately.`
  },
  {
    id: 'eloquent',
    number: 3,
    title: 'Eloquent ORM & Migrations',
    shortDesc: 'Understand schema version control, fillable attributes, and active record models.',
    concepts: [
      {
        term: 'Migrations',
        definition: 'Database version control files that let developers build tables programmatically.',
        expressAnalogy: 'Sequelize migrations / Knex schema files'
      },
      {
        term: 'Mass Assignment Prevention',
        definition: 'Restricting model attributes which can be filled altogether using $fillable or $guarded.',
        expressAnalogy: 'Destructured filtering like: const { title } = req.body;'
      }
    ],
    detailedContent: `### The Eloquent Active Record Philosophy

Eloquent ORM is built on the **Active Record pattern**, which means each instance of a Model class directly represents a single row in your database table.

#### Migrations
Think of migrations as Git repositories for database structures. Running \`php artisan migrate\` reads files inside \`database/migrations/*\` sequentially and builds tables dynamically onto SQL engines without needing raw SQL.

#### Preventing Mass Assignment Exploits
In Node, an attacker might feed malicious data into inputs (like \`is_admin = true\`).
Laravel protects you from this by forcing you to declare a protected \`$fillable\` array inside the model:
\`\`\`php
protected $fillable = ['title', 'description'];
\`\`\`
Parameters outside this list are disregarded during \`Model::create($request->all())\`, keeping database contents secure.`
  },
  {
    id: 'blade',
    number: 4,
    title: 'Blade Engines and Layout Inheritance',
    shortDesc: 'Construct modular layouts utilizing layouts grids and security loops.',
    concepts: [
      {
        term: '@extends & @yield',
        definition: 'Allows nested template files to inherit layouts from a shared master frame automatically.',
        expressAnalogy: 'React <Layout> {children} </Layout>'
      },
      {
        term: '@csrf Directive',
        definition: 'Auto-injects a hidden form input with a temporary token, sealing forms against cross-site forged queries.',
        expressAnalogy: 'csurf Express cookies/token mapping'
      }
    ],
    detailedContent: `### Building Serverless HTML with Blade

Blade is Laravels rapid, lightweight, and incredibly powerful template engine. Unlike plain PHP templates, Blade files compile into cached raw PHP script, incurring **zero performance overhead**!

#### Supercharge Form Security
Any HTTP \`POST\`, \`PUT\`, or \`DELETE\` form in Laravel require the static \`@csrf\` directive:
\`\`\`html
<form action="/tasks" method="POST">
    @csrf
    <input name="title" ...>
</form>
\`\`\`
This injects a hidden dynamic secure token. If missing, Laravel halts execution with an \`HTTP 419 Token Expired\` error. This prevents external websites from tricking your users into performing inadvertent write queries on your app!`
  },
  {
    id: 'artisan',
    number: 5,
    title: 'Artisan CLI & Form Validation',
    shortDesc: 'Form request objects separation, client triggers, and Artisan commands.',
    concepts: [
      {
        term: 'Artisan Console',
        definition: 'Native command-line companion containing utilities to generate boilerplate, run migrations, and clear cache.',
        expressAnalogy: 'npx cli builders / script triggers'
      },
      {
        term: 'Form Requests',
        definition: 'Dedicated PHP request classes that contain parameters validation parameters.',
        expressAnalogy: 'Express-validator / Joi schema validation middlewares'
      }
    ],
    detailedContent: `### The Power of Artisan CLI

Artisan is Laravels included CLI console. It provides dozens of incredibly fast helpers that create standard-compliant files:

*   \`php artisan make:model Task -mrc\`: Generates the Eloquent **Model**, a **Migration** file, and a fully populated resource **Controller** all in one quick command!
*   \`php artisan migrate\`: Appends and applies all unrun structural schema changes inside PostgreSQL/MySQL/SQLite.
*   \`php artisan route:list\`: Visualizes all active paths, middleware, and action bindings on the terminal.

#### Request Validation
In controllers, keeping validation rules like checking if a title is required clutter controller code. Laravel solves this by utilizing **Form Request** files (\`app/Http/Requests/*\`). If validation fails, Laravel **automatically redirects** the browser back to the prior page and flashes the error bag variables (\`@error\`), providing perfect user experience with zero manual code!`
  }
];

export const LARAVEL_QUIZ: QuizQuestion[] = [
  {
    id: 1,
    question: 'How do you register all 7 standard RESTful CRUD routes in web.php?',
    options: [
      "Route::crud('tasks', TaskController::class);",
      "Route::resource('tasks', TaskController::class);",
      "Route::all('tasks', TaskController::class);",
      "Route::api('tasks', TaskController::class);"
    ],
    correctAnswer: 1,
    explanation: 'Route::resource registers standard RESTful resources (index, create, store, show, edit, update, destroy) mapping to controller methods automatically.',
    category: 'routing'
  },
  {
    id: 2,
    question: 'How do you protect a form against Cross-Site Request Forgery (CSRF) exploits in Blade views?',
    options: [
      'Using the <meta name="csrf-token"> tag',
      'Using the @csrf directive inside the form',
      'By adding "csrf" to the middleware array in the route',
      'By using double curly braces: {{ $csrf }}'
    ],
    correctAnswer: 1,
    explanation: 'The @csrf blade directive injects a hidden input containing a secure session-specific CSRF token validated automatically by Laravel middleware.',
    category: 'blade'
  },
  {
    id: 3,
    question: 'What property must be declared on an Eloquent Model to allow inserting rows via mass assignment updates (like Model::create())?',
    options: [
      'protected $fillable = [...];',
      'protected $insertable = [...];',
      'protected $tableColumns = [...];',
      'protected $allowMass = true;'
    ],
    correctAnswer: 0,
    explanation: 'Defining $fillable specifies which variables are mass-assignable, protecting your DB structures from parameters injection bugs.',
    category: 'eloquent'
  },
  {
    id: 4,
    question: 'What is Implicit Route Model Binding in Laravel?',
    options: [
      'An option mapping Laravel blades directly with DB tables',
      'Automatically matching path IDs with Model parameters to fetch the DB row automatically',
      'Using Vue or React to map inputs with models on the client side',
      'Defining table joins inside model declaration'
    ],
    correctAnswer: 1,
    explanation: 'By type-hinting a Model in a Controller method, Laravel matches the wildcard ID parameter in the URL and performs Model::findOrFail($id) automatically.',
    category: 'routing'
  },
  {
    id: 5,
    question: 'Which Artisan command generates a Model, database migration, and RESTful resource Controller together?',
    options: [
      'php artisan generate:all Task',
      'php artisan make:model Task --all',
      'php artisan make:model Task -mrc',
      'php artisan make:crud Task'
    ],
    correctAnswer: 2,
    explanation: 'The flag -mrc stands for migration (-m), resource controller (-rc), generating three foundational files simultaneously.',
    category: 'artisan'
  }
];
