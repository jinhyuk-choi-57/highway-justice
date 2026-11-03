import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createMonsterTruck, createSedan, createTank, VehicleParts } from './models';
import { soundManager } from '../audio/soundManager';

export interface GameCallbacks {
  onScoreUpdate: (score: number, highscore: number) => void;
  onLivesUpdate: (lives: number) => void;
  onTimeUpdate: (timeLeft: number) => void;
  onSpeedUpdate: (kmh: number) => void;
  onComboUpdate: (combo: number) => void;
  onFeedback: (message: string, isError: boolean) => void;
  onGameOver: (reason: 'TIME_UP' | 'TANK_CRASH' | 'NO_LIVES', stats: GameOverStats) => void;
}

export interface GameOverStats {
  score: number;
  maxCombo: number;
  carsCrushed: number;
  carsMissed: number;
  timeSurvived: number;
  isNewHigh: boolean;
}

export type CameraViewMode = 'CHASE' | 'HIGH' | 'HOOD';

interface ObstacleEntity {
  mesh: THREE.Group;
  wheels: THREE.Mesh[];
  lane: number;
  type: 'SEDAN' | 'TANK';
  speedOffset: number;
  isDestroyed: boolean;
}

interface ParticleEntity {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameCallbacks;

  // Three.js core
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  // Highway Meshes
  private roadMesh!: THREE.Mesh;
  private laneLines: THREE.Mesh[] = [];
  private guardRails: THREE.Mesh[] = [];
  private streetLights: THREE.Group[] = [];

  // Player
  private playerParts!: VehicleParts;
  private playerTruck!: THREE.Group;
  private currentLane: number = 1;
  private targetX: number = 0;
  private truckRollAngle: number = 0;
  private truckPitchAngle: number = 0;
  private truckYOffset: number = 0;

  // Constants
  public readonly LANES = [-3.2, 0, 3.2];
  public readonly LIVES_MAX = 3;
  public readonly GAME_DURATION = 60;

  // Game state
  private isGameActive: boolean = false;
  private isPaused: boolean = false;
  private score: number = 0;
  private highScore: number = 0;
  private lives: number = 3;
  private timeLeft: number = 60;
  private combo: number = 0;
  private maxCombo: number = 0;
  private carsCrushedCount: number = 0;
  private carsMissedCount: number = 0;
  private gameTimerInterval: ReturnType<typeof setInterval> | null = null;

  // Speed and spawning
  private baseRoadSpeed: number = 1.2;
  private spawnInterval: number = 45;
  private spawnTimer: number = 0;
  private smokeSpawnTimer: number = 0;

  // Entities
  private obstacles: ObstacleEntity[] = [];
  private particles: ParticleEntity[] = [];
  private cameraShakeIntensity: number = 0;

  // Camera settings
  private viewMode: CameraViewMode = 'CHASE';

  // Colors for Sedans (밝고 선명한 색상, 탱크의 올리브 그린 계열은 완전 제외)
  private sedanColors = [0x0ea5e9, 0xef4444, 0xfacc15, 0xf8fafc, 0x8b5cf6, 0xec4899, 0xf97316];

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.highScore = parseInt(localStorage.getItem('monster_rush_high_score') || '0', 10);

