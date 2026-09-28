import {Camera, Circle, Line, Node, Path, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all, chain, createRef, createSignal, delay, easeInCubic, easeInOutCubic, easeInOutSine,
  easeOutBack, easeOutCubic, linear, sequence, spawn, useRandom, useTime, waitFor,
} from '@motion-canvas/core';
import {LAND, proj} from '../land';

// ---------- palette (flat, like the reference) ----------
const P = {
  sky: '#dff4e6', sky2: '#c9ecd8', cloud: '#eefaf2',
  hillFar: '#bfe6cf', hillMid: '#a6d9bb', hillNear: '#b3b02a', hillNear2: '#a3a01f',
  bush: '#5e5c17', bush2: '#747219', path: '#f2c65a',
  jFar: '#a9d8b5', jMid: '#6fb37f', jNear: '#3f8a52', jDark: '#2b6a3c', trunk: '#8a5a33',
  khaki: '#8f8a4c', khakiD: '#6e6a37', skin: '#f2b48a', skinD: '#dc9a70', boot: '#4a3423',
  sea: '#6cc3dc', land: '#e9dcb4', landEdge: '#c9b98c', ink: '#2a2a33', red: '#e0533d',
  paper: '#f7efd9', sand: '#f3d995',
};
const F = 'DejaVu Sans';
const SERIF = 'DejaVu Serif';

// ---------- timing (sentence starts from am_liam VO) ----------
const T = [0.5, 3.97, 7.72, 14.99, 19.06, 24.71, 30.57, 37.84, 44.07, 49.76, 58.2, 63.38];
const END = 71;

function* at(t: number) {
  const now = useTime();
  if (t > now) yield* waitFor(t - now);
}

// ---------- building blocks ----------
function hill(y: number, amp: number, seed: number, color: string, w = 1800) {
  const r = useRandom(seed);
  const n = 7;
  let d = `M ${-w / 2} ${y}`;
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + (w / n) * i, x1 = x0 + w / n;
    const h = y - r.nextFloat(0.3, 1) * amp;
    d += ` C ${x0 + w / n / 3} ${h} ${x1 - w / n / 3} ${h} ${x1} ${y + r.nextFloat(-amp * 0.2, amp * 0.2)}`;
  }
  d += ` L ${w / 2} 1400 L ${-w / 2} 1400 Z`;
  return <Path data={d} fill={color} />;
}

function cloud(x: number, y: number, s: number) {
  return (
    <Node x={x} y={y} scale={s}>
      <Circle size={220} x={-120} y={20} fill={P.cloud} />
      <Circle size={300} x={0} y={-20} fill={P.cloud} />
      <Circle size={240} x={130} y={15} fill={P.cloud} />
      <Rect width={420} height={120} y={80} fill={P.cloud} radius={60} />
    </Node>
  );
}

function bushRow(y: number, seed: number, color: string, big = 1) {
  const r = useRandom(seed);
  return (
    <Node y={y}>
      {Array.from({length: 11}, (_, i) => (
        <Circle x={-800 + i * 160 + r.nextFloat(-30, 30)} y={r.nextFloat(-20, 30)}
          size={r.nextFloat(180, 280) * big} fill={i % 2 ? color : P.bush2} />
      ))}
    </Node>
  );
}

function palm(x: number, y: number, h: number, lean: number, dark = false) {
  const top: [number, number] = [x + lean, y - h];
  const leaf = dark ? P.jDark : P.jNear;
  return (
    <Node>
      <Path data={`M ${x} ${y} Q ${x + lean * 0.2} ${y - h * 0.5} ${top[0]} ${top[1]}`}
        stroke={P.trunk} lineWidth={26} lineCap={'round'} />
      {[-150, -110, -60, -20, 20, 70, 120, 160].map((a, i) => (
        <Path x={top[0]} y={top[1]} rotation={a + (i % 2) * 6}
          data={'M 0 0 Q 90 -55 200 10 Q 95 -10 0 0 Z'} fill={i % 2 ? leaf : P.jMid} />
      ))}
      <Circle x={top[0]} y={top[1]} size={30} fill={'#6b4424'} />
    </Node>
  );
}

