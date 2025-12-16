import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Torus, Icosahedron, Sphere, Environment } from '@react-three/drei';

const FloatingShapes = () => {
    return (
        <>
            <Float speed={2} rotationIntensity={1} floatIntensity={2}>
                <Torus args={[1, 0.3, 16, 100]} position={[-3, 2, -5]} rotation={[0.5, 0.5, 0]}>
                    <meshStandardMaterial color="#6366f1" opacity={0.6} transparent roughness={0.2} metalness={0.5} />
                </Torus>
            </Float>

            <Float speed={1.5} rotationIntensity={1.5} floatIntensity={1.5}>
                <Icosahedron args={[1.2, 0]} position={[4, -2, -6]}>
                    <meshStandardMaterial color="#fb7185" opacity={0.6} transparent roughness={0.2} metalness={0.5} />
                </Icosahedron>
            </Float>

            <Float speed={2.5} rotationIntensity={0.8} floatIntensity={2}>
                <Sphere args={[0.5, 32, 32]} position={[2, 3, -4]}>
                    <meshStandardMaterial color="#34d399" opacity={0.6} transparent roughness={0.2} metalness={0.5} />
                </Sphere>
            </Float>

            <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1.8}>
                <Torus args={[0.8, 0.2, 16, 50]} position={[-4, -3, -7]} rotation={[1, 1, 0]}>
                    <meshStandardMaterial color="#fb7185" opacity={0.4} transparent roughness={0.2} metalness={0.5} />
                </Torus>
            </Float>
        </>
    );
};

export default function Background3D() {
    return (
        <div className="fixed inset-0 -z-10 w-full h-full pointer-events-none">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 10, 5]} intensity={1} color="#FFF8E7" />
                <Environment preset="city" />
                <FloatingShapes />
            </Canvas>
        </div>
    );
}
