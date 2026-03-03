import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- GECE/GÜNDÜZ VE MOBİL MENÜ ---
const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    themeBtn.innerText = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
});

const hamburgerBtn = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
const navItems = document.querySelectorAll('.nav-item');

hamburgerBtn.addEventListener('click', () => { navLinks.classList.toggle('active'); });
navItems.forEach(item => { item.addEventListener('click', () => { navLinks.classList.remove('active'); }); });

// --- HERO BÖLÜMÜ ---
function setupHero3D() {
    const container = document.getElementById('hero-3d-viewer');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2), new THREE.DirectionalLight(0xffffff, 1.5));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.5;
    controls.enableZoom = false;

    const loader = new GLTFLoader();
    loader.load('models/doner.glb', (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(4.5 / maxDim); 
        scene.add(model);
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        if(container.clientWidth > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
}

window.addEventListener('load', setupHero3D);

// --- MENÜ VE MODAL MANTIĞI ---
const menuItems = [
    { id: 1, name: "Hamburger", price: "220 ₺", cal: 650, ing: "Dana eti, Cheddar", img: "images/hamburger.jpg", model: "models/hamburger.glb" },
    { id: 2, name: "Pizza", price: "310 ₺", cal: 850, ing: "Mozzarella, Fesleğen", img: "images/pizza.jpg", model: "models/pizza.glb" },
    { id: 3, name: "Cheesecake", price: "150 ₺", cal: 420, img: "Labne, Frambuaz", img: "images/cheesecake.jpg", model: "models/cheesecake.glb" },
    { id: 4, name: "Sushi", price: "350 ₺", cal: 320, ing: "Somon, Pirinç", img: "images/sushi.jpg", model: "models/sushi.glb" },
    { id: 5, name: "Taco", price: "240 ₺", cal: 480, ing: "Kıyma, Guacamole", img: "images/taco.jpg", model: "models/taco.glb" }
];

const container = document.getElementById('menu-container');
const modal = document.getElementById('model-modal');
const viewerContainer = document.getElementById('3d-viewer');
const loaderWrapper = document.getElementById('loader-wrapper');

let modalScene, modalCamera, modalRenderer, modalControls, currentModalModel;

function init() {
    container.innerHTML = '';
    menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-card';
        div.innerHTML = `
            <div class="card-image-container">
                <img src="${item.img}" alt="${item.name}" loading="lazy" decoding="async">
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
    
    // iOS Tespiti
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const modelFileName = item.model.split('/').pop().replace('.glb', '');

    if (isIOS) {
        // iOS: Quick Look için USDZ yönlendirmesi
        arLink.href = `models/${modelFileName}.usdz`;
        arLink.setAttribute('rel', 'ar');
        // Safari'nin AR ikonunu göstermesi için boş bir img gerekebilir
        const arImg = document.createElement('img');
        arImg.src = item.img;
        arImg.style.display = 'none';
        arLink.appendChild(arImg);
        arLink.onclick = null;
    } else {
        // Android/WebXR: Mevcut WebXR Viewer yönlendirmesi
        arLink.removeAttribute('rel');
        arLink.href = `ar-viewer.html?model=${modelFileName}`;
        arLink.onclick = null;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setupModal3D();
    loadModalModel(item.model);
}

function setupModal3D() {
    if (modalScene) return;
    modalScene = new THREE.Scene();
    modalRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
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
        modalControls.update();
    }, undefined, () => { loaderWrapper.style.display = 'none'; });
}

document.getElementById('close-btn').onclick = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    if (currentModalModel) { modalScene.remove(currentModalModel); currentModalModel = null; }
};

init();