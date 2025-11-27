import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';

export default function Setup({ onComplete }) {
    const [mode, setMode] = useState('initial'); // initial, new, open
    const [filePath, setFilePath] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateNew = async () => {
        try {
            const path = await save({
                filters: [{
                    name: 'Password Database',
                    extensions: ['json']
                }]
            });
            if (path) {
                setFilePath(path);
                setMode('new');
                setError('');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to select file location');
        }
    };

    const handleOpenExisting = async () => {
        try {
            const path = await open({
                multiple: false,
                filters: [{
                    name: 'Password Database',
                    extensions: ['json']
                }]
            });
            if (path) {
                setFilePath(path);
                setMode('open');
                setError('');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to open file');
        }
    };

    const handleSubmitNew = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }
        setLoading(true);
        try {
            await invoke('initialize_database_secure', { path: filePath, masterPassword: password });
            onComplete(password);
        } catch (e) {
            setError('Failed to initialize database: ' + e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitOpen = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('open_database_secure', { path: filePath, masterPassword: password });
            onComplete(password);
        } catch (e) {
            setError('Failed to open database. Incorrect password? ' + e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <h2 className="text-3xl font-bold text-center text-blue-400">Welcome</h2>

                {mode === 'initial' && (
                    <div className="space-y-4">
                        <p className="text-center text-gray-400">Choose how to start</p>
                        <button
                            onClick={handleCreateNew}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <span>✨</span> Create New Database
                        </button>
                        <button
                            onClick={handleOpenExisting}
                            className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <span>📂</span> Open Existing Database
                        </button>
                    </div>
                )}

                {mode === 'new' && (
                    <form onSubmit={handleSubmitNew} className="space-y-4">
                        <div className="text-sm text-gray-400 break-all">
                            Creating: {filePath}
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Set Master Password"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            autoFocus
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Master Password"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setMode('initial'); setError(''); }}
                                className="flex-1 py-3 text-gray-300 hover:text-white"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !password || !confirmPassword}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create & Start'}
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'open' && (
                    <form onSubmit={handleSubmitOpen} className="space-y-4">
                        <div className="text-sm text-gray-400 break-all">
                            Opening: {filePath}
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Master Password"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            autoFocus
                        />
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setMode('initial'); setError(''); }}
                                className="flex-1 py-3 text-gray-300 hover:text-white"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold disabled:opacity-50"
                            >
                                {loading ? 'Opening...' : 'Open'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
