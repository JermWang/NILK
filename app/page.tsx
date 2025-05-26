"use client";

import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Text, useTexture, Plane, ContactShadows, Html, Stars } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Info, Play, XCircle } from 'lucide-react';
import * as THREE from 'three';

// GLTF Model Loader
function Model({ modelPath, ...props }: { modelPath: string;[key: string]: any }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const clonedScene = scene.clone();

  // Optional: Add animation to the model if needed
  // useFrame((state) => {
  //   if (group.current) {
  //     group.current.rotation.y += 0.005;
  //   }
  // });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  );
}

const PARTICLE_IMAGE_PATHS = [
  '/NILK COW.png',
  '/galactic moo moo.png',
  '/cosmic cow.png'
];

const NUM_PARTICLES = 30; // Reduced
const PARTICLE_SPEED_MIN = 0.002; // Slower
const PARTICLE_SPEED_MAX = 0.008; // Slower
const PARTICLE_SIZE_MIN = 0.2;   // Smaller
const PARTICLE_SIZE_MAX = 0.5;   // Smaller
const VIEW_HEIGHT = 10;
const VIEW_WIDTH = 15;

function RainParticle({ texture, initialPosition, speed, size }: {
  texture: THREE.Texture;
  initialPosition: THREE.Vector3;
  speed: number;
  size: number;
}) {
  const meshRef = useRef<THREE.Sprite>(null!);
  const randomRotationSpeed = useMemo(() => (Math.random() - 0.5) * 0.02, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.y -= speed + (delta * speed * 30);
      meshRef.current.position.x += Math.sin(meshRef.current.position.y * 0.5 + initialPosition.x) * 0.002;
      meshRef.current.rotation.z += randomRotationSpeed;

      if (meshRef.current.position.y < -VIEW_HEIGHT / 2 - size) {
        meshRef.current.position.y = VIEW_HEIGHT / 2 + size;
        meshRef.current.position.x = (Math.random() - 0.5) * VIEW_WIDTH;
        meshRef.current.rotation.z = Math.random() * Math.PI * 2;
      }
    }
  });

  return (
    <sprite ref={meshRef} position={[initialPosition.x, initialPosition.y, initialPosition.z]} scale={[size, size, size]}>
      <spriteMaterial map={texture as any} transparent alphaTest={0.1} opacity={0.8} rotation={Math.random() * Math.PI * 2} />
    </sprite>
  );
}

const ParticleRain = () => {
  const textures = useTexture(PARTICLE_IMAGE_PATHS) as any[];

  const particles = useMemo(() => {
    return Array.from({ length: NUM_PARTICLES }).map((_, i) => {
      const texture = textures[i % textures.length];
      const x = (Math.random() - 0.5) * VIEW_WIDTH;
      const y = (Math.random() - 0.5) * VIEW_HEIGHT + VIEW_HEIGHT / 2;
      const z = (Math.random() - 0.5) * 5 - 3;
      const speed = Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN) + PARTICLE_SPEED_MIN;
      const size = Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) + PARTICLE_SIZE_MIN;
      return {
        id: i,
        texture,
        initialPosition: new THREE.Vector3(x, y, z),
        speed,
        size
      };
    });
  }, [textures]);

  if (textures.some(t => !t)) {
    return null;
  }

  return (
    <group>
      {particles.map(p => (
        <RainParticle 
          key={p.id} 
          texture={p.texture as any}
          initialPosition={p.initialPosition} 
          speed={p.speed} 
          size={p.size} 
        />
      ))}
    </group>
  );
};

