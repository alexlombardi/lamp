import { useState, useRef, useEffect } from 'react';
import './App.css';
import * as THREE from 'three';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { Html, Environment, OrbitControls, MeshDiscardMaterial, useScroll, ScrollControls, Scroll, SoftShadows, RoundedBox, useGLTF, View } from '@react-three/drei';
import { easing, geometry } from 'maath';
import { BrowserRouter, Routes, Route, Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import chroma from 'chroma-js';

extend(geometry)

const maxScrollPages = 10;

const pageTransitionAnimations = {
    initial: { opacity: 0, transform: 'translate(0, -120px)' },
    animate: { opacity: 1, transform: 'translate(0, 0)' },
    exit: { opacity: 0, transform: 'translate(0, 0)' },
    transition: { duration: 0.3 }
}

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

function RotatingCamera() {
    const { camera } = useThree();
    const timeRef = useRef(0);
    const radius = 10;
    const speed = 0.1;
    const height = 0;
    useFrame(() => {
        timeRef.current += speed * 0.01;
        camera.position.x = radius * Math.cos(timeRef.current);
        camera.position.z = radius * Math.sin(timeRef.current);
        camera.position.y = height;
        camera.lookAt(0, 0, 0);
    });
}

function RotatingCameraB() {
    const { camera } = useThree();
    const radius = 1;
    const speed = 0.5;
    const height = 1.2;

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime() * speed;
        camera.position.x = radius * Math.cos(t);
        camera.position.z = radius * Math.sin(t);
        camera.position.y = height;
        camera.lookAt(0, 0, 0);
    });

    return null;
}

function PlaceholderScene(name) {
    const { scene } = useGLTF('/placeholder-1.glb');
    const sharedMaterial = new THREE.MeshStandardMaterial({ color: 'white', roughness: 0.5, metalness: 0, side: THREE.DoubleSide });

    // Modify all meshes
    scene.traverse((child) => {
        if (child.isMesh) {
            if (!child.geometry.attributes.normal) {
                child.geometry.computeVertexNormals(); //Generate normals if missing
            }
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = sharedMaterial;
        }
        if (child.isCamera) {
            scene.remove(child);  //remove any cameras
        }
    });

    return <primitive object={scene} />;
}

function DemoLamp() {
    const { scene } = useGLTF('/concept-lamp-7.glb');
    const scroll = useScroll();
    const [scrollPosition, setScrollPosition] = useState(0); // 1 = 1 viewport height

    useFrame(() => {
        setScrollPosition(scroll.offset * maxScrollPages);
        scene.position.y = -40 - Math.min(Math.max(scrollPosition - 2.7, 0), 1.5) * 13.82;
        //scene.rotation.x = Math.max(scrollPosition - 2.70, 0) * 2;
    });

    return <>
        <primitive object={scene} />
        <pointLight
            color="#fff2d5"
            position={[0, -40 - Math.min(Math.max(scrollPosition - 2.7, 0), 1.5) * 13.82, 0]}
            intensity={40 + Math.min(Math.max(scrollPosition - 2.7, 0), 1.5) * 50}
            castShadow
        />
        <directionalLight position={[0, 0, 2]} rotation={[0, 0, Math.PI]} color="#fff2d5" intensity={Math.min(Math.max(scrollPosition - 2.7, 0), 1.5) * 15} />
    </>;
}

