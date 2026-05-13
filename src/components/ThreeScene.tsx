import { Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three"

interface LorenzPoint {
    x: number;
    y: number;
    z: number;
}

interface LorenzTrace {
    positions: Float32Array;
    currentIndex: number;
    pointCount: number;
    x: number;
    y: number;
    z: number;
    color: THREE.ColorRepresentation;
}

const MAX_POINTS = 10000;

function createRandomStartPoints(count: number): LorenzPoint[] {
    const baseX = (Math.random() - 0.5) * 20;
    const baseY = (Math.random() - 0.5) * 20;
    const baseZ = (Math.random() - 0.5) * 20;

    return Array.from({ length: count }, () => ({
        x: baseX + Math.random() * 0.02,
        y: baseY + Math.random() * 0.02,
        z: baseZ + Math.random() * 0.02,
    }));
}

function LorenzSystem() {
    const groupRef = useRef<THREE.Group>(null);

    const [isAnimating, setIsAnimating] = useState(true);
    const [tick, setTick] = useState(0);

    const { sigma, rho, beta, dt, numTraces, rotationSpeed, animationSpeed, showAxes } = useControls({
        sigma: { value: 10, min: 0, max: 50, step: 0.1 },
        rho: { value: 28, min: 0, max: 50, step: 0.1 },
        beta: { value: 8 / 3, min: 0, max: 10, step: 0.01 },
        dt: { value: 0.005, min: 0.0001, max: 0.02, step: 0.001 },
        numTraces: { value: 3, min: 1, max: 10, step: 1 },
        rotationSpeed: { value: 0.001, min: -0.05, max: 0.05, step: 0.001 },
        animationSpeed: { value: 1, min: 1, max: 20, step: 1 },
        showAxes: false,
        toggleAnimation: button(() => { setIsAnimating((prev) => !prev) }),
    })

    const traces = useMemo<LorenzTrace[]>(() => {
        const startPoints = createRandomStartPoints(numTraces);

        const colors = [
            "#ff006e",
            "#3a86ff",
            "#8338ec",
            "#fb5607",
            "#06d6a0",
            "#ffbe0b",
        ];

        return Array.from({ length: numTraces }, (_, index) => ({
            positions: new Float32Array(MAX_POINTS * 3),
            currentIndex: 0,
            pointCount: 0,
            x: startPoints[index].x,
            y: startPoints[index].y,
            z: startPoints[index].z,
            color: colors[index % colors.length]
        }));
    }, [numTraces]);

    const lorenzDerivatives = (
        x: number,
        y: number,
        z: number
    ): LorenzPoint => {
        return {
            x: sigma * (y - x),
            y: x * (rho - z) - y,
            z: x * y - beta * z,
        };
    };

    useFrame(() => {
        if (!isAnimating) return;

        traces.forEach((trace) => {
            for (let i = 0; i < animationSpeed; i++) {
                const derivatives = lorenzDerivatives(
                    trace.x,
                    trace.y,
                    trace.z
                )

                trace.x += derivatives.x * dt;
                trace.y += derivatives.y * dt;
                trace.z += derivatives.z * dt;

                const i3 = trace.currentIndex * 3;

                trace.positions[i3] = trace.x;
                trace.positions[i3 + 1] = trace.y;
                trace.positions[i3 + 2] = trace.z;

                trace.currentIndex = (trace.currentIndex + 1) % MAX_POINTS;

                trace.pointCount = Math.min(trace.pointCount + 1, MAX_POINTS);
            }
        });

        if (groupRef.current) {
            groupRef.current.rotation.z += rotationSpeed;
        }

        setTick((prev) => prev + 1);
    })

    return (
        <group ref={groupRef}>
            {showAxes && <axesHelper args={[200]} />}

            {traces.map((trace, index) => {
                const points: [number, number, number][] = []

                for (let i = 0; i < trace.pointCount; i++) {
                    const i3 = i * 3;

                    points.push([
                        trace.positions[i3],
                        trace.positions[i3 + 1],
                        trace.positions[i3 + 2],
                    ]);
                }

                return (
                    <group key={index}>
                        <mesh position={[trace.x, trace.y, trace.z]}>
                            <sphereGeometry args={[0.25, 16, 16]} />
                            <meshStandardMaterial color={trace.color} />
                        </mesh>

                        {points.length >= 2 && (
                            <Line points={points} color={trace.color} lineWidth={1} />
                        )}
                    </group>
                );
            })}

            <ambientLight intensity={0.6} />
            <pointLight position={[20, 20, 20]} intensity={1} />
        </group>
    )
}

export default function LorenzAttractor() {
    return (
        <div style={{ position: "fixed", inset: 0 }}>
            <Canvas camera={{ position: [0, -100, 50], fov: 75 }}>
                <color attach="background" args={["#080808"]} />
                <LorenzSystem />
                <OrbitControls enableDamping dampingFactor={0.05} />
            </Canvas>
        </div>
    )
}