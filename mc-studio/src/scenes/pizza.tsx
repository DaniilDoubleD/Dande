import {Camera, Circle, Line, Node, Path, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  ThreadGenerator, all, cancel, createRef, createSignal, delay, easeInCubic, easeInOutCubic, easeInOutSine,
  easeOutBack, easeOutCubic, linear, sequence, spawn, useRandom, useTime, waitFor,
} from '@motion-canvas/core';
import {LAND_US, projUS} from '../land_us';
import {bust, V} from '../lib/kit';

const C = {
  ink: '#2b2b33', red: '#e0533d', cream: '#f3ead2', sea: '#6cc3dc', land: '#eadcb3',
  wall: '#f0dfc1', wall2: '#e6d0ab', wood: '#9b6a3f', woodD: '#7a5130', gold: '#f5b83d', goldD: '#d9952a',
  crust: '#e7b262', sauce: '#d8543a', cheese: '#f6d77a', pep: '#b8352a',
};
const F = 'DejaVu Sans', SERIF = 'DejaVu Serif', MONO = 'DejaVu Sans Mono';
// sentence starts (am_liam)
const T = [0.4, 3.58, 6.8, 11.93, 15.81, 19.95, 22.53, 32.8, 36.45];
const END = 44;
function* at(t: number): ThreadGenerator { const n = useTime(); if (t > n) yield* waitFor(t - n); }
const money = (v: number) => '$' + Math.round(v).toLocaleString('en-US');

function pizza(r: number) {
  const rnd = useRandom(5);
  return (
    <Node>
      <Circle size={r * 2} fill={C.crust} />
      <Circle size={r * 1.8} fill={C.sauce} />
      {Array.from({length: 14}, (_, i) => { const a = i * 2.39, d = rnd.nextFloat(0, r * 0.7); return <Circle x={Math.cos(a) * d} y={Math.sin(a) * d} size={rnd.nextFloat(r * 0.35, r * 0.6)} fill={C.cheese} />; })}
      {Array.from({length: 9}, (_, i) => { const a = i * 0.7 + 0.3, d = (i % 3 + 1) * r * 0.24; return <Circle x={Math.cos(a) * d} y={Math.sin(a) * d} size={r * 0.24} fill={C.pep} />; })}
      {[0, 45, 90, 135].map(a => <Line points={[[-r * 0.9, 0], [r * 0.9, 0]]} rotation={a} stroke={'rgba(120,60,20,0.35)'} lineWidth={r * 0.03} />)}
    </Node>
  );
}
function box(w = 330) {
  return (
    <Node>
      <Rect width={w} height={70} radius={8} fill={'#e9dcc4'} />
      <Rect y={-8} width={w - 30} height={8} radius={4} fill={'#d5c4a6'} />
      <Circle y={4} size={44} fill={C.red} />
      <Txt y={6} text={'PIZZA'} fontFamily={F} fontWeight={900} fontSize={14} fill={'#fff'} />
    </Node>
  );
}
function coin(s = 1) {
  return (<Node scale={s}><Circle size={90} fill={C.goldD} /><Circle size={74} fill={C.gold} /><Txt text={'₿'} fontFamily={F} fontWeight={900} fontSize={46} fill={'#fff4d6'} /></Node>);
}
function room(extra?: Node) {
  const stars = useRandom(3);
  return (
    <Node>
      <Rect width={1400} height={2400} fill={C.wall} />
      <Rect y={-200} width={1400} height={10} fill={C.wall2} />
      {/* window, night */}
      <Rect x={-300} y={-520} width={420} height={480} radius={10} fill={'#27305a'} />
      {Array.from({length: 18}, () => <Circle x={-300 + stars.nextFloat(-190, 190)} y={-520 + stars.nextFloat(-220, 220)} size={stars.nextFloat(3, 7)} fill={'#fff6c9'} />)}
      <Circle x={-200} y={-640} size={70} fill={'#fff1c2'} />
      <Rect x={-300} y={-520} width={420} height={480} radius={10} stroke={'#fff'} lineWidth={18} />
      <Rect x={-300} y={-520} width={10} height={470} fill={'#fff'} />
      {/* shelf */}
      <Rect x={290} y={-560} width={360} height={16} fill={C.woodD} />
      {['#4b7bd1', '#e0533d', '#6aa84f', '#f1c232', '#8e7cc3'].map((c, i) => <Rect x={150 + i * 40} y={-612} width={32} height={90 - (i % 2) * 18} radius={3} fill={c} offset={[0, 0.5]} />)}
      {extra}
    </Node>
  );
}

