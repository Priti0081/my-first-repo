// Simple Change Password front-end example.
// NOTE: Real security checks must happen on the server.

const form = document.getElementById('changeForm');
const currentInput = document.getElementById('current');
const newInput = document.getElementById('newpw');
const confirmInput = document.getElementById('confirm');
const errorsEl = document.getElementById('errors');
const resultEl = document.getElementById('result');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const submitBtn = document.getElementById('submitBtn');

function calcStrength(pw) {
  // very basic scoring: length + variety
  let score = 0;
  if (!pw) return {score, label: '—'};
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  // normalize 0..5 => percent
  const pct = Math.min(100, Math.round((score / 5) * 100));
  let label = 'Weak';
  if (pct >= 80) label = 'Strong';
  else if (pct >= 50) label = 'Okay';
  else label = 'Weak';
  return {score:pct, label};
}

function updateStrength() {
  const pw = newInput.value;
  const {score, label} = calcStrength(pw);
  strengthBar.style.setProperty('--pct', `${score}%`);
  // update pseudo-element width by setting style directly on ::after using background-size fallback:
  strengthBar.querySelector('::after'); // noop - can't access pseudo - we'll update by inline background
  // fallback: set background gradient width via inline background-size
  const color = score >= 80 ? 'var(--good)' : score >= 50 ? 'var(--okay)' : 'var(--bad)';
  strengthBar.style.background = `linear-gradient(90deg, ${color} ${score}%, rgba(255,255,255,0.06) ${score}%)`;
  strengthText.textContent = `Strength: ${label}`;
}

newInput.addEventListener('input', updateStrength);

// client-side validation
function validate() {
  errorsEl.textContent = '';
  const cur = currentInput.value.trim();
  const nw = newInput.value;
  const cf = confirmInput.value;
  const errs = [];
  if (!cur) errs.push('Enter your current password.');
  if (!nw) errs.push('Enter a new password.');
  if (nw && nw.length < 8) errs.push('New password must be at least 8 characters.');
  if (nw && cf && nw !== cf) errs.push('New password and confirmation do not match.');
  // (Optional) discourage using the same as current:
  if (cur && nw && cur === nw) errs.push('New password must be different from the current password.');
  if (errs.length) {
    errorsEl.innerHTML = errs.map(e => `<div>• ${e}</div>`).join('');
    return false;
  }
  return true;
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  resultEl.textContent = '';
  if (!validate()) return;

  submitBtn.disabled = true;
  const payload = {
    currentPassword: currentInput.value,
    newPassword: newInput.value
  };

  try {
    // Example: POST to a secure backend endpoint that validates current password and updates safely.
    // IMPORTANT: include auth (cookie or Authorization header) and use HTTPS.
    const resp = await fetch('/api/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer <token>'   // If using token auth
      },
      body: JSON.stringify(payload),
      credentials: 'include' // if using cookies
    });

    if (resp.ok) {
      resultEl.style.color = '';
      resultEl.textContent = 'Password changed successfully.';
      form.reset();
      updateStrength();
    } else {
      const data = await resp.json().catch(()=>({message:'Unable to parse server response.'}));
      resultEl.style.color = 'var(--bad)';
      resultEl.textContent = data?.message || 'Failed to change password. Check current password and try again.';
    }
  } catch (err) {
    resultEl.style.color = 'var(--bad)';
    resultEl.textContent = 'Network error. Please try again.';
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});
