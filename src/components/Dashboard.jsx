import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { open as openUrl } from '@tauri-apps/plugin-shell';
import ImportWizard from './ImportWizard';

export default function Dashboard({ passwords, onAdd, onEdit, onDelete, onCloseDatabase, onOpenSettings, onViewDetail, onImport }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Import Wizard State
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [importContent, setImportContent] = useState(null);

    const handleImportClick = async () => {
        try {
            const selected = await openDialog({
                multiple: false,
                filters: [{
                    name: 'CSV',
                    extensions: ['csv']
                }]
            });

            if (selected) {
                const content = await invoke('read_file_content', { path: selected });
                setImportContent(content);
                setShowImportWizard(true);
                setShowMenu(false);
            }
        } catch (e) {
            console.error('Import failed:', e);
            alert('Failed to import file: ' + e);
        }
    };

    const handleOpenUrl = async (url) => {
        try {
            await openUrl(url);
        } catch (e) {
            console.error('Failed to open URL:', e);
        }
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (showMenu && !e.target.closest('.menu-container')) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const filteredPasswords = passwords.filter(p =>
        p.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-400">My Passwords</h1>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={onAdd}
                            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors font-semibold shadow-lg"
                        >
                            + Add New
                        </button>
                        <div className="relative menu-container">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                title="Menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                                    <button
                                        onClick={handleImportClick}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-300 hover:text-white rounded-t-lg border-b border-gray-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Import CSV
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            onOpenSettings();
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-300 hover:text-white"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Settings
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            onCloseDatabase();
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-300 hover:text-white rounded-b-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                        </svg>
                                        Close Database
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-6 relative">
                    <input
                        type="text"
                        placeholder="Search services or usernames..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                    />
                    <svg className="w-5 h-5 absolute right-4 top-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="grid gap-4">
                    {filteredPasswords.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No passwords found. Add one to get started!
                        </div>
                    ) : (
                        filteredPasswords.map((item) => (
                            <div key={item.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors flex justify-between items-center group cursor-pointer" onClick={() => onViewDetail(item)}>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-1">
                                        {item.service}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {item.username}
                                    </p>
                                </div>
                                <div className="flex space-x-2 items-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCopy(item.username, `${item.id} -username`); }}
                                        className={`px - 3 py - 2 rounded - lg transition - all ${copiedId === `${item.id}-username`
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            } `}
                                        title="Copy Username"
                                    >
                                        {copiedId === `${item.id} -username` ? (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Copied
                                            </span>
                                        ) : (
                                            'Copy ID'
                                        )}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCopy(item.password, `${item.id} -password`); }}
                                        className={`px - 3 py - 2 rounded - lg transition - all ${copiedId === `${item.id}-password`
                                            ? 'bg-green-600 text-white'
                                            : 'bg-blue-600 text-white hover:bg-blue-500'
                                            } `}
                                        title="Copy Password"
                                    >
                                        {copiedId === `${item.id} -password` ? (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Copied
                                            </span>
                                        ) : (
                                            'Copy Pass'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ImportWizard
                isOpen={showImportWizard}
                onClose={() => setShowImportWizard(false)}
                onImport={onImport}
                csvContent={importContent}
            />
        </div>
    );
}
