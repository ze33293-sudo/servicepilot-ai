import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from './theme';
import {PaperField, SectionLabel} from './Common';

type Flyer = {file: string; w: number; h: number; x: number; y: number; dx: number; dy: number; rot: number; cue: number};

const flyers: Flyer[] = [
  {file: 'result-panel.png', w: 390, h: 615, x: 50, y: 300, dx: -560, dy: 80, rot: -5, cue: 875},
  {file: 'queue-table.png', w: 620, h: 428, x: 1260, y: 510, dx: 650, dy: 160, rot: 4, cue: 887},
  {file: 'evaluation-panel.png', w: 500, h: 300, x: 210, y: 65, dx: -260, dy: -420, rot: 3, cue: 899},
  {file: 'roi-panel.png', w: 470, h: 342, x: 1320, y: 80, dx: 380, dy: -420, rot: -3, cue: 911},
];

const nodes = [
  {x: 90, y: 420, label: '浏览器'},
  {x: 350, y: 420, label: 'Agent 编排'},
  {x: 650, y: 280, label: '分类 / 抽取'},
  {x: 650, y: 560, label: 'RAG / 引用'},
  {x: 970, y: 420, label: '工单工具层'},
  {x: 1280, y: 280, label: 'SQLite'},
  {x: 1280, y: 560, label: '人工队列'},
];

