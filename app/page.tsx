"use client";

import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Text, useTexture, Plane, ContactShadows, Html, Stars, useProgress } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info, Play, XCircle, Wallet, Home as FarmIcon, Factory, Combine, Coins, Award, Sparkles, Sparkles as WelcomeIcon, ListChecks, Package, Droplets, TrendingUp, Scaling, Clock, Leaf, Percent, Banknote, Recycle, Truck, Zap, User, ExternalLink, Crown } from 'lucide-react';
import * as THREE from 'three';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from '@supabase/supabase-js'

// Define the type for a leaderboard entry
type LeaderboardEntry = {
  rank: number;
  wallet_address: string;
  username: string | null;
  raw_nilk_processed: number;
  hype_earned: number;
  fusion_count: number;
  avatar_url?: string;
  x_handle?: string;
};

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

// New constants for floating particle effect
// const MAX_INITIAL_PARTICLE_SPEED = 0.5; // Max speed units per second - Will be replaced
const HORIZONTAL_SPEED_MIN = 0.1; // Min horizontal speed
const HORIZONTAL_SPEED_MAX = 0.5; // Max horizontal speed
const VERTICAL_DRIFT_MAX = 0.05;  // Max vertical drift speed
const DEPTH_DRIFT_MAX = 0.05;     // Max depth drift speed

const PARTICLE_DAMPING = 0.995;          // Per-frame damping factor (closer to 1 means less damping)
const MOUSE_INTERACTION_RADIUS = 3;     // World units for mouse attraction range
const MOUSE_ATTRACTION_STRENGTH = 7;  // How strongly particles are pulled by the mouse
const PARTICLE_BOUNDS = { width: VIEW_WIDTH, height: VIEW_HEIGHT, depth: 10 }; // 3D boundary for particles
const PARTICLE_BOUNCE_EFFICIENCY = -0.5; // Speed retained/reversed on bounce (negative for reversal)
// const PARTICLE_CONTINUOUS_ROTATION_SPEED_MAX = Math.PI / 2; // Max radians per second for continuous spin
const PARTICLE_CONTINUOUS_ROTATION_SPEED_MAX = Math.PI / 4; // Reduced for a gentler spin

function Particle({ 
  texture, 
  initialPosition, 
  initialVelocity, 
  size
}: { 
  texture: THREE.Texture; 
  initialPosition: THREE.Vector3; 
  initialVelocity: THREE.Vector3; 
  size: number; 
}) {
  const meshRef = useRef<THREE.Sprite>(null!);
  const velocity = useRef(initialVelocity.clone());
  const continuousRotationSpeed = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * PARTICLE_CONTINUOUS_ROTATION_SPEED_MAX,
    (Math.random() - 0.5) * PARTICLE_CONTINUOUS_ROTATION_SPEED_MAX,
    (Math.random() - 0.5) * PARTICLE_CONTINUOUS_ROTATION_SPEED_MAX
  ));

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const currentPos = meshRef.current.position;
    const currentVel = velocity.current;

    // Apply velocity
    currentPos.add(currentVel.clone().multiplyScalar(delta));

    // Boundary checks and bounce/wrap
    const halfBounds = {
      x: PARTICLE_BOUNDS.width / 2,
      y: PARTICLE_BOUNDS.height / 2,
      z: PARTICLE_BOUNDS.depth / 2,
    };

    // Horizontal (X-axis) wrap
    if (currentPos.x > halfBounds.x + size) {
      currentPos.x = -halfBounds.x - size;
    } else if (currentPos.x < -halfBounds.x - size) {
      currentPos.x = halfBounds.x + size;
    }

    // Vertical (Y-axis) bounce
    if (Math.abs(currentPos.y) > halfBounds.y) {
      currentPos.y = Math.sign(currentPos.y) * halfBounds.y;
      currentVel.y *= PARTICLE_BOUNCE_EFFICIENCY;
    }
    // Depth (Z-axis) bounce
    if (Math.abs(currentPos.z) > halfBounds.z) {
      currentPos.z = Math.sign(currentPos.z) * halfBounds.z;
      currentVel.z *= PARTICLE_BOUNCE_EFFICIENCY;
    }

    // Continuous rotation
    meshRef.current.rotation.x += continuousRotationSpeed.current.x * delta;
    meshRef.current.rotation.y += continuousRotationSpeed.current.y * delta;
    meshRef.current.rotation.z += continuousRotationSpeed.current.z * delta;
  });

  return (
    <sprite 
      ref={meshRef} 
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
      scale={[size, size, size]}
    >
      <spriteMaterial map={texture} transparent alphaTest={0.1} opacity={0.8} />
    </sprite>
  );
}

const ParticleEffect = ({ quality }: { quality: 'High' | 'Low' }) => {
  const textures = useTexture(PARTICLE_IMAGE_PATHS) as unknown as THREE.Texture[];
  const numParticles = quality === 'High' ? 30 : 15;

  const particles = useMemo(() => {
    return Array.from({ length: numParticles }).map((_, i) => {
      const texture = textures[i % textures.length];
      const x = (Math.random() - 0.5) * PARTICLE_BOUNDS.width;
      const y = (Math.random() - 0.5) * PARTICLE_BOUNDS.height;
      const z = (Math.random() - 0.5) * PARTICLE_BOUNDS.depth;
      
      // Initial horizontal speed, ensuring it's not too slow and has a direction
      let vx = (Math.random() * (HORIZONTAL_SPEED_MAX - HORIZONTAL_SPEED_MIN) + HORIZONTAL_SPEED_MIN);
      if (Math.random() < 0.5) vx *= -1; // Randomly assign direction
      const vy = (Math.random() - 0.5) * 2 * VERTICAL_DRIFT_MAX; // Symmetrical drift up/down
      const vz = (Math.random() - 0.5) * 2 * DEPTH_DRIFT_MAX; // Symmetrical drift front/back
      
      const size = Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) + PARTICLE_SIZE_MIN;
      return {
        id: i,
        texture,
        initialPosition: new THREE.Vector3(x, y, z),
        initialVelocity: new THREE.Vector3(vx, vy, vz),
        size
      };
    });
  }, [textures, numParticles]);

  if (textures.some(t => !t)) {
    console.warn("Particle textures not fully loaded yet.")
    return null;
  }

  return (
    <group>
      {particles.map(p => (
        <Particle 
          key={p.id} 
          texture={p.texture}
          initialPosition={p.initialPosition} 
          initialVelocity={p.initialVelocity}
          size={p.size} 
        />
      ))}
    </group>
  );
};

function Loader() {
  const { progress } = useProgress()
  return <Html center>{progress.toFixed(1)} % loaded</Html>
}

