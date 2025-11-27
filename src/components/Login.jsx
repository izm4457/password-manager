import React, { useState } from 'react';

export default function Login({ onLogin, isFirstRun }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isFirstRun) {
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }
            if (password.length < 4) {
                setError('Password must be at least 4 characters');
                setLoading(false);
                return;
            }
        }

        try {
            await onLogin(password);
        } catch (err) {
            setError('Failed to login. Incorrect password?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <h2 className="text-3xl font-bold text-center text-blue-400">
                    {isFirstRun ? 'Setup Master Password' : 'Password Manager'}
                </h2>
                <p className="text-center text-gray-400">
                    {isFirstRun
                        ? 'Create a strong master password to encrypt your data.'
                        : 'Enter your master password to unlock'}
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isFirstRun ? "New Master Password" : "Master Password"}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                            autoFocus
                        />
                    </div>

                    {isFirstRun && (
                        <div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Master Password"
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                            />
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading || !password || (isFirstRun && !confirmPassword)}
                        className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (isFirstRun ? 'Set Password & Start' : 'Unlock')}
                    </button>
                </form>
            </div>
        </div>
    );
}
