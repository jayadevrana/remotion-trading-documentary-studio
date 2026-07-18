import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import stockMarketEnglishAudioTiming from './stockMarketEnglishAudioTiming.json';

type DocumentaryScene = {
  id: string;
  title: string;
  caption: string;
  kicker: string;
  visualMode: string;
  audioFile: string;
  audioDurationSeconds: number;
  durationInFrames: number;
  startFrame: number;
  narration: string;
};

const scenes = stockMarketEnglishAudioTiming.scenes as DocumentaryScene[];

const palette = {
  bg: '#04070b',
  panel: 'rgba(8, 13, 18, 0.8)',
  text: '#f2ede5',
  muted: 'rgba(242,237,229,0.74)',
  gold: '#d3b174',
  red: '#c76c6c',
  green: '#79d8a6',
};

const panelPath = (sceneId: string, panel: number) =>
  staticFile(`images/stock-market-english/${sceneId}-${panel}.png`);

const Grain: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      opacity: 0.1,
      mixBlendMode: 'screen',
      backgroundImage:
        'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0 1px, transparent 1px), radial-gradient(circle at 72% 60%, rgba(255,255,255,0.12) 0 1px, transparent 1px)',
      backgroundSize: '120px 120px, 180px 180px',
    }}
  />
);

const HeaderCard: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const entrance = spring({
    fps: 30,
    frame: progress * 30,
    config: {damping: 200, stiffness: 170},
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        top: 62,
        width: 760,
        padding: '22px 28px',
        borderRadius: 28,
        background: 'linear-gradient(180deg, rgba(8,13,18,0.88), rgba(8,13,18,0.54))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        transform: `translateY(${interpolate(entrance, [0, 1], [24, 0])}px)`,
        opacity: entrance,
      }}
    >
      <div
        style={{
          color: palette.gold,
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
          fontSize: 16,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        {scene.kicker}
      </div>
      <div
        style={{
          color: palette.text,
          fontFamily: '"Iowan Old Style", Georgia, serif',
          fontSize: 50,
          lineHeight: 1.04,
          marginBottom: 14,
          textShadow: '0 8px 28px rgba(0,0,0,0.42)',
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          color: palette.muted,
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
          fontSize: 24,
          lineHeight: 1.28,
        }}
      >
        {scene.caption}
      </div>
    </div>
  );
};

const BottomLine: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const opacity = interpolate(progress, [0, 0.08, 0.9, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 72,
        bottom: 50,
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          padding: '14px 24px',
          borderRadius: 999,
          background: 'rgba(8,13,18,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: palette.text,
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
          fontSize: 22,
          letterSpacing: '0.01em',
        }}
      >
        {scene.caption}
      </div>
    </div>
  );
};

const AccentOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  if (scene.visualMode === 'kinetic') {
    const words = scene.caption.replace(/[.,]/g, '').split(' ').slice(0, 4);
    return (
      <div style={{position: 'absolute', inset: 0}}>
        {words.map((word, index) => {
          const enter = spring({
            fps: 30,
            frame: progress * 30 - index * 3,
            config: {damping: 20, stiffness: 110},
          });
          return (
            <div
              key={word}
              style={{
                position: 'absolute',
                left: 120 + (index % 2) * 520,
                top: 260 + index * 88,
                color: index % 2 === 0 ? palette.text : palette.red,
                fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
                fontSize: 58 - index * 4,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                opacity: enter,
                transform: `translateX(${interpolate(enter, [0, 1], [-36, 0])}px)`,
                textShadow: '0 10px 24px rgba(0,0,0,0.42)',
              }}
            >
              {word}
            </div>
          );
        })}
      </div>
    );
  }

  if (scene.visualMode === 'calm') {
    const enter = spring({
      fps: 30,
      frame: progress * 30,
      config: {damping: 18, stiffness: 110},
    });
    return (
      <div
        style={{
          position: 'absolute',
          right: 110,
          bottom: 170,
          display: 'flex',
          gap: 16,
          opacity: enter,
        }}
      >
        {['Process', 'Size', 'Patience'].map((label, index) => (
          <div
            key={label}
            style={{
              padding: '16px 20px',
              borderRadius: 999,
              background: 'rgba(8,13,18,0.72)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: index === 0 ? palette.gold : palette.text,
              fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
              fontSize: 22,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const SceneVisual: React.FC<{scene: DocumentaryScene; index: number}> = ({scene, index}) => {
  const frame = useCurrentFrame();
  const localFrame = frame;
  const progress = localFrame / Math.max(1, scene.durationInFrames);
  const panelIndex = Math.min(4, Math.floor((localFrame / Math.max(1, scene.durationInFrames)) * 5));
  const imageSrc = panelPath(scene.id, panelIndex + 1);
  const scale = interpolate(progress, [0, 1], [1.03 + (index % 3) * 0.01, 1.11 + (index % 2) * 0.01], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(progress, [0, 1], [-18 + (index % 5) * 3, 18 - (index % 4) * 3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(progress, [0, 1], [8 - (index % 3) * 3, -10 + (index % 5) * 2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: palette.bg}}>
      <Img
        src={imageSrc}
        style={{
          position: 'absolute',
          inset: -90,
          width: 'calc(100% + 180px)',
          height: 'calc(100% + 180px)',
          objectFit: 'cover',
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          filter: 'brightness(0.56) saturate(0.96) contrast(1.04)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(4,7,11,0.2) 0%, rgba(4,7,11,0.14) 28%, rgba(4,7,11,0.78) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 36,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 30,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset',
        }}
      />
      <HeaderCard scene={scene} progress={progress} />
      <AccentOverlay scene={scene} progress={progress} />
      <BottomLine scene={scene} progress={progress} />
      <Grain />
      <Audio src={staticFile(scene.audioFile)} />
    </AbsoluteFill>
  );
};

export const StockMarketEnglish150Documentary: React.FC = () => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const bedFade = interpolate(
    frame,
    [0, fps * 3, stockMarketEnglishAudioTiming.totalFrames - fps * 4, stockMarketEnglishAudioTiming.totalFrames],
    [0, 0.15, 0.15, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill style={{backgroundColor: palette.bg}}>
      <Audio src={staticFile('audio/stock-market-english-bed.wav')} volume={bedFade} />
      {scenes.map((scene, index) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames}>
          <SceneVisual scene={scene} index={index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
