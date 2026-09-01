import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {COLORS, FONTS} from './theme';

export type CamKey = {
  frame: number;
  cx: number;
  cy: number;
  zoom: number;
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  persp?: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const PaperField: React.FC<{children?: React.ReactNode; dark?: boolean}> = ({children, dark = false}) => (
  <AbsoluteFill
    style={{
      backgroundColor: dark ? '#192033' : COLORS.paper,
      backgroundImage: dark
        ? 'radial-gradient(900px 620px at 50% 42%, rgba(49,88,212,.22), transparent 72%), repeating-linear-gradient(102deg, rgba(255,255,255,.016) 0 1px, transparent 1px 8px)'
        : 'radial-gradient(1100px 720px at 50% 42%, rgba(255,255,255,.88), transparent 68%), repeating-linear-gradient(96deg, rgba(17,27,51,.018) 0 1px, transparent 1px 7px)',
      color: dark ? '#f8fafc' : COLORS.ink,
      overflow: 'hidden',
    }}
  >
    {children}
  </AbsoluteFill>
);

export const PageCam: React.FC<{
  src: string;
  keys: CamKey[];
  children?: React.ReactNode;
  ease?: (value: number) => number;
  blur?: number;
  opacity?: number;
}> = ({src, keys, children, ease = Easing.bezier(0.33, 0, 0.15, 1), blur = 0, opacity = 1}) => {
  const frame = useCurrentFrame();
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let index = 0; index < keys.length - 1; index++) {
    if (frame >= keys[index].frame && frame <= keys[index + 1].frame) {
      a = keys[index];
      b = keys[index + 1];
      break;
    }
  }
  const t = a.frame === b.frame ? 1 : interpolate(frame, [a.frame, b.frame], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease,
  });
  const cx = lerp(a.cx, b.cx, t);
  const cy = lerp(a.cy, b.cy, t);
  const zoom = lerp(a.zoom, b.zoom, t);
  const rotX = lerp(a.rotX ?? 0, b.rotX ?? 0, t);
  const rotY = lerp(a.rotY ?? 0, b.rotY ?? 0, t);
  const rotZ = lerp(a.rotZ ?? 0, b.rotZ ?? 0, t);
  const persp = lerp(a.persp ?? 1500, b.persp ?? 1500, t);
  const has3d = keys.some((key) => key.rotX || key.rotY || key.rotZ);

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: COLORS.paperLight, opacity}}>
      <div style={{position: 'absolute', inset: 0, perspective: `${persp * zoom}px`, perspectiveOrigin: '960px 540px'}}>
        <div
          style={{
            position: 'absolute', width: 1920, height: 1080,
            zoom: has3d ? zoom : undefined,
            transform: has3d
              ? `translate(${960 / zoom - cx}px, ${540 / zoom - cy}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`
              : `translate(${960 - cx * zoom}px, ${540 - cy * zoom}px) scale(${zoom})`,
            transformOrigin: `${cx}px ${cy}px`,
            transformStyle: 'preserve-3d',
            filter: blur ? `blur(${blur}px)` : undefined,
          }}
        >
          <Img src={staticFile(src)} style={{position: 'absolute', width: 1920, height: 1080}} />
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PaperTitleCard: React.FC<{
  duration: number;
  words: {text: string; accent?: boolean}[];
  kicker: string;
}> = ({duration, words, kicker}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [duration - 8, duration], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const line = interpolate(frame, [18, 38], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <PaperField>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: fade}}>
        <div style={{maxWidth: 1540, textAlign: 'center'}}>
          <div style={{fontFamily: FONTS.mono, color: COLORS.blue, fontSize: 25, letterSpacing: '.18em', marginBottom: 30}}>{kicker}</div>
          <div style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: '.28em', fontFamily: FONTS.serif, fontSize: 96, fontWeight: 700, lineHeight: 1.16}}>
            {words.map((word, index) => {
              const delay = 3 + index * 3;
              const t = interpolate(frame, [delay, delay + 10], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.75, 0.3, 1),
              });
              return (
                <span key={`${word.text}-${index}`} style={{opacity: t, transform: `scale(${1.28 - .28 * t})`, filter: `blur(${(1 - t) * 7}px)`, color: word.accent ? COLORS.blue : COLORS.ink, fontStyle: word.accent ? 'italic' : 'normal'}}>
                  {word.text}
                </span>
              );
            })}
          </div>
          <div style={{width: 250, height: 7, borderRadius: 6, margin: '34px auto 0', background: COLORS.amber, transform: `scaleX(${line})`}} />
        </div>
      </AbsoluteFill>
    </PaperField>
  );
};

export const NarrationCaption: React.FC<{text: string; duration: number}> = ({text, duration}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const exit = interpolate(frame, [duration - 10, duration], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 140, right: 140, bottom: 48, display: 'flex', justifyContent: 'center', opacity: enter * exit, transform: `translateY(${(1 - enter) * 14}px)`, pointerEvents: 'none'}}>
      <div style={{maxWidth: 1640, padding: '18px 30px 20px', borderTop: `5px solid ${COLORS.blue}`, borderRadius: 10, background: 'rgba(251,248,242,.95)', boxShadow: '0 18px 50px rgba(17,27,51,.18)', color: COLORS.ink, fontFamily: FONTS.body, fontSize: 58, lineHeight: 1.35, fontWeight: 700, textAlign: 'center'}}>
        {text}
      </div>
    </div>
  );
};

export const SectionLabel: React.FC<{eyebrow: string; title: string; align?: 'left' | 'right'}> = ({eyebrow, title, align = 'left'}) => (
  <div style={{position: 'absolute', top: 58, [align]: 70, textAlign: align, zIndex: 20}}>
    <div style={{fontFamily: FONTS.mono, fontSize: 21, letterSpacing: '.17em', color: COLORS.blue, fontWeight: 800}}>{eyebrow}</div>
    <div style={{fontFamily: FONTS.serif, fontSize: 58, lineHeight: 1.1, color: COLORS.ink, fontWeight: 800, marginTop: 10}}>{title}</div>
  </div>
);

export const Callout: React.FC<{
  title: string;
  value: string;
  x: number;
  y: number;
  tone?: 'blue' | 'green' | 'red' | 'amber';
  progress?: number;
}> = ({title, value, x, y, tone = 'blue', progress = 1}) => {
  const color = tone === 'green' ? COLORS.green : tone === 'red' ? COLORS.red : tone === 'amber' ? COLORS.amber : COLORS.blue;
  return (
    <div style={{position: 'absolute', left: x, top: y, minWidth: 270, borderRadius: 16, border: `2px solid ${color}`, background: 'rgba(251,248,242,.96)', padding: '18px 22px', boxShadow: '0 18px 45px rgba(17,27,51,.16)', opacity: progress, transform: `translateY(${(1 - progress) * 28}px) scale(${.96 + .04 * progress})`, zIndex: 12}}>
      <div style={{fontFamily: FONTS.mono, fontSize: 20, letterSpacing: '.1em', color, fontWeight: 800}}>{title}</div>
      <div style={{fontFamily: FONTS.body, fontSize: 44, lineHeight: 1.2, color: COLORS.ink, fontWeight: 900, marginTop: 8}}>{value}</div>
    </div>
  );
};

export const FlashCut: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, Math.floor(duration / 2), duration], [0, .94, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#fffaf0', opacity, pointerEvents: 'none'}} />;
};
