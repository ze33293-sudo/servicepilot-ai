import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Callout, PageCam, SectionLabel} from './Common';
import {COLORS, FONTS} from './theme';

const metrics = [
  ['分类准确率', '100%'],
  ['优先级准确率', '100%'],
  ['信息抽取 F1', '100%'],
  ['引用命中率', '100%'],
  ['转人工召回率', '100%'],
  ['工具成功率', '100%'],
];

export const SceneSafety: React.FC = () => {
  const frame = useCurrentFrame();
  const sensitiveOpacity = interpolate(frame, [0, 24, 235, 280], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const confidenceOpacity = interpolate(frame, [235, 275, 415, 455], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const failureOpacity = interpolate(frame, [410, 450, 585, 625], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const evalOpacity = interpolate(frame, [580, 625, 1050], [0, 1, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const title = frame < 250 ? '风险场景，直接转人工' : frame < 430 ? '低置信度，拒绝自动闭环' : frame < 610 ? '工具失败，两次后停止重试' : '用固定评测验证系统';

  return (
    <AbsoluteFill style={{background: COLORS.paperLight}}>
      <AbsoluteFill style={{opacity: sensitiveOpacity}}>
        <PageCam
          src="textures/handoff-full.png"
          keys={[
            {frame: 0, cx: 960, cy: 540, zoom: .86},
            {frame: 120, cx: 1440, cy: 530, zoom: 1.25},
            {frame: 330, cx: 1440, cy: 530, zoom: 1.25},
          ]}
        />
        <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(242,238,230,.97), rgba(242,238,230,.72) 38%, transparent 68%)'}} />
        <Callout title="SENSITIVE" value="sensitive_safety" x={72} y={285} tone="red" progress={interpolate(frame, [55, 85], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        <Callout title="PRIORITY" value="P0" x={72} y={470} tone="red" progress={interpolate(frame, [90, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        <Callout title="ROUTE" value="awaiting_human" x={72} y={655} tone="amber" progress={interpolate(frame, [125, 155], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      </AbsoluteFill>

      <AbsoluteFill style={{opacity: confidenceOpacity}}>
        <PageCam
          src="textures/handoff-full.png"
          keys={[
            {frame: 235, cx: 960, cy: 540, zoom: .86},
            {frame: 330, cx: 1430, cy: 500, zoom: 1.18},
            {frame: 455, cx: 1430, cy: 500, zoom: 1.18},
          ]}
        />
        <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(242,238,230,.97), rgba(242,238,230,.72) 40%, transparent 69%)'}} />
        <div style={{position: 'absolute', left: 72, top: 275, width: 780, display: 'grid', gap: 18}}>
          <div style={{borderRadius: 18, border: `3px solid ${COLORS.amber}`, background: '#fff8e8', padding: '28px 32px', boxShadow: '0 20px 54px rgba(181,84,0,.14)'}}>
            <div style={{fontFamily: FONTS.mono, color: COLORS.amber, fontSize: 24, fontWeight: 900}}>CONFIDENCE GATE</div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 16, fontFamily: FONTS.mono}}>
              <strong style={{fontSize: 72, color: COLORS.red}}>61%</strong>
              <span style={{fontSize: 42, color: COLORS.muted}}>&lt;</span>
              <strong style={{fontSize: 54, color: COLORS.ink}}>72%</strong>
            </div>
          </div>
          <div style={{borderRadius: 18, border: `3px solid ${COLORS.blue}`, background: 'rgba(255,255,255,.97)', padding: '25px 32px'}}>
            <div style={{fontFamily: FONTS.mono, color: COLORS.blue, fontSize: 23, fontWeight: 900}}>DECISION</div>
            <div style={{fontFamily: FONTS.body, color: COLORS.ink, fontSize: 39, fontWeight: 900, marginTop: 10}}>awaiting_human</div>
            <div style={{fontFamily: FONTS.body, color: COLORS.muted, fontSize: 28, fontWeight: 700, marginTop: 8}}>reason: low_confidence</div>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{opacity: failureOpacity}}>
        <PageCam
          src="textures/failure-full.png"
          keys={[
            {frame: 310, cx: 960, cy: 540, zoom: .86},
            {frame: 430, cx: 1435, cy: 820, zoom: 1.18},
            {frame: 660, cx: 1435, cy: 820, zoom: 1.22},
          ]}
        />
        <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(242,238,230,.97), rgba(242,238,230,.70) 39%, transparent 68%)'}} />
        <div style={{position: 'absolute', left: 72, top: 300, width: 760, display: 'grid', gap: 16}}>
          {[
            ['ATTEMPT 01', 'retry', COLORS.amber],
            ['ATTEMPT 02', 'failed', COLORS.red],
            ['ROUTE', 'awaiting_human', COLORS.blue],
          ].map(([label, value, color], index) => {
            const cue = 450 + index * 48;
            const t = interpolate(frame, [cue, cue + 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2, 1.12, .3, 1)});
            return (
              <div key={label} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 15, border: `2px solid ${color}`, background: 'rgba(255,255,255,.96)', padding: '22px 26px', boxShadow: '0 16px 38px rgba(17,27,51,.12)', opacity: t, transform: `translateY(${(1 - t) * -80}px)`}}>
                <span style={{fontFamily: FONTS.mono, fontSize: 24, color, fontWeight: 900}}>{label}</span>
                <strong style={{fontFamily: FONTS.mono, fontSize: 34, color: COLORS.ink}}>{value}</strong>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{opacity: evalOpacity}}>
        <PageCam
          src="textures/insights-full.png"
          keys={[
            {frame: 580, cx: 960, cy: 540, zoom: .86},
            {frame: 700, cx: 700, cy: 530, zoom: 1.12},
            {frame: 1020, cx: 700, cy: 530, zoom: 1.12},
          ]}
        />
        <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(242,238,230,.94), rgba(242,238,230,.78) 45%, transparent 73%)'}} />
        <div style={{position: 'absolute', left: 72, top: 245, width: 820, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
          {metrics.map(([label, value], index) => {
            const cue = 635 + index * 28;
            const t = interpolate(frame, [cue, cue + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div key={label} style={{borderRadius: 14, border: `2px solid ${COLORS.border}`, background: 'rgba(255,255,255,.96)', padding: '17px 20px', opacity: t, transform: `translateY(${(1 - t) * 55}px)`, boxShadow: '0 12px 32px rgba(17,27,51,.09)'}}>
                <div style={{fontFamily: FONTS.body, fontSize: 25, color: COLORS.muted, fontWeight: 800}}>{label}</div>
                <div style={{fontFamily: FONTS.mono, fontSize: 43, color: COLORS.blue, fontWeight: 900, marginTop: 4}}>{value}</div>
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 72, top: 735, width: 820, borderRadius: 16, background: COLORS.blue, color: 'white', padding: '23px 28px', fontFamily: FONTS.body, fontSize: 37, fontWeight: 900, boxShadow: '0 20px 50px rgba(30,64,175,.25)'}}>
          40 / 40 固定评测 · 全部阈值通过
        </div>
      </AbsoluteFill>

      <SectionLabel eyebrow={frame < 610 ? '04 · HUMAN HANDOFF' : '05 · EVALUATION'} title={title} />
    </AbsoluteFill>
  );
};