export default function LandingPage() {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-green-900 to-black text-white overflow-hidden flex flex-col justify-center items-center">
      {/* Canvas for 3D Model & Particle Rain */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 1, 8], fov: 50 }} shadows>
          <Suspense fallback={null}>
            <ambientLight intensity={0.8} />
            <directionalLight 
              position={[5, 10, 5]} 
              intensity={1.5} 
              castShadow 
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Model modelPath="/MODELS/COW.glb" position={[0, 0, 0]} scale={3.0} rotation={[0, -Math.PI / 4, 0]}/>
            <Environment preset="sunset" blur={0.3}/>
            <OrbitControls 
                enableZoom={true} 
                enablePan={true} 
                minDistance={4}
                maxDistance={20}
                minAzimuthAngle={-Math.PI / 4}
                maxAzimuthAngle={Math.PI / 4}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={(2 * Math.PI) / 3}
                target={[0, 0, 0]}
            />
            <ParticleRain />
          </Suspense>
        </Canvas>
      </div>

      {/* Overlay Content (Title, Buttons) */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-8">
        {/* Spacer to push content down a bit, adjust as needed */}
        <div className="flex-grow" />

        <div className="mb-12"> {/* Restored original margin for this container */}
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-lime-400 via-green-400 to-lime-500 bg-clip-text text-transparent font-title">
              GOT NILK?
            </h1>
            <p className="text-xl md:text-2xl text-green-200 mb-12 font-sans"> {/* Original margin for tagline paragraph itself */}
              The Cosmic DeFi Experience on Hyperliquid.
            </p>
        </div>


        {/* Buttons - Visually lifted with transform, layout position unchanged */}
        <div className="flex space-x-4 w-full max-w-md px-4 mx-auto -translate-y-20">
          <Button 
            variant="outline" 
            className="flex-1 bg-black/50 border-lime-500 hover:bg-lime-700/30 text-lime-300 hover:text-lime-100 py-3 text-lg font-title"
            onClick={() => setShowInfoModal(true)}
          >
            <Info className="mr-2 h-5 w-5" />
            Learn More
          </Button>
          <Link href="/farm" passHref legacyBehavior className="flex-1">
            <Button className="flex-1 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-black font-semibold py-3 text-lg font-title">
              <Play className="mr-2 h-5 w-5" />
              Play Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Modal (Placeholder) */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-lime-600/70 rounded-xl shadow-2xl shadow-lime-500/30 p-6 sm:p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-lime-700 scrollbar-track-gray-800 pt-20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-lime-300 font-title flex items-center">
                <Info size={28} className="mr-3 text-lime-400" /> How to Play GOT NILK?
              </h2>
              <Button onClick={() => setShowInfoModal(false)} variant="ghost" className="text-gray-400 hover:text-lime-300 p-1 h-auto">
                <XCircle size={28} />
              </Button>
            </div>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">1. Welcome, Space Farmer!</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                GOT NILK? is a gamified DeFi adventure on the Hyperliquid EVM. Your mission is to build a thriving cosmic cow farm, harvest valuable Raw Nilk, process it into the coveted $NILK token, and dominate the galactic dairy market!
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">2. Getting Started: Connect Your Wallet</h3>
              <div className="flex items-center bg-black/30 p-3 rounded-lg border border-lime-800/50">
                <span className="text-lime-500 text-2xl mr-3">➔</span>
                <p className="text-gray-300 text-sm">
                  To begin your journey, connect your Web3 wallet (e.g., MetaMask). This is your key to interacting with the game on the Hyperliquid network. Look for the <code className="bg-lime-900/70 text-lime-300 px-1 py-0.5 rounded text-xs">Connect Wallet</code> button.
                </p>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">3. Your Farm: The Raw Nilk Source</h3>
              <div className="space-y-3">
                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                  <h4 className="font-medium text-lime-300 mb-2 text-base flex items-center">
                    <img src="/NILK COW.png" alt="Cow Icon" className="w-7 h-7 mr-2 bg-lime-900/30 p-0.5 rounded" /> Cosmic Cows: Your Assets
                  </h4>
                  <p className="text-gray-300 text-sm mb-2">
                    These are your primary Raw Nilk generators. Higher tier cows produce more!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <div className="text-center bg-black/20 p-2 rounded border border-lime-700/50">
                      <img src="/NILK COW.png" alt="Common Cow" className="w-12 h-12 mx-auto mb-1 bg-lime-800/40 rounded-md p-1"/>
                      <p className="text-xs font-semibold text-lime-300">Tier 1: Common</p>
                      <p className="text-xs text-gray-400">Base: 10 Raw Nilk/day</p>
                    </div>
                    <div className="text-center bg-black/20 p-2 rounded border border-lime-700/50">
                      <img src="/cosmic cow.png" alt="Cosmic Cow" className="w-12 h-12 mx-auto mb-1 bg-lime-800/40 rounded-md p-1"/>
                      <p className="text-xs font-semibold text-lime-300">Tier 2: Cosmic</p>
                      <p className="text-xs text-gray-400">Base: 25 Raw Nilk/day</p>
                    </div>
                    <div className="text-center bg-black/20 p-2 rounded border border-lime-700/50">
                      <img src="/galactic moo moo.png" alt="Galactic Moo Moo" className="w-12 h-12 mx-auto mb-1 bg-lime-800/40 rounded-md p-1"/>
                      <p className="text-xs font-semibold text-lime-300">Tier 3: Galactic</p>
                      <p className="text-xs text-gray-400">Base: 70 Raw Nilk/day</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    <strong className="text-lime-400">Acquiring:</strong> Buy cows from the "Farm Upgrades" panel or fuse them (see Advanced Strategies).
                  </p>
                </div>

                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                  <h4 className="font-medium text-lime-300 mb-1 text-base"> Harvesting Raw Nilk </h4>
                  <p className="text-gray-300 text-sm">
                    Cows generate Raw Nilk continuously, but you must click them or "Harvest All" on the Farm page to collect it. Each cow has a harvest cooldown.
                  </p>
                </div>

                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                    <h4 className="font-medium text-lime-300 mb-2 text-base flex items-center">
                        <img src="/MOOFI badge.png" alt="MOOFI Badge Icon" className="w-7 h-7 mr-2 bg-lime-900/30 p-0.5 rounded" /> The MOOFI Badge: Boost Your Gains!
                    </h4>
                    <p className="text-gray-300 text-sm">
                        Holding a MOOFI Badge NFT gives you a <strong className="text-lime-400">permanent +10% boost</strong> to all Raw Nilk harvesting on your farm. It's a one-time purchase that pays dividends forever! You can get it from the "Farm Upgrades" panel.
                    </p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">4. Nilk Factory: Processing & Tokenizing</h3>
              <div className="space-y-3">
                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                  <h4 className="font-medium text-lime-300 mb-1 text-base"> From Raw to Refined </h4>
                  <p className="text-gray-300 text-sm">
                    Raw Nilk isn't spendable. Take it to the Nilk Factory to process it into $NILK tokens. This is the lifeblood of the GOT NILK? economy.
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                  <h4 className="font-medium text-lime-300 mb-2 text-base flex items-center">
                    <img src="/manual processing.png" alt="Manual Processor Icon" className="w-7 h-7 mr-2 bg-lime-900/30 p-0.5 rounded" /> Manual Processors
                  </h4>
                  <p className="text-gray-300 text-sm mb-2">
                    The basic way to process. Converts Raw Nilk to $NILK at a 1:1 ratio (e.g., 10 Raw Nilk → 10 $NILK). Requires manual clicking.
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong className="text-lime-400">Acquiring:</strong> Purchase from "Farm Upgrades".
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                  <h4 className="font-medium text-lime-300 mb-2 text-base flex items-center">
                    <img src="/nilk machine.png" alt="Automated Machine Icon" className="w-7 h-7 mr-2 bg-lime-900/30 p-0.5 rounded" /> Automated Nilk Machines
                  </h4>
                  <p className="text-gray-300 text-sm mb-2">
                    These beauties process Raw Nilk automatically over time. Different tiers have different processing speeds and capacities.
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong className="text-lime-400">Acquiring:</strong> Available in the "Processing" section of the game.
                  </p>
                </div>
              </div>
            </section>
            
            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">5. Fusion Chamber: Advanced Strategies</h3>
              <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                <h4 className="font-medium text-lime-300 mb-2 text-base flex items-center">
                  <img src="/nilk token.png" alt="Fusion Icon" className="w-7 h-7 mr-2 bg-lime-900/30 p-0.5 rounded" /> Combine for Power!
                </h4>
                <p className="text-gray-300 text-sm mb-2">
                  Got multiple lower-tier cows or machines? Use the Fusion Chamber to combine them into higher-tier, more powerful versions!
                </p>
                <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 pl-2">
                    <li><strong className="text-lime-400">Cows:</strong> 3x Common → 1x Cosmic. 3x Cosmic → 1x Galactic.</li>
                    <li><strong className="text-lime-400">Machines:</strong> (Details vary by machine type and tier)</li>
                </ul>
                <p className="text-gray-300 text-sm mt-2">
                  Fusion costs some $NILK. It's a strategic way to upgrade your assets without direct purchase.
                </p>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">6. The $NILK Token & Economy</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                $NILK is the central ERC-20 utility token. Use it to buy upgrades, perform fusions, and participate in future governance. The supply is managed through in-game mechanics. More features to come!
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">7. Tips for Success</h3>
              <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 pl-2">
                <li> Regularly harvest your Raw Nilk. Don't let it sit idle!</li>
                <li> Invest in processors early to start accumulating $NILK.</li>
                <li> Consider the MOOFI Badge for a long-term Raw Nilk boost.</li>
                <li> Strategically fuse assets to maximize efficiency.</li>
                <li> Keep an eye out for special events and new features!</li>
              </ul>
            </section>

            <div className="mt-8 text-center">
                <Button onClick={() => setShowInfoModal(false)} className="bg-lime-500 hover:bg-lime-600 text-black font-semibold py-2 px-6 text-lg font-title">
                    Got It, Let's Farm!
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

