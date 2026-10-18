/* Bitcycling — Three.js premium 3D arka plan sahnesi
 *
 * - Topografik yer (yer improvement haritası gibi elevate edilen dikdörtgenler)
 * - Dönen bisiklet tekerleği (merkezde, premium oda noktası)
 * - Kazanç parçacıkları (yukarı doğru çizen, BTCYC simgesi akışı)
 * - Hafif kamera hareketi (fare / parmak ile reaksiyon)
 * - Mobil dostu: parçacık ve geometri sayısı ekrana göre ölçeklenir
 */
(function () {
  'use strict';

  const CANVAS_ID = 'threeBg';
  let scene, camera, renderer, controls, terrain, wheel, particles, clock;
  let mouse = { x: 0, y: 0 };
  let rafId;

  const COLORS = {
    terrain: 0x047857,
    terrainAlt: 0x064E3B,
    wheel: 0xFFFFFF,
    wheelAccent: 0x10B981,
    particle: 0x34D399,
    glow: 0x059669
  };

  function init() {
    const container = document.getElementById(CANVAS_ID);
    if (!container) return;

    // Existing PWA UI must stay on top; canvas sits behind it.
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '1';
    container.style.pointerEvents = 'none';
    container.style.background = '#031613';

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const particleCount = isMobile ? 900 : 1800;
    const terrainSize = isMobile ? 60 : 100;
    const terrainSegments = isMobile ? 32 : 64;

    // ---------- Scene & Camera ----------
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x031613, 0.035);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 18, 38);
    camera.lookAt(0, 0, 0);

    // ---------- Renderer ----------
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById(CANVAS_ID), antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x031613);

    // ---------- Lights ----------
    const ambient = new THREE.AmbientLight(0xFFFFFF, 0.35);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    dirLight.position.set(10, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(COLORS.glow, 0.6, 60);
    fillLight.position.set(-12, 6, 12);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x10B981, 0.45, 70);
    rimLight.position.set(12, 14, -18);
    scene.add(rimLight);

    // ---------- Topographic terrain ----------
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position.array;
    const freq = 2.6;
    const amp = 4.2;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const n = Math.sin(x * freq) * Math.cos(z * freq) * 0.5 + 0.5;
      positions[i + 1] = Math.sin(n * Math.PI * 4) * amp * 0.9;
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.terrain,
      flatShading: true,
      wireframe: false,
      roughness: 0.9,
      metalness: 0.1
    });
    terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // ---------- Bicycle wheel ----------
    buildWheel();

    // ---------- Particles ----------
    buildParticles(particleCount);

    // ---------- Clock ----------
    clock = new THREE.Clock();

    // ---------- Interaction ----------
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);

    animate();
  }

  function buildWheel() {
    const group = new THREE.Group();

    // Rim
    const rimGeo = new THREE.TorusGeometry(3.4, 0.14, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({ color: COLORS.wheel, metalness: 0.6, roughness: 0.25 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.castShadow = true;
    rim.receiveShadow = true;
    group.add(rim);

    // Spokes
    const spokeCount = 24;
    for (let i = 0; i < spokeCount; i++) {
      const a = (i / spokeCount) * Math.PI * 2;
      const spokeGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.3, 4);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(Math.sin(a) * 1.7, 0, Math.cos(a) * 1.7);
      spoke.rotation.x = Math.PI / 2 - a;
      spoke.castShadow = true;
      group.add(spoke);
    }

    // Hub (center)
    const hubGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x1F2937, metalness: 0.8, roughness: 0.2 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.x = Math.PI / 2;
    hub.castShadow = true;
    group.add(hub);

    // Pedal accent (subtle glow ring)
    const glowGeo = new THREE.TorusGeometry(3.6, 0.04, 8, 48);
    const glowMat = new THREE.MeshBasicMaterial({ color: COLORS.wheelAccent, transparent: true, opacity: 0.5 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    group.position.set(0, 0.6, 0);
    group.rotation.x = Math.PI / 2;
    wheel = group;
    scene.add(wheel);
  }

  function buildParticles(count) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12 + 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 70;

      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = 0.04 + Math.random() * 0.08;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      life[i] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(vel, 3));
    geo.setAttribute('life', new THREE.BufferAttribute(life, 1));

    const mat = new THREE.PointsMaterial({
      size: isMobile() ? 0.14 : 0.18,
      color: COLORS.particle,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    particles = new THREE.Points(geo, mat);
    scene.add(particles);

    particles._userData = { vel, life };
  }

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function onPointerMove(e) {
    mouse.x = (e.clientX / window.innerWidth) - 0.5;
    mouse.y = (e.clientY / window.innerHeight) - 0.5;
  }

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Terrain slow breathing
    if (terrain) {
      terrain.rotation.z = Math.sin(t * 0.15) * 0.015;
      const positions = terrain.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] = Math.sin(positions[i] * 2.6 + t * 0.6) * Math.cos(positions[i + 2] * 2.6) * 0.5 * 4.2 * 0.9;
      }
      terrain.geometry.attributes.position.needsUpdate = true;
      terrain.geometry.computeVertexNormals();
    }

    // Wheel rotation
    if (wheel) {
      wheel.rotation.y += 0.014;
      wheel.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.03;
      wheel.position.y = 0.6 + Math.sin(t * 1.2) * 0.08;
      wheel.material && wheel.traverse((o) => {
        if (o.isMesh) {
          const m = o.material;
          if (m.emissive) m.emissive.setHex(0x000000);
        }
      });
      const glowChild = wheel.children.find((c) => c.material && c.material.transparent && c.material.opacity === 0.5);
      if (glowChild) glowChild.material.opacity = 0.4 + Math.sin(t * 2) * 0.1;
    }

    // Particles float upward + gentle sway
    if (particles) {
      const pos = particles.geometry.attributes.position.array;
      const vel = particles._userData.vel;
      const life = particles._userData.life;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += vel[i];
        pos[i + 1] += vel[i + 1];
        pos[i + 2] += vel[i + 2];
        pos[i] += Math.sin(t + i) * 0.005;
        pos[i + 2] += Math.cos(t + i) * 0.005;

        if (pos[i + 1] > 14) {
          pos[i + 1] = -6;
          pos[i] = (Math.random() - 0.5) * 70;
          pos[i + 2] = (Math.random() - 0.5) * 70;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }

    // Gentle camera drift by mouse
    if (camera) {
      const targetX = mouse.x * 12;
      const targetY = mouse.y * 6;
      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - (camera.position.y - 18)) * 0.04;
      camera.lookAt(camera.position.x, 0, 0);
    }

    renderer.render(scene, camera);
  }

  // Public API
  window.Bitcycling3D = {
    init,
    dispose: () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      if (renderer) renderer.dispose();
      if (scene) {
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
            else o.material.dispose();
          }
        });
      }
    }
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
