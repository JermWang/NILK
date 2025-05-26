"use client"

import React, { useState, useRef, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Canvas, useFrame, RootState } from "@react-three/fiber"
import { OrbitControls, Environment, Text, useGLTF, useTexture } from "@react-three/drei"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAccount, useBalance } from 'wagmi'
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Zap,
  Sparkles,
  Gift,
  Plus,
  Star,
  Cog,
  Tractor,
  Factory,
  XCircle,
  Loader2,
  Atom,
  CheckCircle2,
  Combine,
  Home,
  ShoppingCart
} from "lucide-react"
import * as THREE from "three"
import { RepeatWrapping } from "three"
import useGameStore, { useGameActions, COW_STATS } from "../store/useGameStore"
import type { GameActions, Cow as StoreCow, CowTier } from "../store/useGameStore"
import Image from 'next/image'

// Define UpgradeItem interface earlier
interface UpgradeItem {
  name: string;
  cost: number; 
  description: string;
  image: string;
  id: string;
  tier?: CowTier;
  currency?: '$NILK' | 'Raw Nilk'; // Added currency type
}

// GLTF Model paths - These become fallbacks or defaults if not specified by tier
const DEFAULT_COW_MODEL_PATH = "/MODELS/COW.glb";
const MACHINE_PRO_MODEL_PATH = "/MODELS/nilk machine PRO.glb"
const MACHINE_MODEL_PATH = "/MODELS/nilk machine.glb"
const GRASS_COLOR_TEXTURE_PATH = "/textures/grass/Grass008_1K-JPG_Color.jpg"
const GRASS_NORMAL_TEXTURE_PATH = "/textures/grass/Grass008_1K-JPG_NormalGL.jpg"
const GRASS_ROUGHNESS_TEXTURE_PATH = "/textures/grass/Grass008_1K-JPG_Roughness.jpg"
const GRASS_AO_TEXTURE_PATH = "/textures/grass/Grass008_1K-JPG_AmbientOcclusion.jpg"

// Generic GLTF Model Loader Component
function LoadedGLTFModel({ modelPath, ...props }: { modelPath: string;[key: string]: any }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const clonedScene = scene.clone(); 

  // Optional: Add a simple animation or effect if needed
  // useFrame((state) => {
  //   if (group.current) {
  //     // group.current.rotation.y += 0.005;
  //   }
  // });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Real Cow Component with Waddle Animation & Roaming AI
function RealCow({
  initialPosition,
  initialRotation,
  scale,
  farmBoundary,
  modelPath, // Added modelPath prop
}: {
  initialPosition?: [number, number, number];
  initialRotation?: [number, number, number];
  scale?: number | [number, number, number];
  farmBoundary: number; // Half the side length of the farm
  modelPath: string; // Added modelPath prop
  [key: string]: any;
}) {
  const group = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(modelPath || DEFAULT_COW_MODEL_PATH);
  const clonedScene = scene.clone();

  const randomAnimOffset = useRef(Math.random() * Math.PI * 2);
  
  // AI State
  const movementState = useRef<'wandering' | 'turning' | 'turningFromBoundary'>('wandering');
  const timeUntilNextAction = useRef(Math.random() * 5 + 3); // Wander for 3-8 seconds initially
  const targetRotationY = useRef((initialRotation ? initialRotation[1] : 0) + (Math.random() - 0.5) * Math.PI); // Initial target rotation
  const baseForwardSpeed = 0.3 + Math.random() * 0.2; // Units per second
  const baseTurnSpeed = Math.PI * 0.5; // Radians per second for turning state

  const actualGroundY = initialPosition ? initialPosition[1] : 0;

  useFrame((state, delta) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime + randomAnimOffset.current;
    timeUntilNextAction.current -= delta;

    let currentForwardSpeed = baseForwardSpeed * delta;

    // Boundary checks
    const pos = group.current.position;
    const boundaryLimit = farmBoundary - 0.5; 
    const newBoundaryPadding = 2.5; // Increased from 1.5
    let isNearBoundary = false;

    if (pos.x > boundaryLimit - newBoundaryPadding || pos.x < -boundaryLimit + newBoundaryPadding || 
        pos.z > boundaryLimit - newBoundaryPadding || pos.z < -boundaryLimit + newBoundaryPadding) {
      isNearBoundary = true;
    }

    if (isNearBoundary && movementState.current !== 'turningFromBoundary') {
      movementState.current = 'turningFromBoundary';
      timeUntilNextAction.current = 1.8 + Math.random() * 1.2; // Slightly longer turn: 1.8-3.0 seconds
      
      let turnAngle = group.current.rotation.y + Math.PI; // Default: 180 degree turn

      // Determine a more direct turn away from the boundary
      const toCenter = new THREE.Vector3(-pos.x, 0, -pos.z).normalize();
      const currentDir = new THREE.Vector3();
      group.current.getWorldDirection(currentDir);

      // If moving somewhat towards boundary, turn more towards center
      // If already moving away, less drastic turn might be okay (or even prefer current target)
      if (currentDir.dot(toCenter) < 0.5) { // If not generally heading towards center
         targetRotationY.current = Math.atan2(toCenter.x, toCenter.z) + (Math.random() - 0.5) * Math.PI * 0.3; // Sharper turn to center + some noise
      } else {
        // If already somewhat facing center, just add a bit more turn to avoid getting stuck in a loop
        targetRotationY.current = group.current.rotation.y + Math.PI * (0.5 + Math.random() * 0.5); 
      }
      
      currentForwardSpeed = baseForwardSpeed * delta * 0.03; // Even slower when hitting boundary
    }

    // Force reposition if truly outside limits (emergency measure)
    const emergencyNudgeFactor = 0.25; // Increased from 0.1
    if (pos.x > boundaryLimit) pos.x = boundaryLimit - emergencyNudgeFactor;
    if (pos.x < -boundaryLimit) pos.x = -boundaryLimit + emergencyNudgeFactor;
    if (pos.z > boundaryLimit) pos.z = boundaryLimit - emergencyNudgeFactor;
    if (pos.z < -boundaryLimit) pos.z = -boundaryLimit + emergencyNudgeFactor;
    

    // State-based movement
    if (movementState.current === 'wandering') {
      if (timeUntilNextAction.current <= 0) {
        movementState.current = 'turning';
        timeUntilNextAction.current = Math.random() * 2 + 1; 
        targetRotationY.current = group.current.rotation.y + (Math.random() - 0.5) * Math.PI * 1.5; 
      }
    } else if (movementState.current === 'turning' || movementState.current === 'turningFromBoundary') {
      const turnRate = (movementState.current === 'turningFromBoundary' ? baseTurnSpeed * 1.7 : baseTurnSpeed) * delta; // Turn even faster from boundary
      const yDiff = THREE.MathUtils.lerp(group.current.rotation.y, targetRotationY.current, turnRate) - group.current.rotation.y;
      group.current.rotation.y += yDiff;
      currentForwardSpeed *= (movementState.current === 'turningFromBoundary' ? 0.05 : 0.3); 

      if (timeUntilNextAction.current <= 0 || Math.abs(THREE.MathUtils.radToDeg(targetRotationY.current - group.current.rotation.y)) < 5) { // Stricter angle check
        movementState.current = 'wandering';
        timeUntilNextAction.current = Math.random() * 5 + 5; 
      }
    }

    // Apply waddle and bounce
    group.current.rotation.z = Math.sin(t * 3.5) * 0.20; 
    group.current.position.y = actualGroundY + Math.abs(Math.sin(t * 4)) * 0.15;

    // Apply forward movement
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(group.current.quaternion);
    group.current.position.add(forward.multiplyScalar(currentForwardSpeed));

  });

  return (
    <group ref={group} position={initialPosition} rotation={initialRotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Materials
const woodMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  color: '#8B4513',
  roughness: 0.8,
  metalness: 0.1,
});
const rockMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  color: '#808080',
  roughness: 0.9,
  metalness: 0.2,
});
const trunkMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  color: '#A0522D',
  roughness: 0.9,
  metalness: 0.1,
});
const foliageMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  color: '#228B22',
  roughness: 0.8,
  metalness: 0.1,
});

