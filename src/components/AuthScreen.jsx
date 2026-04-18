import { useState } from 'react';

const S = {
  wrap: { minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'DM Sans', -apple-system, sans-serif" },
  card: { width: '100%', maxWidth: '400px', background: '#161B22', borderRadius: '20px', border: '1px solid #21262D', padding: '48px 36px', textAlign: 'center' },
  logoMark: { fontFamily: "'DM Mono', monospace", fontSize: '48px', fontWeight: 700, color: '#E8B931', marginBottom: '8px' },
  logoText: { fontSize: '28px', fontWeight: 700, color: '#E6EDF3', marginBottom: '8px' },
  tagline: { fontSize: '15px', color: '#8B9DAF', marginBottom: '40px', lineHeight: 1.5 },
  label: { display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#8B9DAF', marginBottom: '8px' },
  input: { width: '100%', padding: '14px 16px', background: '#0D1117', border: '1px solid #21262D', borderRadius: '10px', color: '#E6EDF3', fontSize: '16px', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', marginBottom: '16px' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #E8B931, #D4A017)', border: 'none', borderRadius: '10px', color: '#0D1117', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  success: { background: '#4CAF5015', border: '1px solid #4CAF5033', borderRadius: '10px', padding: '20px', marginTop: '16px' },
  successIcon: { fontSize: '32px', marginBottom: '8px' },
  successText: { fontSize: '15px', color: '#4CAF50', fontWeight: 600, marginBottom: '4px' },
  successSub: { fontSize: '13px', color: '#8B9DAF', lineHeight: 1.5 },
  error: { fontSize: '13px', color: '#E07B5B', marginTop: '8px' },
  footer: { marginTop: '24px', fontSize: '12px', color: '#555', lineHeight: 1.5 },
  backBtn: { background: 'none', border: 'none', color: '#8B9DAF', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: '20px', padding: '4px 0' },
};

export default function AuthScreen({ onSignIn, onBack }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || sending) return;

    setSending(true);
    setError('');

    const { error: authError } = await onSignIn(email.trim());

    if (authError) {
      setError(authError.message || 'Something went wrong. Try again.');
      setSending(false);
    } else {
      setSent(true);
      setSending(false);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        {onBack && <button style={S.backBtn} onClick={onBack}>&larr; Back to home</button>}
        <div style={S.logoMark}>&Delta;</div>
        <div style={S.logoText}>Delta4app</div>
        <div style={S.tagline}>
          Stop guessing what to work on.<br />
          Know which tasks move the needle.
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <label style={S.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={S.input}
              autoFocus
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={!email.trim() || sending}
              style={{ ...S.btn, ...((!email.trim() || sending) ? S.btnDisabled : {}) }}
            >
              {sending ? 'Sending...' : 'Continue with email'}
            </button>
            {error && <div style={S.error}>{error}</div>}
            <div style={S.footer}>
              We'll send you a magic link — no password needed.
            </div>
          </form>
        ) : (
          <div style={S.success}>
            <div style={S.successIcon}>&#9993;</div>
            <div style={S.successText}>Check your email</div>
            <div style={S.successSub}>
              We sent a magic link to <strong style={{ color: '#E6EDF3' }}>{email}</strong>.
              Click the link to sign in — it expires in 60 minutes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
