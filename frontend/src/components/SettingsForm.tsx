import { useState, FormEvent } from 'react';
import './SettingsForm.css';

interface SettingsField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number';
    options?: { value: string; label: string }[];
    placeholder?: string;
    description?: string;
}

interface SettingsFormProps {
    title?: string;
    fields: SettingsField[];
    initialValues: Record<string, any>;
    onSave: (values: Record<string, any>) => void;
    saving?: boolean;
}

export function SettingsForm({
    title,
    fields,
    initialValues,
    onSave,
    saving = false
}: SettingsFormProps) {
    const [values, setValues] = useState<Record<string, any>>(initialValues);
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = (key: string, value: any) => {
        setValues(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(values);
        setHasChanges(false);
    };

    const handleReset = () => {
        setValues(initialValues);
        setHasChanges(false);
    };

    return (
        <form className="settings-form" onSubmit={handleSubmit}>
            {title && <h3 className="settings-form-title">{title}</h3>}
            
            <div className="settings-fields">
                {fields.map(field => (
                    <div key={field.key} className="settings-field">
                        <label htmlFor={field.key}>{field.label}</label>
                        
                        {field.type === 'text' && (
                            <input
                                id={field.key}
                                type="text"
                                value={values[field.key] || ''}
                                onChange={e => handleChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                            />
                        )}
                        
                        {field.type === 'number' && (
                            <input
                                id={field.key}
                                type="number"
                                value={values[field.key] || ''}
                                onChange={e => handleChange(field.key, Number(e.target.value))}
                                placeholder={field.placeholder}
                            />
                        )}
                        
                        {field.type === 'textarea' && (
                            <textarea
                                id={field.key}
                                value={values[field.key] || ''}
                                onChange={e => handleChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                rows={4}
                            />
                        )}
                        
                        {field.type === 'select' && field.options && (
                            <select
                                id={field.key}
                                value={values[field.key] || ''}
                                onChange={e => handleChange(field.key, e.target.value)}
                            >
                                {field.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        
                        {field.type === 'checkbox' && (
                            <label className="checkbox-label">
                                <input
                                    id={field.key}
                                    type="checkbox"
                                    checked={values[field.key] || false}
                                    onChange={e => handleChange(field.key, e.target.checked)}
                                />
                                <span className="checkbox-text">{field.description}</span>
                            </label>
                        )}
                        
                        {field.description && field.type !== 'checkbox' && (
                            <p className="field-description">{field.description}</p>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="settings-actions">
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleReset}
                    disabled={!hasChanges || saving}
                >
                    Reset
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={!hasChanges || saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