function HomeHtml() {
    const scroll = useScroll();
    const [scrollPosition, setScrollPosition] = useState(0); // 1 = 1 viewport height
    const viewportHeight = window.innerHeight;

    useFrame(() => {
        setScrollPosition(scroll.offset * maxScrollPages);
    });

    const titlePoint = 0.47;
    var titleScale = Math.max(1 - scrollPosition / 1.2, 1 - titlePoint / 1.2);
    var titleTop = scrollPosition > titlePoint ? 100 - (viewportHeight / 2) + (scrollPosition * viewportHeight) * 0.9 + 'px' : ''; //there must be a reason 0.9 works, but I have no idea what it is

    const horizontalMotionDivs = [
        {
            title: 'Smart',
            text: 'Brightens as you get closer to it, dims as you walk away',
            more: 'Using a combination of sensors, the lamp can detect your presence and adjust its brightness accordingly. Enjoy a well-lit space without having to fiddle with switches or apps',
            image: '/example-1.jpg'
        },
        {
            title: 'Simple',
            text: 'Works right out of the box - no complicated setup, apps, or fiddling with automations',
            more: 'Just plug it in and it will automatically adjust to your space. No need to download an app or set up complicated automations',
            image: '/example-2.jpg'
        },
        {
            title: 'Flexible',
            text: 'Detach the cable to switch to battery mode, or mount the lamp with included hardware and optional accessories',
            more: 'Magnetic cable allows for easy detachment and reattachment, while the included mounting hardware lets you place the lamp wherever you want',
            image: '/example-3.jpg'
        },
        {
            title: 'Beautiful',
            text: 'A modern, minimal design that fits in any space',
            more: 'Available in a variety of colors and finishes, including black, white, and gold',
            image: '/example-4.jpg'
        },
    ];

    return <motion.div className='pageTransitionAnimationContainer' initial={pageTransitionAnimations.initial} animate={pageTransitionAnimations.animate} exit={pageTransitionAnimations.exit} transition={pageTransitionAnimations.transition}>
        <video className='video' autoPlay loop muted playsInline style={{ transform: `scale(${1 - scrollPosition})`, opacity: 1 - scrollPosition * 2, borderRadius: Math.max(0, scrollPosition * 2) * 50 + 'px' }}>
            <source src="./vid-2.mp4" type="video/mp4" />
        </video>
        <div className='mainTitle' style={{ transform: `scale(${titleScale})`, top: titleTop }}>
            {/*<div className='objectCanvas'>
                <Canvas shadows camera={{ position: [0, 0, 5], fov: 75 }}>
                    <ambientLight intensity={1} />
                    <RotatingBox />
                </Canvas>
            </div>*/}
            <h1>LAMP</h1>
        </div>

        <div className='fullWidthCenteredRow'>
            <div className='wideCanvasContainer'>
                {/*<View className='wideCanvas'>
                    <PlaceholderScene name='placeholder-1.glb' />
                    <directionalLight
                        position={[-1.2, 0.6, 1]}
                        intensity={3}
                        color='pink'
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                        shadow-bias={-0.0005}
                    />
                </View>*/}
                <div className='textContainer'>
                    <h1>The future is looking bright.</h1>
                    Redefine your space with smooth, dynamic lighting that reacts to your movement through your home
                </div>
            </div>
        </div>
        {renderHorizontalMotionDivs(horizontalMotionDivs, scrollPosition)}
        <div className='moveDownTextContainer'>
            <div className='moveDownText' style={{ marginTop: Math.max(scrollPosition - 1.82, 0) * viewportHeight * 0.9 + 'px', opacity: 1 - Math.max(scrollPosition - 2.5, 0) * 2 }}>
                <h1>The promise of the smart home, fulfilled</h1>
            </div>
        </div>

        {/*debug*/}
        <div style={{ position: 'fixed', top: 50 + (scrollPosition * viewportHeight) * 0.9 + 'px', right: '50px', color: 'white', fontSize: '20px', }}>
            {scrollPosition.toFixed(2)}
        </div>
    </motion.div>
}

function AboutHtml() {
    const scroll = useScroll();
    const [scrollPosition, setScrollPosition] = useState(0); // 1 = 1 viewport height
    const viewportHeight = window.innerHeight;

    useFrame(() => {
        setScrollPosition(scroll.offset * maxScrollPages);
    });

    return <motion.div className='pageTransitionAnimationContainer' initial={pageTransitionAnimations.initial} animate={pageTransitionAnimations.animate} exit={pageTransitionAnimations.exit} transition={pageTransitionAnimations.transition}>
        <div className='aboutContainer'>
            <div className='aboutBox'>
                <h1>About</h1>
            </div>
        </div>
    </motion.div>
}

function ShopHtml() {
    const scroll = useScroll();
    const [scrollPosition, setScrollPosition] = useState(0); // 1 = 1 viewport height
    const viewportHeight = window.innerHeight;

    useFrame(() => {
        setScrollPosition(scroll.offset * maxScrollPages);
    });

    return <motion.div className='pageTransitionAnimationContainer' initial={pageTransitionAnimations.initial} animate={pageTransitionAnimations.animate} exit={pageTransitionAnimations.exit} transition={pageTransitionAnimations.transition}>
        <div className='aboutContainer'>
            <div className='aboutBox'>
                <h1>Shop</h1>
            </div>
        </div>
    </motion.div>
}