interface FenceSegmentProps {
  length: number;
  height?: number;
  postInterval?: number;
  postWidth?: number;
  numRails?: number;
  railHeight?: number;
}

function FenceSegment({
  length,
  height = 1.2,      
  postInterval = 2.5,
  postWidth = 0.15,
  numRails = 2,
  railHeight = 0.1,
}: FenceSegmentProps) {
  const posts = [];
  const numPosts = Math.ceil(length / postInterval) + 1;
  const actualPostInterval = length / (numPosts - 1); 

  for (let i = 0; i < numPosts; i++) {
    const x = -length / 2 + i * actualPostInterval;
    posts.push(
      <mesh
        key={`post-${i}`}
        material={woodMaterial as any}
        position={[x, height / 2, 0]} 
        castShadow
      >
        <boxGeometry args={[postWidth, height, postWidth]} />
      </mesh>
    );
  }

  const rails = [];
  for (let i = 0; i < numRails; i++) {
    const railCenterYFromBase = ((i + 1) * height) / (numRails + 1);
    rails.push(
      <mesh
        key={`rail-${i}`}
        material={woodMaterial as any}
        position={[0, railCenterYFromBase, postWidth / 2]}
        castShadow
      >
        <boxGeometry args={[length, railHeight, postWidth * 0.5]} />
      </mesh>
    );
  }

  return (
    <group>
      {posts}
      {rails}
    </group>
  );
}

// Placeholder Rock Component
function Rock(props: React.ComponentPropsWithoutRef<'group'>) {
  return (
    <group {...props}>
      <mesh material={rockMaterial as any} castShadow receiveShadow>
        <icosahedronGeometry args={[0.5, 0]} /> 
      </mesh>
    </group>
  );
}

// Enhanced Tree Component
function Tree(props: React.ComponentPropsWithoutRef<'group'>) {
  const baseTreeHeight = 4.0; // Increased from 2.5, made taller
  const trunkHeightRatio = 0.4; // Trunk is 40% of total height
  const foliageHeightRatio = 0.6; // Foliage is 60% of total height

  const trunkActualHeight = baseTreeHeight * trunkHeightRatio;
  const foliageActualHeight = baseTreeHeight * foliageHeightRatio;

  const trunkBottomRadius = 0.25; // Wider base for the trunk
  const trunkTopRadius = 0.18;   // Tapered trunk - narrower at the top
  const foliageBottomRadius = 1.1; // Wider foliage base for a taller tree

  return (
    <group {...props}>
      {/* Trunk */}
      <mesh 
        material={trunkMaterial as any}
        position={[0, trunkActualHeight / 2, 0]} // Positioned so base is at groundY
        castShadow 
        receiveShadow
      >
        <cylinderGeometry args={[trunkTopRadius, trunkBottomRadius, trunkActualHeight, 12]} />
      </mesh>
      {/* Foliage */}
      <mesh 
        material={foliageMaterial as any}
        position={[0, trunkActualHeight + foliageActualHeight / 2, 0]} // Positioned on top of the trunk
        castShadow 
        receiveShadow
      >
        <coneGeometry args={[foliageBottomRadius, foliageActualHeight, 16]} />
      </mesh>
    </group>
  );
}

// Define 3D data structure for cows
interface Cow3DData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

const SCENE_GROUND_Y = -0.5;
const COW_SCALE_MULTIPLIER = 6; // Default multiplier

// Predefined spawn points for new cows - ADJUSTED TO AVOID SCENERY
const cowSpawnPoints: Cow3DData[] = [
  { position: [-6, SCENE_GROUND_Y + (0.5 * (0.5 * COW_SCALE_MULTIPLIER)), 6], rotation: [0, 0, 0], scale: 0.5 * COW_SCALE_MULTIPLIER }, // Was [-5,_,5], conflicted with a rock
  { position: [5, SCENE_GROUND_Y + (0.5 * (0.4 * COW_SCALE_MULTIPLIER)), -5], rotation: [0, Math.PI / 2, 0], scale: 0.4 * COW_SCALE_MULTIPLIER },
  { position: [0, SCENE_GROUND_Y + (0.5 * (0.6 * COW_SCALE_MULTIPLIER)), 0], rotation: [0, Math.PI, 0], scale: 0.6 * COW_SCALE_MULTIPLIER },
  { position: [9, SCENE_GROUND_Y + (0.5 * (0.5 * COW_SCALE_MULTIPLIER)), 9], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.5 * COW_SCALE_MULTIPLIER }, // Was [8,_,8], close to rock/tree
  { position: [-9, SCENE_GROUND_Y + (0.5 * (0.5 * COW_SCALE_MULTIPLIER)), -9], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.5 * COW_SCALE_MULTIPLIER }, // Was [-8,_, -8], close to tree
  { position: [10, SCENE_GROUND_Y + (0.5 * (0.5 * COW_SCALE_MULTIPLIER)), -2], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.5 * COW_SCALE_MULTIPLIER },
  { position: [-2, SCENE_GROUND_Y + (0.5 * (0.5 * COW_SCALE_MULTIPLIER)), 10], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.5 * COW_SCALE_MULTIPLIER },
];

