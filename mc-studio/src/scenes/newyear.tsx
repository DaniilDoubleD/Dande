import {Circle, Line, Node, Path, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  ThreadGenerator, all, createRef, createSignal, delay, easeInCubic, easeInOutCubic, easeInOutSine,
  easeOutBack, easeOutCubic, easeOutElastic, linear, sequence, spawn, useRandom, useTime, waitFor,
} from '@motion-canvas/core';

const C = {bg1: '#141a3a', bg2: '#2a1f5c', pink: '#ff3d7f', yel: '#ffd23f', mint: '#3ddc97', blue: '#4da3ff', white: '#fff7ec', tree: '#1f9d6a', treeD: '#16784f'};
const F = 'DejaVu Sans';
const PAL = [C.pink, C.yel, C.mint, C.blue, '#ff8a3d'];
function* at(t: number): ThreadGenerator { const n = useTime(); if (t > n) yield* waitFor(t - n); }
const starPath = (r: number, r2: number) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r2 : r; d += (i ? ' L ' : 'M ') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1); } return d + ' Z'; };

export default makeScene2D(function* (view) {
  view.fill(C.bg1);
  const rnd = useRandom(7);
  // ---------- background: gradient glow + twinkling stars + snow ----------
  const glow = createSignal(0);
  view.add(<Circle y={-200} size={() => 1500 + glow() * 300} fill={C.bg2} opacity={0.8} />);
  const stars: Node[] = [];
  view.add(<Node>{Array.from({length: 40}, (_, i) => { const s = (<Path x={rnd.nextFloat(-520, 520)} y={rnd.nextFloat(-940, 300)} data={starPath(10, 4)} fill={C.white} scale={rnd.nextFloat(0.4, 1)} opacity={0.6} />) as Node; stars.push(s); return s; })}</Node>);
  stars.forEach((s, i) => spawn(function* (): ThreadGenerator { yield* waitFor((i % 7) * 0.3); while (true) { yield* s.opacity(0.15, 0.8 + (i % 3) * 0.3, easeInOutSine); yield* s.opacity(0.9, 0.8 + (i % 3) * 0.3, easeInOutSine); } }));
  const snow = createRef<Node>();
  view.add(<Node ref={snow} />);
  const flakes = Array.from({length: 90}, () => ({x: rnd.nextFloat(-560, 560), y: rnd.nextFloat(-1000, 1000), v: rnd.nextFloat(1.5, 4), s: rnd.nextFloat(6, 16), ph: rnd.nextFloat(0, 6)}));
  const flakeNodes = flakes.map(f => { const c = (<Circle size={f.s} fill={'#ffffff'} opacity={0.8} />) as Circle; snow().add(c); return c; });
  spawn(function* (): ThreadGenerator { let k = 0; while (true) { k++; flakes.forEach((f, i) => { f.y += f.v; if (f.y > 1000) f.y = -1000; flakeNodes[i].position([f.x + Math.sin(k * 0.03 + f.ph) * 20, f.y]); }); yield; } });

  const stage = createRef<Node>();
  view.add(<Node ref={stage} />);
  const fx = createRef<Node>();
  view.add(<Node ref={fx} />);

  // ---------- helpers ----------
  function burst(x: number, y: number, n = 26, spread = 320, dur = 1.1) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd.nextFloat(-0.1, 0.1), d = spread * rnd.nextFloat(0.6, 1);
      const col = PAL[i % PAL.length];
      const p = (<Circle x={x} y={y} size={rnd.nextFloat(12, 22)} fill={col} />) as Circle;
      const trail = (<Line points={() => [[x, y], p.position()]} stroke={col} lineWidth={4} opacity={0.35} lineCap={'round'} />) as Line;
      fx().add(trail); fx().add(p);
      spawn(all(p.position([x + Math.cos(a) * d, y + Math.sin(a) * d + 60], dur, easeOutCubic), delay(dur * 0.55, all(p.opacity(0, dur * 0.45), trail.opacity(0, dur * 0.3))), p.size(4, dur)));
      spawn(delay(dur + 0.1, (function* () { p.remove(); trail.remove(); })()));
    }
  }
  function confetti(n = 60) {
    for (let i = 0; i < n; i++) {
      const col = PAL[i % PAL.length];
      const c = (<Rect x={rnd.nextFloat(-100, 100)} y={200} width={rnd.nextFloat(14, 26)} height={rnd.nextFloat(8, 14)} fill={col} rotation={rnd.nextFloat(0, 360)} />) as Rect;
      fx().add(c);
      const tx = rnd.nextFloat(-560, 560), ty = rnd.nextFloat(-900, -300);
      spawn(all(
        c.x(tx, 2.4, easeOutCubic),
        c.y(ty, 0.8, easeOutCubic).to(1100, 2.2, easeInCubic),
        c.rotation(c.rotation() + rnd.nextFloat(-720, 720), 3),
        c.scale.x(-1, 0.25).to(1, 0.25).to(-1, 0.25).to(1, 0.25).to(-1, 0.25).to(1, 0.25),
      ));
    }
  }

  // ---------- S1: MAD STUDIO logo drops in ----------
  const logo = createRef<Node>();
  const mad = 'MAD'.split(''), studio = 'STUDIO'.split('');
  const madL: Node[] = [], stL: Node[] = [];
  stage().add(
    <Node ref={logo} y={-80}>
      <Rect y={-40} width={640} height={250} radius={40} fill={C.pink} rotation={-4} scale={0} ref={createRef()} />
      <Node y={-50}>{mad.map((ch, i) => { const t = (<Node x={-190 + i * 190} y={-900}><Txt text={ch} fontFamily={F} fontWeight={900} fontSize={230} fill={C.white} /></Node>) as Node; madL.push(t); return t; })}</Node>
      <Node y={140}>{studio.map((ch, i) => { const t = (<Node x={-225 + i * 90} opacity={0} scale={0.3}><Txt text={ch} fontFamily={F} fontWeight={900} fontSize={96} letterSpacing={4} fill={C.yel} /></Node>) as Node; stL.push(t); return t; })}</Node>
    </Node>,
  );
  const badge = logo().children()[0] as Rect;
  yield* waitFor(0.25);
  yield* all(
    sequence(0.12, ...madL.map((l, i) => all(l.y(0, 0.7, easeOutBack), l.rotation(i === 1 ? 0 : (i ? 6 : -6), 0.7)))),
    delay(0.35, badge.scale(1, 0.6, easeOutBack)),
    delay(0.7, sequence(0.05, ...stL.map(l => all(l.opacity(1, 0.2), l.scale(1, 0.4, easeOutBack))))),
  );
  spawn(function* (): ThreadGenerator { while (true) { yield* all(...madL.map((l, i) => l.y(-14, 0.35 + i * 0.05, easeInOutSine))); yield* all(...madL.map((l, i) => l.y(0, 0.35 + i * 0.05, easeInOutSine))); } });
  yield* waitFor(0.4);
  yield* all(logo().position([0, -640], 0.8, easeInOutCubic), logo().scale(0.62, 0.8, easeInOutCubic));

  // ---------- S2: year flip 2026 → 2027 ----------
  const yr = createRef<Node>(), d6 = createRef<Node>(), d7 = createRef<Node>();
  const digit = (ch: string, x: number, col = C.white) => (
    <Node x={x}><Rect width={170} height={230} radius={26} fill={'rgba(255,255,255,0.08)'} /><Txt text={ch} fontFamily={F} fontWeight={900} fontSize={190} fill={col} /></Node>);
  stage().add(
    <Node ref={yr} y={40} scale={0}>
      {digit('2', -285)}{digit('0', -95)}{digit('2', 95)}
      <Node x={285}>
        <Node ref={d6}>{digit('6', 0)}</Node>
        <Node ref={d7} scale={[1, 0]}>{digit('7', 0, C.yel)}</Node>
      </Node>
    </Node>,
  );
  yield* yr().scale(1, 0.6, easeOutBack);
  yield* at(3.3);
  yield* d6().scale([1, 0], 0.18, easeInCubic);
  yield* d7().scale([1, 1], 0.5, easeOutElastic);
  confetti(70);
  burst(0, 40, 30, 420, 1.2);
  yield* glow(1, 0.3).to(0, 1);

  // ---------- S3: fireworks + tree builds ----------
  yield* at(5.0);
  yield* all(yr().position([0, -330], 0.7, easeInOutCubic), yr().scale(0.55, 0.7, easeInOutCubic));
  const tree = createRef<Node>();
  const tiers: Node[] = [];
  const ornaments: Node[] = [];
  stage().add(
    <Node ref={tree} y={420}>
      <Rect y={250} width={90} height={110} radius={10} fill={'#8a5a33'} />
      {[[0, 150, 520, 300], [0, -20, 420, 260], [0, -170, 310, 220]].map(([x, y, w, h], i) => {
        const t = (<Node x={x} y={y - 900} opacity={0}>
          <Path data={`M ${-w / 2} ${h / 2} Q 0 ${h / 2 + 30} ${w / 2} ${h / 2} L 0 ${-h / 2} Z`} fill={i % 2 ? C.treeD : C.tree} />
        </Node>) as Node; tiers.push(t); return t;
      })}
      {[[-150, 170], [120, 200], [-40, 110], [170, 40], [-120, 20], [40, -60], [-60, -140], [60, -190], [0, 230]].map(([x, y], i) => {
        const o = (<Circle x={x} y={y} size={46} fill={PAL[i % PAL.length]} scale={0} />) as Node; ornaments.push(o); return o;
      })}
      <Path ref={createRef()} y={-330} data={starPath(70, 30)} fill={C.yel} scale={0} />
    </Node>,
  );
  const treeStar = tree().children()[tree().children().length - 1] as Path;
  spawn(function* (): ThreadGenerator {
    const pts: [number, number][] = [[-330, -520], [320, -600], [-260, -150], [300, -220], [0, -760], [-360, 200], [350, 120]];
    for (let k = 0; k < 14; k++) { const p = pts[k % pts.length]; burst(p[0] + rnd.nextFloat(-40, 40), p[1] + rnd.nextFloat(-40, 40), 22, 220, 1.0); yield* waitFor(0.42); }
  });
  yield* sequence(0.25, ...tiers.map((t, i) => all(t.y(t.y() + 900, 0.6, easeOutBack), t.opacity(1, 0.2))));
  yield* sequence(0.07, ...ornaments.map(o => o.scale(1, 0.4, easeOutBack)));
  yield* all(treeStar.scale(1, 0.6, easeOutElastic), treeStar.rotation(360, 0.8, easeOutCubic));
  spawn(function* (): ThreadGenerator { while (true) { yield* treeStar.scale(1.15, 0.5, easeInOutSine); yield* treeStar.scale(1, 0.5, easeInOutSine); } });
  spawn(function* (): ThreadGenerator { while (true) { for (const o of ornaments) { yield* o.scale(1.25, 0.08); yield* o.scale(1, 0.1); } } });

  // ---------- S4: greeting letter by letter ----------
  yield* at(8.8);
  yield* all(tree().position([0, 640], 0.8, easeInOutCubic), tree().scale(0.62, 0.8, easeInOutCubic), yr().opacity(0, 0.4));
  const g1 = 'HAPPY NEW'.split(''), g2 = 'YEAR!'.split('');
  const lines: Node[] = [];
  const mk = (arr: string[], y: number, size: number, col: string) => (
    <Node y={y}>{arr.map((ch, i) => { const n = (<Node x={(i - (arr.length - 1) / 2) * size * 0.8} scale={0} rotation={rnd.nextFloat(-20, 20)}><Txt text={ch} fontFamily={F} fontWeight={900} fontSize={size} fill={col} /></Node>) as Node; lines.push(n); return n; })}</Node>);
  stage().add(<Node y={-150}>{mk(g1, -90, 110, C.white)}{mk(g2, 80, 170, C.yel)}</Node>);
  yield* sequence(0.06, ...lines.map(l => all(l.scale(1, 0.45, easeOutBack), l.rotation(0, 0.45, easeOutBack))));
  spawn(function* (): ThreadGenerator { while (true) { yield* sequence(0.05, ...lines.map(l => l.y(-18, 0.18, easeOutCubic).to(0, 0.22, easeInCubic))); yield* waitFor(0.8); } });
  const sub = (<Node y={170} opacity={0}>
    <Txt text={'Have a madly awesome 2027!'} fontFamily={F} fontWeight={700} fontSize={46} fill={C.white} />
    <Txt y={64} text={'Thank you for being with us'} fontFamily={F} fontWeight={600} fontSize={38} fill={'#c9c2ff'} />
  </Node>) as Node;
  stage().add(sub);
  yield* all(sub.opacity(1, 0.6), sub.y(140, 0.6, easeOutCubic));

  // ---------- S5: gift box opens, logo pops ----------
  yield* at(12.0);
  yield* all(...stage().children().map(n => n.opacity(0, 0.4)));
  stage().removeChildren();
  const gift = createRef<Node>(), lid = createRef<Node>(), out = createRef<Node>();
  stage().add(
    <Node>
      <Node ref={out} y={120} scale={0}>
        <Rect y={-40} width={640} height={250} radius={40} fill={C.pink} rotation={-4} />
        <Txt y={-50} text={'MAD'} fontFamily={F} fontWeight={900} fontSize={230} fill={C.white} letterSpacing={-6} />
        <Txt y={140} text={'STUDIO'} fontFamily={F} fontWeight={900} fontSize={96} letterSpacing={30} fill={C.yel} />
      </Node>
      <Node ref={gift} y={420} scale={0}>
        <Rect width={440} height={340} radius={20} fill={C.mint} />
        <Rect width={70} height={340} fill={C.pink} />
        <Node ref={lid} y={-190}>
          <Rect width={480} height={80} radius={16} fill={'#35c587'} />
          <Rect width={74} height={80} fill={C.pink} />
          <Circle x={-50} y={-60} size={90} stroke={C.pink} lineWidth={22} />
          <Circle x={50} y={-60} size={90} stroke={C.pink} lineWidth={22} />
        </Node>
      </Node>
    </Node>,
  );
  yield* gift().scale(1, 0.5, easeOutBack);
  yield* all(gift().rotation(-6, 0.1).to(6, 0.1).to(-6, 0.1).to(0, 0.1));
  yield* at(13.0);
  yield* all(lid().position([700, -1300], 0.8, easeOutCubic), lid().rotation(160, 0.8));
  confetti(80);
  burst(0, 250, 34, 480, 1.3);
  yield* all(out().scale(1, 0.7, easeOutElastic), out().y(-360, 0.7, easeOutBack), glow(1, 0.3).to(0.4, 1));
  const tag = (<Txt y={-80} text={'Happy New Year 2027!'} fontFamily={F} fontWeight={800} fontSize={54} fill={C.white} opacity={0} />) as Txt;
  stage().add(tag);
  yield* tag.opacity(1, 0.5);
  yield* waitFor(1.6);
});
