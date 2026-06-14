import gsap from 'gsap';
import TextPlugin from 'gsap/TextPlugin';
import Swiper from 'swiper';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import swiperCss from 'swiper/css?inline';
import swiperPaginationCss from 'swiper/css/pagination?inline';

gsap.registerPlugin(TextPlugin);

function injectInlineStyles(id, css) {
  if (!css || document.getElementById(id)) {
    return;
  }

  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.append(style);
}

function initMobileMenu() {
  const toggle = document.querySelector('[data-theme-menu-toggle]');
  const menu = document.querySelector('[data-theme-mobile-nav]');

  if (!toggle || !menu) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = menu.dataset.open === 'true';
    menu.dataset.open = isOpen ? 'false' : 'true';
    toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    document.body.classList.toggle('theme-mobile-open', !isOpen);
  });
}

function initHeroSwiper() {
  const sliderEnabled = document.body.dataset.themeSlider !== 'false';
  const root = document.querySelector('[data-theme-swiper]');

  if (!sliderEnabled || !root) {
    return;
  }

  injectInlineStyles('starter-creative-swiper', `${swiperCss}\n${swiperPaginationCss}`);

  new Swiper(root, {
    modules: [Autoplay, EffectFade, Pagination],
    slidesPerView: 1,
    loop: true,
    effect: 'fade',
    speed: 850,
    autoplay: {
      delay: 5200,
      disableOnInteraction: false,
    },
    pagination: {
      el: root.querySelector('.swiper-pagination'),
      clickable: true,
    },
  });
}

function initGsapAnimations() {
  const animationsEnabled = document.body.dataset.themeAnimations !== 'false';

  if (!animationsEnabled) {
    return;
  }

  const fadeUps = document.querySelectorAll('[data-animate="fade-up"]');
  if (fadeUps.length > 0) {
    gsap.from(fadeUps, {
      y: 24,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out',
    });
  }

  const headline = document.querySelector('[data-gsap-text]');
  if (headline instanceof HTMLElement) {
    const nextText = headline.dataset.gsapText?.trim();

    if (nextText) {
      headline.textContent = '';
      gsap.to(headline, {
        duration: 1.4,
        text: nextText,
        ease: 'none',
      });
    }
  }

  document.querySelectorAll('[data-stagger-group]').forEach((group) => {
    const children = Array.from(group.children);

    if (children.length === 0) {
      return;
    }

    gsap.from(children, {
      opacity: 0,
      y: 20,
      duration: 0.75,
      stagger: 0.1,
      ease: 'power2.out',
      delay: 0.15,
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initHeroSwiper();
  initGsapAnimations();
});
