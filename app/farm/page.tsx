"use client"

import React, { useState, useRef, useEffect, Suspense, useMemo } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Canvas, useFrame, RootState } from "@react-three/fiber"
import { OrbitControls, Environment, Text, useGLTF, useTexture, Stars } from "@react-three/drei"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAccount, useBalance } from 'wagmi'
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabaseClient';
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
  ShoppingCart,
  TrendingUp,
  Coins,
  Droplets
} from "lucide-react"
import * as THREE from "three"
import { RepeatWrapping } from "three"
import useGameStore, { useGameActions, COW_STATS, FLASK_STATS, ActiveFlask, FlaskId } from "../store/useGameStore"
import { useErrorHandler, validators, antiCheat } from "../utils/errorHandling"

import type { GameActions, Cow as StoreCow, CowTier } from "../store/useGameStore"
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { initialMarketItems, type UpgradeItem } from "@/app/config/marketItems"
import Marketplace from "./components/Marketplace"

// GLTF Model paths - These become fallbacks or defaults if not specified by tier
const DEFAULT_COW_MODEL_PATH = "/MODELS/COW_optimized.glb";
const MACHINE_PRO_MODEL_PATH = "/MODELS/nilk machine PRO_optimized.glb"
const MACHINE_MODEL_PATH = "/MODELS/nilk machine_optimized.glb"
const GRASS_COLOR_TEXTURE_PATH = "/textures/grass/Grass008_1K-JPG_Color.jpg"
const GRASS_NORMAL_TEXTURE_PATH = "/textures/grass/Grass008_1K-JPG_NormalGL.jpg"
const GRASS_ROUGHNESS_TEXTURE_PATH = "/textures/grass/Grass008_1K-JPG_Roughness.jpg"
const GRASS_AO_TEXTURE_PATH = "/textures/grass/Grass008_1K-JPG_AmbientOcclusion.jpg"

// Scene constants
const SCENE_GROUND_Y = 0;

// Helper function to dispose of materials and geometries in a cloned scene
function disposeClonedScene(scene: THREE.Object3D) {
  if (!scene) return;
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => {
            // Dispose textures if they exist
            Object.values(material).forEach((value: any) => {
              if (value && typeof value.dispose === 'function' && value.isTexture) {
                value.dispose();
              }
            });
            material.dispose();
          });
        } else {
          // Dispose textures if they exist
          Object.values(mesh.material).forEach((value: any) => {
            if (value && typeof value.dispose === 'function' && value.isTexture) {
              value.dispose();
            }
          });
          mesh.material.dispose();
        }
      }
    }
  });
}

// Define UpgradeItem interface earlier
interface BulkDeal {
  quantity: number;
  totalPrice: number;
  discountDisplayName?: string; // e.g., "10% Off!", "Save 500 $NILK"
}

// Generic GLTF Model Loader Component
function LoadedGLTFModel({ modelPath, ...props }: { modelPath: string;[key: string]: any }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    return () => {
      if (clonedScene) {
        disposeClonedScene(clonedScene as unknown as THREE.Object3D);
      }
    };
  }, [clonedScene]);

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
  const clonedScene = useMemo(() => scene.clone(), [scene]);

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

  useEffect(() => {
    return () => {
      if (clonedScene) {
        disposeClonedScene(clonedScene as unknown as THREE.Object3D);
      }
    };
  }, [clonedScene]);

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

  // Define fixed plots for farm items
  const itemPlots = {
    machine: {
      position: [6, groundY + (0.5 * 3.5), newMachineZ] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
      scale: 3.5,
    },
    farmer: {
      position: [-6, groundY, newMachineZ - 2] as [number, number, number],
      rotation: [0, Math.PI / 4, 0] as [number, number, number],
      scale: 1.5,
    },
  };

  const ownedMachines = useGameStore(state => state.ownedMachines);
  const hasAlienFarmerBoost = useGameStore(state => state.hasAlienFarmerBoost);

  const machineToRender = ownedMachines.pro > 0 ? 'pro' : ownedMachines.standard > 0 ? 'standard' : null;

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
        
        {/* Render machine based on ownership */}
        <LoadedGLTFModel 
          modelPath={
            ownedMachines.pro > 0 
              ? MACHINE_PRO_MODEL_PATH 
              : ownedMachines.standard > 0 
                ? MACHINE_MODEL_PATH 
                : MACHINE_MODEL_PATH
          } 
            position={itemPlots.machine.position}
          scale={ownedMachines.pro > 0 ? 4 : 3.5}
            rotation={itemPlots.machine.rotation}
          />

        {/* Render Alien Farmer based on ownership */}
        {hasAlienFarmerBoost && (
        <LoadedGLTFModel 
            modelPath="/MODELS/farmer_optimized.glb"
            position={itemPlots.farmer.position}
            scale={itemPlots.farmer.scale}
            rotation={itemPlots.farmer.rotation}
          />
        )}

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

