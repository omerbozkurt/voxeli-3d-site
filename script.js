import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * VOXELI 3D - Ürün Veritabanı
 */
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

/**
 * Ana Menü Başlatma
 */
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

/**
 * Modal Açma ve AR Link Hazırlama
 */
function openModal(item) {
    document.getElementById('modal-title').innerText = item.name;
    document.getElementById('modal-price').innerText = item.price;
    document.getElementById('modal-calories').innerText = item.cal;
    document.getElementById('modal-ingredients').innerText = item.ing;
    
    const arLink = document.getElementById('ar-link');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        arLink.href = item.model.replace('.glb', '.usdz');
    } else {
        arLink.href = `intent://arvr.google.com/scene-viewer/1.0?file=${window.location.origin}/${item.model}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setup3D();
    loadModel(item.model);
}

/**
 * Three.js Sahne Kurulumu (Cinematic Deep Umami Lighting)
 */
function setup3D() {
    if (scene) return;
    
    scene = new THREE.Scene();
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    viewerContainer.appendChild(renderer.domElement);

    // Başlangıç kamera pozisyonu (Model yüklenince akıllı zoom ile güncellenecek)
    camera = new THREE.PerspectiveCamera(40, viewerContainer.clientWidth / viewerContainer.clientHeight, 0.01, 1000);
    camera.position.set(0, 2, 8);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(5, 10, 5);
    const rimLight = new THREE.DirectionalLight(0xFF9933, 2.5);
    rimLight.position.set(-5, 5, -10);
    
    scene.add(ambientLight, mainLight, rimLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        const width = viewerContainer.clientWidth;
        const height = viewerContainer.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
}

/**
 * Akıllı Yakınlaştırma ve Garantili Odaklama (Model Yükleme)
 */
function loadModel(path) {
    const loader = new GLTFLoader();
    loadingText.style.display = 'block';

    loader.load(path, (gltf) => {
        loadingText.style.display = 'none';
        if (currentModel) scene.remove(currentModel);
        
        currentModel = gltf.scene;

        // Materyal ve Görünürlük Düzeltme
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.material.side = THREE.DoubleSide;
                child.frustumCulled = false;
            }
        });

        // 1. MERKEZLEME: Modeli sahnenin tam ortasına (0,0,0) çeker
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);

        // 2. ÖLÇEKLENDİRME: Modelleri standart bir referans boyutuna getirir
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scaleFactor = 3.5 / maxDim;
            currentModel.scale.setScalar(scaleFactor);
        }

        scene.add(currentModel);
        
        // 3. AKILLI YAKINLAŞTIRMA: Kamerayı modelin büyüklüğüne göre ayarlar
        const finalBox = new THREE.Box3().setFromObject(currentModel);
        const finalSize = finalBox.getSize(new THREE.Vector3());
        const finalCenter = finalBox.getCenter(new THREE.Vector3());

        // Modelin çapını hesapla ve kamerayı oraya odakla
        const maxFinalDim = Math.max(finalSize.x, finalSize.y, finalSize.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxFinalDim / Math.tan(fov / 2));
        
        // Biraz ekstra yakınlık (İştah açıcı görünüm için %20 daha yakın)
        cameraZ *= 0.8; 
        
        camera.position.set(0, finalSize.y / 2, cameraZ + 2);
        controls.target.copy(finalCenter);
        controls.update();

    }, undefined, (error) => {
        loadingText.innerText = "YÜKLEME HATASI!";
        console.error("3D Model Yüklenemedi:", error);
    });
}

/**
 * Kapatma Fonksiyonu
 */
closeBtn.onclick = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    if (currentModel) {
        scene.remove(currentModel);
        currentModel = null;
    }
};

// Uygulamayı Başlat
init();