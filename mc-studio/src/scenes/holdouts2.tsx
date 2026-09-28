import {Camera, Circle, Line, Node, Path, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all, cancel, createRef, createSignal, delay, easeInCubic, easeInOutCubic, easeInOutSine, easeOutBack,
  easeOutCubic, linear, sequence, spawn, useRandom, useTime, waitFor, ThreadGenerator,
} from '@motion-canvas/core';
import {LAND, proj} from '../land';

const C = {
  ink: '#2b2b33', red: '#e0533d', cream: '#f3ead2',
  sky: '#dff1e2', jFar: '#b9ddc4', jMid: '#86c29a', jNear: '#4f9a63', jDark: '#2f7045', jDeep: '#24583a',
  trunk: '#8a5a33', leafA: '#3e8a55', leafB: '#5aa56b',
  grass: '#6f8f2a', grassD: '#566f1e',
  soil: '#8a5e3b', soilD: '#6e4a2d', soilDD: '#4d321e',
  sea: '#6cc3dc', land: '#eadcb3', paper: '#f7efd9', sand: '#f2d697',
};
const F = 'DejaVu Sans', SERIF = 'DejaVu Serif';
const T = [0.5, 3.97, 7.72, 14.99, 19.06, 24.71, 30.57, 37.84, 44.07, 49.76, 58.2, 63.38];
const END = 71;

function* at(t: number): ThreadGenerator { const n = useTime(); if (t > n) yield* waitFor(t - n); }

// ---------------- 2-bone IK ----------------
type V = [number, number];
function reach(s: V, t: V, max: number): V {
  const dx = t[0] - s[0], dy = t[1] - s[1], d = Math.hypot(dx, dy);
  if (d <= max) return t;
  return [s[0] + dx / d * max, s[1] + dy / d * max];
}
function elbow(s: V, t: V, l1: number, l2: number, bend: number): V {
  const dx = t[0] - s[0], dy = t[1] - s[1];
  const d = Math.max(Math.abs(l1 - l2) + 1, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5));
  const a = Math.atan2(dy, dx);
  const b = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  return [s[0] + Math.cos(a + bend * b) * l1, s[1] + Math.sin(a + bend * b) * l1];
}

// ---------------- waist-up character ----------------
type BustOpts = {x: number; y: number; s?: number; uni?: string; uniD?: string; skin?: string;
  hat?: 'cap' | 'officer' | 'none'; hair?: string; glasses?: boolean; mustache?: boolean; rifle?: boolean; beard?: boolean};
