'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
    id: string;
    label: string;
    value: string;
}

interface ComboboxProps {
    label: string;
    options: Option[];
    value: string; // The selected ID or custom string
    onChange: (value: string) => void;
    onAddNew?: (newValue: string) => void; // Called when user types something new and selects it (or hits enter if we support that)
    placeholder?: string;
    className?: string;
    allowCustom?: boolean; // If true, user can type a value that isn't in options
}

export default function Combobox({
    label,
    options,
    value,
    onChange,
    onAddNew,
    placeholder = 'Select...',
    className = '',
    allowCustom = false
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update query when value changes programmatically (e.g. initial load)
    useEffect(() => {
        const selectedOption = options.find(o => o.id === value || o.value === value);
        if (selectedOption) {
            setQuery(selectedOption.label);
        } else if (value && allowCustom) {
            setQuery(value); // If it's a custom value
        }
    }, [value, options, allowCustom]);

    const filteredOptions = query === ''
        ? options
        : options.filter((option) =>
            option.label.toLowerCase().includes(query.toLowerCase())
        );

    const handleSelect = (option: Option) => {
        setQuery(option.label);
        onChange(option.id); // Or option.value depending on use case. For IDs we usually want ID.
        setIsOpen(false);
    };

    const handleCustomAdd = () => {
        if (onAddNew) {
            onAddNew(query);
        } else if (allowCustom) {
            onChange(query);
        }
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 shadow-sm py-3 pl-3 pr-10 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-colors"
                    placeholder={placeholder}
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setIsOpen(true);
                        // Optionally clear selection if user types?
                        // onChange(''); 
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    {/* Chevron down */}
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredOptions.length === 0 && query !== '' && (
                        <li
                            className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-indigo-600 hover:bg-slate-50 font-medium"
                            onClick={handleCustomAdd}
                        >
                            Add "{query}"...
                        </li>
                    )}

                    {filteredOptions.map((option) => (
                        <li
                            key={option.id}
                            className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-slate-50 ${(value === option.id || value === option.value) ? 'bg-slate-50 text-slate-900 font-medium' : 'text-slate-700'
                                }`}
                            onClick={() => handleSelect(option)}
                        >
                            <span className="block truncate">{option.label}</span>
                        </li>
                    ))}

                    {filteredOptions.length === 0 && query === '' && options.length === 0 && (
                        <li className="relative cursor-default select-none py-2 pl-3 pr-9 text-slate-500 italic">
                            No options available
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