// 3D Farm Scene - Modified to use cowList from parent state
function FarmScene({ cowList, farmBoundary }: { cowList: CowListItem[]; farmBoundary: number }) {
  const textures = useTexture([
    GRASS_COLOR_TEXTURE_PATH,
    GRASS_NORMAL_TEXTURE_PATH,
    GRASS_ROUGHNESS_TEXTURE_PATH,
    GRASS_AO_TEXTURE_PATH
  ]);

  const colorMap = textures[0];
  const normalMap = textures[1];
  const roughnessMap = textures[2];
  const aoMap = textures[3];

  const originalSideLength = 50;
  const newSideLength = originalSideLength * Math.sqrt(3 / 4);
  const textureRepeatsPerUnit = 10 / originalSideLength; 
  const newTextureRepeat = newSideLength * textureRepeatsPerUnit; 
  
  const edgePadding = 3; 
  const newMachineZ = (newSideLength / 2) - edgePadding;

  textures.forEach(texture => {
    if (texture) { 
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(newTextureRepeat, newTextureRepeat); 
      texture.anisotropy = 16; 
    }
  });

  const groundY = SCENE_GROUND_Y; 
  const halfNewSide = (originalSideLength * Math.sqrt(3 / 4)) / 2;
  const fenceHeight = 1.0; 
  const groundThickness = 0.5; // Added ground thickness

  return (
    <>
      {/* Environment preset="sunset" /> */ /* This line should be removed or stay commented */}
      {/* <ambientLight intensity={0.6} /> */ /* Removed: Defined globally in Canvas */}
      {/* <directionalLight 
        position={[5, 10, 7]} 
        intensity={1.5} 
        color="#ffedd5" 
        castShadow 
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      /> */ /* Removed: Defined globally in Canvas */}
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#a78bfa" />

      <mesh position={[0, groundY - groundThickness / 2, 0]} receiveShadow>
        <boxGeometry args={[newSideLength, groundThickness, newSideLength]} /> 
        <meshStandardMaterial 
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          aoMap={aoMap}
          metalness={0.05}
          roughness={0.9}
        />
      </mesh>

      {/* Orange box for testing, can be removed if ground plane shows */}
      {/* <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="orange" />
      </mesh> */}

      {/* Fences */}
      <group position={[0, groundY, halfNewSide]}>
        <FenceSegment length={newSideLength} height={fenceHeight} />
      </group>
      <group position={[0, groundY, -halfNewSide]} rotation={[0, Math.PI, 0]}>
        <FenceSegment length={newSideLength} height={fenceHeight} />
      </group>
      <group position={[halfNewSide, groundY, 0]} rotation={[0, -Math.PI / 2, 0]}> 
        <FenceSegment length={newSideLength} height={fenceHeight} />
      </group>
      <group position={[-halfNewSide, groundY, 0]} rotation={[0, Math.PI / 2, 0]}> 
        <FenceSegment length={newSideLength} height={fenceHeight} />
      </group>

      {/* Real Cows from cowList state */}
      <Suspense fallback={null}>
        {cowList.map(cow => (
          cow.threeD && (
            <RealCow 
              key={cow.id} 
              initialPosition={cow.threeD.position}
              initialRotation={cow.threeD.rotation}
              scale={cow.threeD.scale}
              farmBoundary={halfNewSide}
              modelPath={cow.modelPath}
            />
          )
        ))}
        
        <LoadedGLTFModel 
          modelPath={MACHINE_PRO_MODEL_PATH} 
          position={[-4, groundY + (0.5 * 4), newMachineZ]} 
          scale={4} 
          rotation={[0, Math.PI / 2, 0]} 
        />
        <LoadedGLTFModel 
          modelPath={MACHINE_MODEL_PATH} 
          position={[4, groundY + (0.5 * 3.5), newMachineZ]} 
          scale={3.5} 
          rotation={[0, Math.PI / 2, 0]} 
        />

        <Rock position={[-5, groundY, 5]} scale={1.5} />
        <Rock position={[-7, groundY, -2]} scale={1.2} rotation={[0, 0.5, 0]} />
        <Rock position={[6, groundY, 8]} scale={1.8} rotation={[0, 1.2, 0.2]} />
        <Rock position={[-12, groundY, 10]} scale={1.3} rotation={[0, Math.PI / 7, 0.1]} />
        <Rock position={[10, groundY, -10]} scale={1.6} rotation={[0, -Math.PI / 5, -0.15]} />
        <Rock position={[15, groundY, 15]} scale={1.1} rotation={[0, Math.PI / 3, 0]} />

        <Tree position={[8, groundY, 0]} scale={1.3} />
        <Tree position={[-9, groundY, -5]} scale={1.1} rotation={[0, Math.PI / 3, 0]} />
        <Tree position={[6, groundY, 5]} scale={1.5} rotation={[0, -Math.PI / 5, 0]} />
        <Tree position={[-4, groundY, 5]} scale={1.2} />
        <Tree position={[14, groundY, 10]} scale={1.4} rotation={[0, Math.PI / 9, 0]} />
        <Tree position={[-15, groundY, -8]} scale={1.25} rotation={[0, -Math.PI / 6, 0]} />
        <Tree position={[2, groundY, -15]} scale={1.35} rotation={[0, Math.PI / 2, 0]} />
      </Suspense>
    </>
  )
}

// Define Cow List Item type including 3D data and modelPath
interface CowListItem {
  id: string;
  name: string;
  image: string;
  rarity: string;
  level: number;
  tier: CowTier;
  rawNilkPerDay: number;
  lastHarvestTime: number;
  harvestCooldownHours: number;
  modelPath: string; // Added modelPath
  threeD?: Cow3DData;
}

// Sound Playback Utility
const playSound = (soundFile: string) => {
  try {
    const audio = new Audio(soundFile);
    audio.play().catch(error => console.error("Error playing sound:", error));
  } catch (error) {
    console.error("Could not play sound:", error);
  }
};

const MAX_COW_LEVEL = 10;

interface GameStateFromStore {
  userNilkBalance: number;
  userRawNilkBalance: number;
  // Add other state properties if you select them directly
}

