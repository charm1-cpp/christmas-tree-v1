import React, { useState, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  Float,
  Stars,
  Sparkles,
  Text,
  PerspectiveCamera,
  Instance,
  Instances,
  Image,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { easing } from "maath";
import { AnimatePresence, motion } from "framer-motion";

// 🎵 音乐链接
const MUSIC_URL =
  "https://assets.mixkit.co/music/preview/mixkit-christmas-magic-2815.mp3";

// 📷 照片链接 (占位图，请替换为你下载到本地的 /photos/xxx.jpg 或永久图床链接)
const MY_PHOTOS = [
  "https://i.postimg.cc/MZdWW9CT/5.jpg",
  "https://i.postimg.cc/m2nB9t2W/6.jpg",
  "https://i.postimg.cc/DzkhCHX4/7.jpg",
  "https://i.postimg.cc/CKYtng8v/8.jpg",
  "https://i.postimg.cc/xdRvxr4W/1.jpg",
  "https://i.postimg.cc/DyrPJbcG/2.jpg",
  "https://i.postimg.cc/R0F7Dpxf/3.jpg",
  "https://i.postimg.cc/SQ8W3z3w/4.jpg",
];

// 💖 文字内容
const TEXTS = [
  "Merry Christmas",
  "I love you",
  "you so cute",
  "To LSY",
  "川雾",
  "迟",
  "19990624",
  "Merry Christmas",
  "I love you",
  "Happy New Year",
  "平安喜乐",
  "万事胜意",
  "Always be with you",
];

// 🎨 颜色配置
const FILL_COLORS = ["#2d5a27", "#1a3c17", "#d4af37", "#c41e3a", "#ffffff"];
const GIFT_COLORS = ["#D32F2F", "#1976D2", "#388E3C", "#FBC02D"];

// --- 算法部分 ---
const generateDenseTree = (
  count: number,
  maxRadius: number,
  height: number
) => {
  const items = [];
  for (let i = 0; i < count; i++) {
    const h = Math.random();
    const rLimit = maxRadius * (1 - h);
    const r = Math.sqrt(Math.random()) * rLimit;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = h * height - height / 2;
    const scale = Math.random() * 0.25 + 0.1;
    const color = FILL_COLORS[Math.floor(Math.random() * FILL_COLORS.length)];
    items.push({
      pos: [x, y, z],
      scale,
      color,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
    });
  }
  return items;
};

const generateGiftsPositions = (
  count: number,
  maxRadius: number,
  height: number
) => {
  const items = [];
  for (let i = 0; i < count; i++) {
    const h = Math.random() * 0.7;
    const rBase = maxRadius * (1 - h);
    const r = rBase + 0.4;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = h * height - height / 2;
    items.push({
      pos: [x, y, z],
      color: GIFT_COLORS[Math.floor(Math.random() * GIFT_COLORS.length)],
      rotation: [0, angle, 0],
      scale: 0.6 + Math.random() * 0.4,
    });
  }
  return items;
};

const generateSilverGarland = (
  radius: number,
  height: number,
  turns: number,
  count: number
) => {
  const beads = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * turns * Math.PI * 2;
    const r = radius * (1 - t) + 0.2;
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const y = t * height - height / 2;
    beads.push({ pos: [x, y, z] });
  }
  return beads;
};

// --- 组件：礼物盒 ---
const GiftBox = ({ position, rotation, color, scale, visible }: any) => {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const targetScale = visible ? scale : 0;
    easing.damp3(
      group.current.scale,
      [targetScale, targetScale, targetScale],
      0.5,
      delta
    );
  });
  return (
    <group ref={group} position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.82, 0.82, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.2, 0.82, 0.82]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusKnotGeometry args={[0.15, 0.04, 64, 8, 2, 3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
    </group>
  );
};

// --- 组件：五角星 (树顶) ---
const TopStar = () => {
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.6;
    const innerRadius = 0.3;
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);
  const extrudeSettings = {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
  };
  return (
    <mesh position={[0, 3.8, 0]}>
      <extrudeGeometry args={[starShape, extrudeSettings]} />
      <meshStandardMaterial
        color="#ffd700"
        emissive="#ffaa00"
        emissiveIntensity={2}
        metalness={1}
        roughness={0}
      />
    </mesh>
  );
};

