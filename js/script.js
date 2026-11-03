import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const universe = document.getElementById('universe');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x061719, 0.025);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(0, 2.2, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
universe.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x9bd8ce, 1.25));
const tealLight = new THREE.PointLight(0x28c7b2, 35, 18);
tealLight.position.set(3, 4, 4);
scene.add(tealLight);
const pinkLight = new THREE.PointLight(0xff477d, 22, 14);
pinkLight.position.set(-4, -1, 2);
scene.add(pinkLight);

const galaxy = new THREE.Group();
scene.add(galaxy);

function makePlanet(radius, color, roughness = 0.72) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 48),
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.12 })
  );
  return mesh;
}

const core = new THREE.Group();
const planet = makePlanet(1.22, 0x08766e, 0.42);
core.add(planet);

const glow = new THREE.Mesh(
  new THREE.SphereGeometry(1.36, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x2ad6c0, transparent: true, opacity: 0.09, side: THREE.BackSide })
);
core.add(glow);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(1.85, 0.035, 12, 160),
  new THREE.MeshStandardMaterial({ color: 0xf2a4c0, emissive: 0x7d2949, emissiveIntensity: 1.1, metalness: 0.55 })
);
ring.rotation.x = Math.PI / 2.55;
ring.rotation.y = 0.2;
core.add(ring);

const ring2 = new THREE.Mesh(
  new THREE.TorusGeometry(2.05, 0.012, 8, 160),
  new THREE.MeshBasicMaterial({ color: 0x42c7b5, transparent: true, opacity: 0.7 })
);
ring2.rotation.x = Math.PI / 2.55;
ring2.rotation.y = 0.2;
core.add(ring2);
galaxy.add(core);

// Tiny orbiting moons
const moon = makePlanet(0.22, 0xd94b69);
moon.position.set(2.4, 0.25, 0);
galaxy.add(moon);
const moon2 = makePlanet(0.13, 0xf1b4ca);
moon2.position.set(-2.25, -0.55, 0.5);
galaxy.add(moon2);

// Star field
const starCount = 1800;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const radius = 4 + Math.random() * 16;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = radius * Math.cos(phi);
  starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
  color: 0xffdce8, size: 0.035, transparent: true, opacity: 0.9, sizeAttenuation: true
}));
scene.add(stars);

// A soft nebula made from transparent colored points
const nebulaCount = 650;
const nebulaPositions = new Float32Array(nebulaCount * 3);
for (let i = 0; i < nebulaCount; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 2.5 + Math.random() * 5.5;
  nebulaPositions[i * 3] = Math.cos(a) * r;
  nebulaPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
  nebulaPositions[i * 3 + 2] = Math.sin(a) * r;
}
const nebulaGeo = new THREE.BufferGeometry();
nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
const nebula = new THREE.Points(nebulaGeo, new THREE.PointsMaterial({
  color: 0x147d78, size: 0.075, transparent: true, opacity: 0.22
}));
galaxy.add(nebula);

function resize() {
  const width = universe.clientWidth;
  const height = universe.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize);
resize();

// Drag to rotate and wheel to zoom
let dragging = false;
let previous = { x: 0, y: 0 };
let targetRotationX = 0;
let targetRotationY = 0;

renderer.domElement.addEventListener('pointerdown', (event) => {
  dragging = true;
  previous = { x: event.clientX, y: event.clientY };
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const dx = event.clientX - previous.x;
  const dy = event.clientY - previous.y;
  targetRotationY += dx * 0.006;
  targetRotationX += dy * 0.004;
  targetRotationX = Math.max(-0.75, Math.min(0.75, targetRotationX));
  previous = { x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener('pointerup', () => dragging = false);
renderer.domElement.addEventListener('pointercancel', () => dragging = false);
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  camera.position.z = Math.max(6.2, Math.min(15, camera.position.z + event.deltaY * 0.008));
}, { passive: false });

let pointerX = 0, pointerY = 0;
universe.addEventListener('pointermove', (event) => {
  const rect = universe.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.35;
  pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.2;
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  galaxy.rotation.y += (targetRotationY - galaxy.rotation.y) * 0.045;
  galaxy.rotation.x += (targetRotationX - galaxy.rotation.x) * 0.045;
  core.rotation.y += 0.0018;
  ring.rotation.z += 0.002;
  moon.position.set(Math.cos(t * 0.55) * 2.4, Math.sin(t * 0.55) * 0.45, Math.sin(t * 0.55) * 1.1);
  moon2.position.set(Math.cos(t * 0.38 + 2) * 2.65, Math.sin(t * 0.38 + 2) * 0.65, Math.sin(t * 0.38 + 2) * 0.8);
  stars.rotation.y = t * 0.006;
  nebula.rotation.y = -t * 0.012;
  camera.position.x += (pointerX - camera.position.x) * 0.015;
  camera.position.y += ((2.2 - pointerY) - camera.position.y) * 0.015;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}
animate();

// Intro and modals
const intro = document.getElementById('intro');
document.getElementById('enterBtn').addEventListener('click', () => {
  intro.classList.add('hidden');
});

function showModal(id) {
  document.getElementById(id).classList.add('show');
}
function hideModal(id) {
  document.getElementById(id).classList.remove('show');
}
document.getElementById('letterBtn').addEventListener('click', () => showModal('letterModal'));
document.getElementById('helpBtn').addEventListener('click', () => showModal('helpModal'));
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => hideModal(button.dataset.close));
});
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', event => {
    if (event.target === modal) hideModal(modal.id);
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('.modal.show').forEach(modal => hideModal(modal.id));
});

// Little love notes
document.querySelectorAll('.planet-card').forEach(card => {
  card.addEventListener('click', () => {
    document.getElementById('revealMessage').textContent = card.dataset.message;
  });
});

// Music button: add your own MP3 file in audio/musica.mp3
const music = document.getElementById('backgroundMusic');
const musicBtn = document.getElementById('musicBtn');
const musicLabel = document.getElementById('musicLabel');
musicBtn.addEventListener('click', async () => {
  if (music.paused) {
    try {
      await music.play();
      musicLabel.textContent = 'Pausar';
      musicBtn.firstChild.textContent = '♫ ';
    } catch {
      musicLabel.textContent = 'Añade tu MP3';
      alert('Primero coloca una canción en la carpeta audio y nómbrala musica.mp3.');
    }
  } else {
    music.pause();
    musicLabel.textContent = 'Música';
  }
});
music.addEventListener('ended', () => musicLabel.textContent = 'Música');
