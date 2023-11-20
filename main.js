import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// globals
let mouse, target, model, renderer, scene, camera, spriteSheetTexture;

function init() {

    // set up mouse and touch event handling
    target = new THREE.Vector3(0, 0, 2.7);
    mouse = new THREE.Vector2(0, -1.5);

    // set up scene including camera and renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color('white');

    camera = new THREE.PerspectiveCamera(75, 350 / 350, 0.1, 1000);
    camera.position.set(0, -1.8, 3);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(350, 350);

    const container = document.getElementById('scene-container');
    container.appendChild(renderer.domElement);

    // make it a bit brighter
    const light = new THREE.DirectionalLight(0xffffff, 5);
    light.position.set(0, 0, 3);
    scene.add(light);

    // get the sprite sheet
    spriteSheetTexture = new THREE.TextureLoader().load('spritesheet.png');

    // create a material from the sprite sheet
    const material = new THREE.MeshBasicMaterial({ map: spriteSheetTexture });
    material.side = THREE.BackSide;
    material.transparent = true;
    material.map.flipY = false;
    
    // texture filters to sharpen png face
    material.map.minFilter = THREE.NearestFilter;
    material.map.magFilter = THREE.NearestFilter;

    // load the model
    const loader = new GLTFLoader();
    loader.load('/sixcen_head_3.glb', (gltf) => {
        // onload
        model = gltf.scene;
        model.scale.set(1.5, 1.5, 1.5);
        model.position.set(0, 0, 0);
        model.traverse((o) => {
            if (o.name == "sixcen_png_face") {
                o.material = material; // Assign the sprite sheet material
            }
        });
        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play(); // Play the animation
            action.setLoop(THREE.LoopRepeat, Infinity); // Set the animation to loop
        });
        model.mixer = mixer;
    });
}

const render = () => {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
};

const update = () => {
    requestAnimationFrame(update);

    if (model && model.mixer) {
        model.mixer.update(0.01); // You can adjust the time delta as needed
    }

    // Calculate the current frame index based on the time
    const currentTime = Date.now();
    const frameDuration = 6000; // 4 seconds for the first frame
    const totalDuration = frameDuration + 500; // Total duration (4s + 0.5s)
    const frameIndex = Math.floor((currentTime % totalDuration) / frameDuration);

    // Update the texture offset and repeat based on the current frame index
    const frameWidth = 1 / 2; // Assuming 2 frames

    if (frameIndex === 0) {
        // Display the first frame for 4 seconds
        spriteSheetTexture.offset.x = 0;
        spriteSheetTexture.repeat.x = frameWidth;
    } else {
        // Display the second frame for half a second and loop
        spriteSheetTexture.offset.x = frameWidth;
        spriteSheetTexture.repeat.x = frameWidth;
    }

    // Basic lerping
    target.x += (mouse.x - target.x) * 0.1;
    target.y += (mouse.y - target.y) * 0.1;
    if (model) {
        model.lookAt(target);
    }
};

// Event handler for both mouse and touch events
const handleInput = (event) => {
    if (event.touches) {
        // Handle touch events
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 - 1;
    } else {
        // Handle mouse events
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 - 1;
    }

    // Update the model's orientation
    if (model) {
        model.lookAt(target);
    }
};

// Add event listeners for both mouse and touch events
window.addEventListener('mousemove', handleInput);
window.addEventListener('touchstart', handleInput);
window.addEventListener('touchmove', handleInput);

// Handle touchend to stop model movement (optional)
window.addEventListener('touchend', () => {
    mouse.set(0, -1.5);
    if (model) {
        model.lookAt(target);
    }
});

init();
render();
update();