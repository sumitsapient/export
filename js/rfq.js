const f = document.getElementById('rfq');
const status = f.querySelector('.form-status');
f.addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(f));
  const { endpoint, email } = f.dataset;
  if (endpoint) {
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw 0;
      f.reset();
      status.textContent = 'Thank you. We will respond within 1 business day.';
    } catch {
      status.textContent = 'Could not send. Please email ' + email + ' directly.';
    }
    return;
  }
  const body = Object.entries(data).map(([k, v]) => k + ': ' + v).join('\n');
  location.href = 'mailto:' + email + '?subject=' + encodeURIComponent('RFQ: ' + data.Product) + '&body=' + encodeURIComponent(body);
  status.textContent = 'Opening your email app to send the RFQ.';
});
