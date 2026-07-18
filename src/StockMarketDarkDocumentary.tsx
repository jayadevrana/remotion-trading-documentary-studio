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
import stockMarketDarkAudioTiming from './stockMarketDarkAudioTiming.json';

type DocumentaryScene = {
  id: string;
  title: string;
  caption: string;
  kicker: string;
  visualMode: string;
  assetId: string;
  audioFile: string;
  audioDurationSeconds: number;
  durationInFrames: number;
  startFrame: number;
  narration: string;
};

const scenes = stockMarketDarkAudioTiming.scenes as DocumentaryScene[];

const palette = {
  bg: '#04070b',
  panel: 'rgba(8, 13, 18, 0.78)',
  soft: 'rgba(255,255,255,0.08)',
  text: '#f2ede5',
  muted: 'rgba(242,237,229,0.75)',
  gold: '#d3b174',
  green: '#79d8a6',
  red: '#c76c6c',
  blue: '#91a6b6',
};

const assetAliases: Record<string, string> = {
  'invest-or-fall-behind': 'money-dies-in-silence',
  'owning-the-machine': 'the-promise',
  'price-is-not-value': 'auction-of-emotion',
  'greed-fear-herd': 'auction-of-emotion',
  'black-monday-dotcom': 'when-the-machine-breaks',
  'pandemic-panic': 'when-the-machine-breaks',
  'why-retail-loses': 'human-cost',
  'day-trading': 'media-theatre',
  'bubble-pattern': 'leverage',
};

const assetFiles: Record<string, string> = {
  'lie-of-safety': 'images/stock-market-dark/lie-of-safety.png',
  'money-dies-in-silence': 'images/stock-market-dark/money-dies-in-silence.png',
  'the-promise': 'images/stock-market-dark/the-promise.png',
  'auction-of-emotion': 'images/stock-market-dark/auction-of-emotion.png',
  'when-the-machine-breaks': 'images/stock-market-dark/when-the-machine-breaks.png',
  'crash-1929': 'images/stock-market-dark/crash-1929.png',
  'crash-2008': 'images/stock-market-dark/crash-2008.png',
  'meme-stock-euphoria': 'images/stock-market-dark/meme-stock-euphoria.png',
  'human-cost': 'images/stock-market-dark/human-cost.png',
  'house-advantage': 'images/stock-market-dark/house-advantage.png',
  'media-theatre': 'images/stock-market-dark/media-theatre.png',
  'manipulation': 'images/stock-market-dark/manipulation.png',
  'leverage': 'images/stock-market-dark/leverage.png',
  'realistic-profitability': 'images/stock-market-dark/realistic-profitability.png',
  'final-truth': 'images/stock-market-dark/final-truth.png',
};

const getAssetPath = (assetId: string): string | null => {
  const resolved = assetFiles[assetId] ? assetId : assetAliases[assetId];
  return resolved ? assetFiles[resolved] ?? null : null;
};

const baseTextStyle: React.CSSProperties = {
  color: palette.text,
  textShadow: '0 8px 28px rgba(0,0,0,0.45)',
};

const sceneWords = (scene: DocumentaryScene) =>
  scene.caption
    .replace(/[.,]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 4);

const Grain: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.12,
        mixBlendMode: 'screen',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.16) 0 1px, transparent 1px), radial-gradient(circle at 72% 58%, rgba(255,255,255,0.12) 0 1px, transparent 1px), radial-gradient(circle at 38% 80%, rgba(255,255,255,0.12) 0 1px, transparent 1px)',
        backgroundSize: '120px 120px, 180px 180px, 220px 220px',
      }}
    />
  );
};

