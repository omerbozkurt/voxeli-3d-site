import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const menuItems = [
    { id: 1, name: "Hamburger", price: "220 ₺", cal: 650, ing: "Dana köfte, cheddar peyniri, domates, marul, karamelize soğan.", img: "images/hamburger.jpg", model: "models/hamburger.glb" },
    { id: 2, name: "Pizza", price: "310 ₺", cal: 850, ing: "Mozzarella, sucuk, sosis, mantar, mısır, siyah zeytin.", img: "images/pizza.jpg", model: "models/pizza.glb" },
    { id: 3, name: "Cheesecake", price: "150 ₺", cal: 420, ing: "Krem peynir, yulaf tabanı, frambuaz sosu.", img: "images/cheesecake.jpg", model: "models/cheesecake.glb" },
    { id: 4, name: "Sushi", price: "350 ₺", cal: 320, ing: "Somon, sushi pirinci, yosun (nori), avokado.", img: "images/sushi.jpg", model: "models/sushi.glb" },
    { id: 5, name: "Taco", price: "240 ₺", cal: 480, ing: "Kıyma, taco kabuğu, kaşar peyniri, marul, domates.", img: "images/taco.jpg", model: "models/taco.glb" }
];

const container = document.getElementById('menu-container');
const modal = document.getElementById('model-modal');
const closeBtn = document.getElementById('close-btn');
const viewerContainer = document.getElementById('3d-viewer');
const loadingText = document.getElementById('loading-text');

let scene, camera, renderer, controls, currentModel;

function init() {
    container.innerHTML = '';
    menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-card';
        div.innerHTML = `
            <div class="card-image-container">
                <img src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x400/121212/FF9933?text=${item.name}'">
                <div class="ar-badge">3D İNCELE</div>
            </div>
            <div class="card-info">
                <h3>${item.name}</h3>
                <span class="price">${item.price}</span>
            </div>
        `;
        div.onclick = () => openModal(item);
        container.appendChild(div);
    });
}

function openModal(item) {
    document.getElementById('modal-title').innerText = item.name;
    document.getElementById('modal-price').innerText = item.price;
    document.getElementById('modal-calories').innerText = item.cal;
    document.getElementById('modal-ingredients').innerText = item.ing;
    
    // AR Link Mantığı
    const arLink = document.getElementById('ar-link');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
        arLink.href = item.model.replace('.glb', '.usdz');
    } else {
        const modelUrl = window.location.origin + window.location.pathname.replace('index.html', '') + item.model;
        arLink.href = `intent://arvr.google.com/scene-viewer/1.0?file=${modelUrl}&mode=ar_only&resizable=true#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setup3D();
    loadModel(item.model);
}

function setup3D() {
    if (scene) return;
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    viewerContainer.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(40, viewerContainer.clientWidth / viewerContainer.clientHeight, 0.01, 1000);
    camera.position.set(0, 2, 8);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0), new THREE.DirectionalLight(0xffffff, 1.8));
    
    const rimLight = new THREE.DirectionalLight(0xFF9933, 2.5);
    rimLight.position.set(-5, 5, -10);
    scene.add(rimLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

function loadModel(path) {
    const loader = new GLTFLoader();
    loadingText.style.display = 'block';

    loader.load(path, (gltf) => {
        loadingText.style.display = 'none';
        if (currentModel) scene.remove(currentModel);
        currentModel = gltf.scene;
        
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.material.side = THREE.DoubleSide;
                child.frustumCulled = false;
            }
        });

        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);
        
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scaleFactor = 3.8 / maxDim;
            currentModel.scale.setScalar(scaleFactor);
        }

        scene.add(currentModel);
        
        // Akıllı Zoom
        const finalBox = new THREE.Box3().setFromObject(currentModel);
        const finalSize = finalBox.getSize(new THREE.Vector3());
        const maxFinalDim = Math.max(finalSize.x, finalSize.y, finalSize.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxFinalDim / Math.tan(fov / 2)) * 0.8;
        
        camera.position.set(0, finalSize.y / 2, cameraZ + 2);
        controls.target.set(0, 0, 0);
        controls.update();
    });
}

closeBtn.onclick = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    if (currentModel) scene.remove(currentModel);
};

init();