export default function LandingPage() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isHighQuality, setIsHighQuality] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Initialize Supabase client
  const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch leaderboard data when modal is opened to the leaderboard tab
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (showInfoModal && activeTab === 'leaderboard') {
        setLeaderboardLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_leaderboard');
            if (error) {
                console.error('Error fetching leaderboard:', error);
                setLeaderboardData([]);
            } else {
                setLeaderboardData(data as LeaderboardEntry[]);
            }
        } catch (error) {
            console.error('An unexpected error occurred:', error);
            setLeaderboardData([]);
        } finally {
            setLeaderboardLoading(false);
        }
      }
    };

    fetchLeaderboard();
  }, [showInfoModal, activeTab, supabase]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-green-900 to-black text-white overflow-hidden flex flex-col justify-center items-center">
      {/* Canvas for 3D Model & Particle Rain */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 1, 8], fov: 50 }} shadows>
          <Suspense fallback={<Loader />}>
            <ambientLight intensity={0.8} />
            <directionalLight 
              position={[5, 10, 5]} 
              intensity={1.5} 
              castShadow={isHighQuality} 
              shadow-mapSize-width={isHighQuality ? 2048 : 1024}
              shadow-mapSize-height={isHighQuality ? 2048 : 1024}
            />
            <Stars radius={100} depth={50} count={isHighQuality ? 5000 : 1000} factor={4} saturation={0} fade speed={1} />
            <Model modelPath="/MODELS/COW_optimized.glb" position={[0, 0, 0]} scale={3.0} rotation={[0, -Math.PI / 4, 0]}/>
            <Environment preset="sunset" blur={isHighQuality ? 0.3 : 0.8}/>
            <OrbitControls 
                enableRotate={true}
                enableZoom={true} 
                enablePan={true} 
                minDistance={4}
                maxDistance={20}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={(2 * Math.PI) / 3}
                target={[0, 0, 0]}
            />
            <ParticleEffect quality={isHighQuality ? 'High' : 'Low'} />
          </Suspense>
        </Canvas>
      </div>

      {/* Overlay Content (Title, Buttons) */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-8">
        {/* Spacer to push content down a bit, adjust as needed */}
        <div className="flex-grow" />

        <div className="mb-12"> {/* Container for title, tagline, and buttons */}
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-lime-400 via-green-400 to-lime-500 bg-clip-text text-transparent font-title">
              GOT NILK?
            </h1>
            
            <div className="flex justify-center items-center gap-3 text-xl md:text-2xl text-green-200 mb-8 font-sans">
              <span>The Cosmic DeFi Experience on Hyperliquid.</span>
              <Image 
                src="/hyperliquid.png" 
                alt="Hyperliquid Logo" 
                width={40} 
                height={40} 
                className="object-contain" 
                priority
                quality={100}
              />
        </div>

            {/* Buttons - Centered with the content above */}
            <div className="flex space-x-4 w-full max-w-lg px-4 mx-auto">
          <Button 
            variant="outline" 
            className="flex-1 bg-black/50 border-lime-500 hover:bg-lime-700/30 text-lime-300 hover:text-lime-100 py-3 text-lg font-title pointer-events-auto"
                onClick={() => {
                  setActiveTab("overview");
                  setShowInfoModal(true);
                }}
          >
            <Info className="mr-2 h-5 w-5" />
            Learn More
          </Button>
              <Button
                variant="outline"
                className="flex-1 bg-black/50 border-yellow-500 hover:bg-yellow-700/30 text-yellow-300 hover:text-yellow-100 py-3 text-lg font-title pointer-events-auto"
                onClick={() => {
                  setActiveTab("leaderboard");
                  setShowInfoModal(true);
                }}
              >
                <Award className="mr-2 h-5 w-5" />
                Leaderboard
              </Button>
          <Link href="/farm" passHref legacyBehavior className="flex-1 pointer-events-auto">
            <Button className="flex-1 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-black font-semibold py-3 text-lg font-title">
              <Play className="mr-2 h-5 w-5" />
              Play Now
            </Button>
          </Link>
            </div>
        </div>
      </div>

      {/* Quality Toggle */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-2">
        <Switch id="quality-mode" checked={isHighQuality} onCheckedChange={setIsHighQuality} />
        <Label htmlFor="quality-mode" className="text-white">High Quality</Label>
      </div>

      {/* Info Modal - Comprehensive Tokenomics */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-start justify-center pt-32 px-4 pb-4 font-sans">
          <div className="w-full max-w-7xl max-h-[calc(100vh-9rem)] bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-lime-500/50 rounded-2xl shadow-2xl text-lime-200 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-lime-800/50 bg-gradient-to-r from-lime-900/20 to-green-900/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 relative">
                  <Image src="/nilk token.png" alt="NILK Token" fill className="object-contain" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-lime-300 font-title">NILKhype Tokenomics V2.0</h2>
                  <p className="text-lime-400/80">Enhanced DeFi Integration & Sustainable Economy</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowInfoModal(false)} className="text-lime-300 hover:bg-lime-700/30 hover:text-lime-100">
                <XCircle className="w-6 h-6" />
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow overflow-hidden">
              <TabsList className="grid w-full grid-cols-9 bg-slate-800/50 border-lime-700/50 m-6 mb-0">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="production" className="text-xs">Production</TabsTrigger>
                <TabsTrigger value="processing" className="text-xs">Processing</TabsTrigger>
                <TabsTrigger value="fusion" className="text-xs">Fusion</TabsTrigger>
                <TabsTrigger value="pricing" className="text-xs">Pricing</TabsTrigger>
                <TabsTrigger value="hype" className="text-xs">HYPE</TabsTrigger>
                <TabsTrigger value="liquidity" className="text-xs">Liquidity</TabsTrigger>
                <TabsTrigger value="leaderboard" className="text-xs">Leaderboard</TabsTrigger>
                <TabsTrigger value="roadmap" className="text-xs">Roadmap</TabsTrigger>
              </TabsList>
              
              <div className="p-6 overflow-y-auto flex-grow min-h-0">
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Token Ecosystem - Visual Heavy */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 p-6 rounded-xl border border-lime-800/50 hover:border-lime-600/70 transition-all duration-300">
                      <div className="flex items-center mb-6">
                        <Coins className="w-6 h-6 text-lime-400 mr-3" />
                        <h3 className="text-xl font-bold text-lime-300">Token Ecosystem</h3>
                      </div>
                      
                      {/* Visual Token Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl p-3 border border-orange-400/30">
                            <Image src="/smalljar.png" alt="Raw Nilk" width={56} height={56} className="object-contain" />
                          </div>
                          <h4 className="font-bold text-white text-sm">Raw Nilk</h4>
                          <p className="text-xs text-orange-300">Production Asset</p>
                          </div>
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-lime-500/20 to-lime-600/20 rounded-xl p-3 border border-lime-400/30">
                            <Image src="/nilk token.png" alt="NILK Token" width={56} height={56} className="object-contain" />
                        </div>
                          <h4 className="font-bold text-white text-sm">$NILK</h4>
                          <p className="text-xs text-lime-300">Utility Token</p>
                          </div>
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-3 border border-purple-400/30">
                            <Image src="/hyperliquid.png" alt="HYPE Token" width={56} height={56} className="object-contain" />
                          </div>
                          <h4 className="font-bold text-white text-sm">HYPE</h4>
                          <p className="text-xs text-purple-300">Bridge Asset</p>
                        </div>
                          </div>

                      {/* Token Properties */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                          <span className="text-orange-300 text-sm">Raw Nilk</span>
                          <span className="text-white text-xs">Inflationary • Generated by Cows</span>
                          </div>
                        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                          <span className="text-lime-300 text-sm">$NILK</span>
                          <span className="text-white text-xs">Deflationary • Processed Asset</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                          <span className="text-purple-300 text-sm">HYPE</span>
                          <span className="text-white text-xs">Cross-chain • Hyperliquid</span>
                        </div>
                      </div>
                    </div>

                    {/* Value Flow - Visual Heavy */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-xl border border-purple-500/50 hover:border-purple-400/70 transition-all duration-300">
                      <div className="flex items-center mb-6">
                        <TrendingUp className="w-6 h-6 text-purple-400 mr-3" />
                        <h3 className="text-xl font-bold text-purple-300">Value Flow</h3>
                      </div>
                      
                      {/* Visual Flow Chain */}
                      <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-2 border border-green-400/30">
                            <Image src="/NILK COW.png" alt="Cows" width={48} height={48} className="object-contain" />
                          </div>
                          <p className="text-white font-semibold text-xs">Cows</p>
                          <p className="text-green-300 text-xs">Produce</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl p-2 border border-orange-400/30">
                            <Image src="/smalljar.png" alt="Raw Nilk" width={48} height={48} className="object-contain" />
                        </div>
                          <p className="text-white font-semibold text-xs">Raw Nilk</p>
                          <p className="text-orange-300 text-xs">Convert</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-2 border border-blue-400/30 flex items-center justify-center">
                            <Image src="/nilk machine.png" alt="Processing" width={40} height={40} className="object-contain" />
                          </div>
                          <p className="text-white font-semibold text-xs">Process</p>
                          <p className="text-blue-300 text-xs">Refine</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-lime-500/20 to-lime-600/20 rounded-xl p-2 border border-lime-400/30">
                            <Image src="/nilk token.png" alt="NILK" width={48} height={48} className="object-contain" />
                          </div>
                          <p className="text-white font-semibold text-xs">$NILK</p>
                          <p className="text-lime-300 text-xs">Earn</p>
                        </div>
                      </div>

                      {/* Flow Arrows */}
                      <div className="flex justify-center items-center space-x-8 mb-6 text-purple-300">
                        <span className="text-2xl">→</span>
                        <span className="text-2xl">→</span>
                        <span className="text-2xl">→</span>
                      </div>
                      
                      {/* Secondary Flows with Images */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-700/20 p-4 rounded-lg border border-green-500/30 text-center">
                          <div className="w-12 h-12 mx-auto mb-2 bg-green-600/20 rounded-lg p-2">
                            <Image src="/gallonjug.png" alt="Treasury" width={32} height={32} className="object-contain" />
                          </div>
                          <p className="text-green-300 font-semibold text-sm">Treasury</p>
                          <p className="text-green-200/80 text-xs">Buybacks & Rewards</p>
                        </div>
                        <div className="bg-slate-700/20 p-4 rounded-lg border border-purple-500/30 text-center">
                          <div className="w-12 h-12 mx-auto mb-2 bg-purple-600/20 rounded-lg p-2">
                            <Image src="/hyperliquid.png" alt="HYPE Pool" width={32} height={32} className="object-contain" />
                          </div>
                          <p className="text-purple-300 font-semibold text-sm">HYPE Pool</p>
                          <p className="text-purple-200/80 text-xs">Cross-chain Liquidity</p>
                        </div>
                      </div>
                    </div>

                    {/* Economic Sustainability */}
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-6 rounded-xl border border-green-500/50">
                      <div className="flex items-center mb-4">
                        <Scaling className="w-6 h-6 text-green-400 mr-3" />
                        <h3 className="text-xl font-bold text-green-300">Economic Sustainability</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-white">Treasury Management</p>
                          <p className="text-sm text-green-200/80">1M $NILK + 10k HYPE starting balance</p>
                        </div>
                        <div>
                          <p className="font-semibold text-white">Deflationary Mechanisms</p>
                          <ul className="text-sm text-green-200/80 list-disc list-inside">
                            <li>20% processing fees → Treasury</li>
                            <li>50% fusion costs → Treasury burn</li>
                            <li>Trading fees → LP rewards + Treasury</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 p-6 rounded-xl border border-orange-500/50">
                      <div className="flex items-center mb-4">
                        <Award className="w-6 h-6 text-orange-400 mr-3" />
                        <h3 className="text-xl font-bold text-orange-300">Success Metrics</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-white">30-Day Targets</p>
                          <ul className="text-sm text-orange-200/80 list-disc list-inside">
                            <li>TVL Growth: $500k → $750k</li>
                            <li>Active LPs: 100 → 250 users</li>
                            <li>50% HYPE integration</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-white">60-Day Targets</p>
                          <ul className="text-sm text-orange-200/80 list-disc list-inside">
                            <li>TVL Growth: $750k → $2M</li>
                            <li>Cross-chain expansion</li>
                            <li>Governance launch</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* DeFi Ecosystem Diagram */}
                    <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 p-6 rounded-xl border border-lime-800/50 lg:col-span-2">
                      <div className="flex items-center mb-6">
                        <Package className="w-6 h-6 text-lime-400 mr-3" />
                        <h3 className="text-xl font-bold text-lime-300">Complete DeFi Ecosystem</h3>
                      </div>
                      
                      {/* Interactive Flow Diagram */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Production Layer */}
                        <div className="bg-gradient-to-b from-green-900/40 to-green-800/40 p-4 rounded-lg border border-green-500/30 hover:border-green-400/50 transition-colors">
                          <div className="text-center mb-3">
                            <div className="w-12 h-12 mx-auto bg-green-600/20 rounded-full flex items-center justify-center mb-2">
                              <div className="w-8 h-8 relative">
                                <Image src="/NILK COW.png" alt="Production" fill className="object-contain" />
                              </div>
                            </div>
                            <h4 className="font-bold text-green-300">Production</h4>
                          </div>
                          <ul className="text-xs text-green-200/80 space-y-1">
                            <li>• Cow farming</li>
                            <li>• Raw Nilk generation</li>
                            <li>• Yield optimization</li>
                          </ul>
                        </div>

                        {/* Processing Layer */}
                        <div className="bg-gradient-to-b from-blue-900/40 to-blue-800/40 p-4 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-colors">
                          <div className="text-center mb-3">
                            <div className="w-12 h-12 mx-auto bg-blue-600/20 rounded-full flex items-center justify-center mb-2">
                              <Factory className="w-6 h-6 text-blue-400" />
                            </div>
                            <h4 className="font-bold text-blue-300">Processing</h4>
                          </div>
                          <ul className="text-xs text-blue-200/80 space-y-1">
                            <li>• Machine efficiency</li>
                            <li>• Fee optimization</li>
                            <li>• $NILK conversion</li>
                          </ul>
                        </div>

                        {/* DeFi Layer */}
                        <div className="bg-gradient-to-b from-purple-900/40 to-purple-800/40 p-4 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-colors">
                          <div className="text-center mb-3">
                            <div className="w-12 h-12 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center mb-2">
                              <Droplets className="w-6 h-6 text-purple-400" />
                            </div>
                            <h4 className="font-bold text-purple-300">DeFi</h4>
                          </div>
                          <ul className="text-xs text-purple-200/80 space-y-1">
                            <li>• Liquidity mining</li>
                            <li>• HYPE integration</li>
                            <li>• Cross-chain bridge</li>
                          </ul>
                        </div>

                        {/* Governance Layer */}
                        <div className="bg-gradient-to-b from-orange-900/40 to-orange-800/40 p-4 rounded-lg border border-orange-500/30 hover:border-orange-400/50 transition-colors">
                          <div className="text-center mb-3">
                            <div className="w-12 h-12 mx-auto bg-orange-600/20 rounded-full flex items-center justify-center mb-2">
                              <Award className="w-6 h-6 text-orange-400" />
                            </div>
                            <h4 className="font-bold text-orange-300">Governance</h4>
                          </div>
                          <ul className="text-xs text-orange-200/80 space-y-1">
                            <li>• Treasury management</li>
                            <li>• Protocol upgrades</li>
                            <li>• Community voting</li>
                          </ul>
                        </div>
                      </div>

                      {/* Connection Arrows */}
                      <div className="flex justify-center items-center space-x-4 text-lime-400 text-sm font-semibold">
                        <span>Production</span>
                        <span>→</span>
                        <span>Processing</span>
                        <span>→</span>
                        <span>DeFi</span>
                        <span>→</span>
                        <span>Governance</span>
                      </div>
                    </div>

                  </div>
                </TabsContent>

                {/* Processing Tab */}
                <TabsContent value="processing" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Processing Methods - Visual Heavy */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-xl border border-blue-500/50">
                      <div className="flex items-center mb-6">
                        <Factory className="w-6 h-6 text-blue-400 mr-3" />
                        <h3 className="text-xl font-bold text-blue-300">Processing Methods</h3>
                      </div>
                      
                      {/* Manual Processing */}
                      <div className="mb-6">
                        <div className="bg-gradient-to-r from-orange-900/40 to-orange-800/40 p-4 rounded-xl border border-orange-500/30">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="w-16 h-16 bg-orange-600/20 rounded-xl p-2">
                              <Image src="/manual processing.png" alt="Manual Processing" width={48} height={48} className="object-contain" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-white">Manual Processing</h4>
                              <p className="text-orange-300 text-sm">Basic conversion method</p>
                            </div>
                            <div className="text-right">
                              <p className="text-orange-400 font-bold">35%</p>
                              <p className="text-orange-300 text-xs">Efficiency</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-700/30 p-2 rounded">
                              <span className="text-orange-200">Fee: 8%</span>
                            </div>
                            <div className="bg-slate-700/30 p-2 rounded">
                              <span className="text-orange-200">Always Available</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Machine Processing Preview */}
                      <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/40 p-4 rounded-xl border border-blue-500/30">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-16 h-16 bg-blue-600/20 rounded-xl p-2">
                            <Image src="/nilk machine.png" alt="Machine Processing" width={48} height={48} className="object-contain" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-white">Machine Processing</h4>
                            <p className="text-blue-300 text-sm">Enhanced efficiency</p>
                          </div>
                          <div className="text-right">
                            <p className="text-blue-400 font-bold">65-85%</p>
                            <p className="text-blue-300 text-xs">Efficiency</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-700/30 p-2 rounded">
                            <span className="text-blue-200">Fee: 4-8%</span>
                          </div>
                          <div className="bg-slate-700/30 p-2 rounded">
                            <span className="text-blue-200">Requires Purchase</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Machine Types - Visual Heavy */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 p-6 rounded-xl border border-lime-800/50">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 relative mr-3">
                          <Image src="/nilk machine.png" alt="Machine" width={32} height={32} className="object-contain" />
                        </div>
                        <h3 className="text-xl font-bold text-lime-300">Processing Machines</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/40 p-4 rounded-xl border border-blue-500/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-16 h-16 bg-blue-600/20 rounded-xl p-2">
                                <Image src="/nilk machine.png" alt="Standard Machine" width={48} height={48} className="object-contain" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white">Standard Machine</h4>
                                <p className="text-blue-300 text-sm">Reliable processing</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-blue-400 font-bold text-lg">65%</p>
                              <p className="text-blue-300 text-xs">Efficiency</p>
                            </div>
                          </div>
                          <div className="bg-slate-700/30 p-2 rounded text-center">
                            <span className="text-blue-200 text-xs">8% Processing Fee</span>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 p-4 rounded-xl border border-purple-500/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-16 h-16 bg-purple-600/20 rounded-xl p-2">
                                <Image src="/nilk machine PRO.png" alt="PRO Machine" width={48} height={48} className="object-contain" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white">PRO Machine</h4>
                                <p className="text-purple-300 text-sm">Premium processing</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-purple-400 font-bold text-lg">85%</p>
                              <p className="text-purple-300 text-xs">Efficiency</p>
                            </div>
                          </div>
                          <div className="bg-slate-700/30 p-2 rounded text-center">
                            <span className="text-purple-200 text-xs">4% Processing Fee</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Processing Economics */}
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-6 rounded-xl border border-green-500/50 lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <Percent className="w-6 h-6 text-green-400 mr-3" />
                        <h3 className="text-xl font-bold text-green-300">Processing Economics & Treasury</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                          <p className="font-bold text-green-300 text-lg">Fee Distribution</p>
                          <p className="text-white font-semibold">20% → Treasury</p>
                          <p className="text-green-200/80 text-sm">Funds buybacks & rewards</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                          <p className="font-bold text-blue-300 text-lg">Efficiency Boost</p>
                          <p className="text-white font-semibold">Up to 85%</p>
                          <p className="text-blue-200/80 text-sm">With PRO Machine</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                          <p className="font-bold text-purple-300 text-lg">HYPE Benefits</p>
                          <p className="text-white font-semibold">50% Fee Reduction</p>
                          <p className="text-purple-200/80 text-sm">24h boost available</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </TabsContent>

                {/* Fusion Tab */}
                <TabsContent value="fusion" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Cow Fusion System - Visual Heavy */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-xl border border-purple-500/50">
                      <div className="flex items-center mb-6">
                        <Combine className="w-6 h-6 text-purple-400 mr-3" />
                        <h3 className="text-xl font-bold text-purple-300">Cow Fusion Chamber</h3>
                      </div>
                      
                      {/* Common to Cosmic Fusion */}
                      <div className="mb-6">
                        <div className="bg-gradient-to-r from-green-900/40 to-purple-900/40 p-4 rounded-xl border border-purple-500/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-green-600/20 rounded-lg p-1">
                                <Image src="/NILK COW.png" alt="Common Cow" width={40} height={40} className="object-contain" />
                              </div>
                              <span className="text-white text-lg">×2</span>
                              <span className="text-purple-300 text-xl">→</span>
                              <div className="w-12 h-12 bg-purple-600/20 rounded-lg p-1">
                                <Image src="/cosmic cow.png" alt="Cosmic Cow" width={40} height={40} className="object-contain" />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <span className="text-purple-200">Fee: 15,000 $NILK</span>
                            </div>
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <span className="text-purple-200">3x Production</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cosmic to Galactic Fusion */}
                      <div className="bg-gradient-to-r from-purple-900/40 to-yellow-900/40 p-4 rounded-xl border border-purple-500/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-600/20 rounded-lg p-1">
                              <Image src="/cosmic cow.png" alt="Cosmic Cow" width={40} height={40} className="object-contain" />
                            </div>
                            <span className="text-white text-lg">×4</span>
                            <span className="text-yellow-300 text-xl">→</span>
                            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg p-1">
                              <Image src="/galactic moo moo.png" alt="Galactic Cow" width={40} height={40} className="object-contain" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-700/30 p-2 rounded text-center">
                            <span className="text-yellow-200">Fee: 70,000 $NILK</span>
                          </div>
                          <div className="bg-slate-700/30 p-2 rounded text-center">
                            <span className="text-yellow-200">10x Production</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Machine Fusion - Visual Heavy */}
                    <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 p-6 rounded-xl border border-indigo-500/50">
                      <div className="flex items-center mb-6">
                        <Zap className="w-6 h-6 text-indigo-400 mr-3" />
                        <h3 className="text-xl font-bold text-indigo-300">Machine Fusion Lab</h3>
                      </div>
                      
                      {/* Standard to PRO Fusion */}
                      <div className="mb-6">
                        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-4 rounded-xl border border-indigo-500/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-600/20 rounded-lg p-1">
                                <Image src="/nilk machine.png" alt="Standard Machine" width={40} height={40} className="object-contain" />
                              </div>
                              <span className="text-white text-lg">×2</span>
                              <span className="text-indigo-300 text-xl">→</span>
                              <div className="w-12 h-12 bg-purple-600/20 rounded-lg p-1">
                                <Image src="/nilk machine PRO.png" alt="PRO Machine" width={40} height={40} className="object-contain" />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <span className="text-indigo-200">Fee: 5,000 $NILK</span>
                            </div>
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <span className="text-indigo-200">85% Efficiency</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Advanced Engineering */}
                      <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900/40 p-4 rounded-xl border border-indigo-500/30">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-16 h-16 bg-indigo-600/20 rounded-xl p-2 flex items-center justify-center">
                            <Zap className="w-8 h-8 text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">Advanced Engineering</h4>
                            <p className="text-indigo-300 text-sm">Premium equipment creation</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="bg-slate-700/30 p-2 rounded">
                            <span className="text-indigo-200">• Combine lower-tier equipment</span>
                          </div>
                          <div className="bg-slate-700/30 p-2 rounded">
                            <span className="text-indigo-200">• Unlock exclusive features</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fusion Economics */}
                    <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 p-6 rounded-xl border border-orange-500/50 lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <Sparkles className="w-6 h-6 text-orange-400 mr-3" />
                        <h3 className="text-xl font-bold text-orange-300">Fusion Economics & Strategy</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                          <p className="font-bold text-orange-300 text-lg">Treasury Burn</p>
                          <p className="text-white font-semibold">50% of Fees</p>
                          <p className="text-orange-200/80 text-sm">Deflationary mechanism</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                          <p className="font-bold text-purple-300 text-lg">HYPE Rewards</p>
                          <p className="text-white font-semibold">5-15 HYPE</p>
                          <p className="text-purple-200/80 text-sm">Achievement milestones</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                          <p className="font-bold text-green-300 text-lg">ROI Timeline</p>
                          <p className="text-white font-semibold">7-14 days</p>
                          <p className="text-green-200/80 text-sm">Typical payback period</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </TabsContent>

                {/* Production Tab */}
                <TabsContent value="production" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Cow Production - Visual Heavy */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 p-6 rounded-xl border border-lime-800/50">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 relative mr-3">
                          <Image src="/NILK COW.png" alt="Cow" width={32} height={32} className="object-contain" />
                        </div>
                        <h3 className="text-xl font-bold text-lime-300">Cow Production</h3>
                      </div>
                      
                      {/* Visual Cow Grid */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-900/40 to-green-800/40 p-4 rounded-xl border border-green-500/30">
                          <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                              <div className="w-16 h-16 bg-green-600/20 rounded-xl p-2">
                                <Image src="/NILK COW.png" alt="Common Cow" width={48} height={48} className="object-contain" />
                            </div>
                              <div>
                                <h4 className="font-bold text-white">Common Cow</h4>
                                <p className="text-green-300 text-sm">Foundation Producer</p>
                          </div>
                        </div>
                            <div className="text-right">
                              <p className="text-lime-400 font-bold text-lg">5,000</p>
                              <p className="text-lime-300 text-xs">Raw Nilk/day</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 p-4 rounded-xl border border-purple-500/30">
                          <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                              <div className="w-16 h-16 bg-purple-600/20 rounded-xl p-2">
                                <Image src="/cosmic cow.png" alt="Cosmic Cow" width={48} height={48} className="object-contain" />
                            </div>
                              <div>
                                <h4 className="font-bold text-white">Cosmic Cow</h4>
                                <p className="text-purple-300 text-sm">Enhanced Producer</p>
                          </div>
                        </div>
                            <div className="text-right">
                              <p className="text-purple-400 font-bold text-lg">15,000</p>
                              <p className="text-purple-300 text-xs">Raw Nilk/day</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 p-4 rounded-xl border border-yellow-500/30">
                          <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                              <div className="w-16 h-16 bg-yellow-600/20 rounded-xl p-2">
                                <Image src="/galactic moo moo.png" alt="Galactic Cow" width={48} height={48} className="object-contain" />
                            </div>
                              <div>
                                <h4 className="font-bold text-white">Galactic Moo Moo</h4>
                                <p className="text-yellow-300 text-sm">Ultimate Producer</p>
                          </div>
                            </div>
                            <div className="text-right">
                              <p className="text-yellow-400 font-bold text-lg">50,000</p>
                              <p className="text-yellow-300 text-xs">Raw Nilk/day</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Processing Efficiency */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-xl border border-blue-500/50">
                      <div className="flex items-center mb-4">
                        <Factory className="w-6 h-6 text-blue-400 mr-3" />
                        <h3 className="text-xl font-bold text-blue-300">Processing Efficiency</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <span className="font-semibold text-white">Manual Processing</span>
                          <span className="text-red-400 font-bold">35% efficiency</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 relative">
                              <Image src="/nilk machine.png" alt="Standard Machine" fill className="object-contain" />
                            </div>
                            <span className="font-semibold text-white">Standard Machine</span>
                          </div>
                          <span className="text-yellow-400 font-bold">65% efficiency</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 relative">
                              <Image src="/nilk machine PRO.png" alt="PRO Machine" fill className="object-contain" />
                            </div>
                            <span className="font-semibold text-white">PRO Machine</span>
                          </div>
                          <span className="text-green-400 font-bold">85% efficiency</span>
                        </div>
                      </div>
                    </div>

                    {/* Yield Booster System */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-xl border border-purple-500/50 lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <Percent className="w-6 h-6 text-purple-400 mr-3" />
                        <h3 className="text-xl font-bold text-purple-300">Yield Booster System (3x Increase)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                          <p className="font-bold text-purple-300 text-lg">Level 1</p>
                          <p className="text-white font-semibold">36,000 $NILK</p>
                          <p className="text-purple-200/80 text-sm">1.21x multiplier</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                          <p className="font-bold text-purple-300 text-lg">Level 2</p>
                          <p className="text-white font-semibold">50,400 $NILK</p>
                          <p className="text-purple-200/80 text-sm">1.331x multiplier</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                          <p className="font-bold text-purple-300 text-lg">Level 3</p>
                          <p className="text-white font-semibold">70,560 $NILK</p>
                          <p className="text-purple-200/80 text-sm">1.4641x multiplier</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Cow Pricing - Visual Heavy */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 p-6 rounded-xl border border-lime-800/50">
                      <div className="flex items-center mb-6">
                        <Banknote className="w-6 h-6 text-lime-400 mr-3" />
                        <h3 className="text-xl font-bold text-lime-300">Cow Marketplace</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-900/40 to-green-800/40 p-4 rounded-xl border border-green-500/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-green-600/20 rounded-xl p-2">
                                <Image src="/NILK COW.png" alt="Common Cow" width={48} height={48} className="object-contain" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white">Common Cow</h4>
                                <p className="text-green-300 text-sm">Entry-level producer</p>
                            </div>
                          </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <p className="text-lime-400 font-bold">65,000 $NILK</p>
                        </div>
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <p className="text-purple-400 font-bold">2 HYPE ($84)</p>
                              </div>
                            </div>
                          </div>
                        
                        <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 p-4 rounded-xl border border-purple-500/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-purple-600/20 rounded-xl p-2">
                                <Image src="/cosmic cow.png" alt="Cosmic Cow" width={48} height={48} className="object-contain" />
                          </div>
                              <div>
                                <h4 className="font-bold text-white">Cosmic Cow</h4>
                                <p className="text-purple-300 text-sm">Enhanced producer</p>
                        </div>
                              </div>
                            </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <p className="text-lime-400 font-bold">275,000 $NILK</p>
                          </div>
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <p className="text-purple-400 font-bold">7 HYPE ($294)</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 p-4 rounded-xl border border-yellow-500/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-yellow-600/20 rounded-xl p-2">
                                <Image src="/galactic moo moo.png" alt="Galactic Cow" width={48} height={48} className="object-contain" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white">Galactic Moo Moo</h4>
                                <p className="text-yellow-300 text-sm">Ultimate producer</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <p className="text-lime-400 font-bold">750,000 $NILK</p>
                            </div>
                            <div className="bg-slate-700/30 p-2 rounded text-center">
                              <p className="text-purple-400 font-bold">18 HYPE ($756)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Machine Pricing */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-xl border border-blue-500/50">
                      <div className="flex items-center mb-4">
                        <Factory className="w-6 h-6 text-blue-400 mr-3" />
                        <h3 className="text-xl font-bold text-blue-300">Machine Pricing (5x Increase)</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 relative">
                                <Image src="/nilk machine.png" alt="Standard Machine" fill className="object-contain" />
                              </div>
                              <span className="font-semibold text-white">Standard Machine</span>
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="text-lime-400">150,000 $NILK</p>
                            <p className="text-purple-400">4 HYPE ($168)</p>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 relative">
                                <Image src="/nilk machine PRO.png" alt="PRO Machine" fill className="object-contain" />
                              </div>
                              <span className="font-semibold text-white">PRO Machine</span>
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="text-lime-400">375,000 $NILK</p>
                            <p className="text-purple-400">9 HYPE ($378)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Flask System */}
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-6 rounded-xl border border-green-500/50 lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <Package className="w-6 h-6 text-green-400 mr-3" />
                        <h3 className="text-xl font-bold text-green-300">Flask Blueprints & Crafting (3x Increase)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-700/50 rounded-lg">
                          <p className="font-bold text-green-300 mb-2">Flask Blueprint</p>
                          <p className="text-white">30,000 $NILK</p>
                          <p className="text-green-200/80 text-sm">(unlocks crafting)</p>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-slate-700/50 rounded-lg">
                            <p className="font-semibold text-white">Swift Harvest</p>
                            <p className="text-sm text-green-200/80">1,250 Raw Nilk + 225 $NILK</p>
                          </div>
                          <div className="p-3 bg-slate-700/50 rounded-lg">
                            <p className="font-semibold text-white">Bountiful Yield</p>
                            <p className="text-sm text-green-200/80">1,750 Raw Nilk + 300 $NILK</p>
                          </div>
                          <div className="p-3 bg-slate-700/50 rounded-lg">
                            <p className="font-semibold text-white">Efficient Processing</p>
                            <p className="text-sm text-green-200/80">1,000 Raw Nilk + 150 $NILK</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </TabsContent>

                {/* HYPE Tab */}
                <TabsContent value="hype" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* HYPE Acquisition - Visual Heavy */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-xl border border-purple-500/50">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 relative mr-3">
                          <Image src="/hyperliquid.png" alt="HYPE" width={32} height={32} className="object-contain" />
                        </div>
                        <h3 className="text-xl font-bold text-purple-300">HYPE Acquisition</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Marketplace */}
                        <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 p-4 rounded-xl border border-purple-500/30">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="w-16 h-16 bg-purple-600/20 rounded-xl p-2 flex items-center justify-center">
                              <Image src="/hyperliquid.png" alt="Marketplace" width={40} height={40} className="object-contain" />
                        </div>
                            <div>
                              <h4 className="font-bold text-white">Marketplace</h4>
                              <p className="text-purple-300 text-sm">Direct purchases</p>
                        </div>
                          </div>
                          <div className="bg-slate-700/30 p-2 rounded text-center">
                            <span className="text-purple-200 text-xs">Marketplace prices are set in HYPE, with a dynamic $NILK price available via oracle.</span>
                          </div>
                        </div>

                        {/* Achievement Rewards */}
                        <div className="bg-gradient-to-r from-orange-900/40 to-orange-800/40 p-4 rounded-xl border border-orange-500/30">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="w-16 h-16 bg-orange-600/20 rounded-xl p-2 flex items-center justify-center">
                              <Award className="w-8 h-8 text-orange-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white">Achievement Rewards</h4>
                              <p className="text-orange-300 text-sm">Earn through gameplay</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="bg-slate-700/30 p-2 rounded">
                              <span className="text-orange-200">Daily Processing: 0.02-0.07 HYPE</span>
                            </div>
                            <div className="bg-slate-700/30 p-2 rounded">
                              <span className="text-orange-200">Fusion Milestones: 0.12-0.36 HYPE</span>
                            </div>
                            <div className="bg-slate-700/30 p-2 rounded">
                              <span className="text-orange-200">Liquidity Goals: 0.24-0.6 HYPE</span>
                            </div>
                          </div>
                        </div>

                        {/* Treasury */}
                        <div className="bg-gradient-to-r from-green-900/40 to-green-800/40 p-4 rounded-xl border border-green-500/30">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="w-16 h-16 bg-green-600/20 rounded-xl p-2">
                              <Image src="/gallonjug.png" alt="Treasury" width={48} height={48} className="object-contain" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white">Treasury Distribution</h4>
                              <p className="text-green-300 text-sm">Community rewards</p>
                            </div>
                          </div>
                          <div className="bg-slate-700/30 p-2 rounded text-center">
                            <span className="text-green-200 text-sm font-bold">240 HYPE ($10,000)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* HYPE Exclusive Items */}
                    <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 p-6 rounded-xl border border-orange-500/50">
                      <div className="flex items-center mb-4">
                        <Sparkles className="w-6 h-6 text-orange-400 mr-3" />
                        <h3 className="text-xl font-bold text-orange-300">HYPE Exclusive Items</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="font-semibold text-white">HYPE Processing Boost</p>
                          <p className="text-orange-400 font-bold">0.12 HYPE ($5)</p>
                          <p className="text-sm text-orange-200/80">50% fee reduction, 24h duration</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="font-semibold text-white">Premium LP Boost</p>
                          <p className="text-orange-400 font-bold">5 HYPE ($210)</p>
                          <p className="text-sm text-orange-200/80">25% permanent LP reward increase</p>
                        </div>
                      </div>
                    </div>

                    {/* Progression Timeline */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 p-6 rounded-xl border border-lime-800/50 lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <Clock className="w-6 h-6 text-lime-400 mr-3" />
                        <h3 className="text-xl font-bold text-lime-300">2-Month Progression Timeline</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-700/50 rounded-lg">
                          <p className="font-bold text-lime-300 mb-2">Week 1-2: Foundation</p>
                          <p className="text-sm text-white mb-1">Target: 1-2 Common Cows</p>
                          <p className="text-sm text-lime-200/80">HYPE Earning: 10-20</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg">
                          <p className="font-bold text-purple-300 mb-2">Week 3-4: Scaling</p>
                          <p className="text-sm text-white mb-1">Target: Standard Machine + Cosmic Cow</p>
                          <p className="text-sm text-purple-200/80">HYPE Earning: 30-50</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg">
                          <p className="font-bold text-blue-300 mb-2">Week 5-6: Optimization</p>
                          <p className="text-sm text-white mb-1">Target: PRO Machine + Multiple Cows</p>
                          <p className="text-sm text-blue-200/80">HYPE Earning: 50-100</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg">
                          <p className="font-bold text-yellow-300 mb-2">Week 7-8: Mastery</p>
                          <p className="text-sm text-white mb-1">Target: Galactic Cow + Full optimization</p>
                          <p className="text-sm text-yellow-200/80">HYPE Earning: 100+</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </TabsContent>

                {/* Liquidity Tab */}
                <TabsContent value="liquidity" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Dynamic Reward System */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-xl border border-blue-500/50 hover:border-blue-400/70 transition-all duration-300">
                      <div className="flex items-center mb-4">
                        <Droplets className="w-6 h-6 text-blue-400 mr-3" />
                        <h3 className="text-xl font-bold text-blue-300">Dynamic Reward System</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-blue-500/30 hover:bg-slate-700/70 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-white">Base APR</p>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-blue-400" />
                          <p className="text-blue-400 font-bold text-lg">25%</p>
                        </div>
                          </div>
                          <p className="text-sm text-blue-200/80">Significantly increased from 0.1%</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-green-500/30 hover:bg-slate-700/70 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-white">Small Pool Bonus</p>
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-green-400" />
                              <p className="text-green-400 font-bold text-lg">Up to 50%</p>
                        </div>
                          </div>
                          <p className="text-sm text-green-200/80">For pools &lt; 100k LP tokens</p>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-purple-500/30 hover:bg-slate-700/70 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-white">Early Adopter Bonus</p>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-purple-400" />
                              <p className="text-purple-400 font-bold text-lg">1.5x</p>
                            </div>
                          </div>
                          <p className="text-sm text-purple-200/80">Multiplier for first 30 days</p>
                        </div>
                      </div>
                    </div>

                    {/* Trading Fees */}
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-6 rounded-xl border border-green-500/50">
                      <div className="flex items-center mb-4">
                        <Percent className="w-6 h-6 text-green-400 mr-3" />
                        <h3 className="text-xl font-bold text-green-300">Trading Fees</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="font-semibold text-white">Fee Rate</p>
                          <p className="text-green-400 font-bold text-lg">0.3%</p>
                          <p className="text-sm text-green-200/80">on all swaps</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="font-semibold text-white mb-2">Fee Distribution</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-green-200/80">50% → LP holders (sustainable rewards)</p>
                            <p className="text-green-200/80">50% → Treasury (protocol sustainability)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Mitigation */}
                    <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 p-6 rounded-xl border border-red-500/50 lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <Truck className="w-6 h-6 text-red-400 mr-3" />
                        <h3 className="text-xl font-bold text-red-300">Risk Mitigation</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="font-semibold text-white">Maximum Reward Rate</p>
                          <p className="text-red-200/80 text-sm">Capped at 50% APR</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="font-semibold text-white">Treasury Monitoring</p>
                          <p className="text-red-200/80 text-sm">Auto-reduction if &lt; 30 days runway</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="font-semibold text-white">Whale Protection</p>
                          <p className="text-red-200/80 text-sm">LP position limits</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="font-semibold text-white">Emergency Controls</p>
                          <p className="text-red-200/80 text-sm">Pause functionality for critical issues</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </TabsContent>

                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard" className="mt-0">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-xl border border-purple-500/50">
                      <div className="flex items-center mb-6">
                        <Award className="w-6 h-6 text-purple-400 mr-3" />
                        <h3 className="text-xl font-bold text-purple-300">Season 1 Leaderboard</h3>
                      </div>
                      <div className="overflow-x-auto">
                        {leaderboardLoading ? (
                          <div className="flex justify-center items-center h-48">
                            <p>Loading Leaderboard...</p>
                          </div>
                        ) : (
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-purple-400/20 text-purple-300">
                                <th className="p-3">Rank</th>
                                <th className="p-3">Player</th>
                                <th className="p-3">X Handle</th>
                                <th className="p-3 text-right">Raw Nilk Processed</th>
                                <th className="p-3 text-right">HYPE Earned</th>
                                <th className="p-3 text-right">Fusions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaderboardData.length > 0 ? (
                                leaderboardData.map((entry, index) => (
                                  <tr key={entry.rank} className="border-b border-slate-700 hover:bg-slate-800/50">
                                    <td className={`p-3 font-bold flex items-center ${
                                      index === 0 ? 'text-yellow-400' :
                                      index === 1 ? 'text-slate-300' :
                                      index === 2 ? 'text-orange-400' : ''
                                    }`}>
                                      {index === 0 && <Crown className="w-4 h-4 mr-1" />}
                                      {entry.rank}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center space-x-3">
                                        {entry.avatar_url ? (
                                          <img 
                                            src={entry.avatar_url} 
                                            alt="Profile" 
                                            className="w-10 h-10 rounded-full border-2 border-lime-400"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-full border-2 border-lime-400 bg-slate-700 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                          </div>
                                        )}
                                        <span className="font-mono" title={entry.wallet_address || 'Unknown'}>
                                          {entry.username || (entry.wallet_address ? `${entry.wallet_address.substring(0, 6)}...${entry.wallet_address.substring(entry.wallet_address.length - 4)}` : 'Unknown')}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      {entry.x_handle ? (
                                        <a 
                                          href={`https://x.com/${entry.x_handle}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                                        >
                                          <span>@{entry.x_handle}</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ) : (
                                        <span className="text-slate-500">-</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">{(entry.raw_nilk_processed || 0).toLocaleString()}</td>
                                    <td className="p-3 text-right">{(entry.hype_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right">{entry.fusion_count || 0}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} className="text-center p-8 text-slate-400">
                                    No data available. Be the first to make your mark!
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <p className="text-xs text-center mt-4 text-purple-200/60">Leaderboard updates in real-time. Rewards distributed at the end of the season.</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Roadmap Tab */}
                <TabsContent value="roadmap" className="mt-0">
                  <div className="space-y-6">
                    
                    {/* Phase 1 */}
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-6 rounded-xl border border-green-500/50">
                      <div className="flex items-center mb-4">
                        <Leaf className="w-6 h-6 text-green-400 mr-3" />
                        <h3 className="text-xl font-bold text-green-300">Season 1: Foundation (Current)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-green-200">5x production boost</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-green-200">70% cost reduction</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-green-200">Dynamic LP rewards (25-50% APR)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-green-200">HYPE integration</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-green-200">Achievement system</span>
                        </div>
                      </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-xl border border-blue-500/50">
                      <div className="flex items-center mb-4">
                        <Recycle className="w-6 h-6 text-blue-400 mr-3" />
                        <h3 className="text-xl font-bold text-blue-300">Season 2: Expansion (Months 3-4)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500/50 rounded-full border border-blue-400"></div>
                          <span className="text-blue-200">Cosmetics & Skins</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500/50 rounded-full border border-blue-400"></div>
                          <span className="text-blue-200">Clan Battles</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500/50 rounded-full border border-blue-400"></div>
                          <span className="text-blue-200">Competitive Mini-games</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500/50 rounded-full border border-blue-400"></div>
                          <span className="text-blue-200">Impermanent loss protection</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500/50 rounded-full border border-blue-400"></div>
                          <span className="text-blue-200">Auto-compounding LP rewards</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500/50 rounded-full border border-blue-400"></div>
                          <span className="text-blue-200">Governance Token Integration</span>
                        </div>
                      </div>
                    </div>

                    {/* Phase 3 */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-xl border border-purple-500/50">
                      <div className="flex items-center mb-4">
                        <Scaling className="w-6 h-6 text-purple-400 mr-3" />
                        <h3 className="text-xl font-bold text-purple-300">Season 3: Maturity (Months 5+)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-purple-500/50 rounded-full border border-purple-400"></div>
                          <span className="text-purple-200">Multi-chain deployment</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-purple-500/50 rounded-full border border-purple-400"></div>
                          <span className="text-purple-200">Institutional partnerships</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-purple-500/50 rounded-full border border-purple-400"></div>
                          <span className="text-purple-200">Real-world asset integration</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-purple-500/50 rounded-full border border-purple-400"></div>
                          <span className="text-purple-200">Mobile app launch</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </TabsContent>

              </div>
            </Tabs>

          </div>
        </div>
      )}
    </div>
  );
}

