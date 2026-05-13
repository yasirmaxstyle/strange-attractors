import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Leva, button, folder, useControls } from "leva";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

function AttractorSystem() {
    const pointsRef = useRef<THREE.Points>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(null);

    const [isAnimating, setIsAnimating] = useState(true);

    const {
        attractorType,
        particleCount,
        dt,
        animationSpeed,
        particleColor,
        autoRotate,
        sigma, rho, beta,
        thomasA,
        aizawaA, aizawaB, aizawaC, aizawaD, aizawaE
    } = useControls({
        attractorType: { options: ["Lorenz", "Thomas", "Aizawa"] },

        // Limits set: Min 10k, Max 300k. Going too high can drop frames heavily.
        particleCount: { value: 100000, min: 10000, max: 300000, step: 5000 },
        autoRotate: true,
        dt: { value: 0.01, min: 0.001, max: 0.05, step: 0.001 },
        animationSpeed: { value: 1, min: 1, max: 10, step: 1 },
        particleColor: "#75bbfd",
        toggleAnimation: button(() => { setIsAnimating((prev) => !prev) }),

        Lorenz: folder({
            sigma: { value: 10, min: 0, max: 50, step: 0.1 },
            rho: { value: 28, min: 0, max: 50, step: 0.1 },
            beta: { value: 8 / 3, min: 0, max: 10, step: 0.01 },
        }, { render: (get) => get("attractorType") === "Lorenz" }),

        Thomas: folder({
            thomasA: { value: 0.19, min: 0.01, max: 0.5, step: 0.01, label: "a (dissipation)" },
        }, { render: (get) => get("attractorType") === "Thomas" }),

        Aizawa: folder({
            aizawaA: { value: 0.80, min: 0.1, max: 2.0, step: 0.01, label: "a" },
            aizawaB: { value: 0.70, min: 0.1, max: 2.0, step: 0.01, label: "b" },
            aizawaC: { value: 0.60, min: 0.1, max: 2.0, step: 0.01, label: "c" },
            aizawaD: { value: 3.50, min: 1.0, max: 10.0, step: 0.1, label: "d" },
            aizawaE: { value: 0.10, min: 0.01, max: 1.0, step: 0.01, label: "e" },
        }, { render: (get) => get("attractorType") === "Aizawa" }),
    });

    // Re-allocate array only when particleCount changes
    const positions = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return pos;
    }, [particleCount]);

    useFrame(() => {
        if (pointsRef.current && autoRotate) {
            pointsRef.current.rotation.z += 0.002;
            pointsRef.current.rotation.y += 0.001; // Added a slight Y spin for volume
        }

        if (!isAnimating || !geometryRef.current) return;

        const posArray = geometryRef.current.attributes.position.array as Float32Array;

        for (let step = 0; step < animationSpeed; step++) {
            for (let i = 0; i < particleCount; i++) {
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
                    dx = (-thomasA * x + Math.sin(y));
                    dy = (-thomasA * y + Math.sin(z));
                    dz = (-thomasA * z + Math.sin(x));
                } else if (attractorType === "Aizawa") {
                    dx = ((z - aizawaB) * x - aizawaD * y);
                    dy = (aizawaD * x + (z - aizawaB) * y);
                    dz = (aizawaC + aizawaA * z - ((z * z * z) / 3.0) - (x * x) + aizawaE * z * (x * x * x));
                }

                posArray[i3] += dx * dt;
                posArray[i3 + 1] += dy * dt;
                posArray[i3 + 2] += dz * dt;
            }
        }

        geometryRef.current.attributes.position.needsUpdate = true;
    });

    // Scale management for vastly different coordinate bounds
    const getMeshScale = () => {
        if (attractorType === "Thomas") return 10;
        if (attractorType === "Aizawa") return 15;
        return 1;
    };

    return (
        <points ref={pointsRef} scale={getMeshScale()}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
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

export default function StrangeAttractors() {
    const [uiHidden, setUiHidden] = useState(false);

    return (
        <div style={{ position: "fixed", inset: 0, fontFamily: "sans-serif" }}>

            {/* Explicit Leva instance to control visibility */}
            <Leva hidden={uiHidden} />

            {/* Focus Mode Toggle Button */}
            <button
                onClick={() => setUiHidden(!uiHidden)}
                style={{
                    position: "absolute",
                    bottom: 24,
                    right: 24,
                    zIndex: 10,
                    padding: "10px 16px",
                    backgroundColor: "rgba(20, 20, 20, 0.8)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backdropFilter: "blur(4px)"
                }}
            >
                {uiHidden ? "Show Controls" : "Focus Mode"}
            </button>

            <Canvas camera={{ position: [0, -60, 40], fov: 75 }}>
                <color attach="background" args={["#080808"]} />
                <AttractorSystem />
                <OrbitControls enableDamping dampingFactor={0.05} />
            </Canvas>
        </div>
    );
}