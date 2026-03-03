import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container, camera, scene, renderer, reticle, foodModel;
let hitTestSource = null;
let hitTestSourceRequested = false;

const instructionText = document.getElementById('instruction-text');
const urlParams = new URLSearchParams(window.location.search);
const modelPath = `models/${urlParams.get('model') || 'hamburger'}.glb`;

init();
animate();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

    new GLTFLoader().load(modelPath, (gltf) => {
        foodModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(foodModel);
        // Önemli: Android masada 20cm sabit ölçek
        foodModel.scale.setScalar(0.2 / box.getSize(new THREE.Vector3()).length());
        document.getElementById('loader').style.display = 'none';
        instructionText.innerText = "Kamerayı masada gezdirin.";
    });

    reticle = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({color: 0xFF9933}));
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    renderer.xr.getController(0).addEventListener('select', () => {
        if (reticle.visible && foodModel) {
            const clone = foodModel.clone();
            clone.position.setFromMatrixPosition(reticle.matrix);
            scene.add(clone);
        }
    });
}

function render(timestamp, frame) {
    if (frame) {
        const session = renderer.xr.getSession();
        if (!hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then(ref => session.requestHitTestSource({space: ref}).then(src => hitTestSource = src));
            hitTestSourceRequested = true;
        }
        if (hitTestSource) {
            const results = frame.getHitTestResults(hitTestSource);
            if (results.length > 0) {
                reticle.visible = true;
                reticle.matrix.fromArray(results[0].getPose(renderer.xr.getReferenceSpace()).transform.matrix);
                instructionText.innerText = "Masa bulundu! Dokunun.";
            } else { reticle.visible = false; }
        }
    }
    renderer.render(scene, camera);
}
function animate() { renderer.setAnimationLoop(render); }