// --- 组件：背景大标题 ---
const TitleWithEffects = ({ visible }: { visible: boolean }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (group.current) {
      const targetScale = visible ? 1 : 0;
      easing.damp3(
        group.current.scale,
        [targetScale, targetScale, targetScale],
        0.5,
        delta
      );
      group.current.position.y =
        6 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });
  return (
    <group ref={group} position={[0, 6, -4]}>
      <Text
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        fontSize={2.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="#0044aa"
        characters="MERRYCHRISTMAS"
      >
        MERRY CHRISTMAS
        <meshStandardMaterial
          color="#e0f7fa"
          emissive="#0088ff"
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </Text>
      <Sparkles
        color="#00eeff"
        count={200}
        scale={[14, 3, 2]}
        size={6}
        speed={0.4}
        opacity={0.8}
        noise={0.2}
      />
      <pointLight
        position={[0, 0, -2]}
        color="#0088ff"
        intensity={3}
        distance={10}
      />
    </group>
  );
};

// --- 组件：核心圣诞树 ---
const RichTree = ({ visible }: { visible: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const treeBody = useMemo(() => generateDenseTree(800, 3.5, 7), []);
  const ornaments = useMemo(() => generateDenseTree(400, 3.6, 7), []);
  const silverBeads = useMemo(() => generateSilverGarland(3.8, 7, 6, 300), []);
  const gifts = useMemo(() => generateGiftsPositions(16, 3.5, 7), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetScale = visible ? 1 : 0;
      easing.damp3(
        groupRef.current.scale,
        [targetScale, targetScale, targetScale],
        0.5,
        delta
      );
      if (visible) groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Instances range={treeBody.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.3} metalness={0.5} />
        {treeBody.map((item, i) => (
          <Instance
            key={i}
            color={item.color}
            position={item.pos as any}
            scale={[item.scale, item.scale, item.scale]}
            rotation={item.rotation as any}
          />
        ))}
      </Instances>
      <Instances range={ornaments.length}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial roughness={0.1} metalness={0.9} />
        {ornaments.map((item, i) => (
          <Instance
            key={i}
            color={i % 3 === 0 ? "#ff4444" : "#ffd700"}
            position={item.pos as any}
            scale={[item.scale * 0.8, item.scale * 0.8, item.scale * 0.8]}
          />
        ))}
      </Instances>
      <Instances range={silverBeads.length}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#e0e0e0"
          roughness={0}
          metalness={1}
          emissive="#444444"
        />
        {silverBeads.map((item, i) => (
          <Instance key={i} position={item.pos as any} />
        ))}
      </Instances>
      {gifts.map((item, i) => (
        <GiftBox
          key={`gift-${i}`}
          position={item.pos}
          rotation={item.rotation}
          color={item.color}
          scale={item.scale}
          visible={visible}
        />
      ))}
      <Float speed={4} floatIntensity={0.2} rotationIntensity={0.5}>
        <TopStar />
        <pointLight
          position={[0, 3.8, 0]}
          color="#ffd700"
          intensity={2}
          distance={5}
        />
      </Float>
    </group>
  );
};

// --- 组件：文字云 ---
const WordItem = ({ text, pos, scale, visible }: any) => {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const shouldShow = visible;
    easing.damp(group.current.scale, "x", shouldShow ? scale : 0, 0.5, delta);
    easing.damp(group.current.scale, "y", shouldShow ? scale : 0, 0.5, delta);
    easing.damp(group.current.scale, "z", shouldShow ? scale : 0, 0.5, delta);
    const targetPos = visible ? pos : [0, 0, 0];
    easing.damp3(group.current.position, targetPos, visible ? 0.8 : 0.5, delta);
  });
  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Text
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
          fontSize={1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#0000ff"
        >
          {text}
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </Text>
      </Float>
    </group>
  );
};

const WordCloud = ({ visible }: { visible: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (visible && groupRef.current) groupRef.current.rotation.y += delta * 0.1;
  });
  const words = useMemo(() => {
    return new Array(40).fill(0).map((_, i) => {
      const text = TEXTS[i % TEXTS.length];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 6 + Math.random() * 6;
      return {
        text,
        pos: [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
        ],
        scale: 0.5 + Math.random() * 0.5,
      };
    });
  }, []);
  return (
    <group ref={groupRef}>
      {words.map((item, i) => (
        <WordItem key={i} {...item} visible={visible} />
      ))}
    </group>
  );
};

// --- 组件：照片墙 ---
const PhotoItem = ({ url, pos, rotation, scale, visible }: any) => {
  const ref = useRef<any>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      const targetScale = visible ? scale : 0;
      easing.damp(ref.current.scale, "x", targetScale, 0.4, delta);
      easing.damp(ref.current.scale, "y", targetScale, 0.4, delta);
      easing.damp3(ref.current.position, visible ? pos : [0, 0, 0], 0.6, delta);
    }
  });

  return (
    <group ref={ref}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Image url={url} transparent scale={[4, 3, 1]} radius={0.1}>
          <boxGeometry args={[1, 1, 0.1]} />
        </Image>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[4.2, 3.2, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </Float>
    </group>
  );
};