export default function NilkFarm3D() {
  const { isConnected, address } = useAccount()
  const { data: nativeBalance } = useBalance({ address })
  const pathname = usePathname()

  const userNilkBalance = useGameStore((state) => state.userNilkBalance)
  const userRawNilkBalance = useGameStore((state) => state.userRawNilkBalance)
  const ownedCowsFromStore = useGameStore((state) => state.ownedCows)
  const yieldBoosterLevelFromStore = useGameStore((state) => state.yieldBoosterLevel)
  const gameActions = useGameActions() as GameActions;

  const [displayCowList, setDisplayCowList] = useState<CowListItem[]>([])
  const [nextSpawnPointIndex, setNextSpawnPointIndex] = useState(0)

  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false)
  const [isMainMarketModalOpen, setIsMainMarketModalOpen] = useState(false)
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeItem | null>(null)
  
  const [isCowFusionModalOpen, setIsCowFusionModalOpen] = useState(false)
  const [selectedCowsForFusion, setSelectedCowsForFusion] = useState<string[]>([])

  const sparkleContainerRef = useRef<HTMLDivElement>(null)
  const [showSparkleEffect, setShowSparkleEffect] = useState(false)
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null)

  const [isLoadingNilkBalance, setIsLoadingNilkBalance] = useState(true)
  const [isLoadingRawNilkBalance, setIsLoadingRawNilkBalance] = useState(true)

  useEffect(() => {
    if (userNilkBalance !== undefined && userNilkBalance !== null) {
      setIsLoadingNilkBalance(false);
    }
    if (userRawNilkBalance !== undefined && userRawNilkBalance !== null) {
      setIsLoadingRawNilkBalance(false);
    }
  }, [userNilkBalance, userRawNilkBalance]);

  useEffect(() => {
    let updatedNextSpawnIndex = nextSpawnPointIndex;

    const newDisplayCows = ownedCowsFromStore.map((storeCow) => {
      const existingDisplayCow = displayCowList.find(dc => dc.id === storeCow.id);
      let threeDData = existingDisplayCow?.threeD;

      if (!threeDData) { 
        if (updatedNextSpawnIndex < cowSpawnPoints.length) {
          threeDData = cowSpawnPoints[updatedNextSpawnIndex];
          updatedNextSpawnIndex++; 
        } else {
          console.warn(`No more spawn points available. Cow ${storeCow.id} will not be displayed in 3D.`);
        }
      }
      
      const cowStat = COW_STATS[storeCow.tier];
      return {
        id: storeCow.id,
        name: storeCow.name,
        image: storeCow.imageUrl || cowStat?.imageUrl || "/NILK COW.png",
        rarity: cowStat?.name || storeCow.tier.charAt(0).toUpperCase() + storeCow.tier.slice(1),
        level: storeCow.level,
        tier: storeCow.tier,
        rawNilkPerDay: storeCow.currentRawNilkPerDay,
        lastHarvestTime: storeCow.lastHarvestTime,
        harvestCooldownHours: 6,
        modelPath: cowStat?.modelPath || DEFAULT_COW_MODEL_PATH,
        threeD: threeDData,
      };
    });

    setDisplayCowList(newDisplayCows);
    if (updatedNextSpawnIndex !== nextSpawnPointIndex) {
        setNextSpawnPointIndex(updatedNextSpawnIndex);
    }
  }, [ownedCowsFromStore, nextSpawnPointIndex]);

  const getHarvestStatus = (cow: CowListItem) => {
    const storeCow = ownedCowsFromStore.find(sc => sc.id === cow.id);
    if (!storeCow) return { canHarvest: false, timeRemaining: "Error", rawNilkToClaim: 0 };

    const cooldownMilliseconds = cow.harvestCooldownHours * 60 * 60 * 1000;
    const timeSinceLastHarvest = Date.now() - storeCow.lastHarvestTime;
    const canHarvest = timeSinceLastHarvest >= cooldownMilliseconds;
    
    let timeRemaining = "Ready!";
    if (!canHarvest) {
      const timeLeft = cooldownMilliseconds - timeSinceLastHarvest;
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      timeRemaining = `${hours}h ${minutes}m`;
    }
    const rawNilkToClaim = cow.rawNilkPerDay; 
    return { canHarvest, timeRemaining, rawNilkToClaim };
  };

  const handleHarvest = (cowId?: string) => {
    if (!isConnected) { console.log("Please connect wallet"); return; }
    if (cowId) {
      console.log(`[UI Harvest Intent] Harvest cow: ${cowId}`);
      gameActions.harvestRawNilkFromCow(cowId);
    } else {
      console.log(`[UI Harvest Intent] Harvest all cows`);
      gameActions.harvestAllRawNilk();
    }
    playSound("/sounds/sparkles.mp3"); // Play sparkles for any harvest action
  };

  const upgrades: UpgradeItem[] = [
    {
      name: COW_STATS.common.name,
      cost: COW_STATS.common.directPurchaseCost,
      description: `Acquire a foundational ${COW_STATS.common.name}. Produces ${COW_STATS.common.rawNilkPerDayBase} Raw Nilk/day (base).`,
      image: COW_STATS.common.imageUrl || "/NILK COW.png",
      id: "buy_cow_common",
      tier: 'common'
    },
    {
      name: COW_STATS.cosmic.name,
      cost: COW_STATS.cosmic.directPurchaseCost,
      description: `Purchase a ${COW_STATS.cosmic.name} directly. Produces ${COW_STATS.cosmic.rawNilkPerDayBase} Raw Nilk/day (base).`,
      image: COW_STATS.cosmic.imageUrl || "/cosmic cow.png",
      id: "buy_cow_cosmic",
      tier: 'cosmic'
    },
    {
      name: COW_STATS.galactic_moo_moo.name,
      cost: COW_STATS.galactic_moo_moo.directPurchaseCost,
      description: `Instantly add a top-tier ${COW_STATS.galactic_moo_moo.name}. Produces ${COW_STATS.galactic_moo_moo.rawNilkPerDayBase} Raw Nilk/day (base).`,
      image: COW_STATS.galactic_moo_moo.imageUrl || "/galactic moo moo.png",
      id: "buy_cow_galactic_moo_moo",
      tier: 'galactic_moo_moo'
    },
    {
      name: "Yield Booster",
      cost: (() => {
        let calculatedCost = 12000;
        if (yieldBoosterLevelFromStore > 0) {
          calculatedCost = 12000 * Math.pow(1.4, yieldBoosterLevelFromStore);
        }
        return Math.floor(calculatedCost);
      })(),
      description: `Boost all cows' Raw Nilk production by 10% per level (compounding). Current Lvl: ${yieldBoosterLevelFromStore}.`,
      image: "/gallonjug.png",
      id: "yield_booster"
    },
    {
      name: "Cow Evolution",
      cost: 0,
      description: `Evolve a cow for a 15% (compounding) Raw Nilk yield increase per level. Cost varies by tier and current level.`,
      image: "/nilk machine PRO.png", 
      id: "cow_evolution"
    },
    {
      name: "Manual Nilk Processor",
      cost: 500, // Example cost, can be adjusted
      currency: 'Raw Nilk',
      description: "A basic machine to process Raw Nilk into $NILK. Essential for converting your raw resources.",
      image: "/manual processing.png",
      id: "manual_processor"
    },
    {
      name: "MOOFI Supporter Badge",
      cost: 1000000,
      currency: '$NILK',
      description: "Show your elite support! Grants a permanent 5% boost to all Raw Nilk to $NILK conversion efficiency.",
      image: "/MOOFI badge.png",
      id: "moofi_badge"
    },
  ];

  const farmActions = [
    {
      name: "Cow Fusion Chamber",
      description: "Combine cows to discover new and more powerful tiers.",
      icon: Atom,
      action: () => setIsCowFusionModalOpen(true),
      id: "cow_fusion_chamber",
      disabled: displayCowList.length < 2
    }
  ]

  const handleInitiatePurchase = (upgradeId: string) => {
    const upgradeToPurchase = upgrades.find(u => u.id === upgradeId);
    if (!isConnected) { console.log("Please connect wallet"); return; }
    if (!upgradeToPurchase) { console.log("Upgrade not found"); return; }

    if (upgradeId === "cow_evolution") {
      const evolvableCow = displayCowList.find(cow => cow.level < MAX_COW_LEVEL);
      if (!evolvableCow) {
        console.log("[Purchase] No cows eligible for evolution.");
        return;
      }
    }
    setSelectedUpgrade(upgradeToPurchase);
    setIsMarketModalOpen(true);
  };

  const handleConfirmPurchase = (
    upgrade: UpgradeItem | null, 
    paymentCurrency: '$NILK' | 'Raw Nilk', 
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!upgrade || !isConnected) {
      console.log("[Purchase UI] Upgrade not selected or wallet not connected.");
        return;
    }

    console.log(`[Purchase UI Intent] User wants to purchase: ${upgrade.name} with ${paymentCurrency}.`);

    let estimatedCostForModalBehavior = 0;
    let targetCowForEvolution: CowListItem | undefined = undefined;
    let actionTaken = false; // To track if a game action was attempted
    let paymentCurrencyForModal: '$NILK' | 'Raw Nilk' = paymentCurrency;

    if (upgrade.id === "cow_evolution") {
      targetCowForEvolution = displayCowList.find(cow => cow.level < MAX_COW_LEVEL);
      if (targetCowForEvolution) {
        const cowStat = COW_STATS[targetCowForEvolution.tier];
        if (cowStat) {
          estimatedCostForModalBehavior = cowStat.evolutionBaseCost + (targetCowForEvolution.level * cowStat.evolutionLevelMultiplier);
          // Placeholder for actual call in Phase 2 logic
          // gameActions.evolveCow(targetCowForEvolution.id);
          // actionTaken = true; // Mark that an action would be taken
          console.log(`[Purchase UI] Placeholder: Evolve cow ${targetCowForEvolution.id}`);
            } else {
          console.warn(`[Purchase UI] COW_STATS not found for tier: ${targetCowForEvolution.tier}`);
        }
      } else {
        console.log("[Purchase UI] No cows eligible for evolution.");
      }
    } else if (upgrade.tier && COW_STATS[upgrade.tier]) { // This is a cow purchase
      estimatedCostForModalBehavior = COW_STATS[upgrade.tier].directPurchaseCost;
      if (paymentCurrencyForModal === "$NILK" && userNilkBalance >= estimatedCostForModalBehavior) {
        // Directly call the purchaseCow action from the store
        const purchaseSuccess = gameActions.purchaseCow(upgrade.tier);
        actionTaken = true;
        if (purchaseSuccess) {
          console.log(`[Purchase UI] gameActions.purchaseCow(${upgrade.tier}) called and succeeded.`);
          playSound("/sounds/success.mp3"); // Play success sound on successful cow purchase
        } else {
          console.log(`[Purchase UI] gameActions.purchaseCow(${upgrade.tier}) called but failed (e.g., insufficient funds in store).`);
           // If store action failed (e.g. due to its own balance check), reflect this
           // For now, modal closing logic below will handle insufficient balance based on UI estimate.
        }
      } else if (paymentCurrencyForModal === "$NILK") {
        console.log("[Purchase UI] Insufficient $NILK based on UI estimate before calling store action.");
      }
    } else if (upgrade.id === "yield_booster") {
        let calculatedCost = 12000;
        if (yieldBoosterLevelFromStore > 0) {
          calculatedCost = 12000 * Math.pow(1.4, yieldBoosterLevelFromStore);
        }
        estimatedCostForModalBehavior = Math.floor(calculatedCost);
        // Placeholder: gameActions.upgradeYieldBooster(); when store action is called
        if (paymentCurrencyForModal === "$NILK" && userNilkBalance >= estimatedCostForModalBehavior) {
          // const success = gameActions.upgradeYieldBooster(); // UNCOMMENT WHEN STORE ACTION EXISTS
          // if (success) { actionTaken = true; playSound("/sounds/success.mp3"); }
        }
        console.log("[Purchase UI] Placeholder: Upgrade yield booster");
    } else if (upgrade.id === "manual_processor") {
      estimatedCostForModalBehavior = upgrade.cost;
      if (paymentCurrencyForModal === "Raw Nilk" && userRawNilkBalance >= estimatedCostForModalBehavior) {
        const success = gameActions.purchaseManualProcessor(); // Assumes this action exists in store
        if (success) { 
          actionTaken = true; 
          playSound("/sounds/success.mp3"); 
          console.log("[Purchase UI] gameActions.purchaseManualProcessor() called and succeeded.");
            } else {
          console.log("[Purchase UI] gameActions.purchaseManualProcessor() called but failed (e.g., insufficient Raw Nilk in store).");
        }
      } else if (paymentCurrencyForModal === "Raw Nilk"){
        console.log("[Purchase UI] Insufficient Raw Nilk based on UI estimate before calling store action for Manual Processor.");
      }
    } else if (upgrade.id === "moofi_badge") {
      estimatedCostForModalBehavior = upgrade.cost;
      if (paymentCurrencyForModal === "$NILK" && userNilkBalance >= estimatedCostForModalBehavior) {
        const success = gameActions.purchaseMoofiBadge(); // Assumes this action exists in store
        if (success) { 
          actionTaken = true; 
          playSound("/sounds/success.mp3"); 
          console.log("[Purchase UI] gameActions.purchaseMoofiBadge() called and succeeded.");
        } else {
          console.log("[Purchase UI] gameActions.purchaseMoofiBadge() called but failed (e.g., insufficient $NILK in store).");
        }
      } else if (paymentCurrencyForModal === "$NILK"){
        console.log("[Purchase UI] Insufficient $NILK based on UI estimate before calling store action for MOOFI Badge.");
      }
    } else {
        // Fallback for items that might not fit the above categories, using their statically defined cost
        estimatedCostForModalBehavior = upgrade.cost;
    }

    console.log(`[Purchase UI] Estimated cost for modal behavior: ${estimatedCostForModalBehavior} ${paymentCurrencyForModal}`);

    if (actionTaken || (event && sparkleContainerRef.current)) { // Show sparkle if an action was attempted or if it's just a UI click for other items
          if (event && sparkleContainerRef.current) {
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            const containerRect = sparkleContainerRef.current.getBoundingClientRect();
            setClickPosition({
              x: rect.left + rect.width / 2 - containerRect.left,
              y: rect.top + rect.height / 2 - containerRect.top,
            });
            setShowSparkleEffect(true);
            setTimeout(() => setShowSparkleEffect(false), 1000);
          }
    }

    if (paymentCurrencyForModal === "$NILK" && userNilkBalance < estimatedCostForModalBehavior && estimatedCostForModalBehavior > 0 && !actionTaken) {
      console.log("[Purchase UI] Insufficient $NILK (estimated), no store action attempted. Modal kept open.");
    } else if (paymentCurrencyForModal === "Raw Nilk" && userRawNilkBalance < estimatedCostForModalBehavior && estimatedCostForModalBehavior > 0 && !actionTaken) {
      console.log("[Purchase UI] Insufficient Raw Nilk (estimated), no store action attempted. Modal kept open.");
    } else {
        setIsMarketModalOpen(false); 
        setSelectedUpgrade(null); 
      console.log("[Purchase UI] Modal closed. Store state should reflect any actions taken.");
    }
  };

  const originalSideLengthForBoundary = 50;
  const farmBoundaryForScene = (originalSideLengthForBoundary * Math.sqrt(3 / 4)) / 2;

  const handleConfirmFusion = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (!isConnected) {
      console.log("[Fusion] Wallet not connected.");
      return;
    }
    console.log(`[UI Intent] Confirming fusion for selected cows: ${selectedCowsForFusion.join(', ')}. Actual logic to use gameActions.`);
    setIsCowFusionModalOpen(false);
    setSelectedCowsForFusion([]);
    console.log("Old handleConfirmFusion partially active for UI. Phase 2 will implement store actions.");
  };

  const handleCanvasCreated = (state: RootState) => {
    if (state.gl.domElement) {
      state.gl.domElement.addEventListener('webglcontextlost', (event) => {
        console.warn('NilkFarm3D: WebGL context lost. Event:', event);
        // R3F usually handles preventDefault, but good to be explicit if we're listening
        event.preventDefault(); 
      });
      state.gl.domElement.addEventListener('webglcontextrestored', () => {
        console.log('NilkFarm3D: WebGL context successfully restored.');
        // R3F should automatically re-render and restore state.
        // If not, additional state refresh logic might be needed here or via a state variable.
      });
    }
  };

  if (isLoadingNilkBalance || isLoadingRawNilkBalance) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-white p-4">
        <Loader2 className="h-16 w-16 text-lime-400 animate-spin" />
        <p className="ml-4 text-2xl font-semibold font-title">Loading Cosmic Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col select-none relative overflow-hidden">
      {/* Sparkle Container for purchase effects */}
      <div ref={sparkleContainerRef} className="absolute inset-0 pointer-events-none z-[150]" >
        {showSparkleEffect && clickPosition && (
          <>
            {Array.from({ length: 25 }).map((_, i) => (
              <span
                key={`sparkle-${i}`}
                className="sparkle-particle-farm"
                style={{
                  '--tx': `${clickPosition.x}px`,
                  '--ty': `${clickPosition.y}px`,
                  '--dx': `${Math.cos((i / 25) * Math.PI * 2) * (Math.random() * 50 + 30)}px`,
                  '--dy': `${Math.sin((i / 25) * Math.PI * 2) * (Math.random() * 50 + 30)}px`,
                  '--duration': `${0.6 + Math.random() * 0.4}s`,
                  '--delay': `${Math.random() * 0.1}s`,
                  '--size': `${6 + Math.random() * 6}px`,
                  '--color': `hsl(${100 + Math.random() * 60}, 100%, 70%)`,
                } as React.CSSProperties}
              />
            ))}
          </>
        )}
      </div>

      {/* Main Content Area - MODIFIED PADDING HERE */}
      <main className="flex-grow flex flex-col lg:flex-row items-stretch justify-center p-4 pt-40 sm:pt-32 pb-10 z-10 relative">
        {/* Left Panel (3D Scene) */}
        <div className="w-full lg:w-2/3 h-[50vh] lg:h-auto bg-black/30 border border-lime-800/50 rounded-xl shadow-xl shadow-lime-500/10 overflow-hidden relative lg:mr-4 mb-4 lg:mb-0">
          <Suspense fallback={<div className="flex justify-center items-center h-full text-lime-400">Loading 3D Farm...</div>}>
            <Canvas 
              camera={{ position: [0, 10, 25], fov: 50 }} 
              shadows 
              className="cursor-grab active:cursor-grabbing"
              gl={{
                alpha: true, // Enable transparent background
                powerPreference: "high-performance"
              }}
              onCreated={handleCanvasCreated}
            >
              {/* <color attach="background" args={['#101020']} /> */}{/* Ensure this is removed or commented */}
              <FarmScene cowList={displayCowList} farmBoundary={farmBoundaryForScene} />
              <OrbitControls maxDistance={50} minDistance={5} enablePan={true} target={[0, 1, 0]} />
              {/* <Environment background blur={0.5} /> */}{/* Remove this to allow transparency */}
              <directionalLight 
                position={[10, 20, 5]}
                intensity={1.2}
                castShadow 
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <ambientLight intensity={0.6} />
            </Canvas>
          </Suspense>
        </div>

        {/* Right Panel (UI Elements) */}
        <div className="w-full lg:w-1/3 flex flex-col space-y-4">
          {/* Account Info & Balances - Top Right */}
          <div className="bg-black/60 border border-lime-500/50 rounded-xl shadow-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-lime-300">Farm Overview</h2>
              {isConnected && address && (
                <Badge variant="outline" className="border-green-400 text-green-300 text-xs">
                  {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 p-3 rounded-md border border-lime-700/50">
                <p className="text-xs text-lime-400">$NILK Balance</p>
                <p className="text-lg font-bold text-lime-200">{userNilkBalance.toFixed(2)}</p>
              </div>
              <div className="bg-black/30 p-3 rounded-md border border-lime-700/50">
                <p className="text-xs text-lime-400">Raw Nilk</p>
                <p className="text-lg font-bold text-lime-200">{userRawNilkBalance.toFixed(2)}</p>
              </div>
            </div>
            {nativeBalance && (
              <div className="bg-black/30 p-3 rounded-md border border-lime-700/50">
                <p className="text-xs text-lime-400">Native Token ({nativeBalance.symbol})</p>
                <p className="text-lg font-bold text-lime-200">{parseFloat(nativeBalance.formatted).toFixed(4)}</p>
              </div>
            )}
          </div>

          {/* Your Herd Section - Middle Right */}
          <div className="bg-black/60 border border-lime-500/50 rounded-xl shadow-xl p-4 flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-lime-300">Your Herd ({displayCowList.length})</h2>
              <Button
                onClick={() => handleHarvest()} 
                variant="outline"
                size="sm"
                className="border-lime-500 bg-lime-600/20 hover:bg-lime-500/30 text-lime-200 hover:text-lime-100 text-xs"
                disabled={displayCowList.every(cow => !getHarvestStatus(cow).canHarvest) || !isConnected}
              >
                <Sparkles size={14} className="mr-1.5 text-yellow-400" /> Harvest All Available
              </Button>
            </div>
            <div className="overflow-y-auto space-y-3 pr-2 flex-grow max-h-[calc(100vh-700px)] min-h-[150px]">
              {displayCowList.length > 0 ? displayCowList.map((cow) => {
                const { canHarvest, timeRemaining, rawNilkToClaim } = getHarvestStatus(cow);
                return (
                  <div key={cow.id} className="bg-black/30 border border-lime-700/50 rounded-lg p-3 flex items-center justify-between space-x-3">
                    <Avatar className="h-12 w-12 border-2 border-lime-600">
                      <AvatarImage src={cow.image} alt={cow.name} />
                      <AvatarFallback className="bg-lime-800 text-lime-300">{cow.name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-semibold text-lime-200">{cow.name} <span className="text-xs text-gray-400">(Lvl {cow.level})</span></p>
                        <Badge variant="secondary" className={`text-xs px-1.5 py-0.5 ${rarityColor(cow.rarity)}`}>{cow.rarity}</Badge>
                      </div>
                      <p className="text-xs text-lime-400">Yield: {cow.rawNilkPerDay.toFixed(1)} Raw Nilk/day</p>
                      {canHarvest ? (
                        <p className="text-xs text-green-400">Ready! Claim: {rawNilkToClaim.toFixed(2)}</p>
                      ) : (
                        <p className="text-xs text-yellow-500">Cooldown: {timeRemaining}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleHarvest(cow.id)} 
                      disabled={!canHarvest || !isConnected}
                      size="sm"
                      className={`text-xs px-2.5 py-1 ${canHarvest ? 'bg-green-500 hover:bg-green-600 text-black' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                    >
                      {canHarvest ? "Harvest" : "Waiting"}
                    </Button>
                  </div>
                );
              }) : (
                <p className="text-center text-gray-400 py-4">No cows in your herd yet. Buy one from the market!</p>
              )}
            </div>
          </div>

          {/* Upgrades Section - Bottom Right - MODIFIED FOR NEW MARKET MODAL TRIGGER */}
          <div className="bg-black/60 border border-lime-500/50 rounded-xl shadow-xl p-4">
            <h2 className="text-xl font-semibold text-lime-300 mb-3">Farm Improvements</h2>
            <Button 
              onClick={() => setIsMainMarketModalOpen(true)}
              disabled={!isConnected} // Keep disabled if not connected
              className="w-full text-base py-3 bg-green-600/80 hover:bg-green-700/90 border border-green-500/50 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={20} className="mr-2" /> Browse Farm Market
                  </Button>
            <p className="text-xs text-green-300/70 mt-1 text-center px-2">Discover cows, boosters, and other valuable upgrades for your farm.</p>
            
            {/* Cow Fusion Chamber Button - Remains as is */}
            {farmActions.map((actionItem) => (
              <div key={actionItem.id} className="mt-4">
                <Button 
                  onClick={actionItem.action} 
                  disabled={actionItem.disabled || !isConnected}
                  className={`w-full text-base py-3 bg-purple-600/80 hover:bg-purple-700/90 border border-purple-500/50 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${actionItem.disabled || !isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <actionItem.icon className="mr-2 h-5 w-5" /> {actionItem.name}
                  </Button>
                <p className="text-xs text-purple-300/70 mt-1 text-center px-2">{actionItem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* Main Market Modal (New) */}
      {isMainMarketModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4">
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-green-600/70 rounded-xl shadow-2xl shadow-green-500/20 p-6 sm:p-8 w-full max-w-2xl text-white relative">
            <Button onClick={() => setIsMainMarketModalOpen(false)} variant="ghost" className="absolute top-3 right-3 text-gray-400 hover:text-green-300 p-1 h-auto z-[130]">
              <XCircle size={28} />
                  </Button>
            <div className="flex items-center justify-center mb-6">
              <ShoppingCart size={36} className="mr-3 text-green-400" />
              <h3 className="text-3xl font-bold text-green-300 font-title">Farm Market</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 pb-4">
              {upgrades.map((item) => {
                let currentCost = item.cost;
                let itemDescription = item.description; // Full description for now, can be shortened if needed
                let actionText = "View Details";
                let isDisabled = !isConnected;
                const currencyType = item.currency || '$NILK';

                if (item.id === 'yield_booster') {
                  if (yieldBoosterLevelFromStore >= MAX_COW_LEVEL) { itemDescription = `Yield Booster is at Max Level (${MAX_COW_LEVEL}).`; actionText = "Max Level"; isDisabled = true; }
                  else { itemDescription = `Boost all cows' Raw Nilk production. Current Lvl: ${yieldBoosterLevelFromStore}.`; }
                } else if (item.id === 'cow_evolution') {
                  const evolvableCows = displayCowList.filter(c => c.level < MAX_COW_LEVEL);
                  if (evolvableCows.length === 0 && displayCowList.length > 0) { itemDescription = "All your current cows are max level!"; actionText = "All Maxed"; isDisabled = true; }
                  else if (displayCowList.length === 0) { itemDescription = "Evolves your highest level, non-maxed cow. You need a cow first!"; actionText = "No Cows"; isDisabled = true; }
                  else { itemDescription = `Evolve a cow for a 15% (compounding) Raw Nilk yield increase per level.`;}
                  currentCost = 0; // Cost varies, handled in confirmation modal
                } else if (item.tier) { // Cow purchase
                  itemDescription = `Acquire a ${item.name}. Produces ${COW_STATS[item.tier]?.rawNilkPerDayBase || 'N/A'} Raw Nilk/day (base).`;
                  if (nextSpawnPointIndex >= cowSpawnPoints.length) { itemDescription = "Your farm is full! No more space for new cows currently."; actionText = "Farm Full"; isDisabled = true; }
                }
                // General check if user has enough currency for items with a fixed cost
                if (currencyType === '$NILK' && currentCost > 0 && userNilkBalance < currentCost && actionText === "View Details") isDisabled = true;
                if (currencyType === 'Raw Nilk' && currentCost > 0 && userRawNilkBalance < currentCost && actionText === "View Details") isDisabled = true;

                return (
                  <div key={item.id} className="bg-black/40 border border-green-700/50 rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-md hover:shadow-green-500/30 transition-shadow">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-16 w-16 border-2 border-green-600 bg-green-900/50 flex-shrink-0 p-1">
                        <AvatarImage src={item.image} alt={item.name} className="object-contain"/>
                      <AvatarFallback>{item.name.substring(0,1)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <p className="font-semibold text-lg text-green-200">{item.name}</p>
                        <p className="text-xs text-green-400/80 leading-tight mt-1">{itemDescription}</p>
                    </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-green-700/30">
                        <p className="text-sm text-white font-semibold">
                          {currentCost > 0 ? `${currentCost} ${currencyType}` : item.id === 'cow_evolution' ? 'Cost Varies' : 'Free / Special'}
                        </p>
                    <Button 
                          onClick={() => {
                            handleInitiatePurchase(item.id);
                            setIsMainMarketModalOpen(false); // Close this modal, open confirmation modal
                          }} 
                      size="sm"
                          disabled={isDisabled}
                          className={`text-xs px-3 py-1.5 whitespace-nowrap ${isDisabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-lime-500 hover:bg-lime-600 text-black'}`}
                    >
                         {actionText}
                    </Button>
                    </div>
                  </div>
                );
              })}
              </div>
          </div>
        </div>
      )}
      
      {/* Market Modal (Confirmation Modal - remains largely unchanged) */}
      {isMarketModalOpen && selectedUpgrade && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-lime-600/70 rounded-xl shadow-2xl shadow-lime-500/20 p-6 sm:p-8 w-full max-w-md text-center relative">
            <Button onClick={() => setIsMarketModalOpen(false)} variant="ghost" className="absolute top-3 right-3 text-gray-400 hover:text-lime-300 p-1 h-auto">
              <XCircle size={24} />
            </Button>
            <img src={selectedUpgrade.image} alt={selectedUpgrade.name} className="w-24 h-24 mx-auto mb-4 rounded-lg bg-lime-900/50 p-2 border border-lime-700"/>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 text-lime-300">{selectedUpgrade.name}</h3>
            
            {(() => {
                let modalCost = 0;
                let modalDescription = selectedUpgrade.description;
                let targetCowInfo = "";
                let actionButtonText = `Confirm Purchase with ${selectedUpgrade.currency || '$NILK'}`;
                let purchaseDisabled = !isConnected;
                const selectedUpgradeCurrency = selectedUpgrade.currency || '$NILK';

                if (selectedUpgrade.id === 'yield_booster') {
                    modalCost = 12000; if (yieldBoosterLevelFromStore > 0) modalCost = 12000 * Math.pow(1.4, yieldBoosterLevelFromStore);
                    modalCost = Math.floor(modalCost);
                    modalDescription = `Upgrade Yield Booster to Level ${yieldBoosterLevelFromStore + 1}. This will boost Raw Nilk production for all your cows by 10% (compounding).`;
                    if (yieldBoosterLevelFromStore >= MAX_COW_LEVEL) { actionButtonText = "Max Level Reached"; purchaseDisabled = true; }
                } else if (selectedUpgrade.id === 'cow_evolution') {
                    const eligibleCowsForModal = [...displayCowList].filter(c => c.level < MAX_COW_LEVEL).sort((a, b) => b.level - a.level);
                    if (eligibleCowsForModal.length > 0) {
                        const targetCow = eligibleCowsForModal[0];
                        const cowStat = COW_STATS[targetCow.tier];
                        modalCost = cowStat.evolutionBaseCost + (targetCow.level * cowStat.evolutionLevelMultiplier);
                        targetCowInfo = ` This will evolve ${targetCow.name} (Lvl ${targetCow.level}) to Level ${targetCow.level + 1}.`;
                        modalDescription = `Evolve ${targetCow.name} to enhance its Raw Nilk production by 15%.`;
                    } else {
                        modalDescription = "No cows eligible for evolution at the moment.";
                        actionButtonText = "No Eligible Cows"; purchaseDisabled = true;
                    }
                } else if (selectedUpgrade.tier) {
                    modalCost = COW_STATS[selectedUpgrade.tier].directPurchaseCost;
                    modalDescription = `This will add a ${COW_STATS[selectedUpgrade.tier].name} to your farm.`;
                    if (nextSpawnPointIndex >= cowSpawnPoints.length) {
                        modalDescription = "Your farm is full! Cannot purchase more cows.";
                        actionButtonText = "Farm Full - Cannot Buy"; purchaseDisabled = true;
                    }
                }
                if (selectedUpgradeCurrency === '$NILK' && userNilkBalance < modalCost) purchaseDisabled = true;
                if (selectedUpgradeCurrency === 'Raw Nilk' && userRawNilkBalance < modalCost) purchaseDisabled = true;

                return (
                    <>
                        <p className="text-sm text-green-400 mb-1 px-4">{modalDescription}{targetCowInfo}</p>
                        <p className="text-lg font-semibold text-white mb-4">Cost: {modalCost > 0 ? `${modalCost} ${selectedUpgradeCurrency}` : "N/A"}</p>
                        <div className="space-y-2">
                            <Button 
                                onClick={(e) => handleConfirmPurchase(selectedUpgrade, selectedUpgradeCurrency, e)}
                                disabled={purchaseDisabled}
                                className="w-full bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-black font-semibold py-2.5 text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                            >
                                <Zap size={18} className="mr-2"/> {actionButtonText}
                            </Button>
                            <Button disabled className="w-full bg-purple-500/50 text-white/70 font-semibold py-2.5 text-base cursor-not-allowed"> Pay with $HYPE (Coming Soon) </Button>
                            <Button disabled className="w-full bg-blue-500/50 text-white/70 font-semibold py-2.5 text-base cursor-not-allowed"> Pay with $USDC (Coming Soon) </Button>
                        </div>
                    </>
                );
            })()}
          </div>
        </div>
      )}

      {/* Cow Fusion Modal */}
      {isCowFusionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gradient-to-br from-gray-800 via-purple-900 to-gray-800 border-2 border-purple-600/70 rounded-xl shadow-2xl shadow-purple-500/20 p-6 sm:p-8 w-full max-w-lg text-white relative">
            <Button onClick={() => setIsCowFusionModalOpen(false)} variant="ghost" className="absolute top-3 right-3 text-gray-400 hover:text-purple-300 p-1 h-auto">
              <XCircle size={28} />
            </Button>
            <div className="flex items-center justify-center mb-6">
              <Atom size={36} className="mr-3 text-purple-400" />
              <h3 className="text-3xl font-bold text-purple-300 font-title">Cow Fusion Chamber</h3>
            </div>

            {/* Content for fusion selection will go here */}
            <div className="my-4 text-center">
              <p className="text-purple-200/80">Select cows from your herd to attempt fusion.</p>
              <p className="text-xs text-purple-400/60 mt-1">(E.g., 2 Common Cows can fuse into 1 Cosmic Cow. 4 Cosmic Cows can fuse into 1 Galactic Moo Moo.)</p>
            </div>

            {/* Placeholder for Cow Selection UI */}
            <div className="min-h-[200px] bg-black/30 border border-purple-700/50 rounded-lg p-4 my-4 overflow-y-auto max-h-[300px]">
              {displayCowList.length > 0 ? (
                <div className="space-y-2">
                  {displayCowList.map(cow => {
                    const isSelected = selectedCowsForFusion.includes(cow.id);
                    return (
                      <div 
                        key={cow.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCowsForFusion(prev => prev.filter(id => id !== cow.id));
                          } else {
                            // Basic selection logic: allow selecting up to 4 cows for now
                            // More complex validation (e.g. only 2 T1s or 4 T2s) will be handled before enabling fuse button
                            if (selectedCowsForFusion.length < 4) { 
                                setSelectedCowsForFusion(prev => [...prev, cow.id]);
                            }
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-lg border-2 cursor-pointer transition-all duration-200 
                                    ${isSelected ? 'bg-purple-600/50 border-purple-400 shadow-lg' : 'bg-black/40 border-purple-800/60 hover:border-purple-600/80'}`}
                      >
                        <div className="flex items-center">
                          <Avatar className={`h-10 w-10 border ${isSelected ? 'border-purple-300' : 'border-purple-700'}`}>
                            <AvatarImage src={cow.image} alt={cow.name} />
                            <AvatarFallback className={`${isSelected ? 'bg-purple-500' : 'bg-purple-800'} text-white`}>{cow.name.substring(0,1)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-purple-200'}`}>{cow.name}</p>
                            <p className={`text-xs ${isSelected ? 'text-purple-200/90' : 'text-purple-400/70'}`}>Tier {COW_STATS[cow.tier]?.name || cow.tier} - Lvl {cow.level} - {cow.rawNilkPerDay.toFixed(1)} Raw Nilk/day</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-purple-300/70 py-10">You have no cows in your herd to fuse.</p>
              )}
            </div>

            {/* Fusion Cost & Result Preview */}
            <div className="my-4 p-3 bg-black/20 rounded-md border border-purple-800/40 min-h-[60px]">
              {(() => {
                const selectedCowObjects = selectedCowsForFusion.map(id => displayCowList.find(cow => cow.id === id)).filter(Boolean) as CowListItem[];
                let fee = 0; let resultTier: CowTier | null = null; let resultName = ""; let canFuse = false;
                
                if (selectedCowObjects.length === COW_STATS.cosmic.inputsForFusion?.count && 
                    selectedCowObjects.every(cow => cow && cow.tier === COW_STATS.cosmic.inputsForFusion?.tierInput)) {
                  fee = COW_STATS.cosmic.fusionFee || 0; resultTier = 'cosmic'; resultName = COW_STATS.cosmic.name; canFuse = true;
                } else if (selectedCowObjects.length === COW_STATS.galactic_moo_moo.inputsForFusion?.count && 
                           selectedCowObjects.every(cow => cow && cow.tier === COW_STATS.galactic_moo_moo.inputsForFusion?.tierInput)) {
                  fee = COW_STATS.galactic_moo_moo.fusionFee || 0; resultTier = 'galactic_moo_moo'; resultName = COW_STATS.galactic_moo_moo.name; canFuse = true;
                }

                if (!canFuse && selectedCowObjects.length > 0) return <p className="text-sm text-yellow-400/80">Invalid selection for fusion. Requires {COW_STATS.cosmic.inputsForFusion?.count}x {COW_STATS.common.name} or {COW_STATS.galactic_moo_moo.inputsForFusion?.count}x {COW_STATS.cosmic.name}.</p>;
                else if (selectedCowObjects.length === 0) return <p className="text-sm text-purple-200/70">Select cows above to see fusion details.</p>;
                
                const hasEnoughNilk = userNilkBalance >= fee;
                return ( <> <p className="text-sm text-purple-200">Fusion Fee: <span className={`font-semibold ${hasEnoughNilk ? 'text-white' : 'text-red-500'}`}>{fee} $NILK</span></p> <p className="text-sm text-purple-200">Expected Result: <span className="font-semibold text-white">{resultName || "N/A"}</span></p> {!hasEnoughNilk && canFuse && <p className="text-xs text-red-500 mt-1">Insufficient $NILK balance.</p>} </> );
              })()}
            </div>

            <Button 
              onClick={handleConfirmFusion} 
              disabled={(() => {
                const selectedCowObjects = selectedCowsForFusion.map(id => displayCowList.find(cow => cow.id === id)).filter(Boolean) as CowListItem[];
                let fee = 0; let canFuse = false;
                if (selectedCowObjects.length === COW_STATS.cosmic.inputsForFusion?.count && 
                    selectedCowObjects.every(cow => cow && cow.tier === COW_STATS.cosmic.inputsForFusion?.tierInput)) {
                  fee = COW_STATS.cosmic.fusionFee || 0; canFuse = true;
                } else if (selectedCowObjects.length === COW_STATS.galactic_moo_moo.inputsForFusion?.count && 
                           selectedCowObjects.every(cow => cow && cow.tier === COW_STATS.galactic_moo_moo.inputsForFusion?.tierInput)) {
                  fee = COW_STATS.galactic_moo_moo.fusionFee || 0; canFuse = true;
                }
                return !canFuse || userNilkBalance < fee || !isConnected;
              })()}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Atom size={20} className="mr-2"/> Fuse Cows (Logic Update Pending)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for rarity color (if not already defined elsewhere)
const rarityColor = (rarity: string) => {
  if (rarity === COW_STATS.cosmic.name) return "bg-purple-600/70 text-purple-200 border border-purple-400";
  if (rarity === COW_STATS.galactic_moo_moo.name) return "bg-blue-600/70 text-blue-200 border border-blue-400"; // Assuming Galactic is "Rare" color
  if (rarity === COW_STATS.common.name) return "bg-green-600/70 text-green-200 border border-green-400"; // Assuming Common is "Uncommon" color
  return "bg-gray-600/70 text-gray-200 border border-gray-400"; // Fallback
};

// Initial cow data, adjusted for RawNilkPerDay
const cowsData: CowListItem[] = [
  { id: "1", name: "Milky Wayfarer", image: "/NILK COW.png", rarity: "Common", level: 1, tier: "common", rawNilkPerDay: 10, lastHarvestTime: 0, harvestCooldownHours: 6, modelPath: DEFAULT_COW_MODEL_PATH },
  // ... (rest of the initial cow data)
];

// Old upgradeItems - REMOVED as 'upgrades' array is now defined dynamically using COW_STATS.
// const upgradeItems: UpgradeItem[] = [ ... ];

</rewritten_file> 