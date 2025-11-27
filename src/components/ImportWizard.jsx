import React, { useState, useEffect } from 'react';

export default function ImportWizard({ isOpen, onClose, onImport, csvContent }) {
    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [mapping, setMapping] = useState({
        service: -1,
        username: -1,
        password: -1,
        notes: -1
    });

    useEffect(() => {
        if (csvContent) {
            parseCSV(csvContent);
        }
    }, [csvContent]);

    const parseCSV = (content) => {
        const lines = content.split(/\r\n|\n/).filter(line => line.trim());
        if (lines.length < 2) return;

        // Parse headers
        const headerLine = lines[0];
        const parsedHeaders = parseLine(headerLine);
        setHeaders(parsedHeaders);

        // Parse rows
        const parsedRows = lines.slice(1).map(line => parseLine(line));
        setRows(parsedRows);

        // Auto-detect mapping
        const newMapping = {
            service: -1,
            username: -1,
            password: -1,
            notes: -1
        };

        const lowerHeaders = parsedHeaders.map(h => h.toLowerCase());

        newMapping.service = lowerHeaders.findIndex(h => ['service', 'name', 'title', 'url', 'website', 'location'].some(k => h.includes(k)));
        newMapping.username = lowerHeaders.findIndex(h => ['username', 'user', 'login', 'email', 'id'].some(k => h.includes(k)));
        newMapping.password = lowerHeaders.findIndex(h => ['password', 'pass', 'key'].some(k => h.includes(k)));
        newMapping.notes = lowerHeaders.findIndex(h => ['notes', 'note', 'comment', 'desc', 'description'].some(k => h.includes(k)));

        // Fallback if nothing detected but we have enough columns
        if (newMapping.service === -1 && newMapping.username === -1 && newMapping.password === -1) {
            if (parsedHeaders.length >= 1) newMapping.service = 0;
            if (parsedHeaders.length >= 3) newMapping.username = 2;
            if (parsedHeaders.length >= 4) newMapping.password = 3;
            if (parsedHeaders.length >= 5) newMapping.notes = 4;
        }

        setMapping(newMapping);
    };

    const parseLine = (line) => {
        const row = [];
        let inQuote = false;
        let current = '';
        for (let char of line) {
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        return row;
    };

    const handleImport = () => {
        const items = rows.map(row => {
            const item = {
                service: mapping.service !== -1 ? row[mapping.service] : '',
                username: mapping.username !== -1 ? row[mapping.username] : '',
                password: mapping.password !== -1 ? row[mapping.password] : '',
                notes: mapping.notes !== -1 ? row[mapping.notes] : ''
            };

            // Basic validation/fallback
            if (!item.service && item.username) item.service = 'Imported';
            return item;
        }).filter(item => item.password); // Only import items with passwords

        onImport(items);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Import Passwords</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Map Columns</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { key: 'service', label: 'Service / Website' },
                                { key: 'username', label: 'Username / Email' },
                                { key: 'password', label: 'Password' },
                                { key: 'notes', label: 'Notes' }
                            ].map(({ key, label }) => (
                                <div key={key} className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        {label}
                                    </label>
                                    <select
                                        value={mapping[key]}
                                        onChange={(e) => setMapping({ ...mapping, [key]: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                    >
                                        <option value={-1}>-- Ignore --</option>
                                        {headers.map((h, i) => (
                                            <option key={i} value={i}>{h} (Column {i + 1})</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Preview ({rows.length} items)</h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-700">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-gray-900 text-gray-100 uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">Service</th>
                                        <th className="px-4 py-3">Username</th>
                                        <th className="px-4 py-3">Password</th>
                                        <th className="px-4 py-3">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {rows.slice(0, 5).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-700/50">
                                            <td className="px-4 py-3">{mapping.service !== -1 ? row[mapping.service] : <span className="text-gray-600 italic">Ignored</span>}</td>
                                            <td className="px-4 py-3">{mapping.username !== -1 ? row[mapping.username] : <span className="text-gray-600 italic">Ignored</span>}</td>
                                            <td className="px-4 py-3 font-mono">
                                                {mapping.password !== -1 ? '••••••' : <span className="text-gray-600 italic">Ignored</span>}
                                            </td>
                                            <td className="px-4 py-3 truncate max-w-xs">{mapping.notes !== -1 ? row[mapping.notes] : <span className="text-gray-600 italic">Ignored</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {rows.length > 5 && (
                                <div className="px-4 py-2 bg-gray-900/50 text-center text-gray-500 text-xs">
                                    And {rows.length - 5} more items...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-700 flex justify-end gap-3 bg-gray-800 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={mapping.password === -1}
                        className={`px-6 py-2 rounded-lg transition-colors font-semibold shadow-lg ${mapping.password === -1
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                    >
                        Import Passwords
                    </button>
                </div>
            </div>
        </div>
    );
}
