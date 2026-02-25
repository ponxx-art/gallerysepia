import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
scene.fog = new THREE.Fog(0x1a1a1a, 1, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#background'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.8));

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

let modelLoaded = false;
let gltfScene = null;

const modelPath = import.meta.env.VITE_MODEL_PATH || '/public/models/Galería Sepia2..glb';

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);
loader.load(
  modelPath,
  (gltf) => {
    scene.add(gltf.scene);
    gltfScene = gltf.scene;
    modelLoaded = true;

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    camera.position.copy(center);
    camera.position.y += 2.0;

    const maxDim = Math.max(size.x, size.y, size.z);
    camera.near = maxDim * 0.01;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();

    scene.fog.far = maxDim * 2;
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
    const errorEl = document.createElement('div');
    errorEl.id = 'error';
    errorEl.textContent = 'Error loading 3D model';
    errorEl.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ff5555;font-family:sans-serif;font-size:24px;';
    document.body.appendChild(errorEl);
  }
);

const controls = new PointerLockControls(camera, document.body);

const instructions = document.createElement('div');
instructions.id = 'instructions';
instructions.innerHTML = '<div>Click to enter</div><div style="font-size:14px;margin-top:10px">WASD / Arrow keys to move<br>Mouse to look around<br>Space to jump<br>Esc to exit</div>';
document.body.appendChild(instructions);

instructions.addEventListener('click', () => {
  controls.lock();
});

controls.addEventListener('lock', () => {
  instructions.style.display = 'none';
});

controls.addEventListener('unlock', () => {
  instructions.style.display = 'block';
});

const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 4;
const friction = 10;
const gravity = 30;
const jumpForce = 10;
let canJump = false;
let groundLevel = 0;

const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveState.forward = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveState.backward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveState.left = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveState.right = true;
      break;
    case 'Space':
      if (canJump) {
        velocity.y = jumpForce;
        canJump = false;
      }
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveState.forward = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveState.backward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveState.left = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveState.right = false;
      break;
  }
});

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement) {
    instructions.style.display = 'block';
  }
});

let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = Math.min((time - prevTime) / 1000, 0.1);

  if (controls.isLocked) {
    raycaster.set(camera.position, downVector);
    const intersects = gltfScene ? raycaster.intersectObject(gltfScene, true) : [];
    if (intersects.length > 0) {
      groundLevel = intersects[0].point.y;
    }

    if (camera.position.y <= groundLevel + 2.0) {
      velocity.y = Math.max(0, velocity.y);
      camera.position.y = groundLevel + 2.0;
      canJump = true;
    } else {
      velocity.y -= gravity * delta;
    }

    direction.z = Number(moveState.forward) - Number(moveState.backward);
    direction.x = Number(moveState.right) - Number(moveState.left);
    direction.normalize();

    if (moveState.forward || moveState.backward) {
      velocity.z += direction.z * speed * delta;
    }
    if (moveState.left || moveState.right) {
      velocity.x += direction.x * speed * delta;
    }

    velocity.x -= velocity.x * friction * delta;
    velocity.z -= velocity.z * friction * delta;

    controls.moveRight(velocity.x * delta * 10);
    controls.moveForward(velocity.z * delta * 10);
    camera.position.y += velocity.y * delta;
  }

  prevTime = time;
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