function bust(o: BustOpts) {
  const skin = o.skin ?? '#ebbd93', skinD = '#d39f78';
  const uni = o.uni ?? '#8e8756', uniD = o.uniD ?? '#716b42';
  const root = createRef<Node>(), torso = createRef<Node>(), rifleN = createRef<Node>();
  const blink = createSignal(1), lookX = createSignal(0), lookY = createSignal(0);
  const brow = createSignal(0), smile = createSignal(0), open = createSignal(0), headRot = createSignal(0), headY = createSignal(0);
  const breath = createSignal(0), eyeSize = createSignal(1);
  const LX = createSignal(-150), LY = createSignal(-40), RX = createSignal(150), RY = createSignal(-40);
  const SL: V = [-128, -300], SR: V = [128, -300], L1 = 150, L2 = 145;
  const handL = () => reach(SL, [LX(), LY()], L1 + L2 - 1), handR = () => reach(SR, [RX(), RY()], L1 + L2 - 1);
  const arm = (S: V, h: () => V, bend: number) => (
    <Node>
      <Line points={() => [S, elbow(S, h(), L1, L2, bend), h()]} stroke={uni} lineWidth={66} lineCap={'round'} lineJoin={'round'} />
      <Line points={() => { const hh = h(), e = elbow(S, hh, L1, L2, bend); const k = 0.82; return [[e[0] + (hh[0] - e[0]) * k, e[1] + (hh[1] - e[1]) * k], hh]; }}
        stroke={uniD} lineWidth={68} lineCap={'butt'} opacity={0.35} />
      <Circle position={h} size={62} fill={skin} />
    </Node>
  );
  const node = (
    <Node ref={root} x={o.x} y={o.y} scale={o.s ?? 1}>
      {o.rifle ? (
        <Node ref={rifleN}>
          <Line points={[[-150, -20], [170, -560]]} stroke={'#5a3a22'} lineWidth={22} lineCap={'round'} />
          <Line points={[[100, -440], [185, -585]]} stroke={'#3d3d44'} lineWidth={12} lineCap={'round'} />
        </Node>) : null}
      <Rect y={() => -372 + headY()} width={82} height={70} radius={10} fill={skinD} />
      <Node ref={torso} scale={() => [1, 1 + breath() * 0.012]}>
        <Path data={'M -160 -250 Q -165 -335 -95 -345 L 95 -345 Q 165 -335 160 -250 L 142 40 L -142 40 Z'} fill={uni} />
        <Path data={'M -48 -345 L 0 -268 L 48 -345 Z'} fill={skinD} />
        <Path data={'M -60 -350 L 0 -262 L -18 -350 Z'} fill={uniD} />
        <Path data={'M 60 -350 L 0 -262 L 18 -350 Z'} fill={uniD} />
        <Rect x={0} y={-150} width={4} height={220} fill={uniD} />
        {[-220, -160, -100].map(y => <Circle x={0} y={y} size={14} fill={'#c9b56a'} />)}
        <Rect x={-78} y={-210} width={72} height={60} radius={8} fill={uniD} opacity={0.55} />
        <Rect x={78} y={-210} width={72} height={60} radius={8} fill={uniD} opacity={0.55} />
        <Rect y={-18} width={290} height={34} fill={'#5e4527'} />
        <Rect y={-18} width={40} height={30} radius={4} fill={'#c9b56a'} />
        {o.rifle ? <Line points={[[-128, -320], [120, -30]]} stroke={'#4e3620'} lineWidth={14} /> : null}
      </Node>
      <Node y={() => -466 + headY()} rotation={headRot}>
                <Circle x={-94} y={10} size={52} fill={skinD} /><Circle x={94} y={10} size={52} fill={skinD} />
        <Rect width={188} height={222} radius={88} fill={skin} />
        <Circle x={-52} y={40} size={40} fill={'#f0a58a'} opacity={0.35} /><Circle x={52} y={40} size={40} fill={'#f0a58a'} opacity={0.35} />
        {[-1, 1].map(sd => (
          <Node x={sd * 40} y={-4}>
            <Circle x={() => lookX() * 8} y={() => lookY() * 6} width={() => 17 * eyeSize()} height={() => 23 * blink() * eyeSize()} fill={C.ink} />
            <Rect y={() => -36 - brow() * 4} width={44} height={8} radius={4} fill={o.hair ?? '#3a2a22'} rotation={() => sd * brow() * -10} />
          </Node>))}
        <Path data={'M -4 16 Q -12 40 6 42'} stroke={skinD} lineWidth={6} lineCap={'round'} />
        {o.mustache ? <Path data={'M -40 62 Q 0 44 40 62 Q 0 56 -40 62 Z'} fill={'#e6e6e6'} /> : null}
        <Path data={() => `M -30 72 Q 0 ${72 + smile() * 22} 30 72`} stroke={'#7a3b2e'} lineWidth={6} lineCap={'round'} />
        <Circle y={80} width={34} height={() => open() * 30} fill={'#6b2a25'} />
        {o.beard ? <Path data={'M -86 20 Q -80 120 0 128 Q 80 120 86 20 Q 60 70 0 72 Q -60 70 -86 20 Z'} fill={'#5a4a3e'} opacity={0.85} /> : null}
        {o.glasses ? <Node><Circle x={-40} y={-4} size={58} stroke={'#444'} lineWidth={5} /><Circle x={40} y={-4} size={58} stroke={'#444'} lineWidth={5} /><Line points={[[-11, -4], [11, -4]]} stroke={'#444'} lineWidth={5} /></Node> : null}
        {o.hat === 'officer' ? (
          <Node>
            <Path data={'M -112 -78 Q -110 -150 0 -158 Q 110 -150 112 -78 Z'} fill={uni} />
            <Rect y={-80} width={226} height={26} fill={'#b2322b'} />
            <Rect y={-60} width={214} height={16} radius={8} fill={'#222'} />
            <Circle y={-112} size={22} fill={'#e8c552'} />
          </Node>
        ) : o.hat === 'none' ? (
          <Path data={'M -96 -20 Q -100 -130 0 -128 Q 100 -130 96 -20 Q 70 -90 0 -86 Q -70 -90 -96 -20 Z'} fill={o.hair ?? '#3a2a22'} />
        ) : (
          <Node>
            <Path data={'M -104 -48 Q -104 -150 0 -152 Q 104 -150 104 -48 Z'} fill={uni} />
            <Rect y={-52} width={210} height={16} fill={uniD} />
            <Rect y={-38} width={150} height={16} radius={8} fill={uniD} />
            <Circle y={-100} size={20} fill={'#e8c552'} />
          </Node>
        )}
      </Node>
      {arm(SL, handL, 1)}
      {arm(SR, handR, -1)}
    </Node>
  ) as Node;
  spawn(function* () { while (true) { yield* breath(1, 1.6, easeInOutSine); yield* breath(0, 1.6, easeInOutSine); } });
  spawn(function* () { const r = useRandom(Math.floor(o.x)); while (true) { yield* waitFor(r.nextFloat(2.2, 4)); yield* blink(0.1, 0.07); yield* blink(1, 0.09); } });
  const hands = {
    L: (x: number, y: number, d: number, e = easeInOutCubic) => all(LX(x, d, e), LY(y, d, e)),
    R: (x: number, y: number, d: number, e = easeInOutCubic) => all(RX(x, d, e), RY(y, d, e)),
  };
  return {node, root, rifleN, blink, lookX, lookY, brow, smile, open, headRot, headY, eyeSize, LX, LY, RX, RY, hands};
}