    this.checkSoftwareGl();
    this.initThree();
    this.createEnvironment();
    this.createPlayer();
    this.bindWindowEvents();
  }

  private checkSoftwareGl() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = false;
    }
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Scene setup with highway night atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.012);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.updateCameraPosition(true);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Studio Environment reflection using RoomEnvironment
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // Graceful fallback
    }

    // Balanced lighting setup: Warm Key + Cool Fill + Backlight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.5);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.0);
    keyLight.position.set(15, 25, 15);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 100;
      keyLight.shadow.camera.left = -15;
      keyLight.shadow.camera.right = 15;
      keyLight.shadow.camera.top = 25;
      keyLight.shadow.camera.bottom = -15;
      keyLight.shadow.bias = -0.0005;
    }
    this.scene.add(keyLight);
  }

  private createEnvironment() {
    // 3-lane Highway Road Surface
    const roadGeo = new THREE.PlaneGeometry(13.6, 260);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x181e29,
      roughness: 0.85,
      metalness: 0.15,
    });
    this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.roadMesh.rotation.x = -Math.PI / 2;
    this.roadMesh.position.z = -70;
    this.roadMesh.receiveShadow = true;
    this.scene.add(this.roadMesh);

    // Left and Right Grass/Gravel verge
    const vergeGeo = new THREE.PlaneGeometry(60, 260);
    const vergeMat = new THREE.MeshStandardMaterial({
      color: 0x0d141e,
      roughness: 0.95,
    });
    const vergeL = new THREE.Mesh(vergeGeo, vergeMat);
    vergeL.rotation.x = -Math.PI / 2;
    vergeL.position.set(-36, -0.01, -70);
    this.scene.add(vergeL);

    const vergeR = new THREE.Mesh(vergeGeo, vergeMat);
    vergeR.rotation.x = -Math.PI / 2;
    vergeR.position.set(36, -0.01, -70);
    this.scene.add(vergeR);

    // Dashed Lane Dividers (-1.6 and 1.6 positions)
    const lineGeo = new THREE.PlaneGeometry(0.3, 4.5);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.laneLines = [];

    for (let z = 25; z > -235; z -= 9) {
      const lineL = new THREE.Mesh(lineGeo, lineMat);
      lineL.rotation.x = -Math.PI / 2;
      lineL.position.set(-1.6, 0.02, z);
      this.scene.add(lineL);
      this.laneLines.push(lineL);

      const lineR = new THREE.Mesh(lineGeo, lineMat);
      lineR.rotation.x = -Math.PI / 2;
      lineR.position.set(1.6, 0.02, z);
      this.scene.add(lineR);
      this.laneLines.push(lineR);
    }

    // Yellow Highway Shoulder Lines
    const shoulderGeo = new THREE.PlaneGeometry(0.4, 260);
    const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderL.rotation.x = -Math.PI / 2;
    shoulderL.position.set(-5.2, 0.02, -70);
    this.scene.add(shoulderL);

    const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderR.rotation.x = -Math.PI / 2;
    shoulderR.position.set(5.2, 0.02, -70);
    this.scene.add(shoulderR);

    // Highway Guardrails
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
    });
    const railGeo = new THREE.BoxGeometry(0.2, 0.7, 260);

    const railL = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-6.2, 0.45, -70);
    this.scene.add(railL);
    this.guardRails.push(railL);

    const railR = new THREE.Mesh(railGeo, railMat);
    railR.position.set(6.2, 0.45, -70);
    this.scene.add(railR);
    this.guardRails.push(railR);

    // Street light poles along highway (placed safely off-road on the left verge)
    for (let z = 10; z > -220; z -= 35) {
      const lightPole = this.createStreetLight(-7.2, z);
      this.scene.add(lightPole);
      this.streetLights.push(lightPole);
    }
    // Overhead gantries completely removed as requested to keep the forward view 100% open and visible
  }

  private createStreetLight(x: number, z: number): THREE.Group {
    const pole = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });

    // Vertical post
    const postGeo = new THREE.CylinderGeometry(0.12, 0.16, 7, 8);
    const post = new THREE.Mesh(postGeo, mat);
    post.position.set(0, 3.5, 0);
    pole.add(post);

    // Overhang arm
    const armGeo = new THREE.BoxGeometry(2.2, 0.1, 0.1);
    const arm = new THREE.Mesh(armGeo, mat);
    arm.position.set(1.0, 7.0, 0);
    pole.add(arm);

    // Light bulb mesh
    const bulbGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(2.0, 6.9, 0);
    pole.add(bulb);

    pole.position.set(x, 0, z);
    return pole;
  }

  private createPlayer() {
    this.playerParts = createMonsterTruck();
    this.playerTruck = this.playerParts.group;
    this.playerTruck.position.set(this.LANES[this.currentLane], 0, 2);
    this.targetX = this.LANES[this.currentLane];
    this.scene.add(this.playerTruck);
  }

  private bindWindowEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onResize = () => {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.isGameActive || this.isPaused) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      this.moveLane(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      this.moveLane(1);
    } else if (e.key === 'p' || e.key === 'P') {
      this.togglePause();
    } else if (e.key === 'c' || e.key === 'C') {
      this.cycleCameraView();
    }
  };

  public moveLane(direction: number) {
    if (!this.isGameActive || this.isPaused) return;
    const nextLane = this.currentLane + direction;
    if (nextLane >= 0 && nextLane < this.LANES.length) {
      this.currentLane = nextLane;
      this.targetX = this.LANES[this.currentLane];
      // Dynamic roll tilt when changing lanes
      this.truckRollAngle = -direction * 0.18;
      soundManager.playLaneSwitch();
    }
  }

  public setViewMode(mode: CameraViewMode) {
    this.viewMode = mode;
    this.updateCameraPosition(true);
  }

  public cycleCameraView() {
    const modes: CameraViewMode[] = ['CHASE', 'HIGH', 'HOOD'];
    const nextIdx = (modes.indexOf(this.viewMode) + 1) % modes.length;
    this.setViewMode(modes[nextIdx]);
  }

  public getViewMode(): CameraViewMode {
    return this.viewMode;
  }

  private updateCameraPosition(snap: boolean = false) {
    if (!this.camera) return;

    let targetCamPos = new THREE.Vector3();
    let targetLookAt = new THREE.Vector3();

    const pX = this.playerTruck ? this.playerTruck.position.x : 0;
    const pZ = this.playerTruck ? this.playerTruck.position.z : 2;

    if (this.viewMode === 'CHASE') {
      // Dynamic follow camera with subtle lane drift
      targetCamPos.set(pX * 0.45, 5.2, pZ + 8.5);
      targetLookAt.set(pX * 0.25, 1.6, pZ - 8.0);
    } else if (this.viewMode === 'HIGH') {
      // High isometric vantage
      targetCamPos.set(0, 14.0, pZ + 12.0);
      targetLookAt.set(pX * 0.3, 0.5, pZ - 10.0);
    } else if (this.viewMode === 'HOOD') {
      // Thrilling bonnet hood view
      targetCamPos.set(pX, 2.4, pZ - 1.2);
      targetLookAt.set(pX, 2.0, pZ - 20.0);
    }

    if (this.cameraShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;
      targetCamPos.x += shakeX;
      targetCamPos.y += shakeY;
      this.cameraShakeIntensity *= 0.88;
      if (this.cameraShakeIntensity < 0.02) this.cameraShakeIntensity = 0;
    }

    if (snap) {
      this.camera.position.copy(targetCamPos);
      this.camera.lookAt(targetLookAt);
    } else {
      this.camera.position.lerp(targetCamPos, 0.12);
      this.camera.lookAt(targetLookAt);
    }
  }

  public startGame() {
    this.score = 0;
    this.lives = this.LIVES_MAX;
    this.timeLeft = this.GAME_DURATION;
    this.combo = 0;
    this.maxCombo = 0;
    this.carsCrushedCount = 0;
    this.carsMissedCount = 0;
    this.currentLane = 1;
    this.targetX = this.LANES[this.currentLane];
    this.baseRoadSpeed = 1.2;
    this.spawnInterval = 45;
    this.spawnTimer = 0;
    this.isPaused = false;

    // Clear active obstacles
    this.obstacles.forEach((obs) => {
      this.scene.remove(obs.mesh);
      this.disposeObject(obs.mesh);
    });
    this.obstacles = [];

    // Clear particles
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
      this.disposeObject(p.mesh);
    });
    this.particles = [];

    // Reset player position
    this.playerTruck.position.set(this.LANES[this.currentLane], 0, 2);
    this.playerTruck.rotation.set(0, 0, 0);
    this.truckRollAngle = 0;
    this.truckPitchAngle = 0;
    this.truckYOffset = 0;

    this.isGameActive = true;
    soundManager.unlock();
    soundManager.startEngine(1.0);

    this.callbacks.onScoreUpdate(this.score, this.highScore);
    this.callbacks.onLivesUpdate(this.lives);
    this.callbacks.onTimeUpdate(this.timeLeft);
    this.callbacks.onComboUpdate(this.combo);
    this.callbacks.onSpeedUpdate(120);

    // 60-second game timer countdown
    if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);
    this.gameTimerInterval = setInterval(() => {
      if (!this.isGameActive || this.isPaused) return;
      this.timeLeft--;
      this.callbacks.onTimeUpdate(this.timeLeft);

      if (this.timeLeft <= 0) {
        this.endGame('TIME_UP');
      }
    }, 1000);
  }

  public togglePause(): boolean {
    if (!this.isGameActive) return false;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      soundManager.stopEngine();
    } else {
      soundManager.startEngine(this.baseRoadSpeed);
    }
    return this.isPaused;
  }

  public isGamePaused(): boolean {
    return this.isPaused;
  }

  public isPlaying(): boolean {
    return this.isGameActive;
  }

  private spawnObstacle() {
    const laneIndex = Math.floor(Math.random() * 3);
    const elapsedTime = this.GAME_DURATION - this.timeLeft;

    // Dynamic tank probability scaling from 22% up to 48% at late game
    const tankProb = Math.min(0.48, 0.22 + (elapsedTime / this.GAME_DURATION) * 0.26);
    const isTank = Math.random() < tankProb;

    let parts: VehicleParts;
    if (isTank) {
      parts = createTank();
    } else {
      const color = this.sedanColors[Math.floor(Math.random() * this.sedanColors.length)];
      parts = createSedan(color);
    }

    const mesh = parts.group;
    mesh.position.set(this.LANES[laneIndex], 0, -85);
    this.scene.add(mesh);

    this.obstacles.push({
      mesh,
      wheels: parts.wheels,
      lane: laneIndex,
      type: isTank ? 'TANK' : 'SEDAN',
      speedOffset: (Math.random() - 0.5) * 0.12,
      isDestroyed: false,
    });
  }

  private createCrushDebris(pos: THREE.Vector3, isTank: boolean) {
    const count = isTank ? 72 : 34;

    // Momentary blinding nuclear / bomb flash on detonation
    const flashColor = isTank ? 0xffffff : 0xffaa00;
    const flashIntensity = isTank ? 16.0 : 5.0;
    const flashDistance = isTank ? 40 : 16;
    const flashDuration = isTank ? 320 : 160;

    const flash = new THREE.PointLight(flashColor, flashIntensity, flashDistance);
    flash.position.copy(pos);
    flash.position.y += isTank ? 2.5 : 1.2;
    this.scene.add(flash);

    const startTime = Date.now();
    const flashTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / flashDuration;
      if (elapsed >= 1.0) {
        clearInterval(flashTimer);
        this.scene.remove(flash);
      } else {
        flash.intensity = (1.0 - elapsed) * flashIntensity;
      }
    }, 16);

    // Explosive fireball, shockwave & mushroom cloud shrapnel particle system
    for (let i = 0; i < count; i++) {
      const isFireball = Math.random() < (isTank ? 0.65 : 0.45);
      const geo = isFireball
        ? new THREE.SphereGeometry(isTank ? 0.38 : 0.24, 7, 7)
        : new THREE.BoxGeometry(0.28, 0.2, 0.28);

      const fireballColors = [0xffffff, 0xffea00, 0xff4800, 0xff0000];
      const selectedColor = isFireball
        ? fireballColors[Math.floor(Math.random() * fireballColors.length)]
        : (isTank ? 0x1f2937 : 0x3b82f6);

      const mat = new THREE.MeshStandardMaterial({
        color: selectedColor,
        emissive: isFireball ? selectedColor : (isTank ? 0x991b1b : 0x1d4ed8),
        emissiveIntensity: isFireball ? (isTank ? 2.5 : 1.5) : 0.4,
        metalness: 0.8,
        roughness: 0.2,
      });

      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      p.position.y += isTank ? 0.6 : 0.45;
      p.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      const angle = Math.random() * Math.PI * 2;
      const blastRadius = isTank
        ? (Math.random() * 1.4 + 0.4)
        : (isFireball ? (Math.random() * 0.65 + 0.25) : (Math.random() * 0.95 + 0.35));

      // Upward mushroom cloud expansion for tanks
      const upwardVel = isTank
        ? (Math.random() * 0.95 + 0.5)
        : (Math.random() * 0.6 + 0.35);

      const vel = new THREE.Vector3(
        Math.cos(angle) * blastRadius,
        upwardVel,
        Math.sin(angle) * blastRadius + (isTank ? 0 : 0.28)
      );

      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: vel,
        life: isTank ? 55 : 42,
        maxLife: isTank ? 55 : 42,
      });
    }
  }

  private emitExhaustSmoke() {
    if (!this.playerParts.exhaustPipes) return;
    this.playerParts.exhaustPipes.forEach((pipePos) => {
      const geo = new THREE.SphereGeometry(0.12, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x475569,
        transparent: true,
        opacity: 0.5,
      });
      const p = new THREE.Mesh(geo, mat);
      // Transform local exhaust tip to world position
      p.position.copy(pipePos);
      p.position.add(this.playerTruck.position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        0.05 + Math.random() * 0.05,
        0.2 + Math.random() * 0.1
      );

      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: vel,
        life: 18,
        maxLife: 18,
      });
    });
  }

  private endGame(reason: 'TIME_UP' | 'TANK_CRASH' | 'NO_LIVES') {
    this.isGameActive = false;
    soundManager.stopEngine();
    if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);

    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
      localStorage.setItem('monster_rush_high_score', this.highScore.toString());
    }

    if (reason === 'TIME_UP') {
      soundManager.playVictory();
    }

    const stats: GameOverStats = {
      score: this.score,
      maxCombo: this.maxCombo,
      carsCrushed: this.carsCrushedCount,
      carsMissed: this.carsMissedCount,
      timeSurvived: this.GAME_DURATION - this.timeLeft,
      isNewHigh,
    };

    this.callbacks.onGameOver(reason, stats);
  }

  public animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.isGameActive && !this.isPaused) {
      const elapsedTime = this.GAME_DURATION - this.timeLeft;

      // 초기속도 1.2부터 60초까지 최종속도 1.5까지 선형적(Linear) 증가
      const clampedElapsed = Math.min(this.GAME_DURATION, Math.max(0, elapsedTime));
      this.baseRoadSpeed = 1.2 + (clampedElapsed / this.GAME_DURATION) * 0.3;

      // Dynamic Speedometer KM/H update
      const currentKmh = Math.round(100 * this.baseRoadSpeed);
      this.callbacks.onSpeedUpdate(currentKmh);
      soundManager.updateEnginePitch(this.baseRoadSpeed);

      // Progressive spawn intervals: faster spawns as timer runs down
      const cappedElapsed = Math.min(50, elapsedTime);
      this.spawnInterval = Math.max(16, 45 - Math.floor(cappedElapsed * 0.58));

      // Player Lane Interpolation (Swift & agile 0.4 damping)
      this.playerTruck.position.x += (this.targetX - this.playerTruck.position.x) * 0.38;

      // Suspension bounce & roll decay
      this.truckRollAngle *= 0.85;
      this.truckPitchAngle *= 0.88;
      this.truckYOffset *= 0.82;

      this.playerTruck.rotation.z = this.truckRollAngle;
      this.playerTruck.rotation.x = this.truckPitchAngle;
      this.playerTruck.position.y = this.truckYOffset;

      // Spin Monster Truck monster tires
      this.playerParts.wheels.forEach((w) => {
        w.rotation.x -= this.baseRoadSpeed * 0.35;
      });

      // Emit truck exhaust smoke periodically
      this.smokeSpawnTimer++;
      if (this.smokeSpawnTimer > 4) {
        this.emitExhaustSmoke();
        this.smokeSpawnTimer = 0;
      }

      // Move Highway Lane Dashes
      this.laneLines.forEach((line) => {
        line.position.z += this.baseRoadSpeed;
        if (line.position.z > 25) {
          line.position.z -= 250;
        }
      });

      // Move Street Light Poles
      this.streetLights.forEach((pole) => {
        pole.position.z += this.baseRoadSpeed;
        if (pole.position.z > 25) {
          pole.position.z -= 245;
        }
      });

      // Spawn Obstacles
      this.spawnTimer++;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnObstacle();
        this.spawnTimer = 0;
      }

      // Process Active Traffic & Collisions
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.mesh.position.z += this.baseRoadSpeed + obs.speedOffset;

        // Spin civilian car wheels
        obs.wheels.forEach((w) => {
          w.rotation.x -= 0.35;
        });

        // Collision check
        const distZ = Math.abs(obs.mesh.position.z - this.playerTruck.position.z);
        const distX = Math.abs(obs.mesh.position.x - this.playerTruck.position.x);

        if (!obs.isDestroyed && distZ < 2.2 && distX < 1.45) {
          if (obs.type === 'SEDAN') {
            obs.isDestroyed = true;
            this.score++;
            this.carsCrushedCount++;
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            // Explosive bomb impact camera shake & suspension hop
            this.cameraShakeIntensity = 0.62;
            this.truckPitchAngle = -0.22;
            this.truckYOffset = 0.48;

            // Trigger massive bomb explosion blast sound
            soundManager.playCrush();
            if (this.combo > 1) {
              soundManager.playCombo(this.combo);
            }

            this.createCrushDebris(obs.mesh.position, false);

            const comboLabels = ['', '', '2연속 참교육! 🔥', '3연속 도로청소! ⚡', '4연속 분노의 질주! 🌪️', '몬스터 피버 무쌍! 👑'];
            const feedbackMsg = comboLabels[Math.min(this.combo, comboLabels.length - 1)] || `참교육 ${this.combo}콤보! 💥`;
            this.callbacks.onFeedback(feedbackMsg, false);
            this.callbacks.onScoreUpdate(this.score, this.highScore);
            this.callbacks.onComboUpdate(this.combo);

            this.scene.remove(obs.mesh);
            this.disposeObject(obs.mesh);
            this.obstacles.splice(i, 1);
            continue;
          } else if (obs.type === 'TANK') {
            // Apocalyptic Thermonuclear Detonation on Tank Collision
            this.cameraShakeIntensity = 1.35;
            this.truckPitchAngle = -0.38;
            this.truckYOffset = 0.85;
            soundManager.playTankCrash();
            this.createCrushDebris(this.playerTruck.position, true);
            this.endGame('TANK_CRASH');
            break;
          }
        }

        // Missed Slow Sedan Check (escaped past z > 12)
        if (obs.mesh.position.z > 14) {
          if (!obs.isDestroyed && obs.type === 'SEDAN') {
            this.lives--;
            this.combo = 0; // Combo breaks on miss
            this.cameraShakeIntensity = 0.2;
            soundManager.playMissedCar();

            this.callbacks.onLivesUpdate(this.lives);
            this.callbacks.onComboUpdate(this.combo);
            this.callbacks.onFeedback('저속 승용차 놓침! (하트 -1)', true);

            this.carsMissedCount++;

            if (this.lives <= 0) {
              this.endGame('NO_LIVES');
              break;
            }
          }

          this.scene.remove(obs.mesh);
          this.disposeObject(obs.mesh);
          this.obstacles.splice(i, 1);
        }
      }

      // Update Particles (Smoke & Debris)
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.mesh.position.add(p.velocity);
        p.mesh.scale.multiplyScalar(0.94);
        p.life--;

        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.disposeObject(p.mesh);
          this.particles.splice(i, 1);
        }
      }
    }

    // Camera update
    this.updateCameraPosition();

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  };

  private disposeObject(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);
    soundManager.stopEngine();

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);

    // Dispose all scene objects
    this.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