function FAQHtml() {
    const scroll = useScroll();
    const [scrollPosition, setScrollPosition] = useState(0); // 1 = 1 viewport height
    const viewportHeight = window.innerHeight;

    useFrame(() => {
        setScrollPosition(scroll.offset * maxScrollPages);
    });

    return <motion.div className='pageTransitionAnimationContainer' initial={pageTransitionAnimations.initial} animate={pageTransitionAnimations.animate} exit={pageTransitionAnimations.exit} transition={pageTransitionAnimations.transition}>
        <div className='aboutContainer'>
            <div className='aboutBox'>
                <h1>FAQ</h1>
            </div>
        </div>
    </motion.div>
}

function ContactHtml() {
    const scroll = useScroll();
    const [scrollPosition, setScrollPosition] = useState(0); // 1 = 1 viewport height
    const viewportHeight = window.innerHeight;

    useFrame(() => {
        setScrollPosition(scroll.offset * maxScrollPages);
    });

    return <motion.div className='pageTransitionAnimationContainer' initial={pageTransitionAnimations.initial} animate={pageTransitionAnimations.animate} exit={pageTransitionAnimations.exit} transition={pageTransitionAnimations.transition}>
        <div className='aboutContainer'>
            <div className='aboutBox'>
                <h1>Contact</h1>
            </div>
        </div>
    </motion.div>
}

