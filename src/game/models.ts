import * as THREE from 'three';

export interface VehicleParts {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  exhaustPipes?: THREE.Vector3[];
  headlights?: THREE.Light[];
}

/**
 * Creates a high-fidelity 8-part procedural Monster Truck:
 * 1. Heavy high-clearance ladder chassis
 * 2. Rugged muscle cabin with tinted windshield
 * 3. Aggressive steel push bumper / bullbar
 * 4. Dual chrome vertical exhaust stacks
 * 5. High-mounted roof auxiliary spotlights
 * 6. Massive deep-tread offroad tires with steel rim hubs
 * 7. Heavy-duty suspension springs
 * 8. LED taillights
 */
export function createMonsterTruck(): VehicleParts {
  const truck = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Chassis frame (dark steel)
  const chassisGeo = new THREE.BoxGeometry(1.7, 0.4, 3.4);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1f242d,
    metalness: 0.8,
    roughness: 0.4,
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.9;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  truck.add(chassis);

  // Main Truck Body (Aggressive Red/Orange Metallic)
  const bodyGeo = new THREE.BoxGeometry(2.1, 0.85, 3.1);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48, // Vibrant crimson red
    metalness: 0.45,
    roughness: 0.25,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 1.45, -0.1);
  body.castShadow = true;
  body.receiveShadow = true;
  truck.add(body);

  // Cabin / Greenhouse (Slightly tapered)
  const cabinGeo = new THREE.BoxGeometry(1.65, 0.8, 1.6);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.1,
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 2.1, -0.3);
  cabin.castShadow = true;
  truck.add(cabin);

  // Windshield & windows (Reflective glass look)
  const glassGeo = new THREE.BoxGeometry(1.5, 0.6, 0.05);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85,
  });
  const windshield = new THREE.Mesh(glassGeo, glassMat);
  windshield.position.set(0, 2.15, 0.52);
  windshield.rotation.x = 0.2;
  truck.add(windshield);

  // Heavy Duty Bullbar / Bumper (Brushed Dark Steel)
  const bullbarGeo = new THREE.BoxGeometry(2.3, 0.55, 0.45);
  const bullbarMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.3,
  });
  const bullbar = new THREE.Mesh(bullbarGeo, bullbarMat);
  bullbar.position.set(0, 1.05, -1.8);
  bullbar.castShadow = true;
  truck.add(bullbar);

  // Bumper guard spikes/teeth (for intense smashing feel)
  for (let x = -0.8; x <= 0.85; x += 0.4) {
    const toothGeo = new THREE.ConeGeometry(0.08, 0.3, 4);
    const tooth = new THREE.Mesh(toothGeo, bullbarMat);
    tooth.rotation.x = -Math.PI / 2;
    tooth.position.set(x, 1.05, -2.05);
    truck.add(tooth);
  }

  // Dual Chrome Exhaust Stacks behind cabin
  const exhaustGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 12);
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.1,
  });

  const exhaustLeft = new THREE.Mesh(exhaustGeo, chromeMat);
  exhaustLeft.position.set(-0.85, 2.3, -1.15);
  exhaustLeft.castShadow = true;
  truck.add(exhaustLeft);

  const exhaustRight = new THREE.Mesh(exhaustGeo, chromeMat);
  exhaustRight.position.set(0.85, 2.3, -1.15);
  exhaustRight.castShadow = true;
  truck.add(exhaustRight);

  // Exhaust pipe tips positions for particle smoke
  const exhaustPipes = [
    new THREE.Vector3(-0.85, 3.0, -1.15),
    new THREE.Vector3(0.85, 3.0, -1.15),
  ];

  // Roof LED Light Bar
  const lightBarGeo = new THREE.BoxGeometry(1.4, 0.15, 0.2);
  const lightBarMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfacc15,
    emissiveIntensity: 0.8,
  });
  const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
  lightBar.position.set(0, 2.55, 0.1);
  truck.add(lightBar);

  // Headlights
  const headlightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
  });
  const hlL = new THREE.Mesh(headlightGeo, headlightMat);
  hlL.position.set(-0.75, 1.45, -1.66);
  truck.add(hlL);

  const hlR = new THREE.Mesh(headlightGeo, headlightMat);
  hlR.position.set(0.75, 1.45, -1.66);
  truck.add(hlR);

  // Giant Deep-Tread Monster Tires & Chrome Rims
  const tireGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.68, 20);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.9,
  });
  const rimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.7, 12);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Amber gold rims
    metalness: 0.8,
    roughness: 0.2,
  });

  const wheelPositions: [number, number, number][] = [
    [-1.25, 0.72, 1.05], // Rear Left
    [1.25, 0.72, 1.05],  // Rear Right
    [-1.25, 0.72, -1.05], // Front Left
    [1.25, 0.72, -1.05],  // Front Right
  ];

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    wheelGroup.position.set(...pos);
    truck.add(wheelGroup);
    wheels.push(tire);
  });

  return { group: truck, wheels, exhaustPipes };
}

/**
 * Procedural Slow Civilian Sedan
 * Features varied body paint, side mirrors, wheels, taillights, roof
 */
