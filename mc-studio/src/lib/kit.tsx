import {Circle, Line, Node, Path, Rect} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeInOutSine, spawn, useRandom, waitFor} from '@motion-canvas/core';
const C = {ink: '#2b2b33'};
// ---------------- 2-bone IK ----------------
export type V = [number, number];
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
  hat?: 'cap' | 'officer' | 'none'; hair?: string; glasses?: boolean; mustache?: boolean; rifle?: boolean; beard?: boolean; civ?: boolean; shirt?: string};
export function bust(o: BustOpts) {
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
        {o.civ ? <Path data={'M -52 -345 Q 0 -290 52 -345 Z'} fill={skinD} /> : <Path data={'M -48 -345 L 0 -268 L 48 -345 Z'} fill={skinD} />}
        {o.civ ? null : <Path data={'M -60 -350 L 0 -262 L -18 -350 Z'} fill={uniD} />}
        {o.civ ? null : <Path data={'M 60 -350 L 0 -262 L 18 -350 Z'} fill={uniD} />}
{o.civ ? null : <><Rect x={0} y={-150} width={4} height={220} fill={uniD} /></>}
{o.civ ? null : <>{[-220, -160, -100].map(y => <Circle x={0} y={y} size={14} fill={'#c9b56a'} />)}</>}
{o.civ ? null : <><Rect x={-78} y={-210} width={72} height={60} radius={8} fill={uniD} opacity={0.55} /></>}
{o.civ ? null : <><Rect x={78} y={-210} width={72} height={60} radius={8} fill={uniD} opacity={0.55} /></>}
{o.civ ? null : <><Rect y={-18} width={290} height={34} fill={'#5e4527'} /></>}
{o.civ ? null : <><Rect y={-18} width={40} height={30} radius={4} fill={'#c9b56a'} /></>}
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

