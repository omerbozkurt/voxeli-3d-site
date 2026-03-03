import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- UI ---
const themeBtn = document.getElementById('theme-toggle');
themeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    themeBtn.innerText = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
});

const hamburgerBtn = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
hamburgerBtn?.addEventListener('click', () => navLinks.classList.toggle('active'));

// --- HERO 3D ---
function setupHero3D() {
    const container = document.getElementById('hero-3d-viewer');
    if (!container) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 8);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 2), new THREE.DirectionalLight(0xffffff, 1.5));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    
    // Model yolu pizza.glb olarak güncellendi
    new GLTFLoader().load('models/pizza.glb', (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        model.scale.setScalar(4.5 / box.getSize(new THREE.Vector3()).length());
        scene.add(model);
    });
    
    function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
    animate();
}
window.addEventListener('load', setupHero3D);

// --- MENU DATA ---
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

function init() {
    menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-card';
        div.innerHTML = `<div class="card-image-container"><img src="${item.img}"><div class="spatial-badge">3D</div></div><div class="card-info"><h3>${item.name}</h3><span class="price">${item.price}</span></div>`;
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
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
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
    setupModal3D();
    loadModalModel(item.model);
}

let modalScene, modalCamera, modalRenderer, modalControls, currentModalModel;
function setupModal3D() {
    if (modalScene) return;
    modalScene = new THREE.Scene();
    modalRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    modalRenderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
    viewerContainer.appendChild(modalRenderer.domElement);
    modalCamera = new THREE.PerspectiveCamera(40, viewerContainer.clientWidth / viewerContainer.clientHeight, 0.1, 1000);
    modalCamera.position.set(0, 1.5, 10);
    modalScene.add(new THREE.AmbientLight(0xffffff, 1.5));
    
    modalControls = new OrbitControls(modalCamera, modalRenderer.domElement);
    // Kendi kendine dönme özelliği eklendi
    modalControls.autoRotate = true; 
    modalControls.autoRotateSpeed = 2.0; // Dönüş hızı (isteğe bağlı ayarlanabilir)

    function animate() { requestAnimationFrame(animate); modalControls.update(); modalRenderer.render(modalScene, modalCamera); }
    animate();
}

function loadModalModel(path) {
    new GLTFLoader().load(path, (gltf) => {
        document.getElementById('loader-wrapper').style.display = 'none';
        if (currentModalModel) modalScene.remove(currentModalModel);
        currentModalModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(currentModalModel);
        currentModalModel.scale.setScalar(4.0 / box.getSize(new THREE.Vector3()).length());
        modalScene.add(currentModalModel);
    });
}

document.getElementById('close-btn').onclick = () => modal.classList.add('hidden');
init();