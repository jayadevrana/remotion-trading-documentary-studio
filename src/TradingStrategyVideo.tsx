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
import audioTiming from './audioTiming.json';

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
  sourceStart: number;
  zoomFrom: number;
  zoomTo: number;
  panFrom?: [number, number];
  panTo?: [number, number];
  title: string;
  body: string;
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

const visualScenes: VisualScene[] = [
  {
    id: 'hook',
    label: 'Opening Sequence',
    kicker: 'XAUUSD • 15m',
    sourceStart: 3300,
    zoomFrom: 1.06,
    zoomTo: 1.14,
    panFrom: [-2, -1],
    panTo: [-6, -2],
    title: 'Entries, targets, and structure on one chart.',
    body: 'This opening segment keeps the chart structure and target path visible while price is moving.',
    highlights: [
      {left: '46%', top: '20%', width: '17%', height: '20%', label: 'Sell signal'},
      {left: '50%', top: '50%', width: '10%', height: '18%', label: 'Target'},
    ],
  },
  {
    id: 'intro',
    label: 'Setup Overview',
    kicker: 'XAUUSD • 15m',
    sourceStart: 0,
    zoomFrom: 1.01,
    zoomTo: 1.05,
    panFrom: [-3, 0],
    panTo: [-5, -1],
    title: 'The chart keeps the trading logic visible.',
    body: 'Markers, structure labels, and target zones appear directly on the swings instead of being explained in the abstract.',
    highlights: [
      {left: '13%', top: '45%', width: '18%', height: '24%', label: 'Early reversal'},
      {left: '42%', top: '26%', width: '19%', height: '18%', label: 'Bullish ladder'},
    ],
  },
  {
    id: 'bull-run',
    label: 'Bullish Sequence',
    kicker: 'Long-side walkthrough',
    sourceStart: 240,
    zoomFrom: 1.04,
    zoomTo: 1.1,
    panFrom: [-4, -1],
    panTo: [-8, -2],
    title: 'Long markers keep stacking as price steps higher.',
    body: 'The continuation sequence stays readable because the callouts reinforce structure without crowding the chart.',
    highlights: [
      {left: '26%', top: '47%', width: '10%', height: '16%', label: 'Buy cluster'},
      {left: '52%', top: '24%', width: '16%', height: '17%', label: 'Breaks higher'},
      {left: '67%', top: '21%', width: '13%', height: '16%', label: 'Continuation'},
    ],
  },
  {
    id: 'bearish-shift',
    label: 'Reversal Sequence',
    kicker: 'Short-side takeover',
    sourceStart: 1020,
    zoomFrom: 1.03,
    zoomTo: 1.12,
    panFrom: [-1, -3],
    panTo: [-6, -4],
    title: 'When momentum flips, the short side takes over.',
    body: 'The sell marker, drive lower, and target print are framed as one continuous handoff.',
    highlights: [
      {left: '18%', top: '18%', width: '11%', height: '20%', label: 'Short trigger'},
      {left: '55%', top: '29%', width: '18%', height: '26%', label: 'Drive lower'},
      {left: '76%', top: '60%', width: '8%', height: '14%', label: 'Tgt2'},
    ],
  },
  {
    id: 'mixed-regime',
    label: 'Mixed Conditions',
    kicker: 'Not only one market type',
    sourceStart: 2220,
    zoomFrom: 1.02,
    zoomTo: 1.08,
    panFrom: [-2, -1],
    panTo: [-7, -2],
    title: 'The overlays still hold attention in choppier action.',
    body: 'This segment shows the overlays through less directional conditions as well.',
    highlights: [
      {left: '19%', top: '40%', width: '11%', height: '15%', label: 'Buy return'},
      {left: '48%', top: '16%', width: '13%', height: '17%', label: 'Trend push'},
      {left: '77%', top: '18%', width: '11%', height: '23%', label: 'Fresh sell'},
    ],
  },
  {
    id: 'report',
    label: 'Visible Report Data',
    kicker: 'Recorded report panel',
    sourceStart: 5940,
    zoomFrom: 1.0,
    zoomTo: 1.03,
    panFrom: [0, -1],
    panTo: [-2, -1],
    title: 'The visible report panel stays on screen.',
    body: 'Only the metrics visible in the recording are shown here.',
    stats: ['122 closed trades', '72.95% profitable', 'Profit factor 3.25'],
    highlights: [
      {left: '2%', top: '18%', width: '96%', height: '15%', label: 'Report header'},
      {left: '26%', top: '39%', width: '46%', height: '36%', label: 'Metrics panel'},
    ],
  },
  {
    id: 'cta',
    label: 'Closing View',
    kicker: 'Trade list on screen',
    sourceStart: 6480,
    zoomFrom: 1.0,
    zoomTo: 1.02,
    panFrom: [0, 0],
    panTo: [-1, 0],
    title: 'The recorded trade list remains on screen.',
    body: 'This keeps the ending tied to the source footage.',
    highlights: [{left: '4%', top: '26%', width: '92%', height: '50%', label: 'Trade list'}],
  },
];