const Background: React.FC<{scene: DocumentaryScene; progress: number; index: number}> = ({
  scene,
  progress,
  index,
}) => {
  const path = getAssetPath(scene.assetId);
  const scale = interpolate(progress, [0, 1], [1.04 + (index % 3) * 0.01, 1.12 + (index % 2) * 0.015], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(progress, [0, 1], [-20 + (index % 5) * 4, 18 - (index % 4) * 4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(progress, [0, 1], [10 - (index % 3) * 4, -12 + (index % 4) * 3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: [
          'radial-gradient(circle at 15% 16%, rgba(145,166,182,0.14), transparent 30%)',
          'radial-gradient(circle at 82% 14%, rgba(211,177,116,0.12), transparent 22%)',
          'radial-gradient(circle at 60% 80%, rgba(199,108,108,0.12), transparent 24%)',
          'linear-gradient(180deg, #071019 0%, #04070b 100%)',
        ].join(','),
      }}
    >
      {path ? (
        <Img
          src={staticFile(path)}
          style={{
            position: 'absolute',
            inset: -90,
            width: 'calc(100% + 180px)',
            height: 'calc(100% + 180px)',
            objectFit: 'cover',
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            filter: 'brightness(0.52) saturate(0.95) contrast(1.04)',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(4,7,11,0.18) 0%, rgba(4,7,11,0.16) 28%, rgba(4,7,11,0.78) 100%)',
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
      <Grain />
    </AbsoluteFill>
  );
};

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
        top: 66,
        width: 770,
        padding: '24px 28px',
        borderRadius: 28,
        background: 'linear-gradient(180deg, rgba(8,13,18,0.88), rgba(8,13,18,0.56))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        transform: `translateY(${interpolate(entrance, [0, 1], [24, 0])}px)`,
        opacity: entrance,
      }}
    >
      <div
        style={{
          ...baseTextStyle,
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
          fontSize: 16,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: palette.gold,
          marginBottom: 12,
        }}
      >
        {scene.kicker}
      </div>
      <div
        style={{
          ...baseTextStyle,
          fontFamily: '"Iowan Old Style", Georgia, serif',
          fontSize: 52,
          lineHeight: 1.03,
          marginBottom: 14,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          ...baseTextStyle,
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
          fontSize: 24,
          lineHeight: 1.3,
          color: palette.muted,
        }}
      >
        {scene.caption}
      </div>
    </div>
  );
};

const BottomCaption: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 72,
        bottom: 56,
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1050,
          padding: '15px 24px',
          borderRadius: 999,
          background: 'rgba(8,13,18,0.66)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: palette.text,
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
          fontSize: 24,
          letterSpacing: '0.01em',
          textAlign: 'center',
        }}
      >
        {scene.caption}
      </div>
    </div>
  );
};

const KineticQuoteOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const words = sceneWords(scene);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {words.map((word, index) => {
        const enter = spring({
          fps: 30,
          frame: progress * 30 - index * 4,
          config: {damping: 22, stiffness: 110},
        });
        return (
          <div
            key={word}
            style={{
              position: 'absolute',
              left: 118 + (index % 2) * 470,
              top: 250 + index * 104,
              color: index % 2 === 0 ? palette.text : palette.gold,
              fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
              fontSize: 64 - index * 4,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transform: `translateX(${interpolate(enter, [0, 1], [-54, 0])}px)`,
              opacity: enter,
              textShadow: '0 10px 24px rgba(0,0,0,0.42)',
            }}
          >
            {word}
          </div>
        );
      })}
    </div>
  );
};

const ProofGridOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const cards = ['Claim', 'Pressure', 'Reality'];
  return (
    <div style={{position: 'absolute', right: 84, top: 190, width: 760, height: 500}}>
      {cards.map((card, index) => {
        const enter = spring({
          fps: 30,
          frame: progress * 30 - index * 5,
          config: {damping: 18, stiffness: 120},
        });
        return (
          <div
            key={card}
            style={{
              position: 'absolute',
              left: index * 180,
              top: index * 42,
              width: 280,
              height: 180,
              padding: 24,
              borderRadius: 22,
              background: 'rgba(8,13,18,0.74)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.24)',
              transform: `translateY(${interpolate(enter, [0, 1], [36, 0])}px)`,
              opacity: enter,
            }}
          >
            <div
              style={{
                color: index === 1 ? palette.red : index === 2 ? palette.green : palette.gold,
                fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
                fontSize: 18,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              {card}
            </div>
            <div
              style={{
                color: palette.text,
                fontFamily: '"Iowan Old Style", Georgia, serif',
                fontSize: 30,
                lineHeight: 1.1,
              }}
            >
              {index === 0 ? scene.kicker : index === 1 ? scene.title : scene.caption}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const NetworkOverlay: React.FC<{progress: number}> = ({progress}) => {
  const nodes = [
    {x: 280, y: 500, label: 'Retail'},
    {x: 620, y: 320, label: 'Broker'},
    {x: 960, y: 500, label: 'Exchange'},
    {x: 1280, y: 320, label: 'Funds'},
    {x: 1560, y: 520, label: 'Media'},
  ];
  return (
    <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      {nodes.slice(0, -1).map((node, index) => (
        <line
          key={`line-${node.label}`}
          x1={node.x}
          y1={node.y}
          x2={nodes[index + 1].x}
          y2={nodes[index + 1].y}
          stroke="rgba(211,177,116,0.45)"
          strokeWidth={3}
          opacity={spring({
            fps: 30,
            frame: progress * 30 - index * 3,
            config: {damping: 22, stiffness: 120},
          })}
        />
      ))}
      {nodes.map((node, index) => {
        const enter = spring({
          fps: 30,
          frame: progress * 30 - index * 3,
          config: {damping: 18, stiffness: 110},
        });
        return (
          <g key={node.label} opacity={enter}>
            <circle
              cx={node.x}
              cy={node.y}
              r={index === nodes.length - 1 ? 36 : 32}
              fill="rgba(8,13,18,0.7)"
              stroke="rgba(255,255,255,0.16)"
            />
            <text
              x={node.x}
              y={node.y + 8}
              textAnchor="middle"
              fill={index >= 3 ? palette.gold : palette.text}
              fontFamily="Avenir Next, Helvetica Neue, sans-serif"
              fontSize="22"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const CrashTimelineOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const labelsById: Record<string, string[]> = {
    s09: ['Calm', 'Stretch', 'Crack', 'Panic', 'Capitulation'],
    s10: ['Speculation', 'Denial', 'Drop', 'Bargain', 'Panic'],
    s11: ['Speed', 'Euphoria', 'Stretch', 'Break', 'Collapse'],
    s13: ['Fear', 'Freeze', 'Selloff', 'Bounce', 'Whiplash'],
  };
  const labels = labelsById[scene.id] ?? ['Hope', 'Risk', 'Crack', 'Fear', 'Exit'];

  return (
    <div style={{position: 'absolute', left: 90, right: 90, bottom: 190}}>
      <div style={{height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 999}} />
      {[0.14, 0.34, 0.54, 0.74, 0.92].map((mark, index) => {
        const grow = spring({
          fps: 30,
          frame: progress * 30 - index * 4,
          config: {damping: 16, stiffness: 100},
        });
        return (
          <div
            key={`${mark}-${index}`}
            style={{
              position: 'absolute',
              left: `${mark * 100}%`,
              top: -20,
              width: 5,
              height: 46,
              borderRadius: 999,
              background: index >= 3 ? palette.red : index === 2 ? palette.gold : 'rgba(242,237,229,0.75)',
              opacity: grow,
              transform: `scaleY(${grow})`,
            }}
          />
        );
      })}
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 34}}>
        {labels.map((label, index) => (
          <div
            key={label}
            style={{
              color: palette.text,
              fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
              fontSize: 24,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: spring({
                fps: 30,
                frame: progress * 30 - 10 - index * 2,
                config: {damping: 18, stiffness: 100},
              }),
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

const SplitContrastOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const pairs =
    scene.id === 's06'
      ? [
          {label: 'Price', title: 'Moves fast'},
          {label: 'Value', title: 'Argues slowly'},
        ]
      : [
          {label: 'Entry', title: 'Hope buys late'},
          {label: 'Exit', title: 'Fear sells low'},
        ];

  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 360, display: 'flex', gap: 30}}>
      {pairs.map((panel, index) => {
        const enter = spring({
          fps: 30,
          frame: progress * 30 - index * 5,
          config: {damping: 18, stiffness: 110},
        });
        return (
          <div
            key={panel.label}
            style={{
              flex: 1,
              minHeight: 280,
              borderRadius: 30,
              background: 'rgba(8,13,18,0.74)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '34px 36px',
              opacity: enter,
              transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
            }}
          >
            <div
              style={{
                color: index === 0 ? palette.gold : palette.red,
                fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
                fontSize: 18,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              {panel.label}
            </div>
            <div
              style={{
                color: palette.text,
                fontFamily: '"Iowan Old Style", Georgia, serif',
                fontSize: 42,
                lineHeight: 1.08,
              }}
            >
              {panel.title}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LeverageOverlay: React.FC<{progress: number}> = ({progress}) => {
  const lineEnter = spring({
    fps: 30,
    frame: progress * 30,
    config: {damping: 18, stiffness: 110},
  });
  return (
    <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, opacity: lineEnter}}>
      <polyline
        points="280,330 660,410 980,500 1240,650 1540,820"
        fill="none"
        stroke="rgba(199,108,108,0.9)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[
        {x: 660, y: 410, label: 'Borrow'},
        {x: 980, y: 500, label: 'Speed'},
        {x: 1240, y: 650, label: 'Pressure'},
        {x: 1540, y: 820, label: 'Margin Call'},
      ].map((node, index) => (
        <g
          key={node.label}
          opacity={spring({fps: 30, frame: progress * 30 - index * 4, config: {damping: 20, stiffness: 110}})}
        >
          <circle cx={node.x} cy={node.y} r={18} fill="rgba(199,108,108,0.9)" />
          <text
            x={node.x}
            y={node.y - 34}
            textAnchor="middle"
            fill={palette.text}
            fontFamily="Avenir Next, Helvetica Neue, sans-serif"
            fontSize="22"
            letterSpacing="0.12em"
            textTransform="uppercase"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

const TickerCascadeOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const tokens = ['Live', 'Fast', 'Now', 'Again', 'Move'];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {tokens.map((token, index) => {
        const enter = spring({
          fps: 30,
          frame: progress * 30 - index * 3,
          config: {damping: 20, stiffness: 120},
        });
        return (
          <div
            key={`${scene.id}-${token}`}
            style={{
              position: 'absolute',
              left: 180 + index * 280,
              top: 180 + (index % 2) * 180,
              padding: '18px 24px',
              borderRadius: 999,
              background: 'rgba(8,13,18,0.72)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: index % 2 === 0 ? palette.green : palette.red,
              fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
              fontSize: 34,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              transform: `translateY(${interpolate(enter, [0, 1], [-40, 0])}px)`,
              opacity: enter,
            }}
          >
            {token}
          </div>
        );
      })}
    </div>
  );
};

const BubbleCurveOverlay: React.FC<{progress: number}> = ({progress}) => {
  const enter = spring({
    fps: 30,
    frame: progress * 30,
    config: {damping: 18, stiffness: 110},
  });
  return (
    <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, opacity: enter}}>
      <path
        d="M180 750 C 380 740, 560 700, 760 600 S 1100 360, 1320 240 S 1540 240, 1680 760"
        fill="none"
        stroke="rgba(121,216,166,0.9)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M1540 280 L1660 760"
        stroke="rgba(199,108,108,0.95)"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
};

const RuleCardsOverlay: React.FC<{progress: number}> = ({progress}) => {
  const rules = ['Emergency Cash', 'Small Size', 'Diversify', 'No Leverage', 'Written Plan'];
  return (
    <div style={{position: 'absolute', left: 96, right: 96, bottom: 180, display: 'flex', gap: 18}}>
      {rules.map((rule, index) => {
        const enter = spring({
          fps: 30,
          frame: progress * 30 - index * 3,
          config: {damping: 18, stiffness: 110},
        });
        return (
          <div
            key={rule}
            style={{
              flex: 1,
              padding: '18px 14px',
              borderRadius: 22,
              background: 'rgba(8,13,18,0.76)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: palette.text,
              fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
              fontSize: 22,
              textAlign: 'center',
              opacity: enter,
              transform: `translateY(${interpolate(enter, [0, 1], [22, 0])}px)`,
            }}
          >
            {rule}
          </div>
        );
      })}
    </div>
  );
};

const ClosingOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const enter = spring({
    fps: 30,
    frame: progress * 30,
    config: {damping: 200, stiffness: 170},
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        bottom: 180,
        textAlign: 'center',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
      }}
    >
      <div
        style={{
          color: palette.gold,
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
          fontSize: 18,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}
      >
        {scene.kicker}
      </div>
      <div
        style={{
          color: palette.text,
          fontFamily: '"Iowan Old Style", Georgia, serif',
          fontSize: 80,
          lineHeight: 1.04,
          textShadow: '0 12px 30px rgba(0,0,0,0.46)',
        }}
      >
        {scene.title}
      </div>
    </div>
  );
};

const SceneVisual: React.FC<{scene: DocumentaryScene; index: number}> = ({scene, index}) => {
  const frame = useCurrentFrame();
  const progress = frame / Math.max(1, scene.durationInFrames);

  return (
    <AbsoluteFill>
      <Background scene={scene} progress={progress} index={index} />
      {scene.visualMode !== 'closing-thesis' ? <HeaderCard scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'kinetic-quotes' ? <KineticQuoteOverlay scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'proof-grid' ? <ProofGridOverlay scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'network-map' ? <NetworkOverlay progress={progress} /> : null}
      {scene.visualMode === 'crash-timeline' ? <CrashTimelineOverlay scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'split-contrast' ? <SplitContrastOverlay scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'leverage-cliff' ? <LeverageOverlay progress={progress} /> : null}
      {scene.visualMode === 'ticker-cascade' ? <TickerCascadeOverlay scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'bubble-curve' ? <BubbleCurveOverlay progress={progress} /> : null}
      {scene.visualMode === 'rule-cards' ? <RuleCardsOverlay progress={progress} /> : null}
      {scene.visualMode === 'closing-thesis' ? <ClosingOverlay scene={scene} progress={progress} /> : null}
      <BottomCaption scene={scene} progress={progress} />
      <Audio src={staticFile(scene.audioFile)} />
    </AbsoluteFill>
  );
};

export const StockMarketDarkDocumentary: React.FC = () => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const bedFade = interpolate(
    frame,
    [0, fps * 3, stockMarketDarkAudioTiming.totalFrames - fps * 4, stockMarketDarkAudioTiming.totalFrames],
    [0, 0.17, 0.17, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill style={{backgroundColor: palette.bg}}>
      <Audio src={staticFile('audio/stock-market-dark-bed.wav')} volume={bedFade} />
      {scenes.map((scene, index) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames}>
          <SceneVisual scene={scene} index={index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
