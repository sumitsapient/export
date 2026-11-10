const selects = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.pcard[data-category]')];
const empty = document.getElementById('no-results');
const keys = { supply: 'supply' };

function apply() {
  let shown = 0;
  cards.forEach(c => {
    const ok = selects.every(s => {
      if (!s.value) return true;
      const v = c.dataset[keys[s.dataset.filter] || s.dataset.filter] || '';
      return v.split('|').includes(s.value);
    });
    c.hidden = !ok;
    if (ok) shown++;
  });
  empty.hidden = shown > 0;
}
selects.forEach(s => s.addEventListener('change', apply));
document.querySelector('.filters').addEventListener('reset', () => setTimeout(apply));