const timingById = Object.fromEntries(
  (audioTiming.scenes as AudioScene[]).map((scene) => [scene.id, scene])
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

const palette = {
  panel: 'rgba(7, 17, 27, 0.78)',
  mint: '#5FE0C4',
  teal: '#2CC7B5',
  gold: '#F7C95E',
  text: '#F5F8FB',
  muted: 'rgba(245, 248, 251, 0.75)',
};

const frameStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 88,
  overflow: 'hidden',
  borderRadius: 28,
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 28px 90px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.04)',
  background: '#fff',
};

const Background: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: [
          'radial-gradient(circle at 18% 22%, rgba(44,199,181,0.22), transparent 28%)',
          'radial-gradient(circle at 83% 12%, rgba(247,201,94,0.14), transparent 20%)',
          'radial-gradient(circle at 68% 72%, rgba(255,90,122,0.16), transparent 24%)',
          'linear-gradient(180deg, #09131f 0%, #050b12 100%)',
        ].join(','),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.12,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          maskImage: 'radial-gradient(circle at center, black 42%, transparent 92%)',
        }}
      />
    </AbsoluteFill>
  );
};

const TitleBlock: React.FC<{scene: (VisualScene & AudioScene); progress: number}> = ({scene, progress}) => {
  const entrance = spring({
    fps: 60,
    frame: progress * 60,
    config: {damping: 200, stiffness: 180},
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 118,
        top: 112,
        width: 650,
        padding: '22px 26px',
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(7,17,27,0.84), rgba(7,17,27,0.58))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        transform: `translateY(${interpolate(entrance, [0, 1], [20, 0])}px)`,
        opacity: entrance,
      }}
    >
      <div
        style={{
          fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
          fontSize: 18,
          fontWeight: 700,
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
          fontSize: 56,
          lineHeight: 1.04,
          fontWeight: 750,
          color: palette.text,
          marginBottom: 14,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          fontFamily: '"Avenir Next", "SF Pro Text", "Helvetica Neue", sans-serif',
          fontSize: 24,
          lineHeight: 1.42,
          color: palette.muted,
        }}
      >
        {scene.body}
      </div>
    </div>
  );
};

const SceneBadge: React.FC<{label: string}> = ({label}) => {
  return (
    <div
      style={{
        position: 'absolute',
        right: 118,
        top: 112,
        padding: '16px 22px',
        borderRadius: 999,
        background: 'rgba(7, 17, 27, 0.78)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.24)',
        color: palette.text,
        fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
};

const HighlightBox: React.FC<{highlight: Highlight; sceneFrame: number}> = ({highlight, sceneFrame}) => {
  const reveal = spring({
    fps: 60,
    frame: sceneFrame - 8,
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
        borderRadius: 18,
        border: `2px solid ${palette.gold}`,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 0 28px rgba(247,201,94,0.35)',
        background: 'rgba(247,201,94,0.06)',
        transform: `scale(${interpolate(reveal, [0, 1], [0.92, 1])})`,
        opacity: reveal,
      }}
    >
      {highlight.label ? (
        <div
          style={{
            position: 'absolute',
            top: -18,
            left: 16,
            padding: '10px 14px',
            borderRadius: 999,
            background: palette.gold,
            color: '#11181f',
            fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          {highlight.label}
        </div>
      ) : null}
    </div>
  );
};

const StatsStrip: React.FC<{stats: string[]}> = ({stats}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 118,
        right: 118,
        bottom: 200,
        display: 'flex',
        gap: 18,
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat}
          style={{
            flex: 1,
            padding: '18px 22px',
            borderRadius: 22,
            background: palette.panel,
            border: '1px solid rgba(255,255,255,0.08)',
            color: palette.text,
            fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
            fontSize: 28,
            fontWeight: 720,
            lineHeight: 1.2,
            boxShadow: '0 16px 40px rgba(0,0,0,0.24)',
          }}
        >
          {stat}
        </div>
      ))}
    </div>
  );
};

