import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function Settings({ onClose }) {
    const [autoLockMinutes, setAutoLockMinutes] = useState(5);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const minutes = await invoke('get_auto_lock_timeout');
            setAutoLockMinutes(minutes);
        } catch (e) {
            console.error('Failed to load settings:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            await invoke('set_auto_lock_timeout', { minutes: autoLockMinutes });
            setMessage('Settings saved successfully!');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (e) {
            setMessage('Failed to save settings: ' + e);
        } finally {
            setSaving(false);
        }
    };

    const presetOptions = [
        { label: '1 minute', value: 1 },
        { label: '5 minutes', value: 5 },
        { label: '10 minutes', value: 10 },
        { label: '15 minutes', value: 15 },
        { label: '30 minutes', value: 30 },
        { label: 'Never', value: 0 }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-blue-400">Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                Auto-lock timeout
                            </label>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {presetOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setAutoLockMinutes(option.value)}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            autoLockMinutes === option.value
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="1440"
                                    value={autoLockMinutes}
                                    onChange={(e) => setAutoLockMinutes(parseInt(e.target.value) || 0)}
                                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-400">minutes</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {autoLockMinutes === 0 
                                    ? 'The app will never auto-lock' 
                                    : `The app will lock after ${autoLockMinutes} minute${autoLockMinutes !== 1 ? 's' : ''} of inactivity`}
                            </p>
                        </div>

                        {message && (
                            <div className={`text-sm text-center ${message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                                {message}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-white disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