const PhotoGallery = ({ visible }: { visible: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (visible && groupRef.current)
      groupRef.current.rotation.y += delta * 0.05;
  });
  const photos = useMemo(() => {
    return MY_PHOTOS.map((url, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 7 + Math.random() * 4;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      return {
        url,
        pos: [x, y, z],
        rotation: [0, 0, 0],
        scale: 0.8 + Math.random() * 0.4,
      };
    });
  }, []);
  return (
    <group ref={groupRef}>
      {photos.map((item, i) => (
        <PhotoItem key={i} {...item} visible={visible} />
      ))}
    </group>
  );
};

// --- UI 界面 ---
const btnStyle: React.CSSProperties = {
  background: "rgba(0, 20, 40, 0.6)",
  border: "1px solid rgba(100, 200, 255, 0.4)",
  color: "#fff",
  padding: "12px 40px",
  fontSize: "1.2rem",
  borderRadius: "30px",
  cursor: "pointer",
  boxShadow:
    "0 0 20px rgba(0, 100, 255, 0.3), inset 0 0 10px rgba(0, 100, 255, 0.2)",
  textTransform: "uppercase",
  letterSpacing: "2px",
  backdropFilter: "blur(5px)",
};

const linkStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(255,255,255,0.5)",
  cursor: "pointer",
  marginTop: "-10px",
};

const Overlay = ({
  stage,
  setStage,
}: {
  stage: number;
  setStage: (v: number) => void;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <AnimatePresence mode="wait">
        {stage === 0 && (
          <motion.div
            key="start-btn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{ pointerEvents: "auto" }}
          >
            <button onClick={() => setStage(1)} style={btnStyle}>
              姐姐打开
            </button>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div
            key="words-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                letterSpacing: "2px",
                textShadow: "0 0 10px white",
              }}
            >
              愿你平安喜乐，万事胜意
            </div>
            <button onClick={() => setStage(2)} style={btnStyle}>
              查看回忆
            </button>
            <div onClick={() => setStage(0)} style={linkStyle}>
              (返回)
            </div>
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div
            key="photos-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                letterSpacing: "2px",
                textShadow: "0 0 10px white",
              }}
            >
              Every moment with you
            </div>
            <button onClick={() => setStage(0)} style={btnStyle}>
              再看一遍
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 主入口 ---
export default function App() {
  const [stage, setStage] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      stage > 0
        ? audioRef.current.play().catch((e) => console.log(e))
        : audioRef.current.pause();
    }
  }, [stage]);

  return (
    <>
      <style>{`body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; } * { box-sizing: border-box; }`}</style>
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: false,
            toneMapping: THREE.ReinhardToneMapping,
            toneMappingExposure: 1.5,
          }}
        >
          <React.Suspense fallback={null}>
            <Scene stage={stage} />
          </React.Suspense>
        </Canvas>
        <Overlay stage={stage} setStage={setStage} />
      </div>
    </>
  );
}

const Scene = ({ stage }: { stage: number }) => {
  const controlsRef = useRef<any>(null);

  // 监听 stage 变化，强制重置相机位置
  useEffect(() => {
    if (controlsRef.current) {
      // 1. 重置旋转角度
      controlsRef.current.reset();
      // 2. 强制设置相机位置 (正面)
      controlsRef.current.object.position.set(0, 4, 18);
      // 3. 强制看向中心点 (树心)
      controlsRef.current.target.set(0, 2, 0);
      // 4. 应用更新
      controlsRef.current.update();
    }
  }, [stage]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={50} />
      <OrbitControls
        ref={controlsRef} // 绑定 ref
        enablePan={false}
        enableZoom={true}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        maxDistance={30}
        // 只有阶段 0 (树) 自动旋转，其他阶段停止旋转方便观看
        autoRotate={stage === 0}
        autoRotateSpeed={0.5}
      />
      <color attach="background" args={["#050505"]} />
      <Environment preset="city" background={false} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#ffd700" />
      <pointLight position={[-10, 10, -10]} intensity={1} color="#ffffff" />

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <Sparkles
        count={100}
        scale={12}
        size={4}
        speed={0.4}
        opacity={0.5}
        color="#ffd700"
      />

      <RichTree visible={stage === 0} />
      <TitleWithEffects visible={stage === 0} />
      <WordCloud visible={stage === 1} />
      <PhotoGallery visible={stage === 2} />

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1} radius={0.5} />
      </EffectComposer>
    </>
  );
};
