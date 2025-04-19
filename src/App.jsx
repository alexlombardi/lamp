import { useState, useRef, useEffect } from 'react';
import './App.css';
import * as THREE from 'three';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { Html, Environment, OrbitControls, MeshDiscardMaterial, useScroll, ScrollControls, Scroll, SoftShadows, RoundedBox, Text3D, Stars } from '@react-three/drei';
import { easing, geometry } from 'maath';

extend(geometry)

const maxScrollPages = 10;

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

function RotatingBox() {
    const meshRef = useRef()

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.01
            meshRef.current.rotation.y += 0.01
        }
    })

    return (
        <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[2, 2, 2]} />
            <meshPhysicalMaterial side={THREE.DoubleSide} color='white' />
        </mesh>
    )
}

function FloatingLight() {
    const lightRef = useRef()
    const timeRef = useRef(0)

    useFrame((state, delta) => {
        timeRef.current += delta
        if (lightRef.current) {
            lightRef.current.position.y = Math.sin(timeRef.current) * 6
            lightRef.current.position.x = Math.cos(timeRef.current) * 6
        }
    })

    return (
        //<pointLight ref={lightRef} color="#ffffff" position={[0, 0, 0.1]} castShadow intensity={1.5} distance={1000} decay={0.1} />
        <directionalLight ref={lightRef} color="#ffffff" position={[0, 1, 0.5]} castShadow intensity={1.5} />
    )
}

function RotatingText() {
    const scroll = useScroll();
    const textRef = useRef();

    useFrame(() => {
        if (textRef.current) {
            const rotationValue = scroll.offset * Math.PI * 5; // Rotate based on scroll offset
            //textRef.current.rotation.y = rotationValue;

            // Move the text down to stay even with the camera as it scrolls
            const scrollPosition = scroll.offset * 100; // Adjust multiplier based on scroll speed
            //textRef.current.position.y = -scrollPosition;
        }
    });

    return (
        <Text3D
            ref={textRef}
            position={[-2.4, -13, 0.2]}
            font={'./Notable_Regular.json'}
            castShadow
            receiveShadow
        >
            TEST
            <meshPhysicalMaterial
                side={THREE.DoubleSide}
                roughness={0.25}
                metalness={1}
                iridescence={1}
                color="red"
                emissive="white"
            />
        </Text3D>
    );
}

function CameraLight() {
    
    return <directionalLight color="#ffffff" position={[0, 0, 1]} rotation={[degToRad(90), 0, 0]} castShadow intensity={0.4} />
}

function MainHtml() {
    const scroll = useScroll();
    const [scrollPosition, setScrollPosition] = useState(0); // 1 = 1 viewport height
    const viewportHeight = window.innerHeight;

    useFrame(() => {
        setScrollPosition(scroll.offset * maxScrollPages);
    });
    
    return <>
        <video className='video' autoPlay loop muted playsInline style={{transform: `scale(${1 - scrollPosition})`, opacity: 1 - scrollPosition * 2}}>
            <source src="./vid.m4v" type="video/mp4" />
        </video>
        <div className='mainTitle' style={{transform: `scale(${1 - scrollPosition / 2})`}}>
            <div className='objectCanvas'>
                <Canvas shadows camera={{ position: [0, 0, 5], fov: 75 }}>
                    <ambientLight intensity={1} />
                    <RotatingBox />
                </Canvas>
            </div>
            <h1>TITLE</h1>
        </div>

        <div className='fullWidthCenteredRow'>
            <div className='wideCanvasContainer'>
                <Canvas className='wideCanvas' shadows camera={{ position: [0, 0, 10], fov: 75 }}>
                    <FloatingLight />
                    <mesh rotation={[2 * Math.PI, 0, 0]} position={[0, 0, 0]} receiveShadow>
                        <planeGeometry args={[100, 100]} receiveShadow />
                        <meshPhysicalMaterial side={THREE.DoubleSide} emissive={1} color={'#ffffff'} />
                    </mesh>
                    <RoundedBox args={[6, 3, 1]} radius={0.24} position={[0, 0, -0.3]} castShadow receiveShadow>
                        <meshPhysicalMaterial side={THREE.DoubleSide} color={'white'} />
                    </RoundedBox>
                    <RotatingText />
                </Canvas>
            </div>
        </div>

        {/*debug*/}
        <div style={{position: 'fixed', top: 50 + (scrollPosition * viewportHeight) + 'px', right: '50px', color: 'white', fontSize: '20px',}}>
            {scrollPosition.toFixed(2)}
        </div>
    </>
}

function buttonHover(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const circle = event.currentTarget.querySelector('.buttonHoverCircle');
    if (!circle) { return };
    circle.style.display = 'block'
    circle.style.left = (event.clientX - rect.left) + 'px';
    circle.style.top = (event.clientY - rect.top) + 'px';
}

function buttonUnhover(event) {
    const circle = event.currentTarget.querySelector('.buttonHoverCircle');
    if (!circle) { return };
    circle.style.display = 'none'
}

function App() {
    return (
        <div className="App">
            <Canvas className='mainCanvas' shadows camera={{ position: [0, 0, 10], fov: 75 }}>
                <SoftShadows size={33} samples={100} />
                <FloatingLight />
                <Environment preset="city" />
                <Stars radius={100} depth={50} count={5000} factor={7} saturation={0} fade />
                <ScrollControls pages={maxScrollPages} damping={0.2}>
                    <Scroll html style={{ width: '100%', height: '100%' }}>
                        <MainHtml />
                    </Scroll>
                    <Scroll>
                        <RoundedBox args={[6, 3, 1]} radius={0.24} position={[0, -12.5, -0.3]} castShadow receiveShadow>
                            <meshPhysicalMaterial side={THREE.DoubleSide} color={'white'} />
                        </RoundedBox>
                        <RotatingText />
                    </Scroll>
                </ScrollControls>
            </Canvas>
            <div className='overlay'>
                <div className='button' onClick={() => {fillAll()}} onMouseEnter={(event) => {buttonHover(event)}} onMouseLeave={(event) => {buttonUnhover(event)}}>
                    <div className='buttonHoverCircle'></div>
                    <div className='buttonText'>ABOUT</div>
                </div>
                <div className='button' onClick={() => {fillAll()}} onMouseEnter={(event) => {buttonHover(event)}} onMouseLeave={(event) => {buttonUnhover(event)}}>
                    <div className='buttonHoverCircle'></div>
                    <div className='buttonText'>SHOP</div>
                </div>
            </div>
        </div>
    )
}

export default App
