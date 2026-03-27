import { useState } from 'react';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { getFormTemplates, saveFormTemplate, deleteFormTemplate } from '../data/localStorage';
import type { FormField, FormTemplate, FieldType } from '../types/form';
import { generateId } from '../utils/id';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'File Upload' },
];

function emptyField(): FormField {
  return { id: generateId(), label: '', name: '', type: 'text', required: false };
}

export default function FormBuilderPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>(() => getFormTemplates());
  const [editing, setEditing] = useState<FormTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);

  function startNew() {
    setEditing(null);
    setTemplateName('Template Baru');
    setFields([emptyField()]);
  }

  function startEdit(t: FormTemplate) {
    setEditing(t);
    setTemplateName(t.name);
    setFields([...t.fields]);
  }

  function addField() {
    setFields(f => [...f, emptyField()]);
  }

  function updateField(id: string, changes: Partial<FormField>) {
    setFields(f => f.map(field => field.id === id ? { ...field, ...changes } : field));
  }

  function removeField(id: string) {
    setFields(f => f.filter(field => field.id !== id));
  }

  function handleSave() {
    if (!templateName.trim() || fields.length === 0) return;
    const now = new Date().toISOString();
    const template: FormTemplate = editing
      ? { ...editing, name: templateName, fields, createdAt: editing.createdAt }
      : { id: generateId(), name: templateName, fields, createdAt: now };
    saveFormTemplate(template);
    setTemplates(getFormTemplates());
    setEditing(null);
    setTemplateName('');
    setFields([]);
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus template ini?')) return;
    deleteFormTemplate(id);
    setTemplates(getFormTemplates());
    if (editing?.id === id) { setEditing(null); setFields([]); }
  }

  return (
    <div className="p-8 flex gap-6">
      {/* Left: Template list */}
      <div className="w-64 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Form Templates</h2>
          <button onClick={startNew} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <Plus size={13} /> Baru
          </button>
        </div>
        {templates.length === 0 && (
          <p className="text-sm text-gray-400">Belum ada template.</p>
        )}
        <div className="space-y-2">
          {templates.map(t => (
            <div
              key={t.id}
              onClick={() => startEdit(t)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${editing?.id === t.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">{t.name}</p>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{t.fields.length} fields</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Editor */}
      <div className="flex-1">
        {!fields.length && !templateName ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <p className="text-sm">Pilih template atau buat yang baru</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <input
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="text-xl font-bold text-gray-900 border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-0.5 bg-transparent"
              />
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Save size={14} /> Simpan
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {fields.map((field) => (
                <div key={field.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical size={16} className="text-gray-300 mt-2.5 shrink-0" />
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Label</label>
                        <input
                          value={field.label}
                          onChange={e => updateField(field.id, { label: e.target.value })}
                          placeholder="Label field"
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Name (key)</label>
                        <input
                          value={field.name}
                          onChange={e => updateField(field.id, { name: e.target.value })}
                          placeholder="field_name"
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Tipe</label>
                        <select
                          value={field.type}
                          onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-3 pt-5">
                        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => updateField(field.id, { required: e.target.checked })}
                            className="rounded"
                          />
                          Required
                        </label>
                        <button onClick={() => removeField(field.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {field.type === 'dropdown' && (
                    <div className="mt-3 ml-7">
                      <label className="text-xs text-gray-500 block mb-1">Options (pisahkan dengan koma)</label>
                      <input
                        value={field.options?.join(', ') || ''}
                        onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="Opsi 1, Opsi 2, Opsi 3"
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addField}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={16} /> Tambah Field
            </button>
          </>
        )}
      </div>
    </div>
  );
}
