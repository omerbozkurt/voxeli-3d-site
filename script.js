import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';

// --- Intersection Observer (Kaydırma Animasyonları) ---
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// --- 3D Hero Scene ---
function initHero() {
    const container = document.getElementById('hero-3d-viewer');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2), new THREE.DirectionalLight(0xffffff, 1.2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; controls.enableDamping = true;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.6;

    const loader = new GLTFLoader();
    loader.load('models/pizza.glb', (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        model.position.sub(box.getCenter(new THREE.Vector3()));
        const targetScale = 4.8 / Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y);
        model.scale.setScalar(0);
        scene.add(model);
        
        gsap.to(model.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 1.5, ease: "expo.out" });
        gsap.to(model.position, { y: "+=0.2", duration: 2.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

window.addEventListener('DOMContentLoaded', initHero);