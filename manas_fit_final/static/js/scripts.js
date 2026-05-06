
window.addEventListener('scroll', () => {
  const bg = document.getElementById('parallaxBg');
  const scrolled = window.scrollY;
  if (scrolled < window.innerHeight * 1.2) {
    bg.style.transform = `translateY(${scrolled * 0.4}px)`;
  }
});

const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 100);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => observer.observe(el));

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}