function renderHorizontalMotionDivs(horizontalMotionDivs, scrollPosition) {
    const [velocity, setVelocity] = useState(0);
    const [draggedValue, setDraggedValue] = useState(0);
    const animationFrame = useRef(null);
    const isDragging = useRef(false);
    const lastX = useRef(0);
    const velocityRef = useRef(0);

    const updatePosition = () => {
        setDraggedValue((prev) => {
            let next = prev + velocityRef.current;
            return next;
        });

        velocityRef.current *= 0.99; // reduce friction even more gently

        if (Math.abs(velocityRef.current) > 0.05) {
            animationFrame.current = requestAnimationFrame(updatePosition);
        } else {
            velocityRef.current = 0;
        }
    };

    const handlePointerDown = (e) => {
        isDragging.current = true;
        lastX.current = e.clientX;
        cancelAnimationFrame(animationFrame.current);

        const handleMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - lastX.current;
            lastX.current = moveEvent.clientX;
            setDraggedValue((prev) => {
                let next = prev + deltaX;
                return next;
            });
            velocityRef.current = deltaX; // store velocity directly in ref for persistence
        };

        const handleUp = () => {
            isDragging.current = false;
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
            animationFrame.current = requestAnimationFrame(updatePosition);
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
    };

    return <div className='horizontalMotionDivsContainer' onPointerDown={handlePointerDown}>
        {horizontalMotionDivs.map((div, i) => {
            function modulo(value, range) {
                return ((value % range) + range) % range;
            }

            var divW = 150 / horizontalMotionDivs.length;
            var x = modulo((scrollPosition * 100 + divW * i + 200 + (draggedValue / 15)), 150) - 50;

            return <div className='horizontalMotionDiv' key={i} style={{ transform: `translateX(${x}vw)`, width: `${divW}vw` }}>
                <div className='horizontalMotionDivInner'>
                    <div className='horizontalMotionDivImage' style={{ backgroundImage: `url(${div.image})` }}>
                        <div className='horizontalMotionDivTextContainer'>
                            <h1>{div.title}</h1>
                            <p>{div.text}</p>
                        </div>
                    </div>
                    <div className='horizontalMotionDivMoreTextContainer'>
                        <p>{div.more}</p>
                    </div>
                </div>
            </div>
        })}
    </div>
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

function Home() {
    return <ScrollControls pages={maxScrollPages} damping={0.2}>
        <Scroll html style={{ width: '100%', height: '100%' }}>
            <HomeHtml />
        </Scroll>
        <Scroll>
            {/*outer 3D*/}
            <DemoLamp />
        </Scroll>
    </ScrollControls>
}

function About() {
    return <ScrollControls pages={maxScrollPages} damping={0.2}>
        <Scroll html style={{ width: '100%', height: '100%' }}>
            <AboutHtml />
        </Scroll>
        <Scroll>
            {/*outer 3D*/}
        </Scroll>
    </ScrollControls>
}

function Shop() {
    return <ScrollControls pages={maxScrollPages} damping={0.2}>
        <Scroll html style={{ width: '100%', height: '100%' }}>
            <ShopHtml />
        </Scroll>
        <Scroll>
            {/*outer 3D*/}
        </Scroll>
    </ScrollControls>
}

function FAQ() {
    return <ScrollControls pages={maxScrollPages} damping={0.2}>
        <Scroll html style={{ width: '100%', height: '100%' }}>
            <FAQHtml />
        </Scroll>
        <Scroll>
            {/*outer 3D*/}
        </Scroll>
    </ScrollControls>
}

function Contact() {
    return <ScrollControls pages={maxScrollPages} damping={0.2}>
        <Scroll html style={{ width: '100%', height: '100%' }}>
            <ContactHtml />
        </Scroll>
        <Scroll>
            {/*outer 3D*/}
        </Scroll>
    </ScrollControls>
}

function Nav() {
    return <div className='overlay'>
        <Link to='/'>
            <div className='button' onClick={(event) => { buttonClickAnimation(event) }} onMouseEnter={(event) => { buttonHover(event) }} onMouseLeave={(event) => { buttonUnhover(event) }}>
                <div className='buttonHoverCircle'></div>
                <div className='buttonText'>HOME</div>
            </div>
        </Link>
        <Link to='/about'>
            <div className='button' onClick={(event) => { buttonClickAnimation(event) }} onMouseEnter={(event) => { buttonHover(event) }} onMouseLeave={(event) => { buttonUnhover(event) }}>
                <div className='buttonHoverCircle'></div>
                <div className='buttonText'>ABOUT</div>
            </div>
        </Link>
        <Link to='/shop'>
            <div className='button' onClick={(event) => { buttonClickAnimation(event) }} onMouseEnter={(event) => { buttonHover(event) }} onMouseLeave={(event) => { buttonUnhover(event) }}>
                <div className='buttonHoverCircle'></div>
                <div className='buttonText'>SHOP</div>
            </div>
        </Link>
        <Link to='/faq'>
            <div className='button' onClick={(event) => { buttonClickAnimation(event) }} onMouseEnter={(event) => { buttonHover(event) }} onMouseLeave={(event) => { buttonUnhover(event) }}>
                <div className='buttonHoverCircle'></div>
                <div className='buttonText'>FAQ</div>
            </div>
        </Link>
        <Link to='/contact'>
            <div className='button' onClick={(event) => { buttonClickAnimation(event) }} onMouseEnter={(event) => { buttonHover(event) }} onMouseLeave={(event) => { buttonUnhover(event) }}>
                <div className='buttonHoverCircle'></div>
                <div className='buttonText'>CONTACT</div>
            </div>
        </Link>
    </div>
}

function buttonClickAnimation(event) {
    const element = event.currentTarget;
    element.classList.add('buttonClickAnimation');
    setTimeout(() => {
        element.classList.remove('buttonClickAnimation');
    }, 300);
}

function App() {
    return (
        <BrowserRouter>
            <Nav />
            <motion.div className="App" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <Canvas className='mainCanvas' shadows camera={{ position: [0, 0, 10], fov: 75 }}>
                    <SoftShadows size={33} samples={100} />
                    <mesh rotation={[0, 0, 0]} position={[0, 0, -5]} receiveShadow>
                        <planeGeometry args={[500, 500]} />
                        <meshStandardMaterial
                            map={new THREE.TextureLoader().load('/texture-1.png', (texture) => {
                                texture.wrapS = THREE.RepeatWrapping;
                                texture.wrapT = THREE.RepeatWrapping;
                                texture.repeat.set(50, 50); // Adjust the repeat values as needed
                            })}
                        />
                    </mesh>
                    <AnimatePresence mode="wait">
                        <Routes>
                            <Route path='/' element={<Home />} />
                            <Route path='/about' element={<About />} />
                            <Route path='/shop' element={<Shop />} />
                            <Route path='/faq' element={<FAQ />} />
                            <Route path='/contact' element={<Contact />} />
                            <Route path='*' element={<Home />} />
                        </Routes>
                    </AnimatePresence>
                </Canvas>
            </motion.div>
        </BrowserRouter>
    )
}

export default App
