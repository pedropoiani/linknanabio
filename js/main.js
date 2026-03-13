/* ========================================
   Miraí Flores - Link na Bio
   JavaScript principal
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Animação de entrada escalonada nos elementos
  const elements = document.querySelectorAll(
    '.profile, .top-buttons, .link-card, .instagram-section, .social-row, .footer'
  );

  elements.forEach((el, index) => {
    el.classList.add('fade-in');
    el.style.animationDelay = `${index * 0.12}s`;
  });

  // Garantir que btn-icon execute as mesmas funções do btn (navegar para o link pai)
  document.querySelectorAll('.link-card .btn-icon').forEach(btnIcon => {
    btnIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const linkCard = btnIcon.closest('.link-card');
      if (linkCard && linkCard.href) {
        if (linkCard.target === '_blank') {
          window.open(linkCard.href, '_blank', 'noopener');
        } else {
          window.location.href = linkCard.href;
        }
      }
    });
  });

  // Parallax suave no cover ao rolar (inspirado no EXEMPLO)
  const cover = document.querySelector('.cover');
  if (cover) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const coverImg = cover.querySelector('.cover-img');
          if (coverImg) {
            coverImg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.05)`;
          }
          // Fade out cover conforme rola
          cover.style.opacity = Math.max(0, 1 - scrollY / (window.innerHeight * 0.5));
          ticking = false;
        });
        ticking = true;
      }
    });
  }

});
