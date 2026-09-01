import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Callout, PageCam, PaperField} from './Common';
import {COLORS, FONTS} from './theme';

const WORDMARK = 'ServicePilot AI';

export const SceneOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const vertical = interpolate(frame, [0, 15], [100, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const horizontal = interpolate(frame, [12, 28], [100, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const crossFade = interpolate(frame, [34, 48], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const brandOut = interpolate(frame, [145, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const pageIn = interpolate(frame, [150, 182], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const spotlight = interpolate(frame, [200, 230], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const callout = interpolate(frame, [238, 260], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

  return (
    <PaperField>
      {frame >= 150 ? (
        <AbsoluteFill style={{opacity: pageIn}}>
          <PageCam
            src="textures/intake-full.png"
            keys={[
              {frame: 150, cx: 960, cy: 540, zoom: .86, rotX: 0, rotY: 0, rotZ: 0},
              {frame: 205, cx: 960, cy: 540, zoom: .92, rotX: 1, rotY: 0, rotZ: 0},
              {frame: 255, cx: 1435, cy: 545, zoom: 1.28, rotX: 5, rotY: -13, rotZ: -1, persp: 1450},
              {frame: 350, cx: 1435, cy: 545, zoom: 1.28, rotX: 5, rotY: -13, rotZ: -1, persp: 1450},
            ]}
          >
            <div style={{position: 'absolute', left: 1070, top: 295, width: 742, height: 760, borderRadius: 18, border: `5px solid ${COLORS.blue}`, boxShadow: `0 0 0 8px rgba(30,64,175,.10), 0 30px 90px rgba(17,27,51,.25)`, opacity: spotlight, transform: 'translateZ(45px)', pointerEvents: 'none'}} />
          </PageCam>
          <AbsoluteFill style={{background: `radial-gradient(540px 380px at 74% 49%, rgba(255,255,255,.08), rgba(17,27,51,${.38 * spotlight}) 100%)`, pointerEvents: 'none'}} />
          <Callout title="LOCAL FIRST" value="本地运行 · 确定性降级" x={92} y={790} tone="green" progress={callout} />
        </AbsoluteFill>
      ) : null}

      {frame < 172 ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 1 - brandOut, transform: `translateY(${-35 * brandOut}px) scale(${1 - .08 * brandOut})`}}>
          <div style={{textAlign: 'center'}}>
            <svg width="92" height="92" viewBox="0 0 92 92" style={{display: 'block', margin: '0 auto 34px', opacity: crossFade}}>
              <line x1="46" y1="4" x2="46" y2="88" stroke={COLORS.blue} strokeWidth="7" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={vertical} />
              <line x1="4" y1="46" x2="88" y2="46" stroke={COLORS.blue} strokeWidth="7" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={horizontal} />
            </svg>
            <div style={{display: 'flex', justifyContent: 'center', fontFamily: FONTS.serif, fontSize: 132, fontWeight: 800, letterSpacing: '-.03em', color: COLORS.ink, whiteSpace: 'pre'}}>
              {WORDMARK.split('').map((letter, index) => {
                const delay = 18 + index * 4;
                const t = interpolate(frame, [delay, delay + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2, .75, .3, 1)});
                return <span key={`${letter}-${index}`} style={{display: 'inline-block', opacity: t, transform: `scale(${1.55 - .55 * t})`, transformOrigin: 'center bottom', filter: `blur(${(1 - t) * 7}px)`}}>{letter}</span>;
              })}
            </div>
            <div style={{marginTop: 30, fontFamily: FONTS.mono, fontSize: 27, letterSpacing: '.18em', color: COLORS.blue, fontWeight: 800}}>ENTERPRISE SUPPORT AGENT</div>
            <div style={{width: 280, height: 7, margin: '32px auto 0', borderRadius: 8, background: COLORS.amber}} />
          </div>
        </AbsoluteFill>
      ) : null}
    </PaperField>
  );
};
