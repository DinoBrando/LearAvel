export type FieldType = 'string' | 'text' | 'boolean' | 'integer' | 'decimal';

export interface LaravelField {
  name: string;
  type: FieldType;
  isRequired: boolean;
  validationRules: string;
  description: string;
}

export interface LaravelModel {
  name: string;       // e.g., 'Task' or 'Post'
  pluralName: string; // e.g., 'tasks' or 'posts'
  fields: LaravelField[];
}

export interface DbRecord {
  id: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface VirtualDb {
  [tableName: string]: DbRecord[];
}

export interface LifecycleStep {
  title: string;
  description: string;
  codeSnippet: string;
  filePath: string;
}

export interface LogEntry {
  timestamp: string;
  type: 'eloquent' | 'routing' | 'validation' | 'blade' | 'artisan';
  message: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: 'mvc' | 'routing' | 'eloquent' | 'blade' | 'artisan';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