export const SceneOutcome: React.FC = () => {
  const frame = useCurrentFrame();
  const comparisonOut = interpolate(frame, [0, 450, 485], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const architectureIn = interpolate(frame, [450, 485], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const architectureOut = interpolate(frame, [675, 710], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const roiIn = interpolate(frame, [680, 715], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const roiOut = interpolate(frame, [855, 890], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const outroIn = interpolate(frame, [860, 895], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const recede = interpolate(frame, [900, 945], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const brandT = interpolate(frame, [870, 915], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2, .75, .3, 1)});
  const line = interpolate(frame, [910, 940], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <PaperField>
      <AbsoluteFill style={{opacity: comparisonOut}}>
        <SectionLabel eyebrow="06 · OPTIMIZATION" title="同一条 Bad Case，前后可复现" />
        <div style={{position: 'absolute', left: 145, right: 145, top: 250, display: 'grid', gridTemplateColumns: '1fr 130px 1fr', gap: 24, alignItems: 'stretch'}}>
          <div style={{borderRadius: 20, border: `3px solid ${COLORS.red}`, background: '#fff6f5', padding: '34px 38px', boxShadow: '0 20px 55px rgba(180,35,24,.12)'}}>
            <div style={{fontFamily: FONTS.mono, fontSize: 24, color: COLORS.red, fontWeight: 900}}>BASELINE</div>
            <div style={{fontFamily: FONTS.body, fontSize: 54, color: COLORS.ink, fontWeight: 900, marginTop: 20}}>物流配送</div>
            <div style={{fontFamily: FONTS.body, fontSize: 30, lineHeight: 1.45, color: COLORS.muted, marginTop: 18}}>“不是物流问题”仍被首关键词命中，分类错误。</div>
          </div>
          <div style={{display: 'grid', placeItems: 'center', fontFamily: FONTS.mono, fontSize: 72, color: COLORS.amber}}>→</div>
          <div style={{borderRadius: 20, border: `3px solid ${COLORS.green}`, background: '#effcf7', padding: '34px 38px', boxShadow: '0 20px 55px rgba(8,122,85,.12)'}}>
            <div style={{fontFamily: FONTS.mono, fontSize: 24, color: COLORS.green, fontWeight: 900}}>OPTIMIZED</div>
            <div style={{fontFamily: FONTS.body, fontSize: 54, color: COLORS.ink, fontWeight: 900, marginTop: 20}}>退款退货</div>
            <div style={{fontFamily: FONTS.body, fontSize: 30, lineHeight: 1.45, color: COLORS.muted, marginTop: 18}}>否定 / 转折加权 + 分类感知 RAG，仅命中退款知识。</div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 300, right: 300, top: 700, borderRadius: 14, background: COLORS.blue, color: 'white', padding: '21px 30px', textAlign: 'center', fontFamily: FONTS.body, fontSize: 36, fontWeight: 900}}>不是物流问题，而是退款一直没到账</div>
      </AbsoluteFill>

      <AbsoluteFill style={{opacity: roiIn * roiOut}}>
        <SectionLabel eyebrow="07 · ROI SIMULATOR" title="业务价值明确标注为模拟假设" />
        <div style={{position: 'absolute', left: 150, right: 150, top: 290, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28}}>
          {[
            ['每月节省', '97.1', '小时'],
            ['人工成本改善', '5,825', '元 / 月'],
            ['一次解决率', '+10', '百分点'],
          ].map(([label, value, unit], index) => {
            const cue = 700 + index * 24;
            const t = interpolate(frame, [cue, cue + 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2, 1.12, .3, 1)});
            return (
              <div key={label} style={{minHeight: 300, borderRadius: 22, border: `2px solid ${COLORS.border}`, background: 'rgba(255,255,255,.96)', padding: '36px 40px', boxShadow: '0 24px 65px rgba(17,27,51,.13)', opacity: t, transform: `translateY(${(1 - t) * 100}px) scale(${.95 + .05 * t})`}}>
                <div style={{fontFamily: FONTS.body, fontSize: 31, color: COLORS.muted, fontWeight: 900}}>{label}</div>
                <div style={{fontFamily: FONTS.mono, fontSize: 78, color: COLORS.blue, fontWeight: 900, marginTop: 28}}>{value}</div>
                <div style={{fontFamily: FONTS.body, fontSize: 29, color: COLORS.muted, marginTop: 8}}>{unit}</div>
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 440, right: 440, top: 720, borderRadius: 999, border: `2px solid ${COLORS.amber}`, background: COLORS.amberWash, color: COLORS.amber, padding: '16px 28px', textAlign: 'center', fontFamily: FONTS.mono, fontSize: 25, fontWeight: 900}}>SIMULATED ASSUMPTIONS · NOT PRODUCTION REVENUE</div>
      </AbsoluteFill>

      <AbsoluteFill style={{opacity: architectureIn * architectureOut}}>
        <SectionLabel eyebrow="08 · ARCHITECTURE" title="从浏览器到人工队列的完整闭环" />
        <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
          {[[0,1],[1,2],[1,3],[2,4],[3,4],[4,5],[4,6]].map(([a,b], index) => {
            const first = nodes[a]; const second = nodes[b];
            const t = interpolate(frame, [495 + index * 14, 525 + index * 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return <line key={`${a}-${b}`} x1={first.x + 110} y1={first.y + 42} x2={first.x + (second.x - first.x) * t + 110} y2={first.y + (second.y - first.y) * t + 42} stroke={COLORS.blue} strokeWidth="5" strokeLinecap="round" opacity=".6" />;
          })}
        </svg>
        {nodes.map((node, index) => {
          const cue = 480 + index * 22;
          const t = interpolate(frame, [cue, cue + 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2, 1.12, .3, 1)});
          return (
            <div key={node.label} style={{position: 'absolute', left: node.x, top: node.y, width: 220, height: 84, display: 'grid', placeItems: 'center', borderRadius: 16, border: `3px solid ${COLORS.blue}`, background: 'rgba(255,255,255,.97)', boxShadow: '0 18px 45px rgba(17,27,51,.12)', fontFamily: FONTS.body, fontSize: 28, fontWeight: 900, color: COLORS.ink, opacity: t, transform: `scale(${.85 + .15 * t})`}}>{node.label}</div>
          );
        })}
      </AbsoluteFill>

      <AbsoluteFill style={{opacity: outroIn}}>
        <div style={{position: 'absolute', inset: 0, transform: `perspective(1400px) rotateX(${3 * (1 - outroIn)}deg) scale(${1.04 - .04 * outroIn})`, transformOrigin: '50% 46%'}}>
          {flyers.map((flyer, index) => {
            const t = interpolate(frame, [flyer.cue, flyer.cue + 35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.34, 1.4, .44, 1)});
            const x = flyer.dx * (1 - t);
            const y = flyer.dy * (1 - t);
            return (
              <div key={flyer.file} style={{position: 'absolute', left: flyer.x, top: flyer.y, width: flyer.w, height: flyer.h, borderRadius: 16, overflow: 'hidden', boxShadow: '0 28px 70px rgba(17,27,51,.22)', opacity: t * (1 - .18 * recede), transform: `translate(${x}px, ${y}px) rotate(${flyer.rot * (2 - t)}deg) scale(${1.09 - .09 * t})`, filter: `saturate(${1 - .15 * recede})`}}>
                <Img src={staticFile(`textures/${flyer.file}`)} style={{width: '100%', height: '100%', display: 'block'}} />
              </div>
            );
          })}
        </div>
        <AbsoluteFill style={{background: `radial-gradient(720px 400px at 50% 47%, rgba(255,255,255,${.88 * brandT}), transparent 72%)`, pointerEvents: 'none'}} />
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{textAlign: 'center', transform: `translateY(${(1 - brandT) * 40}px) scale(${1.25 - .25 * brandT})`, filter: `blur(${(1 - brandT) * 8}px)`, opacity: brandT}}>
            <div style={{fontFamily: FONTS.serif, fontSize: 142, color: COLORS.ink, fontWeight: 900, letterSpacing: '-.035em'}}>ServicePilot AI</div>
            <div style={{width: 300, height: 8, margin: '34px auto 0', borderRadius: 8, background: COLORS.amber, transform: `scaleX(${line})`}} />
            <div style={{display: 'inline-block', fontFamily: FONTS.mono, fontSize: 34, color: COLORS.blue, letterSpacing: '.14em', fontWeight: 900, marginTop: 30, padding: '8px 22px', borderRadius: 999, background: 'rgba(255,255,255,.88)', boxShadow: '0 8px 26px rgba(255,255,255,.9)'}}>RUNNABLE · EVALUATED · AUDITABLE · RESILIENT</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </PaperField>
  );
};