// ---------------- scenery (no clouds) ----------------
function hill(y: number, amp: number, seed: number, color: string, w = 2600) {
  const r = useRandom(seed); const n = 8;
  let d = `M ${-w / 2} ${y}`;
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + (w / n) * i, x1 = x0 + w / n, h = y - r.nextFloat(0.35, 1) * amp;
    d += ` C ${x0 + w / n / 3} ${h} ${x1 - w / n / 3} ${h} ${x1} ${y + r.nextFloat(-amp * 0.15, amp * 0.15)}`;
  }
  return <Path data={d + ` L ${w / 2} 2000 L ${-w / 2} 2000 Z`} fill={color} />;
}
function palm(x: number, y: number, h: number, lean: number, dark = false) {
  const tx = x + lean, ty = y - h;
  return (
    <Node>
      <Path data={`M ${x} ${y} Q ${x + lean * 0.15} ${y - h * 0.55} ${tx} ${ty}`} stroke={C.trunk} lineWidth={24} lineCap={'round'} />
      {[-160, -120, -75, -30, 15, 60, 105, 150].map((a, i) => (
        <Path x={tx} y={ty} rotation={a} data={'M 0 0 Q 95 -58 215 12 Q 100 -8 0 0 Z'} fill={dark ? (i % 2 ? C.jDark : C.jNear) : (i % 2 ? C.leafA : C.leafB)} />))}
    </Node>
  );
}
function bigLeaf(x: number, y: number, rot: number, s: number, col = C.jDeep) {
  return (
    <Node x={x} y={y} rotation={rot} scale={s}>
      <Path data={'M 0 0 Q 160 -210 470 -150 Q 240 70 0 0 Z'} fill={col} />
      <Path data={'M 10 -6 Q 220 -110 440 -146'} stroke={'rgba(255,255,255,0.18)'} lineWidth={8} lineCap={'round'} />
    </Node>
  );
}
function grassBand(y: number, seed: number, col: string, h = 140, w = 2800) {
  const r = useRandom(seed); let d = `M ${-w / 2} 2000 L ${-w / 2} ${y}`;
  for (let x = -w / 2; x < w / 2; x += 46) d += ` Q ${x + 12} ${y - r.nextFloat(0.4, 1) * h} ${x + 23} ${y - r.nextFloat(0.6, 1) * h} Q ${x + 30} ${y - 10} ${x + 46} ${y}`;
  return <Path data={d + ` L ${w / 2} 2000 Z`} fill={col} />;
}
function bushes(y: number, seed: number, cols: string[], size = 1, w = 2800) {
  const r = useRandom(seed);
  return <Node>{Array.from({length: Math.ceil(w / 150)}, (_, i) => (
    <Circle x={-w / 2 + i * 150 + r.nextFloat(-30, 30)} y={y + r.nextFloat(-20, 30)} size={r.nextFloat(200, 300) * size} fill={cols[i % cols.length]} />))}
    <Rect y={y + 600} width={w} height={1000} fill={cols[0]} /></Node>;
}
function jungle(seed: number, sky = C.sky, w = 2800) {
  return (
    <Node>
      <Rect width={w + 400} height={4000} fill={sky} />
      {hill(-60, 280, seed, C.jFar, w)}
      {Array.from({length: Math.ceil(w / 260)}, (_, i) => palm(-w / 2 + 80 + i * 260, 40, 380 + (i % 3) * 70, i % 2 ? 50 : -40))}
      {hill(200, 220, seed + 4, C.jMid, w)}
      {Array.from({length: Math.ceil(w / 330)}, (_, i) => palm(-w / 2 + 160 + i * 330, 340, 560 + (i % 2) * 90, i % 2 ? -70 : 60, true))}
      {hill(460, 140, seed + 9, C.jNear, w)}
    </Node>
  );
}