// Enhanced sparkle effect function (ported from processing page)
const triggerSparkleEffect = (targetElement?: HTMLElement, sparkleContainer?: HTMLDivElement) => {
  if (!sparkleContainer) return;

  let originX = 0.5;
  let originY = 0.5;

  if (targetElement && sparkleContainer) {
    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = sparkleContainer.getBoundingClientRect();
    originX = (targetRect.left + targetRect.width / 2 - containerRect.left) / containerRect.width;
    originY = (targetRect.top + targetRect.height / 2 - containerRect.top) / containerRect.height;
  }
  
  const numParticles = 25 + Math.floor(Math.random() * 15); // 25-40 particles for more impact
  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement("span");
    particle.classList.add("sparkle-particle-farm");
    particle.style.setProperty("--tx", `${originX * 100}%`);
    particle.style.setProperty("--ty", `${originY * 100}%`);
    
    const angle = Math.random() * 360;
    const distance = Math.random() * 80 + 30; // Larger burst radius
    particle.style.setProperty("--dx", `${Math.cos(angle * Math.PI / 180) * distance}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle * Math.PI / 180) * distance}px`);
    particle.style.setProperty("--duration", `${0.6 + Math.random() * 0.8}s`); // Longer duration
    particle.style.setProperty("--delay", `${Math.random() * 0.3}s`);
    particle.style.setProperty("--size", `${4 + Math.random() * 8}px`); // Varied sizes
    
    // Enhanced color palette for different actions
    const colors = [
      `hsl(${100 + Math.random()*60}, 100%, 70%)`, // Green-yellow range
      `hsl(${45 + Math.random()*30}, 100%, 75%)`,  // Gold range
      `hsl(${280 + Math.random()*40}, 100%, 80%)`, // Purple range
      `hsl(${180 + Math.random()*40}, 100%, 70%)`, // Cyan range
    ];
    particle.style.setProperty("--color", colors[Math.floor(Math.random() * colors.length)]);

    sparkleContainer.appendChild(particle);
    setTimeout(() => {
      particle.remove();
    }, 1500); // Longer cleanup time
  }
};

const MAX_COW_LEVEL = 10;

interface GameStateFromStore {
  userNilkBalance: number;
  userRawNilkBalance: number;
  // Add other state properties if you select them directly
}

