import React, { useState } from 'react';
import { open as openUrl } from '@tauri-apps/plugin-shell';

export default function PasswordDetail({ item, onClose, onEdit, onDelete }) {
    const [showPassword, setShowPassword] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

    if (!item) return null;

    const handleOpenUrl = async (url) => {
        try {
            await openUrl(url);
        } catch (e) {
            console.error('Failed to open URL:', e);
        }
    };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="w-full max-w-2xl p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 relative max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{item.service}</h2>
                        <p className="text-gray-400 text-sm">Password Details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Service Name */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Service Name</label>
                        <span className="text-white text-lg">{item.service}</span>
                    </div>

                    {/* Username */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Username / Email</label>
                        <div className="flex items-center justify-between">
                            <span className="text-white text-lg break-all">{item.username}</span>
                            <button
                                onClick={() => copyToClipboard(item.username, 'username')}
                                className={`px-3 py-1 rounded-lg text-sm transition-all ml-2 ${copiedField === 'username'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                    }`}
                            >
                                {copiedField === 'username' ? (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied
                                    </span>
                                ) : (
                                    'Copy'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* URL */}
                    {item.url && (
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
                            <div className="flex items-center justify-between gap-2">
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleOpenUrl(item.url); }}
                                    className="text-blue-400 hover:text-blue-300 break-all flex-1"
                                >
                                    {item.url}
                                </a>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenUrl(item.url)}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
                                        title="Open URL"
                                    >
                                        Open
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(item.url, 'url')}
                                        className={`px-3 py-1 rounded-lg text-sm transition-all ${copiedField === 'url'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                            }`}
                                    >
                                        {copiedField === 'url' ? (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Copied
                                            </span>
                                        ) : (
                                            'Copy'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Password */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-white text-lg font-mono flex-1 break-all">
                                {showPassword ? item.password : '••••••••••••'}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-gray-300 transition-colors"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                                <button
                                    onClick={() => copyToClipboard(item.password, 'password')}
                                    className={`px-3 py-1 rounded-lg text-sm transition-all ${copiedField === 'password'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                                        }`}
                                >
                                    {copiedField === 'password' ? (
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Copied
                                        </span>
                                    ) : (
                                        'Copy'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {item.notes && (
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                            <p className="text-white whitespace-pre-wrap break-words">{item.notes}</p>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Information</label>
                        <div className="text-gray-400 text-sm space-y-1">
                            <p>ID: <span className="text-gray-300 font-mono text-xs">{item.id}</span></p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
                    <button
                        onClick={() => onEdit(item)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            onDelete(item.id);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