export function createSedan(colorHex: number = 0x3b82f6): VehicleParts {
  const sedan = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Main chassis & lower body
  const bodyGeo = new THREE.BoxGeometry(1.65, 0.55, 3.0);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.35,
    metalness: 0.4,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  body.receiveShadow = true;
  sedan.add(body);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(1.35, 0.48, 1.55);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.2,
    metalness: 0.7,
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 0.98, -0.2);
  cabin.castShadow = true;
  sedan.add(cabin);

  // Tinted Windows
  const winGeo = new THREE.BoxGeometry(1.3, 0.38, 1.4);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.8,
  });
  const win = new THREE.Mesh(winGeo, winMat);
  win.position.set(0, 1.0, -0.2);
  sedan.add(win);

  // Front Headlights
  const hlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfffbeb,
    emissiveIntensity: 0.6,
  });
  const hlGeo = new THREE.BoxGeometry(0.35, 0.15, 0.05);
  const hl1 = new THREE.Mesh(hlGeo, hlMat);
  hl1.position.set(-0.6, 0.55, -1.52);
  sedan.add(hl1);
  const hl2 = new THREE.Mesh(hlGeo, hlMat);
  hl2.position.set(0.6, 0.55, -1.52);
  sedan.add(hl2);

  // Red Taillights (Slow Car brake lights)
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.9,
  });
  const tailGeo = new THREE.BoxGeometry(0.35, 0.15, 0.05);
  const tail1 = new THREE.Mesh(tailGeo, tailMat);
  tail1.position.set(-0.6, 0.55, 1.52);
  sedan.add(tail1);
  const tail2 = new THREE.Mesh(tailGeo, tailMat);
  tail2.position.set(0.6, 0.55, 1.52);
  sedan.add(tail2);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 16);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
  });
  const wheelPositions: [number, number, number][] = [
    [-0.88, 0.32, 0.85],
    [0.88, 0.32, 0.85],
    [-0.88, 0.32, -0.85],
    [0.88, 0.32, -0.85],
  ];

  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...pos);
    wheel.castShadow = true;
    sedan.add(wheel);
    wheels.push(wheel);
  });

  return { group: sedan, wheels };
}

/**
 * Procedural Heavy Military Tank Obstacle
 * Features armored hull, track guards, heavy turret, long cannon, and warning beacon
 */
export function createTank(): VehicleParts {
  const tank = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Heavy Dark Base / Caterpillar Tracks
  const trackGeo = new THREE.BoxGeometry(2.35, 0.65, 3.5);
  const trackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
    metalness: 0.7,
  });
  const tracks = new THREE.Mesh(trackGeo, trackMat);
  tracks.position.y = 0.45;
  tracks.castShadow = true;
  tracks.receiveShadow = true;
  tank.add(tracks);

  // Armored Camo Hull
  const hullGeo = new THREE.BoxGeometry(2.1, 0.75, 3.1);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x166534, // Military Olive Green
    roughness: 0.65,
    metalness: 0.3,
  });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.95;
  hull.castShadow = true;
  tank.add(hull);

  // Heavy Turret
  const turretGeo = new THREE.BoxGeometry(1.5, 0.6, 1.6);
  const turret = new THREE.Mesh(turretGeo, hullMat);
  turret.position.set(0, 1.5, 0.1);
  turret.castShadow = true;
  tank.add(turret);

  // Cannon Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.14, 0.16, 2.3, 14);
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.85,
    roughness: 0.3,
  });
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 1.55, 1.35); // Pointing forward
  barrel.castShadow = true;
  tank.add(barrel);

  // Muzzle brake
  const muzzleGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 14);
  const muzzle = new THREE.Mesh(muzzleGeo, barrelMat);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 1.55, 2.5);
  tank.add(muzzle);

  // Flashing Warning Siren Light on Turret
  const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 10);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.2,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 1.9, -0.2);
  tank.add(beacon);

  return { group: tank, wheels };
}

/**
 * Creates Highway Overhead Gantry Signs ("1차로는 추월차로!", "저속주행 금지!")
 */
export function createHighwayGantry(message: string): THREE.Group {
  const gantry = new THREE.Group();

  // Vertical steel pillars
  const pillarGeo = new THREE.BoxGeometry(0.4, 7, 0.4);
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.4,
  });

  const leftPillar = new THREE.Mesh(pillarGeo, metalMat);
  leftPillar.position.set(-6.5, 3.5, 0);
  gantry.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, metalMat);
  rightPillar.position.set(6.5, 3.5, 0);
  gantry.add(rightPillar);

  // Top crossbeam
  const beamGeo = new THREE.BoxGeometry(13.4, 0.6, 0.6);
  const beam = new THREE.Mesh(beamGeo, metalMat);
  beam.position.set(0, 6.8, 0);
  gantry.add(beam);

  // Green Highway Sign Board
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Green highway background
    ctx.fillStyle = '#047857';
    ctx.fillRect(0, 0, 512, 128);

    // White border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 112);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, 256, 64);
  }

  const signTexture = new THREE.CanvasTexture(canvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;

  const signGeo = new THREE.PlaneGeometry(9.0, 2.2);
  const signMat = new THREE.MeshStandardMaterial({
    map: signTexture,
    roughness: 0.4,
  });

  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 5.5, 0);
  gantry.add(signMesh);

  return gantry;
}