function jungleBg(opts: {sunset?: boolean; seed?: number} = {}) {
  const s = opts.seed ?? 1;
  const skyC = opts.sunset ? '#ffd8a8' : P.sky;
  return (
    <Node>
      <Rect y={-1400} width={2600} height={5600} fill={skyC} />{cloud(-150, -1500, 1.1)}{cloud(380, -1850, 0.9)}{cloud(-420, -2050, 0.8)}
      {opts.sunset ? <Circle x={200} y={-150} size={380} fill={'#ffb46b'} /> : null}
      {cloud(-280, -650, 1)}{cloud(330, -480, 0.8)}
      {hill(-80, 260, s, opts.sunset ? '#f0c7a0' : P.jFar)}
      {Array.from({length: 7}, (_, i) => palm(-760 + i * 250, 60, 360 + (i % 3) * 60, (i % 2 ? 50 : -40), false))}
      {hill(160, 200, s + 3, P.jMid)}
      {Array.from({length: 6}, (_, i) => palm(-700 + i * 300, 330, 520 + (i % 2) * 90, (i % 2 ? -70 : 60), true))}
      {hill(420, 120, s + 7, P.jNear)}
    </Node>
  );
}

// flat side-view soldier (faces right). returns controls.
function soldier(o: {x: number; y: number; s?: number; dir?: number; uni?: string; rifle?: boolean; hair?: string; cap?: boolean}) {
  const walk = createSignal(0);     // phase
  const arm = createSignal(10);     // front arm angle
  const arm2 = createSignal(-10);   // back arm angle
  const lean = createSignal(0);
  const head = createSignal(0);
  const root = createRef<Node>();
  const uni = o.uni ?? P.khaki, uniD = P.khakiD;
  const node = (
    <Node ref={root} x={o.x} y={o.y} scale={[(o.dir ?? 1) * (o.s ?? 1), o.s ?? 1]}>
      <Node rotation={lean}>
        {/* back leg */}
        <Rect y={-130} width={30} height={130} offset={[0, -1]} radius={14} fill={uniD}
          rotation={() => -Math.sin(walk()) * 28}>
          <Rect y={118} x={10} width={52} height={24} radius={10} fill={P.boot} />
        </Rect>
        {/* back arm */}
        <Rect y={-265} x={-4} width={26} height={110} offset={[0, -1]} radius={13} fill={uniD}
          rotation={arm2}><Circle y={112} size={28} fill={P.skinD} /></Rect>
        {/* torso */}
        <Rect y={-200} width={82} height={150} radius={[30, 30, 20, 20]} fill={uni} />
        <Rect y={-150} width={84} height={16} fill={'#5a4a2a'} />
        {/* front leg */}
        <Rect y={-130} width={30} height={130} offset={[0, -1]} radius={14} fill={uni}
          rotation={() => Math.sin(walk()) * 28}>
          <Rect y={118} x={10} width={52} height={24} radius={10} fill={P.boot} />
        </Rect>
        {/* head */}
        <Node y={-315} rotation={head}>
          <Rect y={32} width={30} height={24} fill={P.skinD} />
          <Circle size={96} fill={P.skin} />
          <Circle x={24} y={-6} size={11} fill={P.ink} />
          <Rect x={30} y={22} width={16} height={4} radius={2} fill={'#b0634a'} />
          <Circle x={-26} y={4} size={20} fill={P.skinD} />
          {o.cap === false
            ? <Path data={'M -48 -6 Q -40 -58 10 -52 Q 44 -48 44 -18 Q 10 -40 -48 -6 Z'} fill={o.hair ?? '#cfcfcf'} />
            : <Node>
                <Path data={'M -50 -4 Q -48 -60 4 -58 Q 48 -56 50 -10 L -50 -4 Z'} fill={uniD} />
                <Rect x={44} y={-10} width={38} height={10} radius={5} fill={uniD} />
                <Rect x={-44} y={0} width={20} height={34} fill={uniD} radius={4} />
              </Node>}
        </Node>
        {/* front arm (+ rifle) */}
        <Rect y={-265} x={6} width={28} height={112} offset={[0, -1]} radius={14} fill={uni}
          rotation={arm}>
          <Circle y={114} size={30} fill={P.skin} />
          {o.rifle ? <Line points={[[-20, 150], [0, 100], [70, -60]]} stroke={'#5a3a22'} lineWidth={12} lineCap={'round'} /> : null}
        </Rect>
      </Node>
    </Node>
  );
  return {node, root, walk, arm, arm2, lean, head};
}

function* walkLoop(w: ReturnType<typeof createSignal<number>>, speed = 0.22) {
  while (true) { w(w() + speed); yield; }
}

