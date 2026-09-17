import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

export default function Auth({ onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '400px', width: '100%', padding: '24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <h2 className="panel-title" style={{ fontSize: '24px', marginBottom: '8px', textAlign: 'center' }}>
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <p className="hint" style={{ marginBottom: '24px', textAlign: 'center' }}>
          {isSignUp ? 'Sign up to start managing your data.' : 'Sign in to access your dashboard.'}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="field-row single" style={{ marginBottom: '16px' }}>
            <div className="field">
              <label style={{ fontWeight: '500', marginBottom: '6px' }}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>
          </div>
          <div className="field-row single" style={{ marginBottom: '20px' }}>
            <div className="field">
              <label style={{ fontWeight: '500', marginBottom: '6px' }}>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>
          </div>
          
          {authError && <div className="wiz-errors" style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{authError}</div>}
          
          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          <span style={{ color: '#666' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError('');
            }}
            style={{ background: 'none', border: 'none', color: '#007BFF', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        <button 
          className="btn btn-ghost" 
          type="button" 
          onClick={onClose}
          style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '8px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
