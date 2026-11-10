const tabs = [...document.querySelectorAll('[role=tab]')];
const show = t => {
  tabs.forEach(x => {
    const on = x === t;
    x.setAttribute('aria-selected', on);
    x.tabIndex = on ? 0 : -1;
    document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
  });
};
tabs.forEach((t, i) => {
  t.addEventListener('click', () => show(t));
  t.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    const n = tabs[(i + d + tabs.length) % tabs.length];
    n.focus(); show(n);
  });
});
const main = document.getElementById('main-img');
document.querySelectorAll('.thumb').forEach(b =>
  b.addEventListener('click', () => main.style.setProperty('--img', `url(${b.dataset.src})`)));
