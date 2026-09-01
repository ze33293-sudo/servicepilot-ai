import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import narrationSegments from '../../narration/segments.json';
import {FlashCut, NarrationCaption, PaperTitleCard} from './Common';
import {SceneClassification} from './SceneClassification';
import {SceneOpen} from './SceneOpen';
import {SceneOutcome} from './SceneOutcome';
import {SceneRag} from './SceneRag';
import {SceneSafety} from './SceneSafety';
import {SceneTools} from './SceneTools';
import {SHOTS, TOTAL_FRAMES} from './timeline';

export {TOTAL_FRAMES};

type SoundCue = {from: number; src: string; volume: number; duration?: number};

const SFX: SoundCue[] = [
  {from: SHOTS.open.from + 18, src: 'transition-soft.mp3', volume: .34},
  {from: SHOTS.open.from + 150, src: 'whoosh-fast.mp3', volume: .42},
  {from: SHOTS.open.from + 225, src: 'whoosh-big.mp3', volume: .46},
  {from: SHOTS.open.from + 250, src: 'sparkle.mp3', volume: .25, duration: 120},
  {from: SHOTS.open.from + 330, src: 'transition-snap.mp3', volume: .42},
  {from: SHOTS.classificationTitle.from, src: 'swoosh-quick.mp3', volume: .34},
  {from: SHOTS.classification.from + 42, src: 'transition-soft.mp3', volume: .34},
  {from: SHOTS.classification.from + 95, src: 'whoosh-fast.mp3', volume: .33},
  {from: SHOTS.classification.from + 170, src: 'transition-snap.mp3', volume: .42},
  {from: SHOTS.classification.from + 305, src: 'click-camera.mp3', volume: .46},
  {from: SHOTS.classification.from + 450, src: 'whoosh-fast.mp3', volume: .30},
  {from: SHOTS.classification.from + 680, src: 'whoosh-big.mp3', volume: .38},
  {from: SHOTS.rag.from + 5, src: 'transition-soft.mp3', volume: .36},
  {from: SHOTS.rag.from + 185, src: 'whoosh-fast.mp3', volume: .34},
  {from: SHOTS.rag.from + 228, src: 'whoosh-fast.mp3', volume: .28},
  {from: SHOTS.rag.from + 260, src: 'sparkle.mp3', volume: .24, duration: 120},
  {from: SHOTS.rag.from + 590, src: 'transition-snap.mp3', volume: .42},
  {from: SHOTS.toolsTitle.from, src: 'swoosh-quick.mp3', volume: .34},
  {from: SHOTS.tools.from + 40, src: 'whoosh-big.mp3', volume: .42},
  {from: SHOTS.tools.from + 110, src: 'transition-soft.mp3', volume: .32},
  {from: SHOTS.tools.from + 180, src: 'transition-soft.mp3', volume: .28},
  {from: SHOTS.tools.from + 350, src: 'click-camera.mp3', volume: .48},
  {from: SHOTS.tools.from + 450, src: 'whoosh-fast.mp3', volume: .34},
  {from: SHOTS.tools.from + 585, src: 'transition-snap.mp3', volume: .43},
  {from: SHOTS.safetyTitle.from, src: 'swoosh-quick.mp3', volume: .34},
  {from: SHOTS.safety.from + 8, src: 'transition-soft.mp3', volume: .36},
  {from: SHOTS.safety.from + 120, src: 'impact-cine.mp3', volume: .35, duration: 130},
  {from: SHOTS.safety.from + 255, src: 'whoosh-big.mp3', volume: .43},
  {from: SHOTS.safety.from + 430, src: 'transition-snap.mp3', volume: .38},
  {from: SHOTS.safety.from + 600, src: 'whoosh-fast.mp3', volume: .40},
  {from: SHOTS.safety.from + 685, src: 'click-camera.mp3', volume: .46},
  {from: SHOTS.outcomeTitle.from, src: 'swoosh-quick.mp3', volume: .34},
  {from: SHOTS.outcome.from + 8, src: 'transition-soft.mp3', volume: .36},
  {from: SHOTS.outcome.from + 70, src: 'impact-cine.mp3', volume: .38, duration: 130},
  {from: SHOTS.outcome.from + 450, src: 'whoosh-fast.mp3', volume: .36},
  {from: SHOTS.outcome.from + 485, src: 'click-camera.mp3', volume: .46},
  {from: SHOTS.outcome.from + 690, src: 'whoosh-big.mp3', volume: .42},
  {from: SHOTS.outcome.from + 820, src: 'riser-cine.mp3', volume: .46, duration: 150},
  {from: SHOTS.outcome.from + 875, src: 'impact-cine.mp3', volume: .56, duration: 115},
  {from: SHOTS.outcome.from + 920, src: 'sparkle.mp3', volume: .30, duration: 70},
];

