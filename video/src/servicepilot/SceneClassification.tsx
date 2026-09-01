import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Callout, PageCam, SectionLabel} from './Common';
import {COLORS, FONTS} from './theme';

const categories = ['退款退货', '物流配送', '设备故障', '账号激活', '支付发票', '投诉建议'];
const fields = [
  ['订单号', 'ORD-20260831011'],
  ['金额', '399 元'],
  ['问题时间', '未识别'],
  ['客户情绪', 'neutral'],
  ['联系方式', '已脱敏'],
];

export const SceneClassification: React.FC = () => {
  const frame = useCurrentFrame();
  const labelIn = interpolate(frame, [15, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const negationIn = interpolate(frame, [650, 680], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

  return (
    <AbsoluteFill style={{background: COLORS.paperLight}}>
      <PageCam
        src="textures/intake-full.png"
        keys={[
          {frame: 0, cx: 960, cy: 540, zoom: .86},
          {frame: 110, cx: 650, cy: 560, zoom: 1.18},
          {frame: 250, cx: 650, cy: 560, zoom: 1.18},
          {frame: 360, cx: 1445, cy: 500, zoom: 1.32},
          {frame: 520, cx: 1445, cy: 500, zoom: 1.32},
          {frame: 650, cx: 1445, cy: 730, zoom: 1.28},
          {frame: 840, cx: 1445, cy: 680, zoom: 1.16},
          {frame: 900, cx: 1445, cy: 680, zoom: 1.16},
        ]}
      />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(242,238,230,.93) 0%, rgba(242,238,230,.30) 40%, transparent 70%)', pointerEvents: 'none'}} />
      <SectionLabel eyebrow="01 · TRIAGE" title="先理解，再行动" />

      <div style={{position: 'absolute', left: 72, top: 220, width: 690, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, opacity: labelIn}}>
        {categories.map((category, index) => {
          const cue = 55 + index * 14;
          const t = interpolate(frame, [cue, cue + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2, .9, .3, 1.08)});
          const selected = index === 0 && frame >= 175;
          return (
            <div key={category} style={{height: 82, display: 'grid', placeItems: 'center', borderRadius: 14, border: `2px solid ${selected ? COLORS.blue : COLORS.border}`, background: selected ? COLORS.blue : 'rgba(255,255,255,.94)', color: selected ? 'white' : COLORS.ink, fontFamily: FONTS.body, fontSize: 31, fontWeight: 800, opacity: t * (frame > 205 && !selected ? .28 : 1), transform: `translateY(${(1 - t) * 80}px) rotate(${(index % 2 ? 1 : -1) * (1 - t) * 3}deg) scale(${selected ? 1.04 : 1})`, boxShadow: selected ? '0 20px 48px rgba(30,64,175,.24)' : '0 10px 24px rgba(17,27,51,.08)'}}>
              {category}
            </div>
          );
        })}
      </div>

      {frame >= 300 ? (
        <>
          <Callout title="CATEGORY" value="退款退货" x={82} y={230} tone="blue" progress={interpolate(frame, [300, 325], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
          <Callout title="PRIORITY" value="P2" x={82} y={400} tone="amber" progress={interpolate(frame, [330, 355], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
          <Callout title="CONFIDENCE" value="98%" x={82} y={570} tone="green" progress={interpolate(frame, [360, 385], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        </>
      ) : null}

      {frame >= 430 ? (
        <div style={{position: 'absolute', left: 74, top: 230, width: 620, display: 'grid', gap: 12}}>
          {fields.map(([label, value], index) => {
            const cue = 450 + index * 28;
            const t = interpolate(frame, [cue, cue + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.25, .8, .25, 1)});
            return (
              <div key={label} style={{display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', borderRadius: 12, border: `1px solid ${COLORS.border}`, background: 'rgba(255,255,255,.95)', padding: '16px 20px', boxShadow: '0 10px 26px rgba(17,27,51,.08)', opacity: t, transform: `translateY(${(1 - t) * -70}px) rotateX(${(1 - t) * 12}deg)`}}>
                <span style={{fontFamily: FONTS.mono, fontSize: 20, color: COLORS.muted, letterSpacing: '.08em'}}>{label}</span>
                <strong style={{fontFamily: FONTS.body, fontSize: 30, color: COLORS.ink}}>{value}</strong>
              </div>
            );
          })}
        </div>
      ) : null}

      {frame >= 630 ? (
        <div style={{position: 'absolute', left: 70, top: 230, width: 790, borderRadius: 18, border: `2px solid ${COLORS.blue}`, background: 'rgba(251,248,242,.97)', padding: '28px 32px', boxShadow: '0 24px 70px rgba(17,27,51,.20)', opacity: negationIn, transform: `translateY(${(1 - negationIn) * 40}px)`}}>
          <div style={{fontFamily: FONTS.mono, fontSize: 21, letterSpacing: '.15em', color: COLORS.blue, marginBottom: 20}}>NEGATION + TURN</div>
          <div style={{fontFamily: FONTS.serif, fontSize: 49, lineHeight: 1.42, fontWeight: 800}}>
            <span style={{color: COLORS.red, textDecoration: 'line-through', textDecorationThickness: 5}}>不是物流问题</span>
            <br />
            <span style={{color: COLORS.blue}}>而是退款一直没到账</span>
          </div>
          <div style={{height: 7, width: `${interpolate(frame, [680, 730], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, marginTop: 25, borderRadius: 8, background: COLORS.amber}} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
