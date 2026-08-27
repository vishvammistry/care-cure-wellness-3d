import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Scroll-reveal (fade + subtle 3D tilt-in) ---------- */
function initReveal() {
  const elements = document.querySelectorAll('.fade-up');
  if (!('IntersectionObserver' in window) || elements.length === 0) {
    elements.forEach((el) => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  elements.forEach((el) => observer.observe(el));
}

/* ---------- Sticky navbar shadow on scroll ---------- */
function initNavbarScroll() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- Mouse-tilt "3D" cards ---------- */
function initTilt() {
  if (!canHover) return;
  document.querySelectorAll('.tilt-card').forEach((card) => {
    const maxTilt = 8;
    let raf = null;

    function onMove(e) {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rotateX = ((py - 0.5) * -2 * maxTilt).toFixed(2);
        const rotateY = ((px - 0.5) * 2 * maxTilt).toFixed(2);
        card.style.setProperty('--tilt-x', `${rotateX}deg`);
        card.style.setProperty('--tilt-y', `${rotateY}deg`);
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
      });
    }

    function onEnter() { card.classList.add('tilting'); }
    function onLeave() {
      card.classList.remove('tilting');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
    }

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
}

/* ---------- Hero WebGL centerpiece ---------- */
function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  const heroEl = canvas ? canvas.closest('.hero') : null;
  if (!canvas || !heroEl) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (err) {
    return; // No WebGL support: gradient + photo backdrop still renders fine.
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const group = new THREE.Group();
  scene.add(group);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      emissive: 0x0d4d1f,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.35,
      transparent: true,
      opacity: 0.92,
    })
  );
  group.add(core);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.75, 1),
    new THREE.MeshBasicMaterial({ color: 0x8cd93b, wireframe: true, transparent: true, opacity: 0.35 })
  );
  group.add(shell);

  const particleCount = 220;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 4.4 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particlesGeo,
    new THREE.PointsMaterial({ color: 0xcdf5c0, size: 0.045, transparent: true, opacity: 0.75 })
  );
  scene.add(particles);

  scene.add(new THREE.AmbientLight(0xbfe8c4, 0.6));
  const key = new THREE.PointLight(0x8cd93b, 2.4, 20);
  key.position.set(4, 3, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x2e7d32, 1.5, 20);
  rim.position.set(-5, -2, -4);
  scene.add(rim);

  function resize() {
    const w = heroEl.clientWidth;
    const h = heroEl.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let targetX = 0;
  let targetY = 0;
  if (canHover) {
    window.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.6;
    });
  }

  const clock = new THREE.Clock();
  function renderFrame() {
    const t = clock.getElapsedTime();
    group.rotation.y = t * 0.15 + targetX;
    group.rotation.x = Math.sin(t * 0.3) * 0.1 + targetY;
    shell.rotation.y = -t * 0.08;
    particles.rotation.y = t * 0.04;
    renderer.render(scene, camera);
  }

  let frameId = null;
  function loop() {
    frameId = requestAnimationFrame(loop);
    renderFrame();
  }

  if (reduceMotion) {
    renderFrame();
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (frameId === null) loop();
        } else if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
      });
    }, { threshold: 0.05 });
    io.observe(heroEl);
  } else {
    loop();
  }
}

function init() {
  initReveal();
  initNavbarScroll();
  initTilt();
  initHeroScene();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
