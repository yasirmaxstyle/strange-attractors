import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 100000; // Massive increase for the volumetric dust effect

function LorenzSystem() {
    const pointsRef = useRef<THREE.Points>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(null);

    const [isAnimating, setIsAnimating] = useState(true);

    const { sigma, rho, beta, dt, rotationSpeed, animationSpeed, showAxes, particleColor } = useControls({
        sigma: { value: 10, min: 0, max: 50, step: 0.1 },
        rho: { value: 28, min: 0, max: 50, step: 0.1 },
        beta: { value: 8 / 3, min: 0, max: 10, step: 0.01 },
        dt: { value: 0.005, min: 0.0001, max: 0.02, step: 0.001 },
        rotationSpeed: { value: 0.001, min: -0.05, max: 0.05, step: 0.001 },
        animationSpeed: { value: 1, min: 1, max: 10, step: 1 },
        particleColor: "#75bbfd", // Light blue matching the reference
        showAxes: false,
        toggleAnimation: button(() => { setIsAnimating((prev) => !prev) }),
    });

    // Initialize random positions scattered evenly
    const positions = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        return pos;
    }, []);

    useFrame(() => {
        if (pointsRef.current) {
            pointsRef.current.rotation.z += rotationSpeed;
        }

        if (!isAnimating || !geometryRef.current) return;

        // Directly mutate the typed array for high performance
        const posArray = geometryRef.current.attributes.position.array as Float32Array;

        for (let step = 0; step < animationSpeed; step++) {
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const i3 = i * 3;
                const x = posArray[i3];
                const y = posArray[i3 + 1];
                const z = posArray[i3 + 2];

                const dx = sigma * (y - x);
                const dy = x * (rho - z) - y;
                const dz = x * y - beta * z;

                posArray[i3] += dx * dt;
                posArray[i3 + 1] += dy * dt;
                posArray[i3 + 2] += dz * dt;
            }
        }

        // Inform WebGL that the array data has changed
        geometryRef.current.attributes.position.needsUpdate = true;
    });

    return (
        <group>
            {showAxes && <axesHelper args={[200]} />}

            <points ref={pointsRef}>
                <bufferGeometry ref={geometryRef}>
                    <bufferAttribute
                        attach="attributes-position"
                        count={PARTICLE_COUNT}
                        args={[positions, 3]}
                    />
                </bufferGeometry>

                {/* 
                  Additive blending and disabled depthWrite are critical 
                  for preventing dark artifacts and creating the glow 
                */}
                <pointsMaterial
                    size={0.12}
                    color={particleColor}
                    transparent
                    opacity={0.5}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation
                />
            </points>

            <ambientLight intensity={0.6} />
            <pointLight position={[20, 20, 20]} intensity={1} />
        </group>
    );
}

export default function LorenzAttractor() {
    return (
        <div style={{ position: "fixed", inset: 0 }}>
            <Canvas camera={{ position: [0, -80, 40], fov: 75 }}>
                <color attach="background" args={["#080808"]} />
                <LorenzSystem />
                <OrbitControls enableDamping dampingFactor={0.05} />
            </Canvas>
        </div>
    );
}