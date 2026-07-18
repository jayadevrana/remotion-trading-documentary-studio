import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import reelAudioTiming from './reelAudioTiming.json';

type Highlight = {
  left: string;
  top: string;
  width: string;
  height: string;
  label?: string;
};

type VisualScene = {
  id: string;
  label: string;
  kicker: string;
  title: string;
  body: string;
  sourceStart: number;
  scaleFrom: number;
  scaleTo: number;
  focusFrom: [number, number];
  focusTo: [number, number];
  stats?: string[];
  highlights?: Highlight[];
};

type AudioScene = {
  id: string;
  audioFile: string;
  audioDurationSeconds: number;
  audioFrames: number;
  durationInFrames: number;
  caption: string;
  narration: string;
};

const VIDEO_PATH = staticFile('video/tradingview-clean.mp4');

const palette = {
  bg: '#07111b',
  panel: 'rgba(8, 17, 27, 0.80)',
  softPanel: 'rgba(10, 22, 34, 0.62)',
  mint: '#5AE0C2',
  teal: '#20C1AF',
  gold: '#F6C85B',
  coral: '#FF6A7A',
  text: '#F5F7FA',
  muted: 'rgba(245, 247, 250, 0.74)',
};

const visualScenes: VisualScene[] = [
  {
    id: 'hook',
    label: 'Opening Sequence',
    kicker: 'Gold • 15m',
    title: 'Chart segment with visible signals.',
    body: 'This opening segment keeps structure and target logic visible while price is moving.',
    sourceStart: 3300,
    scaleFrom: 1.38,
    scaleTo: 1.48,
    focusFrom: [77, 45],
    focusTo: [84, 46],
    highlights: [
      {left: '61%', top: '28%', width: '20%', height: '18%', label: 'Sell setup'},
      {left: '41%', top: '54%', width: '18%', height: '18%', label: 'Target hit'},
    ],
  },
  {
    id: 'authority',
    label: 'Overview',
    kicker: 'Chart logic on screen',
    title: 'Entries, structure, and targets stay visible.',
    body: 'This overview keeps the plotted entries, structure, and targets readable on screen.',
    sourceStart: 240,
    scaleFrom: 1.18,
    scaleTo: 1.26,
    focusFrom: [40, 46],
    focusTo: [47, 45],
    stats: ['Gold • 15m', 'On-chart structure', 'Targets on-screen'],
    highlights: [
      {left: '22%', top: '44%', width: '16%', height: '14%', label: 'Buy ladder'},
      {left: '40%', top: '22%', width: '20%', height: '18%', label: 'Trend push'},
    ],
  },
  {
    id: 'bullish',
    label: 'Bullish Run',
    kicker: 'Continuation clarity',
    title: 'Long confirmations keep stacking cleanly.',
    body: 'The frame stays focused on the trend build so the movement remains easy to follow.',
    sourceStart: 240,
    scaleFrom: 1.24,
    scaleTo: 1.34,
    focusFrom: [35, 46],
    focusTo: [43, 44],
    highlights: [
      {left: '18%', top: '52%', width: '14%', height: '14%', label: 'Buy'},
      {left: '38%', top: '24%', width: '16%', height: '18%', label: 'Higher high'},
      {left: '53%', top: '35%', width: '14%', height: '15%', label: 'Continuation'},
    ],
  },
  {
    id: 'bearish',
    label: 'Bearish Shift',
    kicker: 'Momentum flips fast',
    title: 'Short marker. Breakdown. Target print.',
    body: 'The focus stays tight on the down move so the sequence remains easy to read.',
    sourceStart: 1020,
    scaleFrom: 1.26,
    scaleTo: 1.36,
    focusFrom: [76, 48],
    focusTo: [83, 50],
    highlights: [
      {left: '36%', top: '24%', width: '14%', height: '14%', label: 'Short'},
      {left: '49%', top: '40%', width: '17%', height: '22%', label: 'Breakdown'},
      {left: '57%', top: '68%', width: '14%', height: '12%', label: 'Target'},
    ],
  },
  {
    id: 'report',
    label: 'Report',
    kicker: 'Visible strategy report',
    title: 'Only the numbers visible in the recording.',
    body: 'This segment holds on the report panel and quotes only the metrics visible in the recording.',
    sourceStart: 5940,
    scaleFrom: 1.08,
    scaleTo: 1.14,
    focusFrom: [52, 34],
    focusTo: [52, 40],
    stats: ['122 closed trades', '72.95% profitable', '3.25 profit factor'],
    highlights: [{left: '10%', top: '26%', width: '80%', height: '34%', label: 'Strategy report'}],
  },
  {
    id: 'cta',
    label: 'Closing View',
    kicker: 'Trade list on screen',
    title: 'The recorded trade list remains on screen.',
    body: 'This ending stays tied to the source footage.',
    sourceStart: 6480,
    scaleFrom: 1.1,
    scaleTo: 1.16,
    focusFrom: [50, 40],
    focusTo: [54, 46],
    highlights: [{left: '11%', top: '30%', width: '78%', height: '48%', label: 'Trade list'}],
  },
];