const CUTS = [
  SHOTS.classificationTitle.from,
  SHOTS.classification.from,
  SHOTS.rag.from,
  SHOTS.toolsTitle.from,
  SHOTS.tools.from,
  SHOTS.safetyTitle.from,
  SHOTS.safety.from,
  SHOTS.outcomeTitle.from,
  SHOTS.outcome.from,
];

export const ServicePilotMain: React.FC = () => (
  <AbsoluteFill style={{background: '#f2eee6'}}>
    {narrationSegments.map((segment, index) => {
      const from = Math.round(segment.from * 30);
      const duration = Math.round((segment.to - segment.from) * 30);
      return (
        <Sequence key={`voice-${index}`} from={from} durationInFrames={duration}>
          <Audio src={staticFile(`audio/narration-${String(index + 1).padStart(2, '0')}.wav`)} volume={.96} />
        </Sequence>
      );
    })}
    {SFX.map((sound, index) => (
      <Sequence key={`sfx-${index}`} from={sound.from} durationInFrames={sound.duration ?? 90}>
        <Audio src={staticFile(`audio/${sound.src}`)} volume={sound.volume} />
      </Sequence>
    ))}

    <Sequence from={SHOTS.open.from} durationInFrames={SHOTS.open.duration}><SceneOpen /></Sequence>
    <Sequence from={SHOTS.classificationTitle.from} durationInFrames={SHOTS.classificationTitle.duration}>
      <PaperTitleCard duration={SHOTS.classificationTitle.duration} kicker="AUTOMATIC TRIAGE" words={[{text: '分类、'}, {text: '优先级'}, {text: '与信息抽取', accent: true}]} />
    </Sequence>
    <Sequence from={SHOTS.classification.from} durationInFrames={SHOTS.classification.duration}><SceneClassification /></Sequence>
    <Sequence from={SHOTS.rag.from} durationInFrames={SHOTS.rag.duration}><SceneRag /></Sequence>
    <Sequence from={SHOTS.toolsTitle.from} durationInFrames={SHOTS.toolsTitle.duration}>
      <PaperTitleCard duration={SHOTS.toolsTitle.duration} kicker="AGENT TOOLS" words={[{text: 'Agent'}, {text: '直接调用'}, {text: '工单 API', accent: true}]} />
    </Sequence>
    <Sequence from={SHOTS.tools.from} durationInFrames={SHOTS.tools.duration}><SceneTools /></Sequence>
    <Sequence from={SHOTS.safetyTitle.from} durationInFrames={SHOTS.safetyTitle.duration}>
      <PaperTitleCard duration={SHOTS.safetyTitle.duration} kicker="SAFETY BY DESIGN" words={[{text: '该自动化时自动化，'}, {text: '该转人工时转人工', accent: true}]} />
    </Sequence>
    <Sequence from={SHOTS.safety.from} durationInFrames={SHOTS.safety.duration}><SceneSafety /></Sequence>
    <Sequence from={SHOTS.outcomeTitle.from} durationInFrames={SHOTS.outcomeTitle.duration}>
      <PaperTitleCard duration={SHOTS.outcomeTitle.duration} kicker="MEASURABLE OUTCOME" words={[{text: '从错误到优化，'}, {text: '再到业务价值', accent: true}]} />
    </Sequence>
    <Sequence from={SHOTS.outcome.from} durationInFrames={SHOTS.outcome.duration}><SceneOutcome /></Sequence>

    {narrationSegments.map((segment, index) => {
      if (index === narrationSegments.length - 1) return null;
      const from = Math.round(segment.from * 30);
      const duration = Math.round((segment.to - segment.from) * 30);
      return (
        <Sequence key={`caption-${index}`} from={from} durationInFrames={duration}>
          <NarrationCaption text={segment.text} duration={duration} />
        </Sequence>
      );
    })}
    {CUTS.map((cut) => (
      <Sequence key={`cut-${cut}`} from={cut - 5} durationInFrames={10}><FlashCut duration={10} /></Sequence>
    ))}
  </AbsoluteFill>
);