export default makeScene2D(function* (view) {
  view.fill('#000');
  const cam = createRef<Camera>();
  const mapLayer = createRef<Node>();
  const side = createRef<Node>();
  const sideCam = createRef<Node>();
  const ui = createRef<Node>();
  const flash = createRef<Rect>();
  const shade = createRef<Rect>();
  const year = createSignal(1945);
  const yearBox = createRef<Node>();

  // ---------- map ----------
  view.add(
    <Node ref={mapLayer}>
      <Rect width={1080} height={1920} fill={P.sea} />
      <Camera ref={cam} zoom={0.55}>
        {Array.from({length: 40}, (_, i) => (
          <Line points={[[-4000, -3000 + i * 160], [4000, -3000 + i * 160]]}
            stroke={'rgba(255,255,255,0.18)'} lineWidth={() => 2 / cam().zoom()} />
        ))}
        <Path data={LAND} fill={'rgba(20,60,80,0.18)'} x={8} y={10} />
        <Path data={LAND} fill={P.land} stroke={P.ink} lineWidth={() => 3 / cam().zoom()} lineJoin={'round'} />
        <Txt text={'JAPAN'} position={proj(138, 38.5)} fontFamily={F} fontWeight={900} fontSize={() => 44 / cam().zoom()} fill={P.ink} />
        <Txt text={'PHILIPPINES'} position={proj(121, 16.8)} fontFamily={F} fontWeight={900} fontSize={() => 38 / cam().zoom()} fill={P.ink} />
        <Txt text={'PACIFIC OCEAN'} position={proj(150, 24)} fontFamily={F} fontWeight={800} fontSize={() => 40 / cam().zoom()} fill={'rgba(255,255,255,0.75)'} letterSpacing={8} />
      </Camera>
    </Node>,
  );
  view.add(<Node ref={side} opacity={0}><Node ref={sideCam} /></Node>);
  view.add(<Rect ref={shade} width={1080} height={1920} fill={'#0b0d18'} opacity={0} />);
  view.add(<Node ref={ui} />);
  view.add(<Rect ref={flash} width={1080} height={1920} fill={'#fff'} opacity={0} />);

  const pins: Record<string, Node> = {};
  function addPin(name: string, lon: number, lat: number, label?: string, col = P.red) {
    const n = (
      <Node position={proj(lon, lat)} scale={0}>
        <Node scale={() => 1 / cam().zoom()}>
          <Circle size={36} stroke={'#ffd23f'} lineWidth={6} opacity={0.8} />
          <Path y={0} data={'M 0 0 C -10 -30 -40 -50 -40 -80 A 40 40 0 1 1 40 -80 C 40 -50 10 -30 0 0 Z'} fill={col} stroke={P.ink} lineWidth={5} />
          <Circle y={-82} size={26} fill={'#fff'} />
          {label ? <Rect y={-175} height={64} width={label.length * 26 + 50} radius={14} fill={'#fff'} stroke={P.ink} lineWidth={5}>
            <Txt text={label} fontFamily={F} fontWeight={900} fontSize={36} fill={P.ink} /></Rect> : null}
        </Node>
      </Node>
    );
    cam().add(n);
    pins[name] = n;
    return n;
  }
  const GUAM: [number, number] = [144.79, 13.45], LUB: [number, number] = [120.12, 13.82], MOR: [number, number] = [128.42, 2.35], TOKYO: [number, number] = [139.7, 35.7];
  addPin('guam', ...GUAM, 'GUAM'); addPin('lub', ...LUB, 'LUBANG'); addPin('mor', ...MOR, 'MOROTAI'); addPin('tokyo', ...TOKYO, 'TOKYO', '#fff');

  // ---------- UI helpers ----------
  ui().add(
    <Node ref={yearBox} y={-760} scale={0}>
      <Rect width={380} height={150} radius={22} fill={'#fff'} />
      <Rect y={-55} width={380} height={40} radius={[22, 22, 0, 0]} fill={P.red} />
      <Txt y={22} text={() => String(Math.round(year()))} fontFamily={SERIF} fontWeight={900} fontSize={86} fill={P.ink} />
    </Node>,
  );
  function* showYear(v = true) { yield* yearBox().scale(v ? 1 : 0, 0.5, v ? easeOutBack : easeInCubic); }

  function nameCard(title: string, sub: string, y = 700) {
    const n = (
      <Node y={y} scale={0}>
        <Rect width={820} height={190} radius={26} fill={'#fff'} />
        <Rect x={-400} width={20} height={190} radius={[26, 0, 0, 26]} fill={P.red} />
        <Txt y={-22} text={title} fontFamily={SERIF} fontWeight={900} fontSize={58} fill={P.ink} />
        <Txt y={46} text={sub} fontFamily={F} fontWeight={700} fontSize={32} fill={'#7a6a48'} />
      </Node>
    ) as Node;
    ui().add(n);
    return n;
  }
  function stamp(label: string, y: number, col: string, size = 76, rot = -8) {
    const n = (
      <Node y={y} rotation={rot} scale={2.4} opacity={0}>
        <Rect width={label.length * size * 0.66 + 70} height={size * 1.55} radius={14} stroke={col} lineWidth={10} />
        <Txt text={label} fontFamily={F} fontWeight={900} fontSize={size} fill={col} />
      </Node>
    ) as Node;
    ui().add(n);
    return n;
  }
  function* slam(n: Node) { yield* all(n.scale(1, 0.25, easeInCubic), n.opacity(1, 0.12)); }
  function* pop(n: Node, s = 1) { yield* n.scale(s, 0.55, easeOutBack); }
  function* hide(n: Node) { yield* all(n.scale(0, 0.35, easeInCubic)); }
  function* flashSwap(swap: () => void, d = 0.35) {
    yield* flash().opacity(1, d, easeInCubic);
    swap();
    yield* flash().opacity(0, d * 1.3, easeOutCubic);
  }
  const toMap = () => { side().opacity(0); mapLayer().opacity(1); sideCam().removeChildren(); sideCam().position([0, 0]); sideCam().scale(1); };
  const toSide = (content: Node) => { mapLayer().opacity(0); sideCam().removeChildren(); sideCam().add(content); side().opacity(1); };
  function* camTo(ll: [number, number], zoom: number, d: number) {
    yield* all(cam().position(proj(...ll), d, easeInOutCubic), cam().zoom(zoom, d, easeInOutCubic));
  }

  // background clouds on map
  const mapClouds = <Node>{[0, 1, 2].map(i => cloud(-400 + i * 450, -600 + i * 520, 0.9))}</Node> as Node;
  mapLayer().add(mapClouds);
  spawn(function* () { while (true) { mapClouds.x(mapClouds.x() + 0.6); if (mapClouds.x() > 700) mapClouds.x(-700); yield; } });

  // ===================== S0-S1: map, 1945 → decades =====================
  cam().position(proj(132, 22));
  spawn(cam().zoom(0.7, 7, easeInOutSine));
  year(1945);
  yield* at(0.4);
  yield* showYear();
  const over = stamp('WAR IS OVER', -560, '#2e7d32', 58, -5);
  yield* at(1.6);
  yield* slam(over);
  yield* at(T[1]);
  yield* all(hide(over), year(1974, 3, easeInOutCubic),
    sequence(0.35, pop(pins.guam), pop(pins.lub), pop(pins.mor)));

  // ===================== S2: jungle side view, hiding soldier =====================
  yield* at(T[2] - 0.6);
  yield* all(showYear(false), cam().zoom(3, 0.6, easeInCubic), cam().position(proj(...LUB), 0.6, easeInCubic),
    delay(0.25, flashSwap(() => {}, 0.3)));
  const s2 = soldier({x: 60, y: 520, s: 1.25, rifle: true});
  const bushFront = bushRow(700, 11, P.bush, 1.2);
  const shot2 = (
    <Node>
      {jungleBg({seed: 2})}
      {s2.node}
      {bushRow(560, 5, P.jDark, 1.1)}
      {bushFront}
      <Rect y={1100} width={2400} height={800} fill={P.bush} />
    </Node>
  ) as Node;
  toSide(shot2);
  s2.root().y(700); s2.arm(-40); s2.lean(-8);
  sideCam().scale(1.15);
  spawn(sideCam().scale(1.0, 7, easeInOutSine));
  yield* s2.root().y(560, 1.4, easeOutCubic);
  spawn(function* () { while (true) { yield* s2.head(-8, 1.2, easeInOutSine); yield* s2.head(8, 1.2, easeInOutSine); } });
  const hideCard = (
    <Node y={760} opacity={0}>
      <Rect width={760} height={120} radius={60} fill={'rgba(20,30,20,0.78)'} />
      <Txt y={-14} text={'JAPAN SURRENDERED'} fontFamily={F} fontWeight={900} fontSize={42} fill={'#fff'} />
      <Txt y={30} text={'but nobody told them'} fontFamily={F} fontWeight={600} fontSize={30} fill={'#cfe3c9'} />
    </Node>
  ) as Node;
  ui().add(hideCard);
  yield* at(10.5);
  yield* hideCard.opacity(1, 0.6);

  // ===================== S3: camera tilts up, plane drops leaflets =====================
  yield* at(T[3] - 0.3);
  yield* hideCard.opacity(0, 0.3);
  // tilt up: move world down
  yield* sideCam().y(900, 1.2, easeInOutCubic);
  const plane = (
    <Node x={-900} y={-1450} scale={1.1}>
      <Rect width={300} height={60} radius={30} fill={'#c9d0da'} />
      <Path data={'M -20 -10 L -90 -120 L -40 -120 L 60 -10 Z'} fill={'#aeb6c2'} />
      <Path data={'M -20 10 L -70 90 L -30 90 L 50 10 Z'} fill={'#9aa3b0'} />
      <Path data={'M -130 -10 L -160 -80 L -120 -80 L -90 -10 Z'} fill={'#aeb6c2'} />
      <Circle x={150} size={60} fill={'#c9d0da'} />
      <Rect x={60} y={-12} width={120} height={20} radius={8} fill={'#5b7fa6'} />
      <Circle x={170} size={16} fill={'#444'} />
    </Node>
  ) as Node;
  sideCam().add(plane);
  const leaflets: Node[] = [];
  const rr = useRandom(7);
  for (let i = 0; i < 46; i++) {
    const l = (
      <Node x={0} y={-1450} opacity={0} rotation={rr.nextFloat(0, 360)}>
        <Rect width={46} height={32} radius={3} fill={'#fff'} />
        <Rect y={-6} width={30} height={5} fill={P.red} />
        <Rect y={4} width={26} height={4} fill={'#aaa'} />
      </Node>
    ) as Node;
    leaflets.push(l); sideCam().add(l);
  }
  spawn(plane.x(1000, 3.4, linear));
  spawn(function* () {
    yield* waitFor(0.5);
    yield* all(...leaflets.map((l, i) => delay(i * 0.045, (function* () {
      l.x(-700 + i * 34 + rr.nextFloat(-20, 20)); l.y(-1420); l.opacity(1);
      yield* all(
        l.y(-500 + rr.nextFloat(0, 900), 3.2 + rr.nextFloat(0, 1), easeInOutSine),
        l.x(l.x() + rr.nextFloat(-160, 160), 3.6, easeInOutSine),
        l.rotation(l.rotation() + rr.nextFloat(-540, 540), 3.6),
        l.scale([rr.nextFloat(0.4, 1), 1], 0.4).to([1, 1], 0.4).to([0.3, 1], 0.4).to([1, 1], 0.4),
      );
    })())));
  });
  yield* waitFor(1.6);
  yield* sideCam().y(0, 1.8, easeInOutCubic);

  // ===================== S4: reads leaflet, tears it =====================
  yield* at(T[4] - 0.2);
  const leaf = (
    <Node y={40} scale={0.1} opacity={0} rotation={-4}>
      <Rect width={720} height={900} radius={8} fill={P.paper} />
      <Txt y={-330} text={'ATTENTION'} fontFamily={SERIF} fontWeight={900} fontSize={58} fill={'#8b1d1d'} />
      <Rect y={-290} width={560} height={6} fill={'#8b1d1d'} />
      <Txt y={-150} text={'THE WAR'} fontFamily={SERIF} fontWeight={900} fontSize={108} fill={P.ink} />
      <Txt y={-30} text={'IS OVER'} fontFamily={SERIF} fontWeight={900} fontSize={108} fill={P.ink} />
      <Txt y={80} text={'Japan has surrendered.'} fontFamily={F} fontWeight={700} fontSize={38} fill={'#5a4a2a'} />
      <Txt y={132} text={'Come out of the jungle.'} fontFamily={F} fontWeight={700} fontSize={38} fill={'#5a4a2a'} />
      {[0, 1, 2].map(k => <Rect y={230 + k * 50} x={-40 * k} width={520 - k * 80} height={16} fill={'rgba(0,0,0,0.12)'} />)}
    </Node>
  ) as Node;
  ui().add(leaf);
  yield* all(shade().opacity(0.45, 0.4), leaf.opacity(1, 0.3), leaf.scale(1, 0.6, easeOutBack));
  const trick = stamp('ENEMY TRICK?', 620, P.red, 74, -8);
  yield* at(20.6);
  yield* slam(trick);
  yield* at(22.4);
  const death = (
    <Node y={330} scale={0}>
      <Rect width={860} height={130} radius={26} fill={'rgba(20,20,24,0.92)'} />
      <Txt text={'Surrender = worse than death'} fontFamily={F} fontWeight={800} fontSize={46} fill={'#fff'} />
    </Node>
  ) as Node;
  ui().add(death);
  // crumple and toss the leaflet
  yield* all(
    leaf.scale([0.5, 0.35], 0.35, easeInCubic).to(0.12, 0.25), leaf.rotation(160, 0.6),
    delay(0.4, all(leaf.x(-620, 0.6, easeInCubic), leaf.y(800, 0.6, easeInCubic))),
    hide(trick), delay(0.5, pop(death)),
  );
  leaf.remove();

  // ===================== S5: Guam — Yokoi digs =====================
  yield* at(T[5] - 0.5);
  yield* flashSwap(() => { toMap(); shade().opacity(0); death.scale(0); cam().position(proj(135, 18)); cam().zoom(0.9); }, 0.3);
  const yCard = nameCard('Sgt. Shoichi Yokoi', 'Guam · hid for 28 years');
  yield* all(camTo([GUAM[0] - 2, GUAM[1] + 1], 2.2, 2.2), delay(0.8, pop(yCard)));
  yield* at(27.4);
  const yo = soldier({x: 90, y: 330, s: 1.15});
  const hole = createSignal(0);
  const dirt: Node[] = [];
  const shot5 = (
    <Node>
      {jungleBg({seed: 5})}
      {/* ground cross-section */}
      <Rect y={950} width={2400} height={1300} fill={'#7a5233'} />
      <Rect y={1250} width={2400} height={700} fill={'#6a4529'} />
      <Rect y={322} width={2400} height={24} fill={P.jNear} />
      <Path fill={'#2e1d12'} data={() => {
        const d = hole();
        return `M -160 334 L 160 334 L ${150 - d * 10} ${334 + d * 520} Q 0 ${370 + d * 540} ${-150 + d * 10} ${334 + d * 520} Z`;
      }} />
      <Path fill={'#8a5e3b'} data={() => `M -520 334 Q -400 ${334 - hole() * 190} -280 334 Z`} />
      {yo.node}
      {bushRow(420, 9, P.jDark, 0.9)}
    </Node>
  ) as Node;
  yield* flashSwap(() => { hide(yCard); yCard.scale(0); toSide(shot5); }, 0.3);
  for (let i = 0; i < 14; i++) { const c = <Circle size={16 + (i % 3) * 8} fill={'#8a5e3b'} opacity={0} /> as Circle; dirt.push(c); sideCam().add(c); }
  // shovel in front hand
  yo.arm(60); yo.arm2(40); yo.lean(18);
  spawn(function* () {
    for (let k = 0; k < 14; k++) {
      yield* all(yo.arm(95, 0.22, easeInCubic), yo.arm2(70, 0.22), yo.lean(28, 0.22));
      const c = dirt[k % dirt.length];
      c.position([60, 360 + hole() * 400]); c.opacity(1);
      spawn(all(c.x(-400 + (k % 4) * 30, 0.7, easeOutCubic), c.y(200, 0.35, easeOutCubic).to(320, 0.35, easeInCubic), delay(0.6, c.opacity(0, 0.1))));
      yield* all(yo.arm(40, 0.28, easeOutCubic), yo.arm2(20, 0.28), yo.lean(10, 0.28));
    }
  });
  spawn(hole(1, 6.4, easeInOutSine));
  spawn(chain(waitFor(0.3), yo.root().y(720, 6.2, easeInOutSine)));
  // shovel prop
  yo.root().add(<Line points={[[40, -250], [180, -60]]} stroke={'#6b4a2e'} lineWidth={12} lineCap={'round'} />);

  // ===================== S6: fish, bark, afraid → found 1972 =====================
  yield* at(T[6]);
  year(1944);
  yield* showYear();
  spawn(year(1972, 5.2, easeInOutCubic));
  const icon = (x: number, y: number, draw: Node) => {
    const n = <Node x={x} y={y} scale={0}><Circle size={190} fill={'#fff'} />{draw}</Node> as Node;
    ui().add(n); return n;
  };
  const fish = icon(-300, 540, <Node><Path data={'M -60 0 Q -10 -45 50 0 Q -10 45 -60 0 Z'} fill={'#5aa6d6'} /><Path data={'M 45 0 L 80 -30 L 80 30 Z'} fill={'#5aa6d6'} /><Circle x={-35} y={-6} size={10} fill={P.ink} /></Node> as Node);
  const bark = icon(0, 620, <Node><Rect width={90} height={110} radius={14} fill={'#8a6b3e'} />{[-30, -10, 10, 30].map(x => <Rect x={x} width={6} height={100} fill={'rgba(0,0,0,0.25)'} />)}{[-30, 0, 30].map(y => <Rect y={y} width={84} height={6} fill={'rgba(0,0,0,0.2)'} />)}</Node> as Node);
  const eye = icon(300, 540, <Node><Path data={'M -70 0 Q 0 -55 70 0 Q 0 55 -70 0 Z'} fill={'#fff'} stroke={P.ink} lineWidth={6} /><Circle x={10} size={44} fill={'#3b2a1e'} /><Circle x={18} y={-8} size={12} fill={'#fff'} /></Node> as Node);
  yield* at(31.4); yield* pop(fish);
  yield* at(33.0); yield* pop(bark);
  yield* at(34.3); yield* pop(eye);
  const found = stamp('FOUND · 1972', 820, '#2e7d32', 70, -6);
  yield* at(35.6); yield* slam(found);

  // ===================== S7: Lubang — Onoda and 3 comrades =====================
  yield* at(T[7] - 0.4);
  yield* flashSwap(() => { toMap(); [fish, bark, eye, found].forEach(n => n.remove()); yearBox().scale(0); cam().position(proj(...GUAM)); cam().zoom(1.2); }, 0.3);
  const oCard = nameCard('Lt. Hiroo Onoda', 'Lubang, Philippines');
  yield* all(camTo([LUB[0] + 1.2, LUB[1]], 2.4, 2.0), delay(0.7, pop(oCard)));
  yield* at(40.6);
  const squad = [0, 1, 2, 3].map(i => soldier({x: -900 - i * 190, y: 560, s: 0.95, rifle: true}));
  const shot7 = (
    <Node>
      {jungleBg({seed: 9})}
      <Rect y={900} width={2400} height={700} fill={P.jNear} />
      <Path data={'M -1200 600 Q 0 560 1200 610 L 1200 700 Q 0 650 -1200 690 Z'} fill={'#c9a45a'} />
      {squad.map(s => s.node)}
      {bushRow(800, 13, P.bush, 1.2)}
    </Node>
  ) as Node;
  yield* flashSwap(() => { oCard.scale(0); toSide(shot7); }, 0.3);
  const walkers = squad.map(s => spawn(walkLoop(s.walk, 0.2)));
  squad.forEach(s => { s.arm(-25); s.arm2(20); });
  yield* all(...squad.map((s, i) => s.root().x(220 - i * 190, 3.2, easeOutCubic)));

  // ===================== S8: year after year, they vanish =====================
  yield* at(T[8]);
  year(1945);
  yield* showYear();
  spawn(year(1972, 4.6, easeInOutCubic));
  // #1 (last in line) surrenders: turns & walks away, hands up
  yield* at(45.2);
  const s3 = squad[3];
  s3.root().scale.x(-0.95);
  s3.arm(170); s3.arm2(170);
  spawn(s3.root().x(-1000, 2.2, easeInCubic));
  // #2 and #1 fall
  yield* at(46.6);
  spawn(all(squad[2].root().rotation(-90, 0.6, easeInCubic), squad[2].root().y(640, 0.6), delay(0.8, squad[2].root().opacity(0, 0.8))));
  yield* at(47.9);
  spawn(all(squad[1].root().rotation(-90, 0.6, easeInCubic), squad[1].root().y(640, 0.6), delay(0.8, squad[1].root().opacity(0, 0.8))));
  const last = (
    <Node y={760} opacity={0}><Txt text={'THE LAST ONE'} fontFamily={F} fontWeight={900} fontSize={76} fill={'#fff'} stroke={P.ink} lineWidth={10} strokeFirst /></Node>
  ) as Node;
  ui().add(last);
  yield* at(48.4);
  yield* all(shade().opacity(0.5, 0.8), last.opacity(1, 0.8), sideCam().scale(1.25, 1.2, easeInOutCubic), sideCam().x(-280, 1.2, easeInOutCubic));

  // ===================== S9: commander flies in, cancels the order =====================
  yield* at(T[9] - 0.4);
  yield* flashSwap(() => { toMap(); shade().opacity(0); last.remove(); yearBox().scale(0); cam().position(proj(130, 25)); cam().zoom(0.95); }, 0.3);
  const route = (
    <Line points={[proj(...TOKYO), proj(128, 28), proj(...LUB)]} radius={400}
      stroke={P.ink} lineWidth={() => 8 / cam().zoom()} lineDash={[24, 18]} end={0} />
  ) as Line;
  cam().add(route);
  const mplane = (<Node scale={() => 0.45 / cam().zoom()}>
    <Rect width={300} height={60} radius={30} fill={'#c9d0da'} /><Path data={'M -20 -10 L -90 -120 L -40 -120 L 60 -10 Z'} fill={'#aeb6c2'} /><Path data={'M -20 10 L -90 120 L -40 120 L 60 10 Z'} fill={'#aeb6c2'} />
  </Node>) as Node;
  cam().add(mplane);
  mplane.position(proj(...TOKYO));
  pins.tokyo.scale(0);
  yield* all(pop(pins.tokyo), year(1974, 0));
  yield* showYear();
  yield* all(route.end(1, 2.6, easeInOutSine), tweenPlane(mplane, route, 2.6));
  yield* at(53.3);
  const cmdr = soldier({x: 1300, y: 560, s: 1.1, dir: -1, cap: false, hair: '#d8d8d8', uni: '#6f6a55'});
  const ono = soldier({x: -120, y: 560, s: 1.1, rifle: true});
  const order = (<Node x={70} y={-230} scale={0}><Rect width={120} height={150} radius={6} fill={P.paper} /><Rect y={-40} width={80} height={8} fill={'#8b1d1d'} /><Rect y={-10} width={80} height={6} fill={'#bbb'} /><Rect y={10} width={70} height={6} fill={'#bbb'} /></Node>) as Node;
  const shot9 = (
    <Node>
      {jungleBg({seed: 12})}
      <Rect y={900} width={2400} height={700} fill={P.jNear} />
      {ono.node}{cmdr.node}
      {bushRow(820, 21, P.bush, 1.2)}
    </Node>
  ) as Node;
  yield* flashSwap(() => { yearBox().scale(0); toSide(shot9); }, 0.3);
  cmdr.root().add(order);
  const cw = spawn(walkLoop(cmdr.walk, 0.2));
  yield* cmdr.root().x(230, 2.4, easeOutCubic);
  cmdr.walk(0);
  yield* all(cmdr.arm(-80, 0.5, easeOutBack), order.scale(1, 0.5, easeOutBack));
  const cancelStamp = stamp('ORDER CANCELLED', 660, '#2e7d32', 60, -6);
  yield* at(55.8);
  yield* slam(cancelStamp);
  // Onoda salutes, lays rifle down
  yield* at(56.6);
  yield* ono.arm(-150, 0.5, easeOutBack);
  yield* waitFor(0.4);
  yield* ono.arm(15, 0.5);
  const rifle = <Line x={-80} y={560} points={[[-60, 0], [120, 0]]} stroke={'#5a3a22'} lineWidth={12} lineCap={'round'} opacity={0} /> as Line;
  sideCam().add(rifle);
  yield* rifle.opacity(1, 0.3);

  // ===================== S10: Morotai — Nakamura =====================
  yield* at(T[10] - 0.4);
  yield* flashSwap(() => { toMap(); cancelStamp.remove(); route.remove(); mplane.remove(); cam().position(proj(...LUB)); cam().zoom(1.4); }, 0.3);
  const nCard = nameCard('Pvt. Teruo Nakamura', 'Morotai · December 1974');
  yield* all(camTo([MOR[0], MOR[1] + 1.4], 2.3, 2.4), delay(1.0, pop(nCard)));

  // ===================== S11: walks out of the jungle to the beach =====================
  yield* at(T[11] - 0.4);
  const naka = soldier({x: -700, y: 600, s: 1.0});
  const shot11 = (
    <Node>
      <Rect width={2400} height={2600} fill={'#ffd6a4'} />
      <Circle x={260} y={-80} size={420} fill={'#ffae62'} />
      {cloud(-250, -620, 0.9)}{cloud(320, -420, 0.7)}
      <Rect y={700} width={2400} height={900} fill={'#5fb8d2'} />
      {[0, 1, 2, 3].map(k => <Rect y={330 + k * 40} x={200} width={900 - k * 150} height={8} radius={4} fill={'rgba(255,255,255,0.6)'} />)}
      <Path data={'M -1200 560 Q 0 520 1200 580 L 1200 1400 L -1200 1400 Z'} fill={P.sand} />
      {palm(-560, 580, 620, 60, true)}{palm(-380, 600, 520, -40, true)}
      {bushRow(560, 31, P.jDark, 1.3)}
      {naka.node}
    </Node>
  ) as Node;
  yield* flashSwap(() => { nCard.scale(0); toSide(shot11); }, 0.3);
  const nw = spawn(walkLoop(naka.walk, 0.18));
  naka.arm(-20); naka.arm2(20);
  spawn(naka.root().x(160, 4.2, easeOutCubic));
  const thirty = (
    <Node y={-620} scale={0}>
      <Rect width={760} height={250} radius={30} fill={'rgba(20,20,24,0.9)'} />
      <Txt y={-52} text={'ALMOST'} fontFamily={F} fontWeight={700} fontSize={44} fill={'#d6dce2'} />
      <Txt y={42} text={'30 YEARS'} fontFamily={SERIF} fontWeight={900} fontSize={110} fill={'#fff'} />
    </Node>
  ) as Node;
  ui().add(thirty);
  yield* at(66.0);
  yield* pop(thirty);
  yield* at(68.8);
  yield* all(shade().opacity(1, 1.8), thirty.opacity(0, 1.6));
  yield* at(END);
});

function* tweenPlane(plane: Node, route: Line, d: number) {
  const pts = route.points() as any[];
  const t0 = useTime();
  while (useTime() - t0 < d) {
    const u = easeInOutSine((useTime() - t0) / d);
    const [a, b, c] = pts.map((p: any) => ({x: p.x ?? p[0], y: p.y ?? p[1]}));
    const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * b.x + u * u * c.x;
    const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * b.y + u * u * c.y;
    const x2 = 2 * (1 - u) * (b.x - a.x) + 2 * u * (c.x - b.x), y2 = 2 * (1 - u) * (b.y - a.y) + 2 * u * (c.y - b.y);
    plane.position([x, y]); plane.rotation(Math.atan2(y2, x2) * 180 / Math.PI);
    yield;
  }
}