const timingById = Object.fromEntries(
  (reelAudioTiming.scenes as AudioScene[]).map((scene) => [scene.id, scene])
) as Record<string, AudioScene>;

const scenes = visualScenes.map((scene) => ({
  ...scene,
  ...timingById[scene.id],
}));

const totalDuration = scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);

const cumulativeStarts = scenes.reduce<number[]>((acc, scene, index) => {
  if (index === 0) {
    acc.push(0);
    return acc;
  }

  acc.push(acc[index - 1] + scenes[index - 1].durationInFrames);
  return acc;
}, []);

const Background: React.FC<{scene: VisualScene & AudioScene; progress: number}> = ({scene, progress}) => {
  const focusX = interpolate(progress, [0, 1], [scene.focusFrom[0], scene.focusTo[0]], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const focusY = interpolate(progress, [0, 1], [scene.focusFrom[1], scene.focusTo[1]], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const blurScale = interpolate(progress, [0, 1], [1.12, 1.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: [
          'radial-gradient(circle at 18% 16%, rgba(90,224,194,0.22), transparent 26%)',
          'radial-gradient(circle at 82% 18%, rgba(246,200,91,0.16), transparent 22%)',
          'radial-gradient(circle at 50% 82%, rgba(255,106,122,0.13), transparent 28%)',
          'linear-gradient(180deg, #09121b 0%, #03070c 100%)',
        ].join(','),
      }}
    >
      <OffthreadVideo
        src={VIDEO_PATH}
        startFrom={scene.sourceStart}
        endAt={scene.sourceStart + scene.durationInFrames}
        muted
        style={{
          position: 'absolute',
          inset: -120,
          width: 'calc(100% + 240px)',
          height: 'calc(100% + 240px)',
          objectFit: 'cover',
          objectPosition: `${focusX}% ${focusY}%`,
          filter: 'blur(42px) saturate(1.05)',
          opacity: 0.34,
          transform: `scale(${blurScale})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(4,8,12,0.24) 0%, rgba(4,8,12,0.20) 20%, rgba(4,8,12,0.60) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const TitleCard: React.FC<{scene: VisualScene & AudioScene; progress: number}> = ({scene, progress}) => {
  const entrance = spring({
    fps: 60,
    frame: progress * 60,
    config: {damping: 180, stiffness: 160},
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 74,
        right: 74,
        top: 82,
        padding: '28px 30px',
        borderRadius: 34,
        background: 'linear-gradient(180deg, rgba(8,17,27,0.92), rgba(8,17,27,0.62))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
        transform: `translateY(${interpolate(entrance, [0, 1], [24, 0])}px)`,
        opacity: entrance,
      }}
    >
      <div
        style={{
          fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
          fontSize: 22,
          fontWeight: 760,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: palette.mint,
          marginBottom: 12,
        }}
      >
        {scene.kicker}
      </div>
      <div
        style={{
          fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
          fontSize: 72,
          lineHeight: 1.03,
          fontWeight: 800,
          color: palette.text,
          marginBottom: 16,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          fontFamily: '"Avenir Next", "SF Pro Text", "Helvetica Neue", sans-serif',
          fontSize: 28,
          lineHeight: 1.34,
          color: palette.muted,
        }}
      >
        {scene.body}
      </div>
    </div>
  );
};

const HighlightBox: React.FC<{highlight: Highlight; sceneFrame: number}> = ({highlight, sceneFrame}) => {
  const reveal = spring({
    fps: 60,
    frame: sceneFrame - 10,
    config: {damping: 160, stiffness: 190},
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: highlight.left,
        top: highlight.top,
        width: highlight.width,
        height: highlight.height,
        borderRadius: 22,
        border: `2px solid ${palette.gold}`,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 0 28px rgba(246,200,91,0.35)',
        background: 'rgba(246,200,91,0.08)',
        opacity: reveal,
        transform: `scale(${interpolate(reveal, [0, 1], [0.92, 1])})`,
      }}
    >
      {highlight.label ? (
        <div
          style={{
            position: 'absolute',
            top: -18,
            left: 18,
            padding: '10px 14px',
            borderRadius: 999,
            background: palette.gold,
            color: palette.bg,
            fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
            fontSize: 18,
            fontWeight: 760,
            whiteSpace: 'nowrap',
          }}
        >
          {highlight.label}
        </div>
      ) : null}
    </div>
  );
};

const StatsStack: React.FC<{stats: string[]}> = ({stats}) => (
  <div
    style={{
      position: 'absolute',
      left: 74,
      right: 74,
      bottom: 288,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}
  >
    {stats.map((stat, index) => (
      <div
        key={`${stat}-${index}`}
        style={{
          padding: '18px 22px',
          borderRadius: 24,
          background: index === 0 ? 'rgba(10, 22, 34, 0.88)' : palette.panel,
          border: '1px solid rgba(255,255,255,0.08)',
          color: palette.text,
          fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
          fontSize: 30,
          fontWeight: 760,
          lineHeight: 1.18,
          boxShadow: '0 16px 40px rgba(0,0,0,0.20)',
        }}
      >
        {stat}
      </div>
    ))}
  </div>
);

const CaptionBar: React.FC<{caption: string}> = ({caption}) => (
  <div
    style={{
      position: 'absolute',
      left: 56,
      right: 56,
      bottom: 48,
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    <div
      style={{
        maxWidth: 920,
        padding: '18px 24px',
        borderRadius: 28,
        background: 'rgba(7, 14, 23, 0.86)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
        color: palette.text,
        fontFamily: '"Avenir Next", "SF Pro Text", "Helvetica Neue", sans-serif',
        fontSize: 28,
        fontWeight: 680,
        lineHeight: 1.3,
        textAlign: 'center',
      }}
    >
      {caption}
    </div>
  </div>
);

const ReelScene: React.FC<{scene: VisualScene & AudioScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const progress = durationInFrames <= 1 ? 0 : frame / Math.max(durationInFrames - 1, 1);
  const scale = interpolate(progress, [0, 1], [scene.scaleFrom, scene.scaleTo], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const focusX = interpolate(progress, [0, 1], [scene.focusFrom[0], scene.focusTo[0]], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const focusY = interpolate(progress, [0, 1], [scene.focusFrom[1], scene.focusTo[1]], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fade = interpolate(frame, [0, 16, durationInFrames - 18, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Background scene={scene} progress={progress} />
      <Audio src={staticFile(scene.audioFile)} />
      <div
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          top: 178,
          bottom: 168,
          borderRadius: 52,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(255,255,255,0.04)',
          background: '#fff',
        }}
      >
        <OffthreadVideo
          src={VIDEO_PATH}
          startFrom={scene.sourceStart}
          endAt={scene.sourceStart + scene.durationInFrames}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${focusX}% ${focusY}%`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6, 12, 18, 0.18) 0%, rgba(6, 12, 18, 0.06) 28%, rgba(6, 12, 18, 0.14) 100%)',
          }}
        />
        {scene.highlights?.map((highlight) => (
          <HighlightBox
            key={`${scene.id}-${highlight.left}-${highlight.top}`}
            highlight={highlight}
            sceneFrame={frame}
          />
        ))}
      </div>
      <TitleCard scene={scene} progress={progress} />
      {scene.stats ? <StatsStack stats={scene.stats} /> : null}
      <CaptionBar caption={scene.caption} />
    </AbsoluteFill>
  );
};

export const TradingStrategyReel: React.FC = () => {
  return (
    <AbsoluteFill style={{background: palette.bg}}>
      {scenes.map((scene, index) => (
        <Sequence key={scene.id} from={cumulativeStarts[index]} durationInFrames={scene.durationInFrames}>
          <ReelScene scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