export default function NilkFarm3D() {
  const isConnected = useAccount().isConnected;
  const { address } = useAccount()
  const { handleError } = useErrorHandler();

  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [itemToPurchase, setItemToPurchase] = useState<UpgradeItem | null>(null);
  const [isConfirmingPurchase, setIsConfirmingPurchase] = useState(false);
  
  const [isCowFusionModalOpen, setIsCowFusionModalOpen] = useState(false)
  const [selectedCowsForFusion, setSelectedCowsForFusion] = useState<string[]>([])
  const sparkleContainerRef = useRef<HTMLDivElement>(null)
  const [isLoadingNilkBalance, setIsLoadingNilkBalance] = useState(true)
  const [isLoadingRawNilkBalance, setIsLoadingRawNilkBalance] = useState(true)
  const [selectedMarketItem, setSelectedMarketItem] = useState<UpgradeItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [finalPurchaseDetails, setFinalPurchaseDetails] = useState<{ item: UpgradeItem; quantity: number; totalPrice: number; currency: '$NILK' | 'Raw Nilk' } | null>(null);
  const [displayCowList, setDisplayCowList] = useState<CowListItem[]>([]);
  const [nextSpawnPointIndex, setNextSpawnPointIndex] = useState(0);

  // Use separate selectors to avoid shallow comparison issues
  const userNilkBalance = useGameStore((state) => state.userNilkBalance);
  const userRawNilkBalance = useGameStore((state) => state.userRawNilkBalance);
  const userHypeBalance = useGameStore((state) => state.userHypeBalance);
  const ownedCows = useGameStore((state) => state.ownedCows);
  const hasAlienFarmerBoost = useGameStore((state) => state.hasAlienFarmerBoost);
  const hasMoofiBadge = useGameStore((state) => state.hasMoofiBadge);
  const yieldBoosterLevelFromStore = useGameStore((state) => state.yieldBoosterLevel);
  const ownedMachines = useGameStore(state => state.ownedMachines);

  const actions = useGameActions();

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

    const newDisplayCows = ownedCows.map((storeCow) => {
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
  }, [ownedCows]); // Removed nextSpawnPointIndex from dependencies to prevent infinite loop

  const getHarvestStatus = (cow: CowListItem) => {
    const storeCow = ownedCows.find(sc => sc.id === cow.id);
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

  const handleHarvest = (cowId?: string, targetElement?: HTMLElement) => {
    try {
      if (!isConnected) { 
        throw new Error("Please connect your wallet to harvest");
      }
      
      if (cowId) {
        // Validate harvest for specific cow
        const cow = ownedCows.find(c => c.id === cowId);
        if (cow) {
          antiCheat.validateHarvest(cow.lastHarvestTime, 24 * 60 * 60 * 1000); // 24 hour cooldown
        }
        console.log(`[UI Harvest Intent] Harvest cow: ${cowId}`);
        actions.harvestRawNilkFromCow(cowId);
      } else {
        console.log(`[UI Harvest Intent] Harvest all cows`);
        actions.harvestAllRawNilk();
      }
      playSound("/sounds/sparkles.mp3"); // Play sparkles for any harvest action
      
      // Trigger enhanced sparkle effect
      if (sparkleContainerRef.current) {
        triggerSparkleEffect(targetElement, sparkleContainerRef.current);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Harvest failed'), {
        action: 'harvest',
        cowId,
        userId: address,
      });
    }
  };

  // This is the OLD list of upgrades for the OLD modal flow.
  // Adding category to satisfy UpgradeItem interface.
  const upgrades: UpgradeItem[] = [
    {
      name: COW_STATS.common.name,
      cost: COW_STATS.common.directPurchaseCost,
      description: `Acquire a foundational ${COW_STATS.common.name}. Produces ${COW_STATS.common.rawNilkPerDayBase} Raw Nilk/day (base).`,
      image: COW_STATS.common.imageUrl || "/NILK COW.png",
      id: "buy_cow_common_legacy", // Changed ID to avoid clash if it ever bought cows
      tier: 'common',
      category: 'cows' // Or 'legacy_upgrades' if you prefer to distinguish
    },
    {
      name: COW_STATS.cosmic.name,
      cost: COW_STATS.cosmic.directPurchaseCost,
      description: `Purchase a ${COW_STATS.cosmic.name} directly. Produces ${COW_STATS.cosmic.rawNilkPerDayBase} Raw Nilk/day (base).`,
      image: COW_STATS.cosmic.imageUrl || "/cosmic cow.png",
      id: "buy_cow_cosmic_legacy",
      tier: 'cosmic',
      category: 'cows' 
    },
    {
      name: COW_STATS.galactic_moo_moo.name,
      cost: COW_STATS.galactic_moo_moo.directPurchaseCost,
      description: `Instantly add a top-tier ${COW_STATS.galactic_moo_moo.name}. Produces ${COW_STATS.galactic_moo_moo.rawNilkPerDayBase} Raw Nilk/day (base).`,
      image: COW_STATS.galactic_moo_moo.imageUrl || "/galactic moo moo.png",
      id: "buy_cow_galactic_moo_moo_legacy",
      tier: 'galactic_moo_moo',
      category: 'cows' 
    },
    {
      name: "Yield Booster",
      cost: (() => {
        let calculatedCost = 12000;
        const tempYieldBoosterLevel = yieldBoosterLevelFromStore; // Use actual store value
        if (tempYieldBoosterLevel > 0) {
          calculatedCost = 12000 * Math.pow(1.4, tempYieldBoosterLevel);
        }
        return Math.floor(calculatedCost);
      })(),
      description: `Boost all cows' Raw Nilk production by 10% per level (compounding). Current Lvl: ${yieldBoosterLevelFromStore}`,
      image: "/gallonjug.png",
      id: "yield_booster_legacy",
      category: 'boosters'
    },
    {
      name: "Cow Evolution",
      cost: 0, 
      description: `Evolve a cow for a 15% (compounding) Raw Nilk yield increase per level. Cost varies. Select a cow first.`,
      image: "/nilk machine PRO.png", 
      id: "cow_evolution_legacy",
      category: 'boosters'
    },
    {
      name: "MOOFI Badge", // Updated Name
      cost: 1000000,
      currency: '$NILK',
      description: "A prestigious badge. Permanently boosts final $NILK yield from processing by 10%.", // Updated Description
      image: "/MOOFI badge.png",
      id: "moofi_badge_legacy", // Kept legacy ID for this modal, actual purchase uses store ID
      category: 'boosters'
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

  // Renamed from handleConfirmPurchase to avoid conflict with new market purchase flow
  const handleConfirmLegacyUpgradePurchase = (
    passedUpgrade: UpgradeItem | null, 
    paymentCurrency: '$NILK' | 'Raw Nilk', 
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!passedUpgrade) return;
    
    try {
      if (!isConnected) {
        throw new Error("Please connect your wallet to make purchases");
      }

      // Validate purchase
      const cost = passedUpgrade.cost || 0;
      if (paymentCurrency === '$NILK' && userNilkBalance < cost) {
        throw new Error("Insufficient NILK balance");
      }
      if (paymentCurrency === 'Raw Nilk' && userRawNilkBalance < cost) {
        throw new Error("Insufficient Raw Nilk balance");
      }

      console.log(`[UI Purchase Intent] Legacy upgrade: ${passedUpgrade.name}, Cost: ${cost} ${paymentCurrency}`);
      
      if (passedUpgrade.id === "yield_booster_legacy") {
        actions.purchaseYieldBooster();
      } else if (passedUpgrade.id === "moofi_badge_legacy") {
        actions.purchaseMoofiBadge();
      } else if (passedUpgrade.id.startsWith("buy_cow_")) {
        const tier = passedUpgrade.tier as CowTier;
        actions.purchaseCow(tier);
      }
      
      playSound("/sounds/sparkles.mp3");
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Purchase failed'), {
        action: 'purchase',
        item: passedUpgrade.name,
        cost: passedUpgrade.cost,
        currency: paymentCurrency,
        userId: address,
      });
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

  // MODIFIED handleInitiateMarketPurchase: Always uses qty 1 and single item cost.
  // Quantity selection is now handled in the confirmation modal.
  const handleInitiateMarketPurchase = (item: UpgradeItem, quantity: number, unitPrice: number, currency: '$NILK' | 'Raw Nilk') => {
    if (!isConnected) {
        // Handle case where user is not connected
      return;
    }
    setItemToPurchase(item);
    // This now just opens the confirmation modal.
    // The actual quantity logic will be inside that modal.
    setIsConfirmingPurchase(true);
  };

  // handleConfirmMarketPurchase remains largely the same, but the `quantity` and `finalPrice` it receives 
  // will come from the confirmation modal's state.
  const handleConfirmMarketPurchase = (
    item: UpgradeItem,
    paymentCurrency: '$NILK' | 'Raw Nilk',
    event: React.MouseEvent<HTMLButtonElement> | undefined, 
    quantityToBuy: number, 
    totalCalculatedPrice: number 
  ) => {
    console.log(`[UI Purchase Intent] Item: ${item.name}, Quantity: ${quantityToBuy}, Total: ${totalCalculatedPrice}, Currency: ${paymentCurrency}`);
    
    const success = actions.purchaseMarketItem(item.id, quantityToBuy);
    if (success) {
      console.log(`[UI Purchase Success] ${item.name} x${quantityToBuy} purchased successfully`);
      playSound("/sounds/sparkles.mp3");
      
      // Trigger enhanced sparkle effect
      if (sparkleContainerRef.current && event?.currentTarget) {
        triggerSparkleEffect(event.currentTarget, sparkleContainerRef.current);
      }
    } else {
      console.log(`[UI Purchase Failed] ${item.name} purchase failed`);
    }
    
    setIsConfirmingPurchase(false);
    setItemToPurchase(null);
  };

  // Helper function to get cow emoji based on rarity
  const getCowEmoji = (rarity: string) => {
    if (rarity === COW_STATS.cosmic.name) return "🌌";
    if (rarity === COW_STATS.galactic_moo_moo.name) return "⭐";
    if (rarity === COW_STATS.common.name) return "🐄";
    return "🐮";
  };

  // Helper function to get rarity gradient
  const getRarityGradient = (rarity: string) => {
    if (rarity === COW_STATS.cosmic.name) return "from-purple-900/80 to-purple-700/80";
    if (rarity === COW_STATS.galactic_moo_moo.name) return "from-blue-900/80 to-blue-700/80";
    if (rarity === COW_STATS.common.name) return "from-green-900/80 to-green-700/80";
    return "from-gray-900/80 to-gray-700/80";
  };

  // Helper function to get rarity border
  const getRarityBorder = (rarity: string) => {
    if (rarity === COW_STATS.cosmic.name) return "border-purple-400/60";
    if (rarity === COW_STATS.galactic_moo_moo.name) return "border-blue-400/60";
    if (rarity === COW_STATS.common.name) return "border-green-400/60";
    return "border-gray-400/60";
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-green-900 to-black text-white overflow-hidden">
      {/* Galaxy Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-black via-purple-900/20 via-green-900/30 to-black">
          {/* Animated stars background */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={`star-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                  opacity: Math.random() * 0.8 + 0.2,
                }}
              />
            ))}
          </div>
          

        </div>
      </div>

      {/* UI Overlay Layer - Unified Station Layout */}
      <div className="relative z-10 h-full flex flex-col">
        
        {/* Main Unified Station - Below navbar */}
        <div className="pt-32 px-4 pb-4 flex-1 flex flex-col max-h-screen overflow-hidden">
          
          {/* Connected Three Panel Layout */}
          <div className="flex flex-1 min-h-0 bg-black/70 backdrop-blur-md rounded-2xl border-2 border-lime-400/40 shadow-2xl overflow-hidden">
            
            {/* Left Panel: Farm Stats & Production */}
            <div className="w-1/5 flex flex-col border-r border-lime-400/30">
              
              {/* Farm Control Center */}
              <div className="flex-1 p-4 border-b border-lime-400/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-lime-400 flex items-center">
                  <Tractor className="mr-2" size={18} />
                  Farm Stats
                </h2>
                </div>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 rounded-lg p-3 border border-yellow-400/40">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 relative">
                        <Image 
                          src="/nilk token.png" 
                          alt="NILK Token" 
                          fill 
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-yellow-300 leading-tight">NILK Balance</p>
                        <p className="font-bold text-yellow-400 text-lg leading-tight">${formatNumber(userNilkBalance)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg p-3 border border-blue-400/40">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 relative">
                        <Image 
                          src="/smalljar.png" 
                          alt="Raw Nilk" 
                          fill 
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-blue-300 leading-tight">Raw Nilk</p>
                        <p className="font-bold text-blue-400 text-lg leading-tight">{formatNumber(userRawNilkBalance)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-lg p-3 border border-purple-400/40">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 relative">
                        <Image 
                          src="/hyperliquid.png" 
                          alt="HYPE Token" 
                          fill 
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-purple-300 leading-tight">HYPE Balance</p>
                        <p className="font-bold text-purple-400 text-lg leading-tight">{formatNumber(userHypeBalance)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Production Overview */}
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-lime-400 flex items-center">
                    <div className="w-6 h-6 relative mr-2">
                      <Image 
                        src="/gallonjug.png" 
                        alt="Production" 
                        fill 
                        className="object-contain"
                      />
                    </div>
                  Production
                </h3>
                  </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-lime-900/20 rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 relative">
                        <Image 
                          src="/smalljar.png" 
                          alt="Daily Output" 
                          fill 
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xs text-lime-300">Daily</span>
                    </div>
                    <span className="text-lime-400 font-bold text-sm">{formatNumber(calculateTotalProduction(displayCowList))}</span>
                  </div>
                  <div className="flex items-center justify-between bg-yellow-900/20 rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 relative">
                        <Image 
                          src="/NILK COW.png" 
                          alt="Ready Cows" 
                          fill 
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xs text-yellow-300">Ready</span>
                    </div>
                    <span className="text-yellow-400 font-bold text-sm">{countReadyToHarvest(displayCowList, getHarvestStatus)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-purple-900/20 rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 relative">
                        <Image 
                          src="/nilk crate.png" 
                          alt="Total Cows" 
                          fill 
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xs text-purple-300">Total</span>
                    </div>
                    <span className="text-purple-400 font-bold text-sm">{displayCowList.length}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-900/20 rounded-lg p-2">
                    <span className="text-xs text-gray-300">⚡ Efficiency</span>
                    <span className="text-lime-400 font-bold text-sm">
                      {displayCowList.length > 0 ? Math.round((countReadyToHarvest(displayCowList, getHarvestStatus) / displayCowList.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Panel: 3D Farm Scene */}
            <div className="flex-1 flex flex-col relative">
                {/* Scene Header */}
              <div className="bg-gradient-to-b from-black/50 to-transparent p-4 border-b border-lime-400/20">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-lime-400 flex items-center">
                      <Home className="mr-2" size={18} />
                      NILK Farm
                    </h2>
                    <div className="flex items-center space-x-2 text-xs text-gray-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Live Farm View</span>
                    </div>
                  </div>
                </div>

                {/* 3D Scene Container */}
              <div className="flex-1 relative">
                  <Canvas
                    shadows
                    camera={{ position: [0, 10, 20], fov: 60 }}
                    onCreated={handleCanvasCreated}
                    className="w-full h-full"
                  >
                  <OrbitControls 
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={5}
                    maxDistance={50}
                    maxPolarAngle={Math.PI / 2.2}
                  />
                    <ambientLight intensity={0.6} />
                    <directionalLight 
                      position={[5, 10, 7]} 
                      intensity={1.5} 
                      color="#ffedd5" 
                      castShadow 
                      shadow-mapSize-width={1024}
                      shadow-mapSize-height={1024}
                    />
                    <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
                    <Environment preset="sunset" blur={0.3}/>
                    

                    
                    <Suspense fallback={null}>
                      <FarmScene cowList={displayCowList} farmBoundary={farmBoundaryForScene} />
                    </Suspense>
                  </Canvas>

                {/* Scene Controls Overlay */}
                <div className="absolute bottom-3 right-3">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-lime-400/20">
                    <div className="flex items-center space-x-2 text-xs text-gray-300">
                      <span>🖱️ Drag to rotate</span>
                      <span>•</span>
                      <span>🔍 Scroll to zoom</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Actions & Processing */}
            <div className="w-1/4 flex flex-col border-l border-lime-400/30">
              
              {/* Quick Actions */}
              <div className="flex-1 p-4 border-b border-lime-400/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-lime-400 flex items-center">
                  <Zap className="mr-2" size={16} />
                  Quick Actions
                </h3>
                </div>
                <div className="grid gap-3">
                  <Button
                    onClick={(e) => {
                      setIsMarketModalOpen(true);
                      playSound("/sounds/sparkles.mp3");
                      if (sparkleContainerRef.current) {
                        triggerSparkleEffect(e.currentTarget, sparkleContainerRef.current);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-lime-500/90 to-green-500/90 hover:from-lime-400 hover:to-green-400 text-black font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-lime-400/30 transition-all duration-300 border border-lime-400/20 hover:border-lime-400/60 backdrop-blur-sm text-sm flex items-center justify-center group"
                  >
                    <div className="w-4 h-4 relative mr-2 group-hover:scale-110 transition-transform duration-300">
                      <Image 
                        src="/nilk crate.png" 
                        alt="Market" 
                        fill 
                        className="object-contain"
                      />
                    </div>
                    Market
                  </Button>
                  
                  <Link href="/liquidity">
                    <Button
                      className="w-full bg-gradient-to-r from-purple-500/90 to-pink-500/90 hover:from-purple-400 hover:to-pink-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-purple-400/30 transition-all duration-300 border border-purple-400/20 hover:border-purple-400/60 backdrop-blur-sm text-sm flex items-center justify-center group"
                    >
                      <div className="w-4 h-4 relative mr-2 group-hover:scale-110 transition-transform duration-300">
                        <Image 
                          src="/hyperliquid.png" 
                          alt="Liquidity" 
                          fill 
                          className="object-contain"
                        />
                      </div>
                      NILK/HYPE Pool
                    </Button>
                  </Link>
                  
                  <Button
                    onClick={(e) => {
                      setIsCowFusionModalOpen(true);
                      playSound("/sounds/sparkles.mp3");
                      if (sparkleContainerRef.current) {
                        triggerSparkleEffect(e.currentTarget, sparkleContainerRef.current);
                      }
                    }}
                    disabled={displayCowList.length < 2}
                    className="w-full bg-gradient-to-r from-indigo-500/90 to-purple-500/90 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-indigo-400/30 transition-all duration-300 border border-indigo-400/20 hover:border-indigo-400/60 backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none text-sm flex items-center justify-center group"
                  >
                    <div className="w-4 h-4 relative mr-2 group-hover:scale-110 transition-transform duration-300">
                      <Image 
                        src="/cosmic cow.png" 
                        alt="Fusion" 
                        fill 
                        className="object-contain"
                      />
                    </div>
                    Fusion
                  </Button>
                  
                  {displayCowList.length > 0 && (
                    <>
                      <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gradient-to-r from-transparent via-lime-400/30 to-transparent"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-black/50 px-2 text-lime-400/70">Harvest</span>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          handleHarvest(undefined, e.currentTarget);
                          playSound("/sounds/sparkles.mp3");
                        }}
                        className="w-full bg-gradient-to-r from-amber-500/90 to-orange-500/90 hover:from-amber-400 hover:to-orange-400 text-black font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-amber-400/30 transition-all duration-300 border border-amber-400/20 hover:border-amber-400/60 backdrop-blur-sm text-sm flex items-center justify-center group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="w-4 h-4 relative mr-2 group-hover:scale-110 transition-transform duration-300">
                          <Image 
                            src="/smalljar.png" 
                            alt="Harvest" 
                            fill 
                            className="object-contain"
                          />
                        </div>
                        Harvest All
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Processing Station */}
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-lime-400 flex items-center">
                  <Factory className="mr-2" size={16} />
                  Processing
                </h3>
                </div>
                
                {/* Machine Status */}
                <div className="mb-4">
                  {ownedMachines.pro > 0 ? (
                    <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-lg p-3 border border-purple-400/40">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-purple-400 text-sm">NILK Machine PRO</span>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 relative">
                          <Image 
                            src="/nilk machine PRO.png" 
                            alt="NILK Machine PRO" 
                            fill 
                            className="object-contain"
                          />
                      </div>
                        <div className="flex-1">
                          <p className="text-xs text-purple-300 mb-1">Premium Unit</p>
                          <div className="bg-purple-400/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-400 to-purple-300 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <p className="text-xs text-purple-300 mt-1">85% Efficiency</p>
                        </div>
                      </div>
                    </div>
                  ) : ownedMachines.standard > 0 ? (
                    <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-lg p-3 border border-blue-400/40">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-blue-400 text-sm">NILK Machine</span>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 relative">
                          <Image 
                            src="/nilk machine.png" 
                            alt="NILK Machine" 
                            fill 
                            className="object-contain"
                          />
                      </div>
                        <div className="flex-1">
                          <p className="text-xs text-blue-300 mb-1">Standard Unit</p>
                          <div className="bg-blue-400/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-blue-400 to-blue-300 h-2 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                          <p className="text-xs text-blue-300 mt-1">65% Efficiency</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-orange-900/50 to-orange-800/50 rounded-lg p-3 border border-orange-600/40">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-orange-400 text-sm">Manual Processing</span>
                        <div className="text-orange-400 text-xs bg-orange-400/20 px-2 py-1 rounded">ACTIVE</div>
                      </div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 relative">
                          <Image 
                            src="/manual processing.png" 
                            alt="Manual Processing" 
                            fill 
                            className="object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-orange-300 mb-1">Basic Processing</p>
                          <div className="bg-orange-400/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-orange-400 to-orange-300 h-2 rounded-full" style={{ width: '35%' }}></div>
                          </div>
                          <p className="text-xs text-orange-300 mt-1">35% Efficiency</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setIsMarketModalOpen(true);
                          playSound("/sounds/sparkles.mp3");
                        }}
                        className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-black text-xs py-2 font-semibold rounded-lg shadow-lg hover:shadow-lime-500/25 transition-all duration-200 hover:scale-105 flex items-center justify-center"
                      >
                        <div className="w-4 h-4 relative mr-1">
                          <Image 
                            src="/nilk machine.png" 
                            alt="Upgrade" 
                            fill 
                            className="object-contain"
                          />
                        </div>
                        Upgrade Machine
                      </Button>
                    </div>
                  )}
                </div>

                {/* Boost Status */}
                <div className="space-y-2">
                  <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white">Yield Booster</span>
                      <span className="text-lime-400 font-bold text-xs">Lvl {yieldBoosterLevelFromStore}</span>
                    </div>
                  </div>
                  
                  <div className={`rounded-lg p-2 border ${hasMoofiBadge ? 'bg-yellow-900/30 border-yellow-400/30' : 'bg-gray-800/30 border-gray-600/30'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 relative">
                          <Image 
                            src="/MOOFI badge.png" 
                            alt="MOOFI Badge" 
                            fill 
                            className={`object-contain ${!hasMoofiBadge ? 'opacity-50 grayscale' : ''}`}
                          />
                        </div>
                        <span className="text-xs">MOOFI Badge</span>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${hasMoofiBadge ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-600/20 text-gray-400'}`}>
                        {hasMoofiBadge ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`rounded-lg p-2 border ${hasAlienFarmerBoost ? 'bg-purple-900/30 border-purple-400/30' : 'bg-gray-800/30 border-gray-600/30'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 relative">
                          <Image 
                            src="/farmer.png" 
                            alt="Alien Farmer" 
                            fill 
                            className={`object-contain ${!hasAlienFarmerBoost ? 'opacity-50 grayscale' : ''}`}
                          />
                        </div>
                        <span className="text-xs">Alien Farmer</span>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${hasAlienFarmerBoost ? 'bg-purple-400/20 text-purple-400' : 'bg-gray-600/20 text-gray-400'}`}>
                        {hasAlienFarmerBoost ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Bottom: Cow Herd Inventory */}
          <div className="mt-2">
            <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 border-2 border-lime-400/40 shadow-2xl min-h-48">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-lime-400 flex items-center">
                  <div className="w-6 h-6 relative mr-2">
                    <Image 
                      src="/NILK COW.png" 
                      alt="Cow Herd" 
                      fill 
                      className="object-contain"
                    />
                  </div>
                  Cow Herd ({displayCowList.length})
                </h3>
                <div className="text-sm text-gray-300 flex items-center space-x-2">
                  <TrendingUp className="text-lime-400" size={14} />
                  <span>
                    <span className="text-lime-400 font-bold">
                    {displayCowList.length > 0 ? Math.round((countReadyToHarvest(displayCowList, getHarvestStatus) / displayCowList.length) * 100) : 0}%
                    </span> Ready
                  </span>
                </div>
              </div>
              
              {displayCowList.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="text-gray-400 mb-3">
                      <div className="w-12 h-12 relative mx-auto mb-2">
                        <Image 
                          src="/NILK COW.png" 
                          alt="Empty Farm" 
                          fill 
                          className="object-contain opacity-50"
                        />
                      </div>
                      <p className="text-sm font-bold">Your farm is empty!</p>
                      <p className="text-xs">Get some cows to start producing NILK</p>
                  </div>
                  <Button
                    onClick={() => {
                      setIsMarketModalOpen(true);
                      playSound("/sounds/sparkles.mp3");
                    }}
                      className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-black font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-lime-500/25 transition-all duration-200 hover:scale-105 text-sm"
                  >
                      Get Your First Cow
                  </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-4 max-h-32 overflow-y-auto pr-2 py-1">
                  {displayCowList.map((cow) => {
                    const harvestStatus = getHarvestStatus(cow);
                    return (
                      <div 
                        key={cow.id} 
                        className={`relative bg-gradient-to-br ${getRarityGradient(cow.rarity)} rounded-xl p-2 border ${getRarityBorder(cow.rarity)} shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group ${harvestStatus.canHarvest ? 'hover:scale-[1.02] hover:shadow-lime-400/20' : 'hover:scale-[1.01] hover:shadow-white/10'}`}
                        onClick={(e) => {
                          if (harvestStatus.canHarvest) {
                            handleHarvest(cow.id, e.currentTarget);
                            playSound("/sounds/sparkles.mp3");
                          }
                        }}
                      >
                        {/* Cow Avatar */}
                        <div className="relative mb-1">
                          <div className="w-10 h-10 bg-gray-800/30 rounded-full flex items-center justify-center border border-gray-500/50 group-hover:border-lime-400/80 transition-all duration-300 overflow-hidden backdrop-blur-sm">
                            <div className="w-8 h-8 relative">
                              <Image 
                                src={cow.rarity === 'Galactic' ? '/galactic moo moo.png' : 
                                     cow.rarity === 'Cosmic' ? '/cosmic cow.png' : 
                                     '/NILK COW.png'} 
                                alt={cow.name} 
                                fill 
                                className="object-contain"
                              />
                            </div>
                          </div>
                          {harvestStatus.canHarvest && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-lime-400 rounded-full animate-ping"></div>
                          )}
                        </div>
                        
                        {/* Cow Info */}
                        <div className="text-center">
                          <p className="text-xs font-bold text-white truncate">{cow.name}</p>
                          <p className="text-xs text-lime-400 font-semibold">Lvl {cow.level}</p>
                          {harvestStatus.canHarvest ? (
                            <div className="text-xs text-lime-400 font-bold">Ready!</div>
                          ) : (
                            <div className="text-xs text-gray-400">{harvestStatus.timeRemaining}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Buy More Cows Card */}
                  <div 
                    className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-2 border border-dashed border-lime-400/50 shadow-md hover:shadow-lg hover:shadow-lime-500/20 transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:border-lime-400/80 backdrop-blur-sm"
                    onClick={() => {
                      setIsMarketModalOpen(true);
                      playSound("/sounds/sparkles.mp3");
                    }}
                  >
                    {/* Plus Icon Avatar */}
                    <div className="relative mb-1">
                      <div className="w-10 h-10 bg-lime-900/20 rounded-full flex items-center justify-center border border-lime-400/50 group-hover:border-lime-400/80 group-hover:bg-lime-800/30 transition-all duration-300 backdrop-blur-sm">
                        <Plus className="w-5 h-5 text-lime-400" />
                      </div>
                    </div>
                    
                    {/* Buy Info */}
                    <div className="text-center">
                      <p className="text-xs font-bold text-lime-400">Buy More</p>
                      <p className="text-xs text-lime-300 font-semibold">Cows</p>
                      <div className="text-xs text-gray-400">Expand!</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Marketplace
        isOpen={isMarketModalOpen}
        onClose={() => setIsMarketModalOpen(false)}
        items={initialMarketItems}
        handleInitiatePurchase={handleInitiateMarketPurchase}
        isOwnedAlienFarmerBoost={hasAlienFarmerBoost}
        isOwnedMoofiBadge={hasMoofiBadge}
        userNilkBalance={userNilkBalance}
        userRawNilkBalance={userRawNilkBalance}
      />

      {/* Purchase Confirmation Modal */}
      {isConfirmingPurchase && itemToPurchase && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 border border-lime-400/30 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-lime-400">Confirm Purchase</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to purchase {itemToPurchase.name}?
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setIsConfirmingPurchase(false);
                  setItemToPurchase(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => handleConfirmMarketPurchase(itemToPurchase, '$NILK', e, 1, itemToPurchase.cost || 0)}
                className="flex-1 bg-lime-500 hover:bg-lime-600 text-black"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cow Fusion Modal */}
      {isCowFusionModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 border border-lime-400/30 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-lime-400">Cow Fusion Chamber</h3>
            <p className="text-gray-300 mb-4">
              Select cows to fuse together for more powerful variants.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setIsCowFusionModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmFusion}
                className="flex-1 bg-lime-500 hover:bg-lime-600 text-black"
              >
                Fuse Cows
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Sparkle Effect Container */}
      <div ref={sparkleContainerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-[150]" />
    </div>
  );
}

// Helper function to calculate total farm production
const calculateTotalProduction = (cowList: CowListItem[]) => {
  return cowList.reduce((sum, cow) => sum + cow.rawNilkPerDay, 0);
};

// Helper function to count ready-to-harvest cows
const countReadyToHarvest = (cowList: CowListItem[], getHarvestStatus: (cow: CowListItem) => any) => {
  return cowList.filter(cow => getHarvestStatus(cow).canHarvest).length;
};

// Helper function to format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

// Initial cow data, adjusted for RawNilkPerDay
const cowsData: CowListItem[] = [
  { id: "1", name: "Milky Wayfarer", image: "/NILK COW.png", rarity: "Common", level: 1, tier: "common", rawNilkPerDay: 10, lastHarvestTime: 0, harvestCooldownHours: 6, modelPath: DEFAULT_COW_MODEL_PATH },
  // ... (rest of the initial cow data)
];

// Old upgradeItems - REMOVED as 'upgrades' array is now defined dynamically using COW_STATS.
// const upgradeItems: UpgradeItem[] = [ ... ];

// Helper component for Consumable Timer
const ConsumableTimer: React.FC<{ expiryTime: number }> = ({ expiryTime }) => {
  const [timeLeft, setTimeLeft] = useState(expiryTime - Date.now());

  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      const newTimeLeft = expiryTime - Date.now();
      if (newTimeLeft <= 0) {
        setTimeLeft(0);
        clearInterval(intervalId);
        // Optionally, trigger a re-check/clear action from the store if needed, though _simulateAccumulation should handle it.
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [expiryTime, timeLeft]);

  if (timeLeft <= 0) return <span className="text-red-500">Expired</span>;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span>
      {hours > 0 ? `${hours}h ` : ''}
      {minutes > 0 || hours > 0 ? `${minutes}m ` : ''}
      {`${seconds}s`}
    </span>
  );
};



