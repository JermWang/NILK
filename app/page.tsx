"use client";

import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Text, useTexture, Plane, ContactShadows, Html, Stars } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Info, Play, XCircle, Rocket, Sparkles, TrendingUp, Zap, Repeat } from 'lucide-react';
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

export default function InfoPage() {
  // const [showInfoModal, setShowInfoModal] = useState(false); // Removed

  return (
    // Main container for the informational content
    <div className="fixed inset-0 bg-gradient-to-br from-black via-green-900 to-black text-white overflow-hidden flex flex-col items-center pt-24 pb-10 px-4">
      {/* Stars Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 1, 8], fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
            {/* Environment preset="sunset" blur={0.3}/> // Optional, can be kept or removed */}
          </Suspense>
        </Canvas>
      </div>

      {/* Info Content - Extracted from the modal */}
      <div className="relative z-10 bg-gradient-to-br from-gray-900/80 via-black/70 to-gray-900/80 border-2 border-lime-600/70 rounded-xl shadow-2xl shadow-lime-500/30 p-6 sm:p-8 max-w-3xl w-full my-8 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-lime-700 scrollbar-track-gray-800">
        {/* Removed the XCircle button as this is no longer a modal */}
        <div className="flex items-center mb-6"> {/* Removed justify-between */}
          <Info size={32} className="mr-3 text-lime-400 flex-shrink-0" />
          <h2 className="text-3xl sm:text-4xl font-bold text-lime-300 font-title">
            How to Play GOT NILK?
          </h2>
        </div>

        <section className="mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-lime-400 mb-2 font-title">1. Welcome, Space Farmer!</h3>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            GOT NILK? is a gamified DeFi adventure on the Hyperliquid EVM. Your mission is to build a thriving cosmic cow farm, harvest valuable Raw Nilk, process it into the coveted $NILK token, and dominate the galactic dairy market!
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-lime-400 mb-2 font-title">2. Getting Started: Connect Your Wallet</h3>
          <div className="flex items-start sm:items-center bg-black/30 p-3 sm:p-4 rounded-lg border border-lime-800/50 space-x-3">
            <span className="text-lime-500 text-2xl sm:text-3xl mt-1 sm:mt-0">➔</span>
            <p className="text-gray-300 text-sm sm:text-base">
              To begin your journey, connect your Web3 wallet (e.g., MetaMask). This is your key to interacting with the game on the Hyperliquid network. Look for the <code className="bg-lime-900/70 text-lime-300 px-1.5 py-0.5 rounded text-xs">Connect Wallet</code> button, usually in the top navigation bar.
            </p>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-lime-400 mb-2 font-title">3. Your Farm: The Raw Nilk Source</h3>
          <div className="space-y-4">
            <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-lime-800/50">
              <h4 className="font-medium text-lime-300 mb-2 text-lg flex items-center">
                <img src="/NILK COW.png" alt="Cow Icon" className="w-8 h-8 mr-2 bg-lime-900/30 p-0.5 rounded" /> Cosmic Cows: Your Assets
              </h4>
              <p className="text-gray-300 text-sm sm:text-base mb-3">
                These are your primary Raw Nilk generators. Higher tier cows produce more!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="text-center bg-black/20 p-3 rounded border border-lime-700/50">
                  <img src="/NILK COW.png" alt="Common Cow" className="w-14 h-14 mx-auto mb-1.5 bg-lime-800/40 rounded-md p-1"/>
                  <p className="text-sm font-semibold text-lime-300">Tier 1: Common</p>
                  <p className="text-xs text-gray-400">Base: 10 Raw Nilk/day</p>
                </div>
                <div className="text-center bg-black/20 p-3 rounded border border-lime-700/50">
                  <img src="/cosmic cow.png" alt="Cosmic Cow" className="w-14 h-14 mx-auto mb-1.5 bg-lime-800/40 rounded-md p-1"/>
                  <p className="text-sm font-semibold text-lime-300">Tier 2: Cosmic</p>
                  <p className="text-xs text-gray-400">Base: 25 Raw Nilk/day</p>
                </div>
                <div className="text-center bg-black/20 p-3 rounded border border-lime-700/50">
                  <img src="/galactic moo moo.png" alt="Galactic Moo Moo" className="w-14 h-14 mx-auto mb-1.5 bg-lime-800/40 rounded-md p-1"/>
                  <p className="text-sm font-semibold text-lime-300">Tier 3: Galactic</p>
                  <p className="text-xs text-gray-400">Base: 70 Raw Nilk/day</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">
                <strong className="text-lime-400">Acquiring:</strong> Buy cows from the "Farm Market" (accessible from the Farm page) or fuse them (see Advanced Strategies).
              </p>
            </div>

            <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-lime-800/50">
              <h4 className="font-medium text-lime-300 mb-1.5 text-lg"> Harvesting Raw Nilk </h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Cows generate Raw Nilk continuously, but you must click them or "Harvest All" on the Farm page to collect it. Each cow has a harvest cooldown.
              </p>
            </div>
            <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-lime-800/50">
                <h4 className="font-medium text-lime-300 mb-1.5 text-lg"> Evolving Cows </h4>
                <p className="text-gray-300 text-sm sm:text-base">
                    Level up your cows through "Cow Evolution" in the Farm Market to increase their Raw Nilk yield by 15% (compounding) per level. Max level is 10.
                </p>
            </div>
            <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-lime-800/50">
                <h4 className="font-medium text-lime-300 mb-1.5 text-lg"> Yield Booster </h4>
                <p className="text-gray-300 text-sm sm:text-base">
                    Upgrade the global "Yield Booster" in the Farm Market to increase Raw Nilk production for ALL your cows by 10% (compounding) per level.
                </p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-lime-400 mb-2 font-title">4. Nilk Factory: Processing Raw Nilk</h3>
          <div className="space-y-3">
            <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-lime-800/50">
                <h4 className="font-medium text-lime-300 mb-2 text-lg flex items-center">
                    <img src="/nilk machine.png" alt="Processing Machine Icon" className="w-8 h-8 mr-2 bg-lime-900/30 p-0.5 rounded" /> Turning Raw to Real $NILK
                </h4>
                <p className="text-gray-300 text-sm sm:text-base mb-2">
                    Raw Nilk isn\'t directly usable for major upgrades. You need to process it into $NILK tokens.
                </p>
                <p className="text-gray-300 text-sm sm:text-base">
                    Head to the "Nilk Factory" page. Here, you can purchase processors (Manual, Automated, etc.) that convert Raw Nilk into $NILK over time, or instantly for a fee. Better machines offer better efficiency and speed.
                </p>
            </div>
             <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-lime-800/50">
                <h4 className="font-medium text-lime-300 mb-1.5 text-lg">MOOFI Supporter Badge</h4>
                 <p className="text-gray-300 text-sm sm:text-base">
                    Consider purchasing the MOOFI Supporter Badge from the Farm Market. It grants a permanent 5% boost to all Raw Nilk to $NILK conversion efficiency in the Nilk Factory.
                </p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-lime-400 mb-2 font-title">5. Fusion Chamber: Advanced Cow Breeding</h3>
           <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-lime-800/50">
                <h4 className="font-medium text-lime-300 mb-2 text-lg flex items-center">
                    <img src="/nilk machine PRO.png" alt="Fusion Icon" className="w-8 h-8 mr-2 bg-lime-900/30 p-0.5 rounded" /> Creating Rarer Cows
                </h4>
                <p className="text-gray-300 text-sm sm:text-base mb-2">
                    The "Fusion" page (or Cow Fusion Chamber in the Farm Market) allows you to combine multiple cows of one tier to attempt to create a cow of a higher tier.
                </p>
                <ul className="list-disc list-inside text-gray-300 text-sm sm:text-base space-y-1 pl-2">
                    <li>2x Common Cows + Fee → 1x Cosmic Cow (Attempt)</li>
                    <li>4x Cosmic Cows + Fee → 1x Galactic Moo Moo (Attempt)</li>
                </ul>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">
                    Fusion isn\'t guaranteed! Success rates and specific recipes are part of the cosmic mystery. Failed fusions may result in loss of input cows and fees.
                </p>
            </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-lime-400 mb-2 font-title">6. The $NILK Token: Your Goal</h3>
          <div className="bg-black/30 p-3 sm:p-4 rounded-lg border border-lime-800/50">
             <h4 className="font-medium text-lime-300 mb-2 text-lg flex items-center">
                <img src="/nilk token.png" alt="Token Icon" className="w-8 h-8 mr-2 bg-lime-900/30 p-0.5 rounded" /> Utility and Value
            </h4>
            <p className="text-gray-300 text-sm sm:text-base">
              $NILK is the lifeblood of this ecosystem. Use it for:
            </p>
            <ul className="list-disc list-inside text-gray-300 text-sm sm:text-base space-y-1 mt-2 pl-2">
              <li>Purchasing high-tier cows and powerful upgrades.</li>
              <li>Paying fusion fees.</li>
              <li>Engaging in future DeFi activities within the Got Nilk? universe (staking, governance - coming soon!).</li>
              <li>Trading on supported exchanges (future integration).</li>
            </ul>
          </div>
        </section>
        
        <section className="mb-8">
          <h3 className="text-xl sm:text-2xl font-semibold text-lime-400 mb-3 font-title">7. Strategy Tips for Aspiring Nilk Barons</h3>
          <ul className="space-y-3">
            <li className="flex items-start bg-black/20 p-3 rounded-md border border-lime-800/40">
              <Sparkles className="text-yellow-400 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-sm sm:text-base"><strong className="text-lime-300">Early Game:</strong> Focus on acquiring a few Common cows and upgrading your Yield Booster. Get a Manual Processor early to start converting Raw Nilk.</p>
            </li>
            <li className="flex items-start bg-black/20 p-3 rounded-md border border-lime-800/40">
              <TrendingUp className="text-green-400 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-sm sm:text-base"><strong className="text-lime-300">Mid Game:</strong> Start fusing Common cows into Cosmic cows. Consider saving for an Automated Processor for better $NILK conversion rates.</p>
            </li>
            <li className="flex items-start bg-black/20 p-3 rounded-md border border-lime-800/40">
              <Zap className="text-purple-400 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-sm sm:text-base"><strong className="text-lime-300">Late Game:</strong> Aim for Galactic Moo Moos through fusion. Max out your Yield Booster and invest in the best processors. The MOOFI badge is a great long-term investment here.</p>
            </li>
            <li className="flex items-start bg-black/20 p-3 rounded-md border border-lime-800/40">
              <Repeat className="text-blue-400 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-sm sm:text-base"><strong className="text-lime-300">Always Be Harvesting:</strong> Don\'t let your Raw Nilk sit uncollected for too long!</p>
            </li>
          </ul>
        </section>

        <div className="mt-8 pt-6 border-t border-lime-700/50 text-center">
          <p className="text-lg text-lime-300 mb-4">Ready to start your cosmic dairy empire?</p>
          <Link href="/farm" passHref legacyBehavior>
            <Button className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-black font-semibold py-3 px-8 text-lg sm:text-xl font-title shadow-lg hover:shadow-lime-400/40 transition-all duration-300 transform hover:scale-105">
              <Rocket className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Enter the Farm!
            </Button>
          </Link>
        </div>

      </div> {/* End of Info Content wrapper */}
    </div>
  );
}

// Helper icons if not already imported and used elsewhere (example, can be removed if not needed)
// const Sparkles = (props: any) => <svg {...props} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3.51L11.26 7.06L15 7.62L12.25 10.06L13.03 13.94L10 11.96L6.97 13.94L7.75 10.06L5 7.62L8.74 7.06L10 3.51ZM10 0L7.5 6.09L1 6.64L5.75 10.89L4.25 17L10 13.5L15.75 17L14.25 10.89L19 6.64L12.5 6.09L10 0Z"/></svg>;
// const TrendingUp = (props: any) => <svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>;
// const Zap = (props: any) => <svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8H7z" /></svg>;
// const Repeat = (props: any) => <svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>;

