import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const menuItems = [
    { id: 1, name: "Hamburger", price: "220 ₺", cal: 650, ing: "Dana eti, Cheddar, Brioche", img: "images/hamburger.jpg", model: "models/hamburger.glb" },
    { id: 2, name: "Pizza", price: "310 ₺", cal: 850, ing: "Mozzarella, Fesleğen, Sos", img: "images/pizza.jpg", model: "models/pizza.glb" },
    { id: 3, name: "Cheesecake", price: "150 ₺", cal: 420, ing: "Labne, Frambuaz, Bisküvi", img: "images/cheesecake.jpg", model: "models/cheesecake.glb" },
    { id: 4, name: "Sushi", price: "350 ₺", cal: 320, ing: "Somon, Pirinç, Nori", img: "images/sushi.jpg", model: "models/sushi.glb" },
    { id: 5, name: "Taco", price: "240 ₺", cal: 480, ing: "Kıyma, Guacamole, Salsa", img: "images/taco.jpg", model: "models/taco.glb" }
];

const container = document.getElementById('menu-container');
const modal = document.getElementById('model-modal');
const viewerContainer = document.getElementById('3d-viewer');
const loadingText = document.getElementById('loading-text');

let scene, camera, renderer, controls, currentModel;

function init() {
    container.innerHTML = '';
    menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-card';
        div.innerHTML = `
            <div class="card-image-container"><img src="${item.img}" loading="lazy"></div>
            <div class="card-info"><h3>${item.name}</h3><span class="price">${item.price}</span></div>`;
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
    if (isIOS) {
        arLink.href = item.model.replace('.glb', '.usdz');
    } else {
        const fullPath = window.location.origin + window.location.pathname.replace('index.html', '') + item.model;
        arLink.href = `intent://arvr.google.com/scene-viewer/1.0?file=${fullPath}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setup3D();
    loadModel(item.model);
}

function setup3D() {
    if (scene) return;
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    viewerContainer.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(45, viewerContainer.clientWidth / viewerContainer.clientHeight, 0.01, 1000);
    camera.position.set(0, 2, 10);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7.5);
    scene.add(ambientLight, dirLight);

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

        // BRUTE FORCE: Cheesecake'in her parçasını zorla göster
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.material.side = THREE.DoubleSide; 
                child.material.transparent = false;
                child.material.opacity = 1;
                child.frustumCulled = false;
            }
        });

        // MERKEZLEME
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);
        
        // ÖLÇEKLENDİRME
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        currentModel.scale.setScalar(4.5 / maxDim); 
        
        scene.add(currentModel);

        // KAMERA ZOOM-IN: Modeli kadraja zorla oturt
        const finalBox = new THREE.Box3().setFromObject(currentModel);
        const finalSize = finalBox.getSize(new THREE.Vector3());
        const camDist = Math.max(finalSize.x, finalSize.y, finalSize.z) * 2.2;
        camera.position.set(0, finalSize.y / 2, camDist);
        controls.target.set(0, 0, 0);
        controls.update();
        
    }, undefined, (e) => { 
        loadingText.innerText = "Yükleme Hatası!"; 
    });
}

document.getElementById('close-btn').onclick = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    if (currentModel) scene.remove(currentModel);
};

init();