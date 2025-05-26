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
                  <h4 className="font-medium text-lime-300 mb-1 text-base"> Farm Enhancements </h4>
                  <p className="text-gray-300 text-sm">
                    - <strong className="text-lime-400">Cow Evolution:</strong> Level up individual cows (up to Lvl 10) to increase their `rawNilkPerDay` using $NILK. Cost scales with level.
                    <br/>- <strong className="text-lime-400">Yield Booster:</strong> A global farm upgrade that boosts `rawNilkPerDay` for ALL cows by 15% per level. Cost scales with level.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">4. The Nilk Factory: From Raw to Riches</h3>
              <p className="text-gray-300 text-sm mb-3">
                The Nilk Factory (link in the header) is where you convert your accumulated Raw Nilk into valuable $NILK tokens. Different machines offer varying efficiency.
              </p>
              <div className="space-y-3">
                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                  <h4 className="font-medium text-lime-300 mb-1 text-base flex items-center">
                     <img src="/icons/manual_processing_icon.svg" alt="Manual Processing" className="w-7 h-7 mr-2 invert brightness-150 sepia-[0.2] hue-rotate-[60deg] saturate-[3] p-0.5 rounded" /> Manual Processing
                  </h4>
                  <div className="flex items-center">
                    <img src="/smalljar.png" alt="Small Jar" className="w-10 h-10 mr-3 rounded-md object-contain bg-lime-900/30 p-1"/>
                    <div>
                      <p className="text-gray-300 text-sm">
                        Rate: <strong className="text-white">20%</strong> (Raw Nilk to $NILK value)
                        <br/>Fee: <strong className="text-white">15%</strong> (of $NILK processed)
                        <br/><em className="text-xs text-gray-400">Default, no machine needed. Less efficient.</em>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                  <h4 className="font-medium text-lime-300 mb-1 text-base flex items-center">
                    <img src="/nilk machine.png" alt="Standard Machine" className="w-7 h-7 mr-2 bg-lime-900/30 p-0.5 rounded" /> Standard Nilk Machine
                  </h4>
                  <div className="flex items-center">
                     <img src="/smalljar.png" alt="Small Jar" className="w-12 h-12 mr-3 rounded-md object-contain bg-lime-900/30 p-1"/> {/* Re-using small jar for standard output visual */}
                    <div>
                      <p className="text-gray-300 text-sm">
                        Rate: <strong className="text-white">30%</strong> | Fee: <strong className="text-white">10%</strong>
                        <br/>Cost: <strong className="text-white">500 $NILK</strong>
                        <br/><em className="text-xs text-gray-400">A good balance for starting producers.</em>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                   <h4 className="font-medium text-lime-300 mb-1 text-base flex items-center">
                     <img src="/nilk machine PRO.png" alt="Pro Machine" className="w-7 h-7 mr-2 bg-lime-900/30 p-0.5 rounded" /> Pro Nilk Machine
                  </h4>
                  <div className="flex items-center">
                    <img src="/gallonjug.png" alt="Gallon Jug" className="w-12 h-12 mr-3 rounded-md object-contain bg-lime-900/30 p-1"/>
                    <div>
                      <p className="text-gray-300 text-sm">
                        Rate: <strong className="text-white">40%</strong> | Fee: <strong className="text-white">5%</strong>
                        <br/>Cost: <strong className="text-white">2500 $NILK</strong> (or fuse 2 Standards)
                        <br/><em className="text-xs text-gray-400">Maximum efficiency for serious farmers.</em>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title flex items-center">
                <img src="/nilk token.png" alt="$NILK Token" className="w-8 h-8 mr-2 bg-lime-900/30 p-0.5 rounded-full" />5. The $NILK Token: Fuel Your Growth
              </h3>
              <p className="text-gray-300 text-sm mb-2">
                $NILK is the primary ERC20 utility token of the GOT NILK? ecosystem on Hyperliquid.
              </p>
              <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50 text-sm">
                <p className="text-gray-300">- <strong className="text-lime-300">Total Supply:</strong> 1 Billion $NILK (fixed).</p>
                <p className="text-gray-300">- <strong className="text-lime-300">Launch:</strong> Via Fair Launch on a Hyperliquid platform.</p>
                <p className="text-gray-300">- <strong className="text-lime-300">Core Utility:</strong> Used for purchasing Cows, Machines, Cow Evolution, Yield Boosters, and paying Fusion Fees.</p>
              </div>
            </section>
            
            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">6. Advanced Strategies: Fusion</h3>
              <p className="text-gray-300 text-sm mb-3">
                Fusion allows you to combine lower-tier assets into more powerful ones, often more cost-effectively than direct purchase.
              </p>
              <div className="space-y-3">
                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                  <h4 className="font-medium text-lime-300 mb-1 text-base">Cow Fusion</h4>
                  <div className="flex flex-col sm:flex-row items-center justify-around text-center text-sm p-2">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <img src="/NILK COW.png" alt="Common Cow" className="w-8 h-8 rounded bg-lime-800/30 p-0.5"/> 
                      <span className="text-gray-300 mx-1">+</span>
                      <img src="/NILK COW.png" alt="Common Cow" className="w-8 h-8 rounded bg-lime-800/30 p-0.5"/>
                    </div>
                    <span className="text-lime-400 font-bold mx-2 text-xl">➔</span>
                    <img src="/cosmic cow.png" alt="Cosmic Cow" className="w-10 h-10 rounded bg-lime-800/30 p-1"/>
                  </div>
                  <p className="text-gray-300 text-xs text-center mt-1">2x Tier 1 Common + 100 $NILK Fee = 1x Tier 2 Cosmic Cow</p>
                  <hr className="border-lime-700/50 my-2"/>
                  <div className="flex flex-col sm:flex-row items-center justify-around text-center text-sm p-2">
                     <div className="flex items-center mb-2 sm:mb-0">
                        <img src="/cosmic cow.png" alt="Cosmic Cow" className="w-8 h-8 rounded bg-lime-800/30 p-0.5"/> <span className="text-gray-300 mx-0.5">+</span>
                        <img src="/cosmic cow.png" alt="Cosmic Cow" className="w-8 h-8 rounded bg-lime-800/30 p-0.5"/> <span className="text-gray-300 mx-0.5">+</span>
                        <img src="/cosmic cow.png" alt="Cosmic Cow" className="w-8 h-8 rounded bg-lime-800/30 p-0.5"/> <span className="text-gray-300 mx-0.5">+</span>
                        <img src="/cosmic cow.png" alt="Cosmic Cow" className="w-8 h-8 rounded bg-lime-800/30 p-0.5"/>
                    </div>
                    <span className="text-lime-400 font-bold mx-2 text-xl">➔</span>
                    <img src="/galactic moo moo.png" alt="Galactic Moo Moo" className="w-10 h-10 rounded bg-lime-800/30 p-1"/>
                  </div>
                  <p className="text-gray-300 text-xs text-center mt-1">4x Tier 2 Cosmic + 400 $NILK Fee = 1x Tier 3 Galactic Moo Moo</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50">
                  <h4 className="font-medium text-lime-300 mb-1 text-base">Machine Fusion</h4>
                   <div className="flex flex-col sm:flex-row items-center justify-around text-center text-sm p-2">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <img src="/nilk machine.png" alt="Standard Machine" className="w-8 h-8 rounded bg-lime-800/30 p-0.5"/>
                      <span className="text-gray-300 mx-1">+</span>
                      <img src="/nilk machine.png" alt="Standard Machine" className="w-8 h-8 rounded bg-lime-800/30 p-0.5"/>
                    </div>
                    <span className="text-lime-400 font-bold mx-2 text-xl">➔</span>
                    <img src="/nilk machine PRO.png" alt="Pro Machine" className="w-10 h-10 rounded bg-lime-800/30 p-1"/>
                  </div>
                  <p className="text-gray-300 text-xs text-center mt-1">2x Standard Machines + 250 $NILK Fee = 1x Pro Machine</p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">7. Treasury & Sustainability</h3>
              <div className="bg-black/30 p-3 rounded-lg border border-lime-800/50 text-sm">
                <p className="text-gray-300 mb-1">
                  The in-game Treasury is vital for a healthy economy. It collects $NILK from processing fees and all $NILK sinks (purchases, fusion fees).
                </p>
                <p className="text-gray-300">
                  The Treasury's primary function is to <strong className="text-lime-300">Buyback & Burn/Redistribute $NILK</strong> from the market, managing supply and rewarding players.
                </p>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-lime-400 mb-2 font-title">8. Placeholder for Detailed Tokenomics</h3>
               <p className="text-gray-300 text-sm">
                For a complete breakdown of token distribution, vesting schedules (if any for team/project allocation), and more intricate economic details, please refer to our official <code className="bg-lime-900/70 text-lime-300 px-1 py-0.5 rounded text-xs">TOKENOMICS.md</code> document available in our community channels or project repository.
              </p>
            </section>
            
            <div className="text-center mt-8">
              <Button onClick={() => setShowInfoModal(false)} className="w-full bg-lime-500 hover:bg-lime-600 text-black font-semibold py-2.5 text-base font-title mt-6">
                Got It, Let's Play!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 