export default makeScene2D(function* (view) {
  view.fill(C.cream);
  const pinLayer = createRef<Node>();
  const cam = createRef<Camera>(), mapLayer = createRef<Node>(), stage = createRef<Node>(), ui = createRef<Node>();
  const dip = createRef<Rect>(), dusk = createRef<Rect>(), black = createRef<Rect>();
  const year = createSignal(1945), yearBox = createRef<Node>();

  // ---------------- MAP (top-down) ----------------
  view.add(
    <Node ref={mapLayer}>
      <Rect width={1080} height={1920} fill={C.sea} />
      <Camera ref={cam} zoom={0.62}>
        {Array.from({length: 40}, (_, i) => <Line points={[[-5000, -3200 + i * 170], [5000, -3200 + i * 170]]} stroke={'rgba(255,255,255,0.16)'} lineWidth={() => 2 / cam().zoom()} />)}
        {Array.from({length: 40}, (_, i) => <Line points={[[-3200 + i * 170, -5000], [-3200 + i * 170, 5000]]} stroke={'rgba(255,255,255,0.10)'} lineWidth={() => 2 / cam().zoom()} />)}
        <Path data={LAND} fill={'rgba(20,60,80,0.18)'} x={7} y={9} />
        <Path data={LAND} fill={C.land} stroke={C.ink} lineWidth={() => 2.6 / cam().zoom()} lineJoin={'round'} />
        <Txt text={'JAPAN'} position={proj(138.5, 38.6)} fontFamily={F} fontWeight={900} fontSize={() => 42 / cam().zoom()} fill={C.ink} />
        <Txt text={'PHILIPPINES'} position={proj(121.5, 17)} fontFamily={F} fontWeight={900} fontSize={() => 36 / cam().zoom()} fill={C.ink} />
        <Txt text={'PACIFIC OCEAN'} position={proj(151, 25)} fontFamily={F} fontWeight={800} letterSpacing={8} fontSize={() => 38 / cam().zoom()} fill={'rgba(255,255,255,0.8)'} />
      </Camera>
    </Node>,
  );
  view.add(<Node ref={stage} opacity={0} />);
  mapLayer().add(<Node ref={pinLayer} />);
  view.add(<Rect ref={dusk} width={1080} height={1920} fill={'#2a1f45'} opacity={0} />);
  view.add(<Node ref={ui} />);
  view.add(<Rect ref={dip} width={1080} height={1920} fill={C.cream} opacity={0} />);
  view.add(<Rect ref={black} width={1080} height={1920} fill={'#000'} opacity={0} />);

  const w2s = (w: V): V => [(w[0] - cam().position.x()) * cam().zoom(), (w[1] - cam().position.y()) * cam().zoom()];
  const pins: Record<string, Node> = {};
  const addPin = (k: string, ll: V, label: string, col = C.red) => {
    const w = proj(...ll);
    const n = (<Node position={() => [(w[0] - cam().position.x()) * cam().zoom(), (w[1] - cam().position.y()) * cam().zoom()]} scale={0}><Node>
      <Circle size={40} stroke={'#ffd23f'} lineWidth={6} />
      <Path data={'M 0 0 C -10 -30 -40 -50 -40 -80 A 40 40 0 1 1 40 -80 C 40 -50 10 -30 0 0 Z'} fill={col} stroke={C.ink} lineWidth={5} />
      <Circle y={-82} size={26} fill={'#fff'} />
      <Rect y={-172} height={62} width={label.length * 25 + 50} radius={14} fill={'#fff'} stroke={C.ink} lineWidth={5}><Txt text={label} fontFamily={F} fontWeight={900} fontSize={34} fill={C.ink} /></Rect>
    </Node></Node>) as Node;
    pinLayer().add(n); pins[k] = n;
  };
  const GUAM: V = [144.79, 13.45], LUB: V = [120.12, 13.82], MOR: V = [128.42, 2.35], TOKYO: V = [139.7, 35.7];
  addPin('guam', GUAM, 'GUAM'); addPin('lub', LUB, 'LUBANG'); addPin('mor', MOR, 'MOROTAI'); addPin('tokyo', TOKYO, 'TOKYO', '#fff');

  ui().add(<Node ref={yearBox} y={-770} scale={0}>
    <Rect width={380} height={150} radius={22} fill={'#fff'} />
    <Rect y={-55} width={380} height={40} radius={[22, 22, 0, 0]} fill={C.red} />
    <Txt y={22} text={() => String(Math.round(year()))} fontFamily={SERIF} fontWeight={900} fontSize={86} fill={C.ink} />
  </Node>);
  const showYear = (v = true) => yearBox().scale(v ? 1 : 0, 0.45, v ? easeOutBack : easeInCubic);
  const card = (title: string, sub: string) => {
    const n = (<Node y={640} scale={0}>
      <Rect width={800} height={180} radius={26} fill={'#fff'} />
      <Rect x={-390} width={20} height={180} radius={[26, 0, 0, 26]} fill={C.red} />
      <Txt y={-22} text={title} fontFamily={SERIF} fontWeight={900} fontSize={56} fill={C.ink} />
      <Txt y={44} text={sub} fontFamily={F} fontWeight={700} fontSize={30} fill={'#7a6a48'} />
    </Node>) as Node; ui().add(n); return n;
  };
  const stampN = (label: string, col: string, size: number) => (
    <Node scale={2.4} opacity={0}>
      <Rect width={label.length * size * 0.66 + 60} height={size * 1.5} radius={12} stroke={col} lineWidth={size / 7} />
      <Txt text={label} fontFamily={F} fontWeight={900} fontSize={size} fill={col} />
    </Node>) as Node;
  const slam = (n: Node) => all(n.scale(1, 0.24, easeInCubic), n.opacity(1, 0.12));
  const pop = (n: Node) => n.scale(1, 0.55, easeOutBack);
  function* go(swap: () => void, d = 0.3): ThreadGenerator { yield* dip().opacity(1, d, easeInCubic); swap(); yield* dip().opacity(0, d * 1.4, easeOutCubic); }
  const toMap = () => { stage().removeChildren(); stage().opacity(0); stage().scale(1); stage().position([0, 0]); mapLayer().opacity(1); dusk().opacity(0); };
  const toStage = (n: Node) => { stage().removeChildren(); stage().add(n); stage().opacity(1); mapLayer().opacity(0); };
  const camTo = (ll: V, z: number, d: number) => all(cam().position(proj(...ll), d, easeInOutCubic), cam().zoom(z, d, easeInOutCubic));

  // ======== S0-S1: MAP ========
  cam().position(proj(132, 22));
  spawn(cam().zoom(0.72, 7, easeInOutSine));
  const over = stampN('WAR IS OVER', '#2e7d32', 60); over.y(-560); over.rotation(-5); ui().add(over);
  yield* at(0.4); yield* showYear();
  yield* at(1.6); yield* slam(over);
  yield* at(T[1]);
  yield* all(over.scale(0, 0.35), year(1974, 3, easeInOutCubic), sequence(0.35, pop(pins.guam), pop(pins.lub), pop(pins.mor)));

  // ======== S2: soldier hiding in the jungle ========
  yield* at(T[2] - 0.5);
  const a = bust({x: 40, y: 1250, s: 1.3, rifle: true});
  const s2 = (<Node>
    {jungle(3)}
    {a.node}
    {bushes(830, 4, [C.jDark, C.jNear, C.jDeep], 1.2)}
    {bigLeaf(-600, 520, -20, 1.2)}{bigLeaf(620, 700, 200, 1.3, C.jDark)}{bigLeaf(-560, 900, -40, 1.4, C.jNear)}
  </Node>) as Node;
  yield* all(yearBox().scale(0, 0.3), cam().zoom(2.4, 0.6, easeInCubic), go(() => toStage(s2)));
  stage().scale(1.12); spawn(stage().scale(1, 6.6, easeInOutSine));
  a.LX(-150); a.LY(-40);
  yield* a.root().y(960, 1.6, easeOutCubic);
  yield* all(a.lookX(-1, 0.5), a.headRot(-6, 0.6, easeInOutSine));
  yield* waitFor(0.8);
  yield* all(a.lookX(1, 0.5), a.headRot(6, 0.8, easeInOutSine));
  yield* waitFor(0.6);
  yield* all(a.lookX(0, 0.4), a.headRot(0, 0.5), a.brow(1, 0.4));

  // ======== S3: plane + leaflets seen from under the canopy ========
  yield* at(T[3] - 0.3);
  const planeN = (<Node x={-900} y={-300} scale={1.6}>
    <Path data={'M -40 -12 L -140 -190 L -80 -190 L 70 -12 Z'} fill={'#aeb6c2'} />
    <Rect width={380} height={70} radius={35} fill={'#cfd5de'} />
    <Circle x={190} size={70} fill={'#cfd5de'} />
    <Rect x={80} y={-14} width={150} height={22} radius={10} fill={'#5b7fa6'} />
    <Path data={'M -150 -12 L -190 -100 L -140 -100 L -110 -12 Z'} fill={'#aeb6c2'} />
    <Path data={'M -40 12 L -110 150 L -60 150 L 70 12 Z'} fill={'#9aa3b0'} />
  </Node>) as Node;
  const leaves: Node[] = []; const r = useRandom(21);
  const s3 = (<Node>
    <Rect width={1400} height={2400} fill={'#e7f5ea'} />
    {planeN}
    <Node>{Array.from({length: 40}, (_, i) => { const l = (<Node opacity={0}><Rect width={50} height={34} radius={3} fill={'#fff'} /><Rect y={-7} width={32} height={5} fill={C.red} /><Rect y={4} width={28} height={4} fill={'#aaa'} /></Node>) as Node; leaves.push(l); return l; })}</Node>
    {bigLeaf(-560, -980, 30, 1.3)}{bigLeaf(560, -1000, 150, 1.3, C.jDark)}
    {bigLeaf(-600, 980, -30, 1.4, C.jDark)}{bigLeaf(600, 960, 210, 1.4)}
  </Node>) as Node;
  yield* go(() => toStage(s3));
  spawn(planeN.x(1000, 3.4, linear));
  spawn(all(...leaves.map((l, i) => delay(0.4 + i * 0.05, (function* (): ThreadGenerator {
    l.position([-600 + i * 32, -300]); l.opacity(1); l.scale(0.5); l.rotation(r.nextFloat(0, 360));
    const tx = l.x() + r.nextFloat(-200, 200), ty = r.nextFloat(200, 1100);
    yield* all(l.x(tx, 3.4, easeInOutSine), l.y(ty, 3.4, easeInOutSine), l.scale(r.nextFloat(1.4, 2.4), 3.4, easeInCubic),
      l.rotation(l.rotation() + r.nextFloat(-400, 400), 3.4), delay(2.8, l.opacity(0, 0.6)));
  })()))));

  // ======== S4: he reads the leaflet, crumples it ========
  yield* at(T[4] - 0.3);
  const b = bust({x: 0, y: 1000, s: 1.35, rifle: true});
  const paper = (<Node x={0} y={-200} rotation={-3}>
    <Rect width={360} height={440} radius={6} fill={C.paper} />
    <Txt y={-160} text={'ATTENTION'} fontFamily={SERIF} fontWeight={900} fontSize={34} fill={'#8b1d1d'} />
    <Txt y={-80} text={'THE WAR'} fontFamily={SERIF} fontWeight={900} fontSize={60} fill={C.ink} />
    <Txt y={-10} text={'IS OVER'} fontFamily={SERIF} fontWeight={900} fontSize={60} fill={C.ink} />
    {[0, 1, 2, 3].map(k => <Rect y={70 + k * 34} x={-20 * (k % 2)} width={280 - k * 30} height={12} fill={'rgba(0,0,0,0.13)'} />)}
  </Node>) as Node;
  const s4 = (<Node>
    {jungle(8)}
    <Node y={-80}>{b.node}</Node>
    {bushes(980, 12, [C.jDark, C.jNear], 1.3)}
    {bigLeaf(-620, 820, -10, 1.3)}{bigLeaf(640, 860, 190, 1.2, C.jDark)}
  </Node>) as Node;
  b.root().add(paper);
  b.LX(-175); b.LY(-190); b.RX(175); b.RY(-190); b.lookY(1); b.headRot(0);
  yield* go(() => toStage(s4));
  yield* all(b.brow(-0.3, 0.6), b.eyeSize(1.1, 0.6));
  yield* at(20.5);
  const trick = stampN('ENEMY TRICK?', C.red, 44); trick.rotation(-12); trick.y(30); paper.add(trick);
  yield* all(slam(trick), b.brow(1.2, 0.3), b.lookY(0, 0.3), b.smile(-0.6, 0.3));
  yield* all(b.headRot(-8, 0.25).to(8, 0.3).to(-6, 0.3).to(0, 0.25));
  yield* at(22.4);
  yield* all(paper.scale([0.45, 0.4], 0.45, easeInCubic), paper.rotation(40, 0.45), b.hands.L(-50, -210, 0.45), b.hands.R(50, -210, 0.45), b.open(0.4, 0.3));
  yield* all(paper.scale(0.22, 0.25), b.hands.L(-40, -220, 0.25), b.hands.R(40, -220, 0.25));
  yield* all(b.hands.R(260, -560, 0.35, easeOutCubic), b.hands.L(-150, -40, 0.5), paper.position([300, -700], 0.35, easeOutCubic), paper.rotation(260, 0.5));
  yield* all(paper.position([700, -300], 0.6, easeInCubic), b.hands.R(150, -40, 0.6), b.open(0, 0.3), b.smile(-0.3, 0.4));

  // ======== S5: Guam — Yokoi digs a hole ========
  yield* at(T[5] - 0.4);
  yield* go(() => { toMap(); cam().position(proj(135, 18)); cam().zoom(0.95); });
  const yc = card('Sgt. Shoichi Yokoi', 'Guam  ·  28 years in hiding');
  yield* all(camTo([GUAM[0] - 1.6, GUAM[1] + 1.2], 2.4, 2.1), delay(0.8, pop(yc)));
  yield* at(27.3);
  const y = bust({x: 80, y: 900, s: 1.15});
  const depth = createSignal(0);
  const shovel = createRef<Node>();
  const shovelAng = createSignal(-30), shovelX = createSignal(150), shovelY = createSignal(-260);
  const grip = (u: number): V => { const a2 = shovelAng() * Math.PI / 180; return [shovelX() + Math.sin(a2) * u, shovelY() - Math.cos(a2) * u]; };
  const dirt: Circle[] = [];
  const pile = createSignal(0);
  const s5 = (<Node>
    {jungle(14)}
    <Node y={() => depth() * 260}>
      {y.node}
    </Node>
    {Array.from({length: 12}, (_, i) => { const c = (<Circle size={22 + (i % 3) * 10} fill={C.soil} opacity={0} />) as Circle; dirt.push(c); return c; })}
    {grassBand(720, 3, C.grass, 50)}
    <Path data={'M -1400 745 Q -300 720 -120 740 Q 120 760 300 735 Q 700 715 1400 745 L 1400 2000 L -1400 2000 Z'} fill={C.soil} />
    <Path data={'M -1400 900 Q 0 870 1400 910 L 1400 2000 L -1400 2000 Z'} fill={C.soilD} />
    {Array.from({length: 18}, (_, i) => <Circle x={-500 + (i * 137) % 1000} y={800 + (i * 71) % 300} size={10 + (i % 4) * 5} fill={C.soilDD} opacity={0.5} />)}
    <Path data={() => `M -560 745 Q -430 ${745 - 30 - pile() * 210} -250 745 Z`} fill={'#9a6a43'} />
  </Node>) as Node;
  // hands follow the shovel handle
  y.root().add(<Node ref={shovel}>
    <Line points={() => [grip(-230), grip(150)]} stroke={'#7a5230'} lineWidth={18} lineCap={'round'} />
    <Path position={() => grip(-238)} rotation={() => shovelAng()} data={'M -36 0 L 36 0 L 32 74 Q 0 106 -32 74 Z'} fill={'#9aa2ab'} />
  </Node>);
  y.LX(() => grip(70)[0]); y.LY(() => grip(70)[1]);
  y.RX(() => grip(-70)[0]); y.RY(() => grip(-70)[1]);
  yield* go(() => { yc.scale(0); toStage(s5); });
  y.lookX(0.6); y.lookY(1); y.brow(0.4);
  spawn(depth(1, 6.2, easeInOutSine));
  spawn(pile(1, 6.2, easeInOutSine));
  spawn(function* (): ThreadGenerator {
    for (let k = 0; k < 9; k++) {
      // plunge
      yield* all(shovelAng(-10, 0.25, easeInCubic), shovelX(170, 0.25), shovelY(-120, 0.25, easeInCubic), y.headY(10, 0.25));
      // lift & toss left
      yield* all(shovelAng(-70, 0.35, easeOutCubic), shovelX(40, 0.35), shovelY(-330, 0.35, easeOutCubic), y.headY(0, 0.3));
      const c = dirt[k % dirt.length];
      c.position([-60, 640]); c.opacity(1);
      spawn(all(c.x(-430 + (k % 3) * 40, 0.7, easeOutCubic), c.y(420, 0.35, easeOutCubic).to(700 - pile() * 150, 0.35, easeInCubic), delay(0.65, c.opacity(0, 0.1))));
      yield* all(shovelAng(-30, 0.2), shovelX(150, 0.2), shovelY(-260, 0.2));
    }
  });

  // ======== S6: inside the dugout — fish, bark clothes, fear ========
  yield* at(T[6] - 0.3);
  const d = bust({x: 40, y: 1000, s: 1.2, hat: 'none', hair: '#2e231c', uni: '#9a7a4e', uniD: '#7c6038'});
  const fishN = (x: number) => (<Node x={x} y={-330}><Path data={'M -40 0 Q 0 -30 40 0 Q 0 30 -40 0 Z'} fill={'#7fb6d6'} rotation={90} /><Path data={'M 0 38 L -16 62 L 16 62 Z'} fill={'#7fb6d6'} /></Node>);
  const lamp = createSignal(1);
  const s6 = (<Node>
    <Rect width={1400} height={2400} fill={C.soilDD} />
    <Path data={'M -520 -560 Q 0 -760 520 -560 L 540 900 L -540 900 Z'} fill={'#5c3c24'} />
    <Path data={'M -120 -700 L 120 -700 L 90 -560 L -90 -560 Z'} fill={'#bfe2c4'} />
    <Circle x={-330} y={80} size={() => 900 * lamp()} fill={'rgba(255,196,110,0.18)'} />
    {[-430, -150, 150, 430].map(x => <Rect x={x} y={120} width={30} height={1100} fill={'#c29b56'} />)}
    <Rect y={-470} width={1100} height={26} fill={'#b58a47'} />
    <Line points={[[-420, -380], [420, -380]]} stroke={'#8a6a3a'} lineWidth={4} />
    {[-300, -150, 0, 150, 300].map(fishN)}
    <Node x={-330} y={180}><Rect width={50} height={70} radius={8} fill={'#6b5b44'} /><Circle y={-50} size={() => 34 + lamp() * 6} fill={'#ffcf6b'} /></Node>
    {d.node}
    <Node x={40} y={880}>
      <Rect width={520} height={120} radius={12} fill={'#8a6b3e'} />
      {Array.from({length: 11}, (_, i) => <Rect x={-240 + i * 48} width={10} height={110} fill={'rgba(0,0,0,0.25)'} />)}
      {Array.from({length: 4}, (_, i) => <Rect y={-40 + i * 26} width={510} height={8} fill={'rgba(0,0,0,0.18)'} />)}
    </Node>
    <Rect y={1000} width={1400} height={500} fill={'#4a311e'} />
  </Node>) as Node;
  yield* go(() => toStage(s6));
  year(1944); yield* showYear();
  spawn(year(1972, 5.2, easeInOutCubic));
  spawn(function* (): ThreadGenerator { while (true) { yield* lamp(0.92, 0.4, easeInOutSine); yield* lamp(1.05, 0.5, easeInOutSine); } });
  d.lookY(1); d.LX(-120); d.LY(-120); d.RX(120); d.RY(-120);
  spawn(function* (): ThreadGenerator {
    for (let k = 0; k < 7; k++) { yield* all(d.hands.L(-60, -150, 0.3), d.hands.R(140, -110, 0.3)); yield* all(d.hands.L(-140, -110, 0.3), d.hands.R(60, -150, 0.3)); }
  });
  yield* at(34.3);
  yield* all(d.lookY(-1.2, 0.3), d.lookX(0.2, 0.3), d.eyeSize(1.35, 0.3), d.brow(-1, 0.3), d.open(0.5, 0.3), d.hands.L(-120, -300, 0.4), d.hands.R(120, -300, 0.4));
  const found = stampN('FOUND · 1972', '#2e7d32', 66); found.y(-520); found.rotation(-6); ui().add(found);
  yield* at(35.6); yield* slam(found);

  // ======== S7: Lubang — Onoda and three comrades ========
  yield* at(T[7] - 0.4);
  yield* go(() => { toMap(); found.remove(); yearBox().scale(0); cam().position(proj(...GUAM)); cam().zoom(1.3); });
  const oc = card('Lt. Hiroo Onoda', 'Lubang, Philippines  ·  3 comrades');
  yield* all(camTo([LUB[0] + 1.2, LUB[1]], 2.4, 2.0), delay(0.7, pop(oc)));
  yield* at(40.5);
  const squad = [0, 1, 2, 3].map(i => bust({x: 330 - i * 250, y: 940 + (i % 2) * 20, s: 0.78, rifle: true}));
  const par = createRef<Node>();
  const s7 = (<Node>
    <Node ref={par}>{jungle(20, C.sky, 5200)}</Node>
    {squad.map(s => s.node)}
    {bushes(880, 7, [C.jDark, C.jNear, C.jDeep], 1.15, 5200)}
  </Node>) as Node;
  yield* go(() => { oc.scale(0); toStage(s7); });
  squad.forEach((s, i) => { s.lookX(1); s.headRot(4); s.LX(-120); s.RX(120); s.LY(-60); s.RY(-60); });
  const bob = spawn(function* (): ThreadGenerator { let ph = 0; while (true) { ph += 0.17; squad.forEach((s, i) => s.root().y(940 + (i % 2) * 20 + Math.abs(Math.sin(ph + i)) * -22)); yield; } });
  spawn(par().x(-1900, 16, linear));

  // ======== S8: year after year… ========
  yield* at(T[8]);
  year(1945); yield* showYear(); spawn(year(1972, 4.6, easeInOutCubic));
  yield* at(45.1);
  const q = squad[3];
  yield* all(q.hands.L(-120, -640, 0.45, easeOutBack), q.hands.R(120, -640, 0.45, easeOutBack), q.lookX(-1, 0.3), q.headRot(-5, 0.3));
  spawn(all(q.root().x(-900, 1.6, easeInCubic), q.root().opacity(0, 1.6)));
  yield* at(46.5);
  spawn(all(squad[2].root().y(1500, 1.2, easeInCubic), squad[2].root().rotation(-12, 1.2), squad[2].root().opacity(0, 1.2)));
  yield* at(47.8);
  spawn(all(squad[1].root().y(1500, 1.2, easeInCubic), squad[1].root().rotation(12, 1.2), squad[1].root().opacity(0, 1.2)));
  yield* at(48.3);
  const on = squad[0];
  yield* all(dusk().opacity(0.42, 1.2), stage().scale(1.35, 1.3, easeInOutCubic), stage().x(-380, 1.3, easeInOutCubic), stage().y(-120, 1.3, easeInOutCubic),
    on.lookX(0, 0.8), on.headRot(0, 0.8), on.brow(-0.6, 0.8), on.smile(-0.4, 0.8));

  // ======== S9: commander flies in, cancels the order ========
  yield* at(T[9] - 0.4);
  yield* go(() => { toMap(); yearBox().scale(0); cam().position(proj(130, 24)); cam().zoom(0.95); });
  const rA = proj(...TOKYO), rB = proj(127, 29), rC = proj(...LUB);
  const bez = (u: number): V => [(1 - u) ** 2 * rA[0] + 2 * (1 - u) * u * rB[0] + u * u * rC[0], (1 - u) ** 2 * rA[1] + 2 * (1 - u) * u * rB[1] + u * u * rC[1]];
  const routeEnd = createSignal(0);
  const route = (<Line points={() => Array.from({length: 41}, (_, i) => w2s(bez(i / 40 * Math.max(0.001, routeEnd()))))} stroke={C.ink} lineWidth={8} lineDash={[24, 18]} lineCap={'round'} />) as Line;
  pinLayer().add(route);
  const mp = (<Node scale={0.42}><Path data={'M -40 -12 L -120 -150 L -70 -150 L 60 -12 Z'} fill={'#aeb6c2'} /><Path data={'M -40 12 L -120 150 L -70 150 L 60 12 Z'} fill={'#aeb6c2'} /><Rect width={320} height={64} radius={32} fill={'#cfd5de'} /></Node>) as Node;
  pinLayer().add(mp); mp.position(() => w2s(bez(routeEnd())));
  mp.rotation(() => { const a2 = w2s(bez(Math.max(0, routeEnd() - 0.01))), b2 = w2s(bez(Math.min(1, routeEnd() + 0.01))); return Math.atan2(b2[1] - a2[1], b2[0] - a2[0]) * 180 / Math.PI; });
  year(1974);
  yield* all(pop(pins.tokyo), showYear());
  yield* routeEnd(1, 2.6, easeInOutSine);
  yield* at(53.2);
  const o = bust({x: -250, y: 980, s: 1.0, rifle: true});
  const cm = bust({x: 900, y: 980, s: 1.0, hat: 'officer', hair: '#e2e2e2', glasses: true, mustache: true, uni: '#6f6a55', uniD: '#57533f'});
  const order = (<Node x={-150} y={-330} scale={0}>
    <Rect width={230} height={290} radius={6} fill={C.paper} />
    <Txt y={-100} text={'ORDER'} fontFamily={SERIF} fontWeight={900} fontSize={36} fill={'#8b1d1d'} />
    {[0, 1, 2, 3].map(k => <Rect y={-40 + k * 34} width={170 - k * 20} height={10} fill={'rgba(0,0,0,0.15)'} />)}
  </Node>) as Node;
  const s9 = (<Node>
    {jungle(26)}
    {o.node}{cm.node}
    {bushes(960, 30, [C.jDark, C.jNear, C.jDeep], 1.25)}
    {bigLeaf(-640, 900, -15, 1.2)}
  </Node>) as Node;
  cm.root().add(order);
  yield* go(() => { yearBox().scale(0); toStage(s9); });
  o.lookX(1); cm.lookX(-1); o.brow(-0.4);
  const cwalk = spawn(function* (): ThreadGenerator { let ph = 0; while (true) { ph += 0.17; cm.root().y(980 - Math.abs(Math.sin(ph)) * 20); yield; } });
  yield* cm.root().x(260, 1.8, easeOutCubic);
  cancel(cwalk);
  yield* cm.root().y(980, 0.2);
  yield* all(cm.hands.L(-260, -300, 0.5), cm.hands.R(-40, -300, 0.5), order.scale(1, 0.5, easeOutBack));
  yield* at(55.6);
  const cancelSt = stampN('CANCELLED', '#2e7d32', 34); cancelSt.rotation(-14); cancelSt.y(40); order.add(cancelSt);
  yield* slam(cancelSt);
  yield* at(56.4);
  yield* all(o.hands.R(70, -560, 0.45, easeOutBack), o.brow(0, 0.3));
  yield* waitFor(0.7);
  yield* all(o.hands.R(150, -40, 0.5), o.blink(0.1, 0.3), o.headY(10, 0.5));
  if (o.rifleN()) yield* all(o.rifleN().position([-60, 700], 0.8, easeInCubic), o.rifleN().rotation(-40, 0.8), o.rifleN().opacity(0, 0.8));

  // ======== S10: Morotai — Nakamura ========
  yield* at(T[10] - 0.4);
  yield* go(() => { toMap(); route.remove(); mp.remove(); cam().position(proj(...LUB)); cam().zoom(1.4); });
  const nc = card('Pvt. Teruo Nakamura', 'Morotai  ·  December 1974');
  yield* all(camTo([MOR[0], MOR[1] + 1.4], 2.3, 2.4), delay(1.0, pop(nc)));

  // ======== S11: walks out of the jungle to the sea ========
  yield* at(T[11] - 0.4);
  const n = bust({x: -30, y: 960, s: 1.05, uni: '#8a8254'});
  const world = createRef<Node>();
  const s11 = (<Node>
    <Rect width={1400} height={2400} fill={'#ffd7a6'} />
    <Circle x={220} y={-40} size={440} fill={'#ffb068'} />
    <Node ref={world}>
      <Rect x={1800} y={620} width={4000} height={900} fill={'#63b9d3'} />
      {[0, 1, 2, 3].map(k => <Rect x={1900} y={250 + k * 50} width={1800 - k * 250} height={8} radius={4} fill={'rgba(255,255,255,0.55)'} />)}
      <Node x={-1000}>{jungle(33, 'rgba(0,0,0,0)', 2600)}</Node>
      <Path data={'M 300 520 Q 1500 470 4000 540 L 4000 2000 L 300 2000 Z'} fill={C.sand} />
    </Node>
    {n.node}
    {bushes(900, 40, [C.jDark, C.jNear, C.jDeep], 1.15, 1600)}
  </Node>) as Node;
  yield* go(() => { nc.scale(0); toStage(s11); });
  n.lookX(1); n.headRot(4); n.LX(-120); n.RX(120); n.LY(-60); n.RY(-60);
  const nb = spawn(function* (): ThreadGenerator { let ph = 0; const t0 = useTime(); while (useTime() - t0 < 2.9) { ph += 0.16; n.root().y(960 - Math.abs(Math.sin(ph)) * 22); yield; } n.root().y(960); });
  yield* world().x(-1500, 3.0, easeInOutCubic);
  yield* all(n.lookX(0.6, 0.6), n.lookY(-0.3, 0.6), n.eyeSize(1.2, 0.6), n.smile(0.3, 0.8));
  const thirty = (<Node y={-640} scale={0}>
    <Rect width={740} height={240} radius={30} fill={'rgba(30,24,20,0.9)'} />
    <Txt y={-50} text={'ALMOST'} fontFamily={F} fontWeight={700} fontSize={42} fill={'#e0d6c8'} />
    <Txt y={42} text={'30 YEARS'} fontFamily={SERIF} fontWeight={900} fontSize={106} fill={'#fff'} />
  </Node>) as Node;
  ui().add(thirty);
  yield* at(66.0); yield* pop(thirty);
  yield* at(68.9);
  yield* black().opacity(1, 1.8);
  yield* at(END);
});
