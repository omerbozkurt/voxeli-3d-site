import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let controller;
let reticle;
let foodModel;
let hitTestSource = null;
let hitTestSourceRequested = false;

const instructionText = document.getElementById('instruction-text');
const loaderUI = document.getElementById('loader');

const urlParams = new URLSearchParams(window.location.search);
const modelName = urlParams.get('model') || 'hamburger'; 
const modelPath = `models/${modelName}.glb`;

init();
animate();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(0, 5, 0);
    scene.add(dirLight);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // AR Butonu oluşturulurken destek kontrolü
    const arButton = ARButton.createButton(renderer, { 
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.getElementById('ui-container') }
    });
    document.body.appendChild(arButton);

    loadModel();

    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xFF9933 }) 
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    window.addEventListener('resize', onWindowResize);

    renderer.xr.addEventListener('sessionstart', () => {
        instructionText.innerText = "Kamerayı masaya tutup yavaşça hareket ettirin.";
    });

    renderer.xr.addEventListener('sessionend', () => {
        instructionText.innerText = "AR Oturumu Bitti.";
    });
}

function loadModel() {
    const loader = new GLTFLoader();
    loader.load(modelPath, function (gltf) {
        foodModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(foodModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        foodModel.scale.setScalar(0.3 / maxDim); 
        
        loaderUI.style.display = 'none';
        // Bilgisayarda iseniz bu yazı görünür kalacaktır çünkü AR başlatılamaz.
        instructionText.innerText = "Model Hazır. AR Başlatmak İçin 'Start AR' Butonuna Basın (Sadece Mobil).";
    }, undefined, function (error) {
        console.error("Model Yükleme Hatası:", error);
        loaderUI.style.display = 'none';
        instructionText.innerText = "Hata: Model dosyası bulunamadı (" + modelName + ")";
    });
}

function onSelect() {
    if (reticle.visible && foodModel) {
        const clone = foodModel.clone();
        clone.position.setFromMatrixPosition(reticle.matrix);
        clone.lookAt(camera.position.x, clone.position.y, camera.position.z);
        scene.add(clone);
        instructionText.innerText = "Afiyet olsun! Başka model koymak için tekrar dokunun.";
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                    hitTestSource = source;
                });
            });
            session.addEventListener('end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });
            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                
                if(instructionText.innerText.includes("hareket ettirin")) {
                    instructionText.innerText = "Masa bulundu! Yemeği koymak için ekrana dokunun.";
                }
            } else {
                reticle.visible = false;
            }
        }
    }
    renderer.render(scene, camera);
}