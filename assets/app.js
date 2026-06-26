// mobile menu
document.addEventListener('click', (e) => {
  if (e.target.closest('.menu-btn')) {
    document.getElementById('nl')?.classList.toggle('open');
  } else if (!e.target.closest('.nav-links')) {
    document.getElementById('nl')?.classList.remove('open');
  }
});

// docs: highlight the active section in the sidebar
const tocLinks = [...document.querySelectorAll('#toc a')];
if (tocLinks.length) {
  const map = new Map(tocLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        tocLinks.forEach(l => l.classList.remove('active'));
        map.get(en.target.id)?.classList.add('active');
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  document.querySelectorAll('.doc-main section').forEach(s => obs.observe(s));
}
