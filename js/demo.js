/**
 * Simple Three.js Infinite Runner Game
 * Player dodges obstacles and racks up points for survival time
 */
class InfiniteRunner {
  constructor() {
    // Game settings
    this.gameSpeed = 0.15;
    this.lanes = [-2, 0, 2]; // Left, Center, Right positions
    this.currentLane = 1; // Start in center (index 1)
    
    // Game state
    this.score = 0;
    this.gameRunning = true;
    this.obstacles = [];
    this.scoreTime = 0;
    this.targetX = 0; // For smooth player movement
    
    // Three.js objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.ground = null;
    this.scoreElement = null;
    this.gameOverDiv = null;
    
    this.init();
  }

  init() {
    console.log('Starting new infinite runner...');
    this.setupScene();
    this.createPlayer();
    this.createGround();
    this.setupLighting();
    this.setupUI();
    this.setupControls();
    this.gameLoop();
  }

  setupScene() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 8);
    this.camera.lookAt(0, 0, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add to DOM
    const container = document.getElementById('AdamContainer');
    container.appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  createPlayer() {
    // Create a spaceship-like player using a group of geometries
    this.player = new THREE.Group();
    
    // Main body (diamond shape)
    const bodyGeometry = new THREE.ConeGeometry(0.3, 0.8, 4);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    this.player.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.1);
    const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x0066ff });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, 0.3, 0);
    leftWing.castShadow = true;
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0, -0.3, 0);
    rightWing.castShadow = true;
    this.player.add(leftWing);
    this.player.add(rightWing);
    
    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    const cockpitMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0.2, 0, 0);
    cockpit.castShadow = true;
    this.player.add(cockpit);
    
    this.player.position.set(this.lanes[this.currentLane], 0.5, 0);
    this.scene.add(this.player);
  }

  createGround() {
    // Change scene background to space
    this.scene.background = new THREE.Color(0x000011);
    
    // Create animated starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400 - 200;
      
      // Random star colors
      const color = new THREE.Color();
      color.setHSL(Math.random(), 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starMaterial = new THREE.PointsMaterial({ 
      size: 2, 
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
    
    // Create subtle ground plane for reference
    const geometry = new THREE.PlaneGeometry(20, 100);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x111133,
      transparent: true,
      opacity: 0.3
    });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  setupLighting() {
    // Ambient light (darker for space atmosphere)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);
    
    // Add colored accent lights for space atmosphere
    const blueLight = new THREE.PointLight(0x0088ff, 0.5, 15);
    blueLight.position.set(-5, 3, 0);
    this.scene.add(blueLight);
    
    const redLight = new THREE.PointLight(0xff4488, 0.5, 15);
    redLight.position.set(5, 3, 0);
    this.scene.add(redLight);
    
    // Purple accent light
    const purpleLight = new THREE.PointLight(0x8844ff, 0.3, 10);
    purpleLight.position.set(0, 5, -5);
    this.scene.add(purpleLight);
  }

  setupUI() {
    // Create score display
    this.scoreElement = document.createElement('div');
    this.scoreElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      color: white;
      font-size: 24px;
      font-family: 'Inter', Arial, sans-serif;
      font-weight: 600;
      background: rgba(0, 0, 0, 0.8);
      padding: 12px 20px;
      border-radius: 12px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    `;
    this.scoreElement.textContent = 'Score: 0';
    document.body.appendChild(this.scoreElement);


  }

  setupControls() {
    document.addEventListener('keydown', (event) => {
      switch(event.key) {
        case 'ArrowLeft':
          if (this.gameRunning && this.currentLane > 0) {
            this.currentLane--;
            this.movePlayer();
          }
          break;
        case 'ArrowRight':
          if (this.gameRunning && this.currentLane < this.lanes.length - 1) {
            this.currentLane++;
            this.movePlayer();
          }
          break;
        case 'r':
        case 'R':
          this.restart();
          break;
      }
      event.preventDefault();
    });
  }

  movePlayer() {
    // Smooth movement to new lane
    const targetX = this.lanes[this.currentLane];
    this.targetX = targetX; // Store target for smooth interpolation
  }

  createObstacle() {
    const obstacleType = Math.random();
    let obstacle;
    
    if (obstacleType < 0.4) {
      // Spiky asteroid
      const geometry = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 8, 6);
      // Make it spiky by displacing vertices
      const vertices = geometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const spike = 1 + Math.random() * 0.5;
        vertices[i] *= spike;
        vertices[i + 1] *= spike;
        vertices[i + 2] *= spike;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      
      const material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
      obstacle = new THREE.Mesh(geometry, material);
    } else if (obstacleType < 0.7) {
      // Crystal formations
      obstacle = new THREE.Group();
      for (let i = 0; i < 3 + Math.random() * 3; i++) {
        const crystalGeometry = new THREE.ConeGeometry(0.1 + Math.random() * 0.2, 0.5 + Math.random() * 0.8, 6);
        const crystalMaterial = new THREE.MeshLambertMaterial({ color: 0x8844ff });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.set(
          (Math.random() - 0.5) * 0.8,
          Math.random() * 0.5,
          (Math.random() - 0.5) * 0.8
        );
        crystal.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        crystal.castShadow = true;
        obstacle.add(crystal);
      }
    } else {
      // Spinning cube clusters
      obstacle = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff8800 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        const angle = (i / 4) * Math.PI * 2;
        cube.position.set(Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3);
        cube.castShadow = true;
        obstacle.add(cube);
      }
    }
    
    // Random lane
    const randomLane = Math.floor(Math.random() * this.lanes.length);
    obstacle.position.set(this.lanes[randomLane], 0.7, -15);
    
    // Add rotation properties for animation
    obstacle.userData = {
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.1,
        y: (Math.random() - 0.5) * 0.1,
        z: (Math.random() - 0.5) * 0.1
      }
    };
    
    this.obstacles.push(obstacle);
    this.scene.add(obstacle);
  }

  updateObstacles() {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.position.z += this.gameSpeed;
      
      // Animate obstacle rotation
      if (obstacle.userData && obstacle.userData.rotationSpeed) {
        obstacle.rotation.x += obstacle.userData.rotationSpeed.x;
        obstacle.rotation.y += obstacle.userData.rotationSpeed.y;
        obstacle.rotation.z += obstacle.userData.rotationSpeed.z;
      }
      
      // Remove obstacles that are behind the camera
      if (obstacle.position.z > 10) {
        this.scene.remove(obstacle);
        this.obstacles.splice(i, 1);
      }
      
      // Check collision with player
      if (this.checkCollision(this.player, obstacle)) {
        this.gameOver();
        return; // Stop processing once game is over
      }
    }
  }

  checkCollision(obj1, obj2) {
    const distance = obj1.position.distanceTo(obj2.position);
    return distance < 0.8; // Collision threshold
  }

  updateScore() {
    if (!this.gameRunning) return;
    
    this.scoreTime += 0.016; // Roughly 60fps
    if (this.scoreTime >= 0.1) { // Update score every 0.1 seconds
      this.score += 1;
      this.scoreElement.textContent = `Score: ${this.score}`;
      this.scoreTime = 0;
    }
  }

  gameLoop() {
    if (!this.gameRunning) return;
    
    // Add floating animation to player
    this.player.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.1;
    this.player.rotation.z = Math.sin(Date.now() * 0.003) * 0.1;
    
    // Smooth player movement
    if (this.targetX !== undefined) {
      this.player.position.x += (this.targetX - this.player.position.x) * 0.15;
    }
    
    // Animate starfield
    if (this.stars) {
      this.stars.rotation.z += 0.001;
      const positions = this.stars.geometry.attributes.position.array;
      for (let i = 2; i < positions.length; i += 3) {
        positions[i] += this.gameSpeed * 0.5;
        if (positions[i] > 100) {
          positions[i] = -300;
        }
      }
      this.stars.geometry.attributes.position.needsUpdate = true;
    }
    
    // Create obstacles periodically
    if (Math.random() < 0.02) {
      this.createObstacle();
    }
    
    this.updateObstacles();
    this.updateScore();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
    
    // Continue the loop
    requestAnimationFrame(() => this.gameLoop());
  }

  gameOver() {
    this.gameRunning = false;
    
    // Show game over message
    this.gameOverDiv = document.createElement('div');
    this.gameOverDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 40px 50px;
      border-radius: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(15px);
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
      text-align: center;
      font-family: 'Inter', Arial, sans-serif;
      z-index: 2000;
    `;
    this.gameOverDiv.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 20px;">💥</div>
      <h2 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 700; color: #ff4444;">Mission Failed!</h2>
      <p style="margin: 0 0 15px 0; font-size: 20px; font-weight: 600; color: #00ff88;">Final Score: ${this.score}</p>
      <p style="margin: 0; font-size: 16px; opacity: 0.8;">Press <span style="color: #ffff00; font-weight: 600;">R</span> to restart mission</p>
    `;
    document.body.appendChild(this.gameOverDiv);
  }

  restart() {
    // Reset game state
    this.score = 0;
    this.gameRunning = true;
    this.currentLane = 1;
    this.scoreTime = 0;
    
    // Reset player position
    this.player.position.set(this.lanes[this.currentLane], 0.25, 0);
    
    // Clear obstacles
    this.obstacles.forEach(obstacle => this.scene.remove(obstacle));
    this.obstacles = [];
    
    // Remove game over screen
    if (this.gameOverDiv) {
      document.body.removeChild(this.gameOverDiv);
      this.gameOverDiv = null;
    }
    
    // Update UI
    this.scoreElement.textContent = 'Score: 0';
    
    // Restart game loop
    this.gameLoop();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Initialize the game when Three.js is available
console.log('Script loaded, checking for Three.js...');

if (typeof THREE !== 'undefined') {
  console.log('Three.js is available, version:', THREE.REVISION);
  
  try {
    const game = new InfiniteRunner();
    window.game = game; // For debugging
    console.log('Game started successfully!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    document.body.innerHTML += `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  color: red; font-size: 18px; text-align: center; 
                  background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px;">
        Game Error<br><small>${error.message}</small>
      </div>`;
  }
} else {
  console.error('Three.js is not available');
  document.body.innerHTML += `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                color: red; font-size: 18px; text-align: center; 
                background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px;">
      Three.js not loaded<br><small>Check console for details</small>
    </div>`;
}
