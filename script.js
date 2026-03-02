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
let originalScale = 1; 

function init() {
    menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-card';
        div.innerHTML = `
            <div class="card-image-container">
                <img src="${item.img}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x400/121212/FF9933?text=Fotoğraf'">
                <div class="ar-badge">3D İncele</div>
            </div>
            <div class="card-info">
                <h3>${item.name}</h3>
                <span class="price">${item.price}</span>
            </div>
        `;
        div.onclick = () => open(item);
        container.appendChild(div);
    });
}

function open(item) {
    document.getElementById('modal-title').innerText = item.name;
    document.getElementById('modal-price').innerText = item.price;
    document.getElementById('modal-calories').innerText = item.cal;
    document.getElementById('modal-ingredients').innerText = item.ing;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
    setup3D();
    load(item.model);
}

closeBtn.onclick = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    if(currentModel) {
        scene.remove(currentModel);
        currentModel = null;
    }
};

function setup3D() {
    if (scene) return;
    scene = new THREE.Scene();
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    renderer.xr.enabled = true; 
    viewerContainer.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(40, viewerContainer.clientWidth / viewerContainer.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 6);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 10, 5);
    const rimLight = new THREE.DirectionalLight(0xFF9933, 3.0); 
    rimLight.position.set(-5, 5, -10); 

    scene.add(ambientLight, mainLight, rimLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
    });
}

function load(path) {
    loadingText.style.display = 'block';
    
    new GLTFLoader().load(path, (gltf) => {
        loadingText.style.display = 'none';
        if(currentModel) scene.remove(currentModel);
        currentModel = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);
        
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        if (maxDim > 0) {
            originalScale = 3.0 / maxDim;
            currentModel.scale.setScalar(originalScale);
        }
        
        currentModel.position.y -= 0.5;
        scene.add(currentModel);
    }, undefined, (error) => {
        loadingText.innerText = 'Model Yüklenemedi';
        console.error(error);
    });
}

document.getElementById('ar-btn').addEventListener('click', () => {
    if ('xr' in navigator) {
        navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
            if (supported) {
                navigator.xr.requestSession('immersive-ar').then((session) => {
                    renderer.xr.setReferenceSpaceType('local');
                    renderer.xr.setSession(session);

                    if (currentModel) {
                        currentModel.position.set(0, -0.2, -1.0); 
                        currentModel.scale.set(0.3, 0.3, 0.3); 
                    }

                    session.addEventListener('end', () => {
                        if (currentModel) {
                            currentModel.position.set(0, -0.5, 0);
                            currentModel.scale.setScalar(originalScale);
                        }
                    });
                });
            } else {
                alert("Cihazınız AR (Artırılmış Gerçeklik) özelliğini desteklemiyor.");
            }
        });
    } else {
        alert("Tarayıcınız AR desteklemiyor. Geçerli bir HTTPS (Güvenli) bağlantı kullandığınızdan emin olun.");
    }
});

init();