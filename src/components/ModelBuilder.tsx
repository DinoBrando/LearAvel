import React, { useState } from 'react';
import { LaravelModel, LaravelField, FieldType } from '../types';
import { Plus, Trash, Info, RefreshCw, Layers } from 'lucide-react';

interface ModelBuilderProps {
  model: LaravelModel;
  onModelChange: (updatedModel: LaravelModel) => void;
  onResetToDefault: () => void;
}

export default function ModelBuilder({ model, onModelChange, onResetToDefault }: ModelBuilderProps) {
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('string');
  const [newFieldRequired, setNewFieldRequired] = useState(true);

  const handleModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^a-zA-Z]/g, '');
    if (!rawVal) return;
    
    // Capitalize Singular Name CamelCase
    const singularName = rawVal.charAt(0).toUpperCase() + rawVal.slice(1);
    const pluralName = (singularName.endsWith('s') ? singularName : singularName + 's').toLowerCase();
    
    onModelChange({
      ...model,
      name: singularName,
      pluralName: pluralName
    });
  };

  const addField = () => {
    const cleanName = newFieldName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (!cleanName) return;

    // Check if field already exists
    if (model.fields.some(f => f.name === cleanName) || cleanName === 'id') {
      alert('Field name already exists!');
      return;
    }

    // Default validation Rules
    let validationStr = newFieldRequired ? 'required' : 'nullable';
    if (newFieldType === 'boolean') {
      validationStr += '|boolean';
    } else if (newFieldType === 'integer') {
      validationStr += '|integer';
    } else if (newFieldType === 'decimal') {
      validationStr += '|numeric';
    } else if (newFieldType === 'text') {
      validationStr += '|string';
    } else {
      validationStr += '|string|max:255';
    }

    // Default description
    const descDefaults: { [key in FieldType]: string } = {
      string: `The ${cleanName} details`,
      text: `Extended text description of the ${cleanName}`,
      boolean: `Completion status for ${cleanName}`,
      integer: `Numeric value representing count for ${cleanName}`,
      decimal: `Monetary or decimal factor for ${cleanName}`,
    };

    const newField: LaravelField = {
      name: cleanName,
      type: newFieldType,
      isRequired: newFieldRequired,
      validationRules: validationStr,
      description: descDefaults[newFieldType]
    };

    onModelChange({
      ...model,
      fields: [...model.fields, newField]
    });

    setNewFieldName('');
  };

  const removeField = (index: number) => {
    if (model.fields.length <= 1) {
      alert('Your Eloquent Model must contain at least one column!');
      return;
    }
    const updatedFields = [...model.fields];
    updatedFields.splice(index, 1);
    onModelChange({
      ...model,
      fields: updatedFields
    });
  };

  const updateValidationRule = (index: number, rulesVal: string) => {
    const updatedFields = [...model.fields];
    updatedFields[index].validationRules = rulesVal;
    onModelChange({
      ...model,
      fields: updatedFields
    });
  };

  return (
    <div className="bg-white border-2 border-zinc-900 overflow-hidden" id="model-builder">
      <div className="px-5 py-4 bg-zinc-900 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Layers className="text-[#FF2D20] w-5 h-5 animate-pulse" />
          <h2 className="text-xs font-black uppercase tracking-widest font-display text-white">Model Schema Builder</h2>
        </div>
        <button
          onClick={onResetToDefault}
          className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-350 hover:text-[#FF2D20] transition bg-zinc-800 px-2.5 py-1 rounded"
        >
          <RefreshCw className="w-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="p-5 space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex justify-between">
            <span>Singular Model Name (PHP Class)</span>
            <span className="text-[9px] text-[#FF2D20] font-sans font-black tracking-wider uppercase">Singular Rule</span>
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={model.name}
              onChange={handleModelNameChange}
              placeholder="e.g. Task"
              className="w-1/2 p-2.5 text-sm bg-zinc-50 border-b-4 border-zinc-900 font-black font-mono text-zinc-850 focus:outline-none focus:border-[#FF2D20]"
            />
            <div className="text-[11px] text-zinc-650 bg-zinc-100 p-2.5 font-bold flex-1 font-mono uppercase tracking-wider border-l-2 border-zinc-400">
              Table: <span className="text-emerald-700 font-extrabold">{model.pluralName}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Columns Schema Definition
            </label>
            <span className="text-[9px] text-zinc-400 font-bold uppercase flex items-center space-x-1">
              <Info className="w-3 h-3 text-zinc-400" />
              <span>defaults: id & timestamps</span>
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {model.fields.map((field, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-900 transition-all">
                <div className="flex items-center space-x-2">
                  <span className="bg-[#FF2D20] text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded uppercase">
                    {field.type}
                  </span>
                  <span className="font-mono text-xs font-black text-zinc-800">{field.name}</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-400 uppercase font-black tracking-wider">Rules:</span>
                    <input
                      type="text"
                      className="p-1 px-1.5 text-xs font-mono bg-white border-2 border-zinc-200 text-zinc-700 focus:outline-none focus:border-[#FF2D20] w-32 font-bold"
                      value={field.validationRules}
                      onChange={(e) => updateValidationRule(idx, e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => removeField(idx)}
                    className="p-1.5 hover:bg-zinc-200 rounded text-zinc-400 hover:text-[#FF2D20] transition cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-50 p-4 border-2 border-dashed border-zinc-250">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
            Create Custom Column:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                placeholder="Column Name"
                className="w-full p-2 bg-white border-2 border-zinc-200 text-xs font-black font-mono text-zinc-700 focus:outline-none focus:border-[#FF2D20]"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full p-2 bg-white border-2 border-zinc-200 text-xs font-black text-zinc-700 focus:outline-none focus:border-[#FF2D20] cursor-pointer"
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as FieldType)}
              >
                <option value="string">String (Varchar)</option>
                <option value="text">Text (Description)</option>
                <option value="boolean">Boolean (True/False)</option>
                <option value="integer">Integer (Numbers)</option>
                <option value="decimal">Decimal (Floating)</option>
              </select>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-4">
              <label className="flex items-center text-xs text-zinc-500 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="mr-1.5 accent-[#FF2D20] rounded h-3.5 w-3.5"
                />
                Required
              </label>

              <button
                onClick={addField}
                className="px-4 py-2 bg-zinc-900 hover:bg-[#FF2D20] text-white text-[10px] font-black uppercase tracking-wider transition cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3 inline mr-1" />
                <span>Add Column</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
