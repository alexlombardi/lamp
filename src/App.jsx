import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import './App.css';
import * as THREE from 'three';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { Html, Environment, OrbitControls, MeshDiscardMaterial, useScroll, ScrollControls, Scroll, SoftShadows, RoundedBox, useGLTF, View, Points, PointMaterial, Loader, Stats } from '@react-three/drei';
import { easing, geometry } from 'maath';
import { BrowserRouter, Routes, Route, Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import chroma from 'chroma-js';
import { CheckoutProvider, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createNoise2D } from 'simplex-noise';
import { EffectComposer, LensFlare, DepthOfField } from '@react-three/postprocessing';

extend(geometry)

const stripePromise = loadStripe('pk_test_51RQF0jPPGjsvAt6RUwq9dTrliviBhi6DbcfQrWwc5MFcZqH8BM18JJqqExE58ZFop1M7rbghdVEGI2hq3guciFhU00YSqfd3EN');

const fetchClientSecret = () => {
  return fetch('/create-checkout-session', {method: 'POST'})
    .then((response) => response.json())
    .then((json) => json.checkoutSessionClientSecret)
};

const maxScrollPages = 10;

const pageTransitionAnimations = {
    initial: { opacity: 0, transform: 'scale(3.5)', filter: 'blur(10px)' },
    animate: { opacity: 1, transform: 'translate(0, 0)', filter: 'blur(0)' },
    exit: { opacity: 0, transform: 'translate(0, 0)', filter: 'blur(0)' },
    transition: { duration: 0.5, ease: [0.2, 0.6, 0.2, 1] }
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

function CameraShake({ intensity = 0.1, frequency = 0.25 }) {
    const { camera } = useThree()
    const noise2D = useRef(createNoise2D())
    const time = useRef(0)
    const basePosition = useRef(camera.position.clone())
    const baseRotation = useRef(camera.rotation.clone())

    useFrame((_, delta) => {
        time.current += delta * frequency

        const x = noise2D.current(time.current, 0)
        const y = noise2D.current(0, time.current)
        const z = noise2D.current(time.current, time.current)

        camera.position.x = basePosition.current.x + x * intensity
        camera.position.y = basePosition.current.y + y * intensity
        camera.rotation.z = baseRotation.current.z + z * intensity * 0.05
    })

    return null
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

function FireflyCloud({ count = 150 }) {
    const pointsRef = useRef();
    const scroll = useScroll();

    const positions = useMemo(() => {
        const posArray = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            posArray[i * 3] = (Math.random() - 0.5) * 20;
            posArray[i * 3 + 1] = (Math.random() - 0.5) * 100;
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        return posArray;
    }, [count]);

    const velocities = useMemo(() => {
        const velArray = [];
        for (let i = 0; i < count; i++) {
            velArray.push([
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01
            ]);
        }
        return velArray;
    }, [count]);

    const opacities = useMemo(() => {
        const opacityArray = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            opacityArray[i] = Math.random();
        }
        return opacityArray;
    }, [count]);

    useFrame((state) => {
        const pos = pointsRef.current.geometry.attributes.position.array;
        const opacityAttr = pointsRef.current.geometry.attributes.opacity.array;
        const time = state.clock.elapsedTime;

        const scrollHeight = -scroll.offset * 140;
        const yMin = scrollHeight - 10;
        const yMax = scrollHeight + 10;

        for (let i = 0; i < count; i++) {
            pos[i * 3] += velocities[i][0] + Math.sin(time * 0.3 + i) * 0.003;
            pos[i * 3 + 1] += velocities[i][1] + Math.cos(time * 0.2 + i * 0.5) * 0.003;
            pos[i * 3 + 2] += velocities[i][2] + Math.sin(time * 0.4 + i * 0.3) * 0.003;

            if (pos[i * 3] > 10) { pos[i * 3] = 10; velocities[i][0] *= -1; }
            if (pos[i * 3] < -10) { pos[i * 3] = -10; velocities[i][0] *= -1; }
            if (pos[i * 3 + 2] > 10) { pos[i * 3 + 2] = 10; velocities[i][2] *= -1; }
            if (pos[i * 3 + 2] < -10) { pos[i * 3 + 2] = -10; velocities[i][2] *= -1; }

            // Reposition fireflies randomly within visible bounds when out of vertical range
            if (pos[i * 3 + 1] < yMin || pos[i * 3 + 1] > yMax) {
                pos[i * 3] = (Math.random() - 0.5) * 20;
                pos[i * 3 + 1] = Math.random() * (yMax - yMin) + yMin;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
            }

            opacityAttr[i] = 0.5 + 0.5 * Math.sin(time * 5 + i);
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.opacity.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={positions}
                    count={count}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-opacity"
                    array={opacities}
                    count={count}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                transparent
                vertexShader={`
            attribute float opacity;
            varying float vOpacity;
            void main() {
              vOpacity = opacity;
              gl_PointSize = 10.0;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
                fragmentShader={`
            varying float vOpacity;
            void main() {
              float dist = distance(gl_PointCoord, vec2(0.5));
              if (dist > 0.5) discard;
              gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity * (1.0 - dist * 2.0));
            }
          `}
            />
        </points>
    );
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

function DemoLamp({ lightDark, setLightDark }) {
    const { scene } = useGLTF('/concept-lamp-7.glb');
    const scroll = useScroll();
    const [scrollPosition, setScrollPosition] = useState(0); // 1 = 1 viewport height

    useFrame(() => {
        setScrollPosition(scroll.offset * maxScrollPages);
        scene.position.y = -40 - Math.min(Math.max(scrollPosition - 2.7, 0), 1.5) * 13.82;
        scene.position.z = Math.max(scrollPosition - 4.2, 0) * -20;
        //setLightDark(Math.min(Math.max(scrollPosition - 2.7, 0), 1.5) / 1.5);
        //scene.rotation.x = Math.max(scrollPosition - 2.70, 0) * 2;
    });

    return <>
        <primitive object={scene} />
        <pointLight
            color="#fff2d5"
            position={[0, -40 - Math.min(Math.max(scrollPosition - 2.7, 0), 1.5) * 13.82, Math.max(scrollPosition - 4.2, 0) * -20]}
            intensity={40 + Math.min(Math.max(scrollPosition - 2.7, 0), 1.5) * 500}
            castShadow
        />
        <directionalLight 
            castShadow 
            position={[0, -40 - Math.max(scrollPosition - 2.7, 0) * 13.82, 2]} 
            rotation={[0, 0, Math.PI]} 
            color="#fff2d5" 
            intensity={Math.min(Math.max(scrollPosition - 2.7, 0), 1.5) * 2} 
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={1}
            shadow-camera-far={10}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
        />
    </>;
}

function HomeHtml({ lightDark, setLightDark }) {
    const scroll = useScroll();
    const [scrollPosition, setScrollPosition] = useState(0); // 1 = 1 viewport height
    const viewportHeight = window.innerHeight;
    const lightDarkScale = chroma.scale(['#fff', '#05361b']);
    const lightDarkColor = lightDarkScale(lightDark).hex();

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

    const horizontalMotionDivs2 = [
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
        <video className='video' autoPlay loop muted playsInline style={{ transform: `scale(${1 - scrollPosition})`, opacity: 1 - scrollPosition * 2, borderRadius: Math.max(0, scrollPosition * 2) * 50 + 'px' }} poster='/vid-thumbnail-1.png'>
            <source src="./vid-2.mp4" type="video/mp4" />
        </video>
        <div className='mainTitle' style={{ transform: `scale(${titleScale})`, top: titleTop, color: lightDarkColor }}>
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
                    Finally, you can have smart lighting that dynamically brightens and dims as you move through your home.
                </div>
            </div>
        </div>
        {renderHorizontalMotionDivs(horizontalMotionDivs, scrollPosition, 1)}
        <div className='moveDownTextContainer'>
            <div className='moveDownText' style={{ top: Math.max(scrollPosition - 1.82, 0) * viewportHeight * 0.9 + 'px', opacity: 1 - Math.max(scrollPosition - 2.5, 0) * 2 }}>
                <h1>The promise of the smart home, fulfilled</h1>
            </div>
        </div>
        {/*<div className='illuminatingInfoDiv' style={{backgroundPosition: '0% ' + (scrollPosition * 100) + '%'}}>
            Test
        </div>*/}
        <div style={{height: '250vh'}}></div>
        {renderHorizontalMotionDivs(horizontalMotionDivs2, scrollPosition, -1)}

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
        <div className='aboutContainer'>
            <div className='aboutParagraph'>
                Based in Westchester, NY and founded by two brothers, <span className='aboutSpan'>LATHE</span> is a small, 
                family-owned company focused on creating intuitive, functional products that fit seamlessly into your life. 
                We believe that technology should be simple, beautiful, and easy to use. Our products are all assembled by hand, 
                and we prioritize quality and craftsmanship in everything we do.
            </div>
        </div>
        <div className='aboutContainer'>
            <div className='aboutParagraph'>
                <span className='aboutSpan'>LAMP</span> is our first product. It was conceived as a standalone smart home lamp that just works, 
                right out of the box, and feels like the future. As impressive as the innovation in the smart home space has been, 
                the ideal form of the smart home - a home that seamlessly reacts to your needs and adapts to suit the moment - has yet to be realized. 
                Though incredible things can be achieved with complex networks of devices, sensors, and automations, we believe that a 
                thoughtfully-designed, self-contained device can do more, with much less fiddling. With its built-in sensor array, 
                the <span className='aboutSpan'>LAMP</span> ambiently adjusts its brightness to meet you as you enter the room, 
                and smoothly dims as you exit.
            </div>
        </div>
        {/*<div className='aboutContainer'>
            <div className='aboutImage' style={{backgroundImage: 'url(\'/alex-1.png\')'}}></div>
            <div className='aboutParagraph'>
                <span className='aboutSpan'>ALEX</span> is pretty cool I guess.
            </div>
        </div>*/}
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
            {/*<CheckoutProvider stripe={stripePromise} options={{fetchClientSecret}}>
                <form>
                    <PaymentElement />
                    <button>Submit</button>
                </form>
            </CheckoutProvider>*/}
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
                <h1 style={{position: 'absolute'}}>FAQ</h1>
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    return <div className='aboutBoxStripe' style= {{height: (5 - i) * (18 / (1 + (i / 10))) + '%', backgroundSize: 100 + (i * 20) + '%'}}>

                    </div>
                })}
            </div>
        </div>
        <div className='aboutContainer'>
            <div className='aboutParagraph' id='p1' style={{transform: `translateX(${Math.max(0, scrollPosition - 0.416) * 1000}px)`}}>
                <h1 className='aboutHeading'>Q: Does the lamp need to be plugged in at all times?</h1>
                <b>A:</b> The <span className='aboutSpan'>LAMP</span> can be used in two modes: plugged in or battery-powered.
                When plugged in, it will always be ready to use and will charge the internal battery. 
                When unplugged, it will run on battery power for up to 8 hours, depending on usage. 
                The lamp can be easily switched between modes by detaching the magnetic cable.
                <div className="boundingTop">
                    {'pixels: ' + (document.querySelector('#p1')?.getBoundingClientRect().top + scrollPosition * window.innerHeight * 0.9) || 'Bounding top not available'}<br />
                    {'scrollPosition: ' + (document.querySelector('#p1')?.getBoundingClientRect().top + scrollPosition * window.innerHeight * 0.9) / window.innerHeight * 0.9 || 'Bounding top not available'}
                </div>
            </div>
        </div>
        <div className='aboutContainer'>
            <div className='aboutParagraph' id='p2' style={{transform: `translateX(${Math.max(0, scrollPosition - 0.926) * 1000}px)`}}>
                <h1 className='aboutHeading'>Q: Is the lamp available in other colors?</h1>
                <b>A:</b> I don't know, maybe!
                <div className="boundingTop">
                    {'pixels: ' + (document.querySelector('#p2')?.getBoundingClientRect().top + scrollPosition * window.innerHeight * 0.9) || 'Bounding top not available'}<br />
                    {'scrollPosition: ' + (document.querySelector('#p2')?.getBoundingClientRect().top + scrollPosition * window.innerHeight * 0.9) / window.innerHeight * 0.9 || 'Bounding top not available'}
                </div>
            </div>
        </div>
        <div className='aboutContainer'>
            <div className='aboutParagraph' id='p3' style={{transform: `translateX(${Math.max(0, scrollPosition - 1.287) * 1000}px)`}}>
                <h1 className='aboutHeading'>Q: Does the lamp support Home Assistant and other smart home platforms?</h1>
                <b>A:</b> Yes, the output of the sensors can be integrated with Home Assistant and other smart home platforms.
                <div className="boundingTop">
                    {'pixels: ' + (document.querySelector('#p3')?.getBoundingClientRect().top + scrollPosition * window.innerHeight * 0.9) || 'Bounding top not available'}<br />
                    {'scrollPosition: ' + (document.querySelector('#p3')?.getBoundingClientRect().top + scrollPosition * window.innerHeight * 0.9) / window.innerHeight * 0.9 || 'Bounding top not available'}
                </div>
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

function renderHorizontalMotionDivs(horizontalMotionDivs, scrollPosition, direction) {
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
            var x = modulo((scrollPosition * 100 * direction + divW * i + 200 + (draggedValue / 15)), 150) - 50;

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

function Home({ lightDark, setLightDark }) {
    return <ScrollControls pages={maxScrollPages} damping={0.2}>
        <Scroll html style={{ width: '100%', height: '100%' }}>
            <HomeHtml lightDark={lightDark} setLightDark={setLightDark} />
        </Scroll>
        <Scroll>
            {/*outer 3D*/}
            <DemoLamp lightDark={lightDark} setLightDark={setLightDark} />
            <FireflyCloud />
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
            <FireflyCloud />
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
            <FireflyCloud />
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
            <FireflyCloud />
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
            <FireflyCloud />
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
    element.addEventListener('animationend', () => {
        element.classList.remove('buttonClickAnimation');
    })
}

function Background() {
    const { scene } = useGLTF('/placeholder-2.glb');
    scene.rotation.y = degToRad(0);
    scene.scale.set(5, 5, 5);
    scene.position.set(0, -20, 0);

    scene.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({ color: 'white', roughness: 0.5, metalness: 0.2 });
        }
    });

    return <primitive object={scene} castShadow receiveShadow />
}

function App() {
    const [lightDark, setLightDark] = useState(0);
    const lightDarkScale = chroma.scale(['#fff', '#0a0536']);
    const lightDarkColor = lightDarkScale(lightDark).hex();

    return (
        <BrowserRouter>
            <Nav />
            <motion.div className="App" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <Suspense fallback={null}>
                    <Canvas className='mainCanvas' shadows camera={{ position: [0, 0, 10], fov: 75 }}>
                        <CameraShake />
                        <color attach="background" args={['#000000']} />
                        <Stats />
                        <Background />
                        <AnimatePresence mode="wait">
                            <Routes>
                                <Route path='/' element={<Home lightDark={lightDark} setLightDark={setLightDark} />} />
                                <Route path='/about' element={<About />} />
                                <Route path='/shop' element={<Shop />} />
                                <Route path='/faq' element={<FAQ />} />
                                <Route path='/contact' element={<Contact />} />
                                <Route path='*' element={<Home />} />
                            </Routes>
                        </AnimatePresence>
                        <EffectComposer>
                            <DepthOfField
                                focusDistance={0} // where to focus
                                focalLength={0.02} // focal length
                                bokehScale={2} // bokeh size
                            />    
                        </EffectComposer>
                    </Canvas>
                </Suspense>
                <Loader />
            </motion.div>
        </BrowserRouter>
    )
}

export default App