export default makeScene2D(function* (view) {
  view.fill(C.cream);
  const cam = createRef<Camera>(), mapLayer = createRef<Node>(), overlay = createRef<Node>(), stage = createRef<Node>(), ui = createRef<Node>();
  const dip = createRef<Rect>(), black = createRef<Rect>();

  // ---------------- map ----------------
  view.add(<Node ref={mapLayer}>
    <Rect width={1080} height={1920} fill={C.sea} />
    <Camera ref={cam} zoom={0.55}>
      {Array.from({length: 40}, (_, i) => <Line points={[[-5000, -3200 + i * 170], [5000, -3200 + i * 170]]} stroke={'rgba(255,255,255,0.15)'} lineWidth={() => 2 / cam().zoom()} />)}
      <Path data={LAND_US} fill={'rgba(20,60,80,0.18)'} x={7} y={9} />
      <Path data={LAND_US} fill={C.land} stroke={C.ink} lineWidth={() => 2.6 / cam().zoom()} lineJoin={'round'} />
      <Txt text={'UNITED STATES'} position={projUS(-98, 39)} fontFamily={F} fontWeight={900} letterSpacing={6} fontSize={() => 44 / cam().zoom()} fill={C.ink} />
      <Txt text={'FLORIDA'} position={projUS(-81.8, 28)} fontFamily={F} fontWeight={800} fontSize={() => 30 / cam().zoom()} fill={'#6b5a3a'} />
    </Camera>
    <Node ref={overlay} />
  </Node>);
  view.add(<Node ref={stage} opacity={0} />);
  view.add(<Node ref={ui} />);
  view.add(<Rect ref={dip} width={1080} height={1920} fill={C.cream} opacity={0} />);
  view.add(<Rect ref={black} width={1080} height={1920} fill={'#000'} opacity={0} />);
  const w2s = (w: V): V => [(w[0] - cam().position.x()) * cam().zoom(), (w[1] - cam().position.y()) * cam().zoom()];
  const JAX = projUS(-81.66, 30.33);
  const pin = (<Node position={() => w2s(JAX)} scale={0}>
    <Circle size={40} stroke={'#ffd23f'} lineWidth={6} />
    <Path data={'M 0 0 C -10 -30 -40 -50 -40 -80 A 40 40 0 1 1 40 -80 C 40 -50 10 -30 0 0 Z'} fill={C.red} stroke={C.ink} lineWidth={5} />
    <Circle y={-82} size={26} fill={'#fff'} />
    <Rect y={-172} height={62} width={330} radius={14} fill={'#fff'} stroke={C.ink} lineWidth={5}><Txt text={'JACKSONVILLE'} fontFamily={F} fontWeight={900} fontSize={34} fill={C.ink} /></Rect>
  </Node>) as Node;
  overlay().add(pin);
  const dateCard = (<Node y={-760} scale={0}>
    <Rect width={420} height={170} radius={22} fill={'#fff'} />
    <Rect y={-62} width={420} height={46} radius={[22, 22, 0, 0]} fill={C.red} />
    <Txt y={-60} text={'MAY'} fontFamily={F} fontWeight={900} fontSize={32} fill={'#fff'} />
    <Txt y={28} text={'2010'} fontFamily={SERIF} fontWeight={900} fontSize={92} fill={C.ink} />
  </Node>) as Node;
  ui().add(dateCard);

  function* go(swap: () => void, d = 0.3): ThreadGenerator { yield* dip().opacity(1, d, easeInCubic); swap(); yield* dip().opacity(0, d * 1.4, easeOutCubic); }
  const toStage = (n: Node) => { stage().removeChildren(); stage().add(n); stage().opacity(1); mapLayer().opacity(0); stage().scale(1); stage().position([0, 0]); };

  // ======== S0: map → Jacksonville ========
  cam().position(projUS(-95, 37));
  yield* at(0.3);
  yield* all(dateCard.scale(1, 0.5, easeOutBack), cam().position(JAX, 3.0, easeInOutCubic), cam().zoom(2.6, 3.0, easeInOutCubic), delay(1.2, pin.scale(1, 0.55, easeOutBack)));

  // ======== S1: hungry programmer at his computer ========
  yield* at(T[1] - 0.4);
  const laz = bust({x: -140, y: 690, s: 1.05, hat: 'none', hair: '#4a3526', glasses: true, civ: true, uni: '#5b7fb5', uniD: '#4a6a99'});
  const typing = createSignal(0);
  const monitor = (
    <Node x={300} y={380}>
      <Rect width={380} height={330} radius={26} fill={'#d9d2c0'} />
      <Rect width={310} height={250} radius={14} fill={'#1f3b2e'} />
      <Txt y={-60} text={'bitcointalk.org'} fontFamily={MONO} fontSize={20} fill={'#8fe3a6'} />
      {[0, 1, 2].map(k => <Rect x={-20} y={-10 + k * 34} width={() => 220 * Math.min(1, Math.max(0, typing() * 3 - k))} height={12} offset={[-1, 0]} fill={'#8fe3a6'} opacity={0.8} />)}
      <Rect y={190} width={120} height={50} fill={'#c9c1ad'} />
      <Rect y={225} width={220} height={20} radius={8} fill={'#c9c1ad'} />
    </Node>
  ) as Node;
  const s1 = (<Node>
    {room()}
    {laz.node}
    {monitor}
    <Rect y={780} width={1400} height={420} fill={C.wood} />
    <Rect y={585} width={1400} height={30} fill={C.woodD} />
    <Rect x={40} y={560} width={420} height={40} radius={8} fill={'#e8e2d2'} />
  </Node>) as Node;
  yield* go(() => { dateCard.scale(0); toStage(s1); });
  laz.lookX(1); laz.headRot(3); laz.brow(-0.4);
  laz.LX(-60); laz.LY(-150); laz.RX(80); laz.RY(-150);
  // thought bubble with pizza
  const bubble = (<Node x={-330} y={-40} scale={0}>
    <Circle x={170} y={170} size={30} fill={'#fff'} /><Circle x={120} y={120} size={46} fill={'#fff'} />
    <Circle size={230} fill={'#fff'} />
    <Node scale={0.8}>{pizza(110)}</Node>
  </Node>) as Node;
  stage().add(bubble);
  const typer = spawn(function* (): ThreadGenerator { while (true) { yield* all(laz.LY(-140, 0.12), laz.RY(-160, 0.12)); yield* all(laz.LY(-160, 0.12), laz.RY(-140, 0.12)); } });
  yield* at(4.9);
  yield* all(bubble.scale(1, 0.6, easeOutBack), laz.lookX(-0.6, 0.4), laz.lookY(-0.6, 0.4), laz.smile(0.4, 0.5));
  spawn(function* (): ThreadGenerator { while (true) { yield* bubble.y(-60, 1, easeInOutSine); yield* bubble.y(-40, 1, easeInOutSine); } });

  // ======== S2: the forum post ========
  yield* at(T[2] - 0.3);
  cancel(typer);
  const postText = 'I\'ll pay 10,000 bitcoins for a couple of pizzas.. like maybe 2 large ones so I have some left over for the next day.';
  const chars = createSignal(0);
  const s2 = (<Node>
    <Rect width={1400} height={2400} fill={'#d9d2c0'} />
    <Rect width={940} height={1300} radius={60} fill={'#1b3327'} />
    <Rect y={-560} width={940} height={90} radius={[60, 60, 0, 0]} fill={'#244536'} />
    <Txt y={-560} text={'bitcointalk.org  ›  Pizza for bitcoins?'} fontFamily={MONO} fontSize={30} fill={'#bff5cf'} />
    <Node x={-400} y={-440}>
      <Circle x={40} y={40} size={80} fill={'#5b7fb5'} />
      <Txt x={110} y={24} offset={[-1, 0]} text={'laszlo'} fontFamily={MONO} fontWeight={700} fontSize={32} fill={'#8fe3a6'} />
      <Txt x={110} y={62} offset={[-1, 0]} text={'May 18, 2010'} fontFamily={MONO} fontSize={24} fill={'#6fae82'} />
    </Node>
    <Txt x={-400} y={-300} offset={[-1, -1]} width={800} textWrap lineHeight={62}
      text={() => postText.slice(0, Math.floor(chars()))} fontFamily={MONO} fontSize={44} fill={'#dfffe8'} />
  </Node>) as Node;
  yield* go(() => toStage(s2));
  stage().scale(1.05); spawn(stage().scale(1, 4.6, easeInOutSine));
  yield* chars(postText.length, 3.8, linear);

  // ======== S3: pizzas arrive ========
  yield* at(T[3] - 0.3);
  const guy = bust({x: 1300, y: 700, s: 1.0, hat: 'none', civ: true, uni: '#d8433a', uniD: '#b63329', hair: '#2a1d16'});
  const boxes = (<Node x={0} y={-150}>{box()}<Node y={-66}>{box()}</Node></Node>) as Node;
  const laz2 = bust({x: -230, y: 690, s: 1.05, hat: 'none', hair: '#4a3526', glasses: true, civ: true, uni: '#5b7fb5', uniD: '#4a6a99'});
  const s3 = (<Node>
    {room()}
    {laz2.node}{guy.node}
    <Rect y={780} width={1400} height={420} fill={C.wood} />
    <Rect y={585} width={1400} height={30} fill={C.woodD} />
  </Node>) as Node;
  guy.root().add(boxes);
  guy.LX(-190); guy.LY(-150); guy.RX(170); guy.RY(-150);
  yield* go(() => toStage(s3));
  laz2.lookX(1); laz2.eyeSize(1.2); laz2.smile(0.8); laz2.open(0.3);
  const gb = spawn(function* (): ThreadGenerator { let ph = 0; while (true) { ph += 0.17; guy.root().y(700 - Math.abs(Math.sin(ph)) * 16); yield; } });
  yield* guy.root().x(300, 1.6, easeOutCubic);
  cancel(gb); guy.root().y(700);
  guy.lookX(-1); guy.smile(0.6);
  yield* all(laz2.hands.L(40, -260, 0.6), laz2.hands.R(240, -260, 0.6), laz2.smile(1, 0.4));

  // ======== S4: 10,000 BTC ≈ $41 ========
  yield* at(T[4] - 0.3);
  const stack = createRef<Node>();
  const s4 = (<Node>
    <Rect width={1400} height={2400} fill={'#2a2230'} />
    <Circle size={900} fill={'rgba(245,184,61,0.10)'} />
    <Node ref={stack} y={120}>{Array.from({length: 9}, (_, i) => <Node y={-i * 22} x={(i % 2) * 6}><Rect width={170} height={30} radius={15} fill={i % 2 ? C.goldD : C.gold} /></Node>)}</Node>
    <Node x={-230} y={220}>{coin(1.1)}</Node><Node x={230} y={230}>{coin(0.9)}</Node>
  </Node>) as Node;
  const btcTag = (<Node y={-300} scale={0}><Rect width={620} height={130} radius={65} fill={C.gold} /><Txt text={'10,000 BTC'} fontFamily={F} fontWeight={900} fontSize={70} fill={'#3a2a10'} /></Node>) as Node;
  const eq = (<Node y={480} scale={0}><Txt text={'≈ $41'} fontFamily={SERIF} fontWeight={900} fontSize={170} fill={'#fff'} /><Txt y={110} text={'about $0.004 per coin'} fontFamily={F} fontWeight={700} fontSize={38} fill={'#bdb3c7'} /></Node>) as Node;
  yield* go(() => toStage(s4));
  stage().add(btcTag); stage().add(eq);
  yield* btcTag.scale(1, 0.55, easeOutBack);
  yield* at(17.6);
  yield* eq.scale(1, 0.6, easeOutBack);

  // ======== S5-S7: the pizza's value climbs ========
  yield* at(T[5] - 0.3);
  const value = createSignal(41), year = createSignal(2010), glow = createSignal(0);
  const bigPizza = createRef<Node>();
  const chips = createRef<Node>();
  const s5 = (<Node>
    <Rect width={1400} height={2400} fill={'#1a1411'} />
    <Circle y={-120} size={() => 820 + glow() * 420} fill={() => `rgba(245,184,61,${0.10 + glow() * 0.2})`} />
    <Node ref={bigPizza} y={-120} scale={0.6}>{pizza(300)}</Node>
    <Node y={-800}>
      <Rect width={340} height={120} radius={60} fill={'#2c231d'} />
      <Txt text={() => String(Math.round(year()))} fontFamily={SERIF} fontWeight={900} fontSize={76} fill={'#fff'} />
    </Node>
    <Txt y={420} text={'TWO PIZZAS ARE WORTH'} fontFamily={F} fontWeight={800} fontSize={40} letterSpacing={4} fill={'#bdaa92'} />
    <Txt y={540} text={() => money(value())} fontFamily={SERIF} fontWeight={900} fontSize={() => 96 + glow() * 20} fill={() => glow() > 0.9 ? C.gold : '#ffffff'} />
    <Node ref={chips} y={700} />
  </Node>) as Node;
  yield* go(() => toStage(s5));
  spawn(function* (): ThreadGenerator { while (true) { yield* bigPizza().rotation(bigPizza().rotation() + 360, 24, linear); } });
  yield* all(bigPizza().scale(0.95, 1.2, easeOutBack));
  const chip = (label: string, x: number) => { const n = (<Node x={x} scale={0}><Rect width={300} height={84} radius={42} fill={'#2c231d'} stroke={C.gold} lineWidth={3} /><Txt text={label} fontFamily={F} fontWeight={800} fontSize={34} fill={'#ffe3a3'} /></Node>) as Node; chips().add(n); return n; };
  // smooth segments: value & year eased together (no jumps)
  const seg = (y1: number, v1: number, d: number) => all(year(y1, d, easeInOutSine), value(v1, d, easeInOutSine), glow(Math.min(1, Math.log10(v1) / 9), d, easeInOutSine));
  yield* at(T[6]);
  yield* seg(2013, 7_500_000, 1.9);
  yield* chip('2013 · $7.5M', -340).scale(1, 0.4, easeOutBack);
  yield* seg(2017, 190_000_000, 2.6);
  yield* chip('2017 · $190M', 0).scale(1, 0.4, easeOutBack);
  yield* seg(2021, 690_000_000, 2.4);
  yield* chip('2021 · $690M', 340).scale(1, 0.4, easeOutBack);
  yield* at(T[7]);
  // billion: impact + coin rain
  const rain = createRef<Node>();
  stage().add(<Node ref={rain} />);
  const rr = useRandom(9);
  yield* all(seg(2025, 1_000_000_000, 1.6), bigPizza().scale(1.08, 1.6, easeInOutSine));
  const flash = (<Rect width={1400} height={2400} fill={C.gold} opacity={0.5} />) as Rect; stage().add(flash);
  spawn(flash.opacity(0, 0.6));
  for (let i = 0; i < 28; i++) {
    const cn = (<Node x={rr.nextFloat(-520, 520)} y={-1100} rotation={rr.nextFloat(-40, 40)}>{coin(rr.nextFloat(0.6, 1.1))}</Node>) as Node;
    rain().add(cn);
    spawn(delay(i * 0.06, all(cn.y(1100, rr.nextFloat(1.4, 2.2), easeInCubic), cn.rotation(cn.rotation() + rr.nextFloat(-200, 200), 2))));
  }
  const billion = (<Node y={-540} scale={0}><Rect width={720} height={120} radius={60} fill={C.gold} /><Txt text={'OVER $1 BILLION'} fontFamily={F} fontWeight={900} fontSize={60} fill={'#3a2a10'} /></Node>) as Node;
  stage().add(billion);
  yield* billion.scale(1, 0.5, easeOutBack);

  // ======== S8: Bitcoin Pizza Day ========
  yield* at(T[8] - 0.3);
  const laz3 = bust({x: -60, y: 720, s: 1.1, hat: 'none', hair: '#4a3526', glasses: true, civ: true, uni: '#5b7fb5', uniD: '#4a6a99'});
  const slice = (<Node rotation={-20}><Path data={'M 0 0 L -60 -170 Q 0 -200 60 -170 Z'} fill={C.crust} /><Path data={'M 0 -10 L -48 -160 Q 0 -184 48 -160 Z'} fill={C.cheese} /><Circle x={-10} y={-110} size={26} fill={C.pep} /><Circle x={18} y={-70} size={22} fill={C.pep} /></Node>) as Node;
  const cal = (<Node x={330} y={-440} rotation={4}>
    <Rect width={300} height={320} radius={16} fill={'#fff'} />
    <Rect y={-120} width={300} height={80} radius={[16, 16, 0, 0]} fill={C.red} />
    <Txt y={-120} text={'MAY'} fontFamily={F} fontWeight={900} fontSize={46} fill={'#fff'} />
    <Txt y={40} text={'22'} fontFamily={SERIF} fontWeight={900} fontSize={150} fill={C.ink} />
  </Node>) as Node;
  const s8 = (<Node>
    {room(cal)}
    {laz3.node}
    <Rect y={800} width={1400} height={420} fill={C.wood} />
    <Rect y={605} width={1400} height={30} fill={C.woodD} />
  </Node>) as Node;
  yield* go(() => toStage(s8));
  laz3.root().add(slice);
  slice.position(() => [laz3.RX() - 10, laz3.RY() + 10]);
  laz3.RX(150); laz3.RY(-40); laz3.lookX(0.4); laz3.smile(0.7);
  yield* all(laz3.hands.R(70, -380, 0.8), laz3.headRot(-4, 0.8));
  yield* all(laz3.open(0.6, 0.2), laz3.lookX(0, 0.3));
  yield* all(laz3.open(0, 0.2), laz3.hands.R(150, -150, 0.6), laz3.smile(1, 0.4), laz3.eyeSize(1.1, 0.4));
  const title = (<Node y={-780} scale={0}>
    <Rect width={860} height={170} radius={30} fill={C.gold} />
    <Txt y={-24} text={'BITCOIN PIZZA DAY'} fontFamily={F} fontWeight={900} fontSize={66} fill={'#3a2a10'} />
    <Txt y={40} text={'the most expensive dinner in history'} fontFamily={F} fontWeight={700} fontSize={30} fill={'#5a4318'} />
  </Node>) as Node;
  ui().add(title);
  yield* at(39.2);
  yield* title.scale(1, 0.6, easeOutBack);
  yield* at(42.4);
  yield* black().opacity(1, 1.4);
  yield* at(END);
});
