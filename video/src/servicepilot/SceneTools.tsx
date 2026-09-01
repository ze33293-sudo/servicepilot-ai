import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {PageCam, SectionLabel} from './Common';
import {COLORS, FONTS} from './theme';

const apiCards = [
  {method: 'POST', path: '/api/tickets', detail: '幂等创建', color: COLORS.green},
  {method: 'GET', path: '/api/tickets', detail: '筛选查询', color: COLORS.blue},
  {method: 'PATCH', path: '/api/tickets/{id}', detail: '版本化更新', color: COLORS.amber},
];

const trace = [
  ['classify', 'success'],
  ['extract', 'success'],
  ['retrieve', 'success'],
  ['route', 'auto'],
  ['tool.create', 'success'],
];

export const SceneTools: React.FC = () => {
  const frame = useCurrentFrame();
  const focusTable = interpolate(frame, [430, 530], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const conflictIn = interpolate(frame, [420, 460], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const conflictOut = interpolate(frame, [570, 620], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const traceIn = interpolate(frame, [565, 610], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: COLORS.paperLight}}>
      <PageCam
        src="textures/queue-full.png"
        keys={[
          {frame: 0, cx: 960, cy: 540, zoom: .86},
          {frame: 180, cx: 960, cy: 560, zoom: .94},
          {frame: 430, cx: 960, cy: 650, zoom: 1.08},
          {frame: 620, cx: 1200, cy: 650, zoom: 1.22},
          {frame: 900, cx: 1500, cy: 650, zoom: 1.28},
          {frame: 1060, cx: 1500, cy: 650, zoom: 1.22},
        ]}
      >
        <div style={{position: 'absolute', left: 222, top: 280, width: 1475, height: 610, borderRadius: 14, border: `5px solid ${COLORS.blue}`, boxShadow: '0 0 0 8px rgba(30,64,175,.1)', opacity: focusTable}} />
      </PageCam>
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(242,238,230,.96) 0%, rgba(242,238,230,.80) 37%, transparent 64%)', pointerEvents: 'none'}} />
      <SectionLabel eyebrow="03 · TOOL USE" title="创建、查询、更新状态" />

      <div style={{position: 'absolute', left: 70, top: 220, width: 760, display: 'grid', gap: 18}}>
        {apiCards.map((card, index) => {
          const cue = 40 + index * 70;
          const t = interpolate(frame, [cue, cue + 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2, 1.14, .3, 1)});
          const press = frame >= cue + 30 ? interpolate(frame, [cue + 30, cue + 36, cue + 44], [1, .985, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
          return (
            <div key={card.method} style={{position: 'relative', borderRadius: 16, border: `2px solid ${card.color}`, background: 'rgba(255,255,255,.96)', padding: '22px 25px', boxShadow: '0 18px 45px rgba(17,27,51,.12)', opacity: t, transform: `translateY(${(1 - t) * 180}px) rotate(${(index - 1) * (1 - t) * 4}deg) scale(${press})`}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <span style={{minWidth: 105, borderRadius: 10, background: card.color, color: 'white', padding: '10px 13px', textAlign: 'center', fontFamily: FONTS.mono, fontSize: 25, fontWeight: 900}}>{card.method}</span>
                <span style={{fontFamily: FONTS.mono, fontSize: 28, color: COLORS.ink, fontWeight: 900}}>{card.path}</span>
              </div>
              <div style={{fontFamily: FONTS.body, fontSize: 30, color: COLORS.muted, marginTop: 13, fontWeight: 800}}>{card.detail}</div>
            </div>
          );
        })}
      </div>

      {frame >= 540 ? (
        <div style={{position: 'absolute', left: 72, top: 570, width: 760, borderRadius: 16, background: '#162340', color: 'white', padding: '24px 28px', boxShadow: '0 24px 70px rgba(17,27,51,.25)', opacity: traceIn}}>
          <div style={{fontFamily: FONTS.mono, fontSize: 21, letterSpacing: '.14em', color: '#8fb0ff', marginBottom: 16}}>AUDITABLE TRACE</div>
          <div style={{display: 'grid', gap: 10}}>
            {trace.map(([step, status], index) => {
              const cue = 590 + index * 28;
              const t = interpolate(frame, [cue, cue + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <div key={step} style={{display: 'grid', gridTemplateColumns: '210px 130px 1fr', alignItems: 'center', gap: 15, opacity: t, transform: `translateX(${(1 - t) * -28}px)`, fontFamily: FONTS.mono, fontSize: 23}}>
                  <strong>{step}</strong>
                  <span style={{borderRadius: 999, background: status === 'auto' ? '#3b82f6' : '#087a55', padding: '5px 10px', textAlign: 'center', fontWeight: 900}}>{status}</span>
                  <span style={{color: '#cbd5e1'}}>可审计步骤</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {frame >= 400 && frame < 640 ? (
        <div style={{position: 'absolute', left: 72, top: 300, width: 780, opacity: conflictIn * conflictOut}}>
          <div style={{borderRadius: 18, border: `3px solid ${COLORS.green}`, background: '#effcf7', padding: '26px 30px', boxShadow: '0 18px 50px rgba(8,122,85,.14)'}}>
            <div style={{fontFamily: FONTS.mono, color: COLORS.green, fontSize: 23, fontWeight: 900}}>OPTIMISTIC LOCK</div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 14, fontFamily: FONTS.mono}}>
              <strong style={{fontSize: 62, color: COLORS.ink}}>v1</strong>
              <span style={{fontSize: 52, color: COLORS.amber}}>→</span>
              <strong style={{fontSize: 62, color: COLORS.blue}}>v2</strong>
              <span style={{fontSize: 28, color: COLORS.green}}>200 OK</span>
            </div>
          </div>
          <div style={{marginTop: 20, borderRadius: 18, border: `3px solid ${COLORS.red}`, background: '#fff6f5', padding: '24px 30px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div><div style={{fontFamily: FONTS.mono, color: COLORS.red, fontSize: 23, fontWeight: 900}}>STALE VERSION</div><div style={{fontFamily: FONTS.body, color: COLORS.ink, fontSize: 34, fontWeight: 900, marginTop: 8}}>拒绝覆盖并发修改</div></div>
              <strong style={{fontFamily: FONTS.mono, color: COLORS.red, fontSize: 54}}>409</strong>
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
