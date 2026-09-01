import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {PageCam, SectionLabel} from './Common';
import {COLORS, FONTS} from './theme';

const sources = [
  {id: 'KB-REF-001', title: '退款到账时效', section: '退款与支付 / 到账时间', score: '96%'},
  {id: 'KB-REF-002', title: '七日无理由退货条件', section: '退款与支付 / 退货条件', score: '30%'},
];

export const SceneRag: React.FC = () => {
  const frame = useCurrentFrame();
  const panelIn = interpolate(frame, [80, 118], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const panelShift = interpolate(frame, [120, 700], [20, -260], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const allowIn = interpolate(frame, [170, 205], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const answerGlow = interpolate(frame, [250, 280, 560, 600], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const invalidIn = interpolate(frame, [570, 600], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: COLORS.paper}}>
      <PageCam
        src="textures/intake-full.png"
        keys={[
          {frame: 0, cx: 960, cy: 540, zoom: .88},
          {frame: 80, cx: 1440, cy: 820, zoom: 1.28},
          {frame: 118, cx: 1440, cy: 820, zoom: 1.28},
        ]}
        opacity={1 - panelIn}
      />

      <AbsoluteFill style={{opacity: panelIn, background: 'radial-gradient(1100px 720px at 66% 48%, white, #eee9de 78%)'}}>
        <div style={{position: 'absolute', left: 1020, top: -5 + panelShift, width: 697, height: 1097, transform: 'scale(1.10)', transformOrigin: 'top left', borderRadius: 17, overflow: 'hidden', boxShadow: '0 30px 90px rgba(17,27,51,.20)', border: `1px solid ${COLORS.border}`}}>
          <Img src={staticFile('textures/result-panel.png')} style={{width: 697, height: 1097, display: 'block'}} />
          <div style={{position: 'absolute', left: 20, top: 530, right: 20, height: 195, border: `5px solid ${COLORS.blue}`, borderRadius: 12, boxShadow: `0 0 0 8px rgba(30,64,175,.11), 0 0 55px rgba(30,64,175,.24)`, opacity: answerGlow}} />
        </div>
      </AbsoluteFill>

      <SectionLabel eyebrow="02 · GROUNDED ANSWER" title="检索有依据，引用可追溯" />

      <div style={{position: 'absolute', left: 70, top: 220, width: 790, opacity: allowIn}}>
        <div style={{fontFamily: FONTS.mono, fontSize: 22, letterSpacing: '.14em', color: COLORS.green, fontWeight: 900, marginBottom: 20}}>CITATION ALLOWLIST</div>
        <div style={{display: 'grid', gap: 16}}>
          {sources.map((source, index) => {
            const cue = 185 + index * 42;
            const t = interpolate(frame, [cue, cue + 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2, 1.12, .3, 1)});
            const press = interpolate(frame, [cue + 23, cue + 27, cue + 31], [1, .988, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div key={source.id} style={{borderRadius: 15, border: `2px solid ${COLORS.border}`, background: 'rgba(255,255,255,.96)', padding: '20px 24px', boxShadow: '0 16px 40px rgba(17,27,51,.10)', opacity: t, transform: `translateY(${(1 - t) * -110}px) rotateX(${(1 - t) * 14}deg) scale(${press})`}}>
                <div style={{display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'center'}}>
                  <span style={{fontFamily: FONTS.mono, fontSize: 24, color: COLORS.blue, fontWeight: 900}}>{source.id}</span>
                  <strong style={{fontFamily: FONTS.mono, fontSize: 28, color: COLORS.green}}>{source.score}</strong>
                </div>
                <div style={{fontFamily: FONTS.body, fontSize: 34, color: COLORS.ink, fontWeight: 900, marginTop: 9}}>{source.title}</div>
                <div style={{fontFamily: FONTS.body, fontSize: 24, color: COLORS.muted, marginTop: 5}}>{source.section}</div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 12, borderRadius: 999, background: COLORS.blueWash, color: COLORS.blue, padding: '12px 20px', fontFamily: FONTS.mono, fontSize: 22, fontWeight: 900}}>
          <span style={{width: 11, height: 11, borderRadius: '50%', background: COLORS.green}} />
          CLASS-AWARE RERANK
        </div>
      </div>

      {frame >= 560 ? (
        <div style={{position: 'absolute', left: 76, top: 700, width: 770, borderRadius: 15, border: `3px solid ${COLORS.red}`, background: '#fff7f6', padding: '22px 25px', opacity: invalidIn, transform: `translateY(${(1 - invalidIn) * 35}px)`}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20}}>
            <div>
              <div style={{fontFamily: FONTS.mono, color: COLORS.red, fontSize: 22, fontWeight: 900}}>KB-FAKE-999</div>
              <div style={{fontFamily: FONTS.body, color: COLORS.ink, fontSize: 34, fontWeight: 900, marginTop: 6}}>伪造引用被拒绝</div>
            </div>
            <div style={{fontFamily: FONTS.mono, fontSize: 64, color: COLORS.red, fontWeight: 900}}>×</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