const CaptionLayer: React.FC<{caption: string}> = ({caption}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const opacity = interpolate(frame, [0, 10, durationInFrames - 16, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 180,
        right: 180,
        bottom: 42,
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          padding: '16px 24px',
          borderRadius: 22,
          background: 'rgba(5, 11, 18, 0.80)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.26)',
          color: palette.text,
          fontSize: 24,
          lineHeight: 1.35,
          fontWeight: 650,
          textAlign: 'center',
          fontFamily: '"Avenir Next", "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
      >
        {caption}
      </div>
    </div>
  );
};

const TradingScene: React.FC<{scene: VisualScene & AudioScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const sceneProgress = durationInFrames <= 1 ? 0 : frame / Math.max(durationInFrames - 1, 1);
  const scale = interpolate(sceneProgress, [0, 1], [scene.zoomFrom, scene.zoomTo], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const panFrom = scene.panFrom ?? [0, 0];
  const panTo = scene.panTo ?? panFrom;
  const translateX = interpolate(sceneProgress, [0, 1], [panFrom[0], panTo[0]], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(sceneProgress, [0, 1], [panFrom[1], panTo[1]], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fade = interpolate(frame, [0, 20, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Audio src={staticFile(scene.audioFile)} />
      <div style={frameStyle}>
        <OffthreadVideo
          src={VIDEO_PATH}
          startFrom={scene.sourceStart}
          endAt={scene.sourceStart + scene.durationInFrames}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
            transformOrigin: 'center center',
          }}
          muted
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6, 12, 18, 0.08), transparent 22%, transparent 78%, rgba(6, 12, 18, 0.14))',
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
      <TitleBlock scene={scene} progress={sceneProgress} />
      <SceneBadge label={scene.label} />
      {scene.stats ? <StatsStrip stats={scene.stats} /> : null}
      {scene.id === 'report' ? (
        <div
          style={{
            position: 'absolute',
            right: 118,
            bottom: 208,
            padding: '14px 18px',
            borderRadius: 18,
            background: 'rgba(5, 11, 18, 0.78)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: palette.muted,
            fontSize: 20,
            fontWeight: 600,
            fontFamily: '"Avenir Next", "SF Pro Text", "Helvetica Neue", sans-serif',
          }}
        >
          Metrics quoted exactly from the visible report panel.
        </div>
      ) : null}
      <CaptionLayer caption={scene.caption} />
    </AbsoluteFill>
  );
};

export const TradingStrategyVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      {scenes.map((scene, index) => (
        <Sequence key={scene.id} from={cumulativeStarts[index]} durationInFrames={scene.durationInFrames}>
          <TradingScene scene={scene} />
        </Sequence>
      ))}
      <div
        style={{
          position: 'absolute',
          left: 118,
          bottom: 118,
          fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(245, 248, 251, 0.52)',
        }}
      >
        Edit built from the supplied TradingView recording
      </div>
      <div
        style={{
          position: 'absolute',
          right: 118,
          bottom: 118,
          fontFamily: '"Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(245, 248, 251, 0.52)',
        }}
      >
        {Math.round(totalDuration / 60)} sec cut
      </div>
    </AbsoluteFill>
  );
};
