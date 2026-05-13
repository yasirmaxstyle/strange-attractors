import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { button, folder, useControls } from "leva";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 100000;

function AttractorSystem() {
    const pointsRef = useRef<THREE.Points>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(null);

    const [isAnimating, setIsAnimating] = useState(true);

    const {
        attractorType,
        dt, animationSpeed, particleColor,
        sigma, rho, beta,
        thomasA
    } = useControls({
        attractorType: { options: ["Lorenz", "Thomas"] },
        dt: { value: 0.01, min: 0.001, max: 0.05, step: 0.001 },
        animationSpeed: { value: 2, min: 1, max: 10, step: 1 },
        particleColor: "#75bbfd",
        toggleAnimation: button(() => { setIsAnimating((prev) => !prev) }),

        // Group Lorenz parameters so they only show when Lorenz is selected
        Lorenz: folder({
            sigma: { value: 10, min: 0, max: 50, step: 0.1 },
            rho: { value: 28, min: 0, max: 50, step: 0.1 },
            beta: { value: 8 / 3, min: 0, max: 10, step: 0.01 },
        }, { render: (get) => get("attractorType") === "Lorenz" }),

        // Group Thomas parameters so they only show when Thomas is selected
        Thomas: folder({
            thomasA: { value: 0.19, min: 0.01, max: 0.5, step: 0.01, label: "a (dissipation)" },
        }, { render: (get) => get("attractorType") === "Thomas" }),
    });

    const positions = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3);
        // Initialize in a tighter 10x10x10 bounds so the particles don't have 
        // to travel as far to fall into the Thomas attractor's pull
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return pos;
    }, []);

    useFrame(() => {
        if (!isAnimating || !geometryRef.current) return;

        const posArray = geometryRef.current.attributes.position.array as Float32Array;

        for (let step = 0; step < animationSpeed; step++) {
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const i3 = i * 3;
                const x = posArray[i3];
                const y = posArray[i3 + 1];
                const z = posArray[i3 + 2];

                let dx = 0, dy = 0, dz = 0;

                if (attractorType === "Lorenz") {
                    dx = sigma * (y - x);
                    dy = x * (rho - z) - y;
                    dz = x * y - beta * z;
                } else if (attractorType === "Thomas") {
                    // Thomas cyclically symmetric equations using Math.sin
                    dx = (-thomasA * x + Math.sin(y));
                    dy = (-thomasA * y + Math.sin(z));
                    dz = (-thomasA * z + Math.sin(x));
                }

                posArray[i3] += dx * dt;
                posArray[i3 + 1] += dy * dt;
                posArray[i3 + 2] += dz * dt;
            }
        }

        geometryRef.current.attributes.position.needsUpdate = true;
    });

    // Dynamically scale the mesh. The Thomas attractor is mathematically very small.
    // Multiplying its render scale by 10 makes it fill the screen similarly to the Lorenz.
    const meshScale = attractorType === "Thomas" ? 10 : 1;

    return (
        <points ref={pointsRef} scale={meshScale}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={PARTICLE_COUNT}
                    args={[positions, 3]}
                />
            </bufferGeometry>

            <pointsMaterial
                size={0.12}
                color={particleColor}
                transparent
                opacity={0.4}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    );
}

export default function ChaoticAttractors() {
    return (
        <div style={{ position: "fixed", inset: 0 }}>
            {/* Adjusted camera slightly for a better universal viewing angle */}
            <Canvas camera={{ position: [0, -60, 40], fov: 75 }}>
                <color attach="background" args={["#080808"]} />
                <AttractorSystem />
                <OrbitControls enableDamping dampingFactor={0.05} />
            </Canvas>
        </div>
    );
}