import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';

// --- GECE/GÜNDÜZ VE MOBİL MENÜ ---
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        themeBtn.innerText = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
    });
}

const hamburgerBtn = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
const navItems = document.querySelectorAll('.nav-item');

if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => { navLinks.classList.toggle('active'); });
}
navItems.forEach(item => { item.addEventListener('click', () => { navLinks.classList.remove('active'); }); });

// --- HERO BÖLÜMÜ ---
function setupHero3D() {
    const container = document.getElementById('hero-3d-viewer');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2), new THREE.DirectionalLight(0xffffff, 1.5));

    // Kontrolleri Parallax için kapattık, kamerayı fare/cihaz ivmesi ile yöneteceğiz.
    // const controls = new OrbitControls(camera, renderer.domElement); 

    let loadedModel;
    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const loader = new GLTFLoader();
    loader.load('models/pizza.glb', (gltf) => {
        loadedModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        loadedModel.position.sub(center);
        
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 4.5 / maxDim; 
        
        // Model başlangıçta 0 boyutunda
        loadedModel.scale.setScalar(0); 
        scene.add(loadedModel);

        // GSAP ile Premium "Pop" Animasyonu
        gsap.to(loadedModel.scale, {
            x: targetScale,
            y: targetScale,
            z: targetScale,
            duration: 1.5,
            ease: "elastic.out(1, 0.4)", // Tatmin edici esneme
            delay: 0.2
        });
        
        // Objeye sürekli hafif bir süzülme (float) animasyonu ekliyoruz
        gsap.to(loadedModel.position, {
            y: "+=0.2",
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
    });

    // Masaüstü için Mouse Takibi
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    });

    // Mobil için Jiroskop (Gyroscope) Takibi
    window.addEventListener('deviceorientation', (event) => {
        // Gamma (sol-sağ eğim), Beta (ön-arka eğim)
        if (event.gamma !== null && event.beta !== null) {
            mouseX = event.gamma / 45; // -45 ile 45 derece arası normalize
            mouseY = (event.beta - 45) / 45; 
        }
    });

    function animate() {
        requestAnimationFrame(animate);
        
        if (loadedModel) {
            // Objeyi kendi etrafında yavaşça döndürmeye devam et
            loadedModel.rotation.y += 0.005;

            // Parallax Etkisi: Mouse veya Jiroskop verisine göre kamerayı yumuşakça hareket ettir (Lerp)
            camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
            camera.position.y += (-mouseY * 2 + 1.5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);
        }

        renderer.render(scene, camera);
    }
    animate();
}

window.addEventListener('load', setupHero3D);

// --- MENÜ VE MODAL ---
const menuItems = [
    { id: 1, name: "Hamburger", price: "220 ₺", cal: 650, ing: "Dana eti, Cheddar", img: "images/hamburger.jpg", model: "models/hamburger.glb" },
    { id: 2, name: "Pizza", price: "310 ₺", cal: 850, ing: "Mozzarella, Fesleğen", img: "images/pizza.jpg", model: "models/pizza.glb" },
    { id: 3, name: "Cheesecake", price: "150 ₺", cal: 420, ing: "Labne, Frambuaz", img: "images/cheesecake.jpg", model: "models/cheesecake.glb" },
    { id: 4, name: "Sushi", price: "350 ₺", cal: 320, ing: "Somon, Pirinç", img: "images/sushi.jpg", model: "models/sushi.glb" },
    { id: 5, name: "Taco", price: "240 ₺", cal: 480, ing: "Kıyma, Guacamole", img: "images/taco.jpg", model: "models/taco.glb" }
];

const container = document.getElementById('menu-container');
const modal = document.getElementById('model-modal');
const viewerContainer = document.getElementById('3d-viewer');
const loaderWrapper = document.getElementById('loader-wrapper');

let modalScene, modalCamera, modalRenderer, modalControls, currentModalModel;

function init() {
    if (!container) return;
    container.innerHTML = '';
    menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-card';
        div.innerHTML = `
            <div class="card-image-container">
                <img src="${item.img}" alt="${item.name}" loading="lazy">
                <div class="spatial-badge">3D</div>
            </div>
            <div class="card-info">
                <h3>${item.name}</h3>
                <span class="price">${item.price}</span>
            </div>`;
        div.onclick = () => openModal(item);
        container.appendChild(div);
    });
}

function openModal(item) {
    document.getElementById('modal-title').innerText = item.name;
    document.getElementById('modal-price').innerText = item.price;
    document.getElementById('modal-calories').innerText = item.cal;
    document.getElementById('modal-ingredients').innerText = item.ing;
    
    const arLink = document.getElementById('ar-link');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const modelFileName = item.model.split('/').pop().replace('.glb', '');

    if (isIOS) {
        arLink.href = `models/${modelFileName}.usdz#allowsContentScaling=0`;
        arLink.setAttribute('rel', 'ar');
        arLink.innerHTML = `🧊 Masamda Gör <img src="${item.img}" style="display:none">`;
    } else {
        arLink.removeAttribute('rel');
        arLink.href = `ar-viewer.html?model=${modelFileName}`;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setupModal3D();
    loadModalModel(item.model);
}

function setupModal3D() {
    if (modalScene) return;
    modalScene = new THREE.Scene();
    modalRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    modalRenderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
    modalRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    viewerContainer.appendChild(modalRenderer.domElement);

    modalCamera = new THREE.PerspectiveCamera(40, viewerContainer.clientWidth / viewerContainer.clientHeight, 0.1, 1000);
    modalCamera.position.set(0, 1.5, 10);
    modalScene.add(new THREE.AmbientLight(0xffffff, 1.5), new THREE.DirectionalLight(0xffffff, 1.5));
    
    modalControls = new OrbitControls(modalCamera, modalRenderer.domElement);
    modalControls.enableDamping = true;
    modalControls.autoRotate = true;

    function animate() {
        requestAnimationFrame(animate);
        modalControls.update();
        modalRenderer.render(modalScene, modalCamera);
    }
    animate();
}

function loadModalModel(path) {
    const loader = new GLTFLoader();
    loaderWrapper.style.display = 'flex'; 

    loader.load(path, (gltf) => {
        loaderWrapper.style.display = 'none'; 
        if (currentModalModel) modalScene.remove(currentModalModel);
        currentModalModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(currentModalModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModalModel.position.sub(center);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        currentModalModel.scale.setScalar(4.0 / maxDim); 
        modalScene.add(currentModalModel);
    }, undefined, () => { loaderWrapper.style.display = 'none'; });
}

document.getElementById('close-btn').onclick = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    if (currentModalModel) { modalScene.remove(currentModalModel); currentModalModel = null; }
};

init();