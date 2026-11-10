const t = document.querySelector('.nav-toggle');
const n = document.getElementById('primary-nav');
t.addEventListener('click', () => {
  const open = n.classList.toggle('open');
  t.setAttribute('aria-expanded', open);
});
document.getElementById('yr').textContent = new Date().getFullYear();
