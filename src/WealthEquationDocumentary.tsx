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
import wealthAudioTiming from './wealthAudioTiming.json';

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

const scenes = wealthAudioTiming.scenes as DocumentaryScene[];

const palette = {
  bg: '#04070c',
  panel: 'rgba(7, 14, 22, 0.76)',
  soft: 'rgba(255,255,255,0.07)',
  text: '#f7f1e7',
  muted: 'rgba(247,241,231,0.72)',
  gold: '#d8b777',
  amber: '#f1c980',
  steel: '#8ea5b7',
  blue: '#6ba4d7',
  red: '#b56969',
};

const assetAliases: Record<string, string> = {
  'school-society': 'childhood-messages',
  'rich-evil-stereotype': 'self-made-mosaic',
  'amazon-ecosystem': 'market-value-network',
  'problem-hunt': 'problem-solution-engine',
  replaceability: 'hard-work-vs-value',
  'yoga-course': 'scale-ladder',
  'systems-outsourcing': 'problem-solution-engine',
  'acquisition-door': 'rigged-game',
  'exit-reward': 'young-millionaires',
  'seed-of-perspective': 'freedom-not-money',
  'time-loop': 'time-vs-salary',
  'final-equation': 'wrong-rules',
};

const assetFiles: Record<string, string> = {
  'money-scale-cosmos': 'images/wealth/money-scale-cosmos.png',
  'office-pressure': 'images/wealth/office-pressure.png',
  'debt-ledger': 'images/wealth/debt-ledger.png',
  'shrinking-dreams': 'images/wealth/shrinking-dreams.png',
  'rigged-game': 'images/wealth/rigged-game.png',
  'wrong-rules': 'images/wealth/wrong-rules.png',
  'warning-tunnel': 'images/wealth/warning-tunnel.png',
  'childhood-messages': 'images/wealth/childhood-messages.png',
  'self-made-mosaic': 'images/wealth/self-made-mosaic.png',
  'salary-equation': 'images/wealth/salary-equation.png',
  'time-vs-salary': 'images/wealth/time-vs-salary.png',
  'young-millionaires': 'images/wealth/young-millionaires.png',
  'market-value-network': 'images/wealth/market-value-network.png',
  'hard-work-vs-value': 'images/wealth/hard-work-vs-value.png',
  'problem-solution-engine': 'images/wealth/problem-solution-engine.png',
  'scale-ladder': 'images/wealth/scale-ladder.png',
  'freedom-not-money': 'images/wealth/freedom-not-money.png',
  'closing-horizon': 'images/wealth/closing-horizon.png',
};

const getAssetPath = (assetId: string): string | null => {
  const resolved = assetFiles[assetId] ? assetId : assetAliases[assetId];
  return resolved ? assetFiles[resolved] ?? null : null;
};

const baseTextStyle: React.CSSProperties = {
  color: palette.text,
  textShadow: '0 8px 26px rgba(0,0,0,0.45)',
};

const sceneWords = (scene: DocumentaryScene) =>
  scene.caption
    .replace(/[.,]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 5);

const Grain: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.12,
        mixBlendMode: 'screen',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0 1px, transparent 1px), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.16) 0 1px, transparent 1px), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.14) 0 1px, transparent 1px)',
        backgroundSize: '120px 120px, 170px 170px, 220px 220px',
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
  const scale = interpolate(progress, [0, 1], [1.03 + (index % 3) * 0.01, 1.12 + (index % 2) * 0.015], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(progress, [0, 1], [-20 + (index % 5) * 5, 20 - (index % 4) * 4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(progress, [0, 1], [8 - (index % 3) * 4, -12 + (index % 5) * 3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: [
          'radial-gradient(circle at 15% 18%, rgba(107,164,215,0.25), transparent 28%)',
          'radial-gradient(circle at 78% 16%, rgba(216,183,119,0.18), transparent 22%)',
          'radial-gradient(circle at 62% 78%, rgba(181,105,105,0.16), transparent 28%)',
          'linear-gradient(180deg, #071018 0%, #04070c 100%)',
        ].join(','),
      }}
    >
      {path ? (
        <Img
          src={staticFile(path)}
          style={{
            position: 'absolute',
            inset: -100,
            width: 'calc(100% + 200px)',
            height: 'calc(100% + 200px)',
            objectFit: 'cover',
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            filter: 'brightness(0.5) saturate(0.95) contrast(1.02)',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(4,7,12,0.28) 0%, rgba(4,7,12,0.18) 28%, rgba(4,7,12,0.74) 100%)',
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
        width: 760,
        padding: '24px 28px',
        borderRadius: 28,
        background: 'linear-gradient(180deg, rgba(7,14,22,0.88), rgba(7,14,22,0.54))',
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
          fontSize: 17,
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
          fontSize: 25,
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
          background: 'rgba(7,14,22,0.64)',
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

const MoneyScaleOverlay: React.FC<{progress: number}> = ({progress}) => {
  const labels = ['1M', '10M', '100M', '1B'];
  const sizes = [92, 170, 300, 470];
  return (
    <div style={{position: 'absolute', right: 130, top: 150, width: 700, height: 620}}>
      {sizes.map((size, index) => {
        const pop = spring({
          fps: 30,
          frame: progress * 30 - index * 5,
          config: {damping: 18, stiffness: 100},
        });
        return (
          <div
            key={labels[index]}
            style={{
              position: 'absolute',
              left: 260 - size / 2 + index * 18,
              top: 250 - size / 2 + index * 18,
              width: size,
              height: size,
              borderRadius: '50%',
              border: `${Math.max(2, 9 - index * 2)}px solid ${index === 3 ? palette.amber : 'rgba(247,241,231,0.7)'}`,
              boxShadow:
                index === 3
                  ? '0 0 90px rgba(241,201,128,0.22), inset 0 0 50px rgba(241,201,128,0.12)'
                  : '0 0 40px rgba(255,255,255,0.07)',
              transform: `scale(${pop})`,
              opacity: pop,
            }}
          />
        );
      })}
      {labels.map((label, index) => (
        <div
          key={`${label}-text`}
          style={{
            position: 'absolute',
            left: 540,
            top: 110 + index * 110,
            color: palette.text,
            fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
            fontSize: index === 3 ? 44 : 28,
            fontWeight: 600,
            letterSpacing: '0.04em',
            opacity: spring({
              fps: 30,
              frame: progress * 30 - 8 - index * 5,
              config: {damping: 200, stiffness: 170},
            }),
          }}
        >
          {label}
        </div>
      ))}
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
              left: 120 + (index % 2) * 460,
              top: 230 + index * 100,
              color: index % 2 === 0 ? palette.text : palette.gold,
              fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
              fontSize: 64 - index * 4,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transform: `translateX(${interpolate(enter, [0, 1], [-60, 0])}px)`,
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
  const cards = ['Evidence', 'Claim', 'Reality'];
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
              background: 'rgba(7,14,22,0.72)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.24)',
              transform: `translateY(${interpolate(enter, [0, 1], [36, 0])}px)`,
              opacity: enter,
            }}
          >
            <div
              style={{
                color: index === 1 ? palette.gold : palette.blue,
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

const EquationOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const formula =
    scene.id === 's12' ? ['Money', '=', 'Salary'] : scene.id === 's18' ? ['Problems', '->', 'Solutions', '->', 'Wealth'] : ['Rules', '->', 'Pattern', '->', 'Freedom'];
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 420,
        display: 'flex',
        justifyContent: 'center',
        gap: 26,
        alignItems: 'center',
      }}
    >
      {formula.map((piece, index) => {
        const enter = spring({
          fps: 30,
          frame: progress * 30 - index * 4,
          config: {damping: 20, stiffness: 110},
        });
        return (
          <div
            key={`${scene.id}-${piece}-${index}`}
            style={{
              padding: piece.includes('>') || piece === '=' ? '0 10px' : '22px 26px',
              borderRadius: 24,
              background: piece.includes('>') || piece === '=' ? 'transparent' : 'rgba(7,14,22,0.72)',
              border: piece.includes('>') || piece === '=' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: piece.includes('>') || piece === '=' ? palette.gold : palette.text,
              fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
              fontSize: piece.includes('>') || piece === '=' ? 52 : 42,
              fontWeight: 700,
              letterSpacing: '0.03em',
              transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
              opacity: enter,
            }}
          >
            {piece}
          </div>
        );
      })}
    </div>
  );
};

const StatsWallOverlay: React.FC<{progress: number}> = ({progress}) => {
  const statEnter = spring({
    fps: 30,
    frame: progress * 30,
    config: {damping: 18, stiffness: 120},
  });
  const names = ['Buffett', 'Schultz', 'Oprah', 'Bezos', 'Musk', 'Blakely'];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 220,
          color: palette.gold,
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
          fontSize: 180,
          fontWeight: 700,
          opacity: statEnter,
          transform: `scale(${interpolate(statEnter, [0, 1], [0.88, 1])})`,
        }}
      >
        68%
      </div>
      <div
        style={{
          position: 'absolute',
          right: 140,
          top: 390,
          color: palette.text,
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
          fontSize: 28,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          opacity: statEnter,
        }}
      >
        self-made
      </div>
      {names.map((name, index) => (
        <div
          key={name}
          style={{
            position: 'absolute',
            left: 120 + (index % 3) * 210,
            top: 440 + Math.floor(index / 3) * 90,
            padding: '16px 20px',
            borderRadius: 999,
            background: 'rgba(7,14,22,0.68)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: palette.text,
            fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
            fontSize: 24,
            opacity: spring({
              fps: 30,
              frame: progress * 30 - 8 - index * 3,
              config: {damping: 18, stiffness: 130},
            }),
          }}
        >
          {name}
        </div>
      ))}
    </div>
  );
};

const TimelineOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
  const bars = [0.18, 0.36, 0.54, 0.72, 0.9];
  const tokens =
    scene.id === 's27'
      ? ['Utho', 'Travel', 'Kaam', 'Ghar', 'Dekho', 'So jao', 'Repeat']
      : ['18', '24', '30', '36', '42'];
  return (
    <div style={{position: 'absolute', left: 90, right: 90, bottom: 180}}>
      <div style={{height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 999}} />
      {bars.map((bar, index) => {
        const grow = spring({
          fps: 30,
          frame: progress * 30 - index * 4,
          config: {damping: 16, stiffness: 100},
        });
        return (
          <div
            key={`${bar}-${index}`}
            style={{
              position: 'absolute',
              left: `${bar * 100}%`,
              top: -20,
              width: 5,
              height: 46,
              borderRadius: 999,
              background: index === bars.length - 1 ? palette.gold : 'rgba(247,241,231,0.75)',
              opacity: grow,
              transform: `scaleY(${grow})`,
            }}
          />
        );
      })}
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 34}}>
        {tokens.map((token, index) => (
          <div
            key={token}
            style={{
              color: palette.text,
              fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
              fontSize: scene.id === 's27' ? 22 : 26,
              letterSpacing: scene.id === 's27' ? '0.08em' : '0.02em',
              textTransform: scene.id === 's27' ? 'uppercase' : 'none',
              opacity: spring({
                fps: 30,
                frame: progress * 30 - 10 - index * 2,
                config: {damping: 18, stiffness: 100},
              }),
            }}
          >
            {token}
          </div>
        ))}
      </div>
    </div>
  );
};

const MarketNetworkOverlay: React.FC<{progress: number}> = ({progress}) => {
  const nodes = [
    {x: 290, y: 420, label: 'You'},
    {x: 620, y: 250, label: 'Family'},
    {x: 920, y: 430, label: 'Friends'},
    {x: 1240, y: 280, label: 'Neighbors'},
    {x: 1510, y: 500, label: 'Market'},
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
          stroke="rgba(216,183,119,0.5)"
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
            <circle cx={node.x} cy={node.y} r={32 + index * 4} fill="rgba(7,14,22,0.7)" stroke="rgba(255,255,255,0.18)" />
            <text
              x={node.x}
              y={node.y + 8}
              textAnchor="middle"
              fill={index === nodes.length - 1 ? palette.gold : palette.text}
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

const SplitContrastOverlay: React.FC<{progress: number}> = ({progress}) => {
  const left = spring({fps: 30, frame: progress * 30, config: {damping: 18, stiffness: 110}});
  const right = spring({fps: 30, frame: progress * 30 - 5, config: {damping: 18, stiffness: 110}});
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 360, display: 'flex', gap: 30}}>
      {[
        {label: 'Time-bound', title: 'Hourly effort'},
        {label: 'Scale-bound', title: 'Repeatable asset'},
      ].map((panel, index) => {
        const enter = index === 0 ? left : right;
        return (
          <div
            key={panel.label}
            style={{
              flex: 1,
              minHeight: 280,
              borderRadius: 30,
              background: 'rgba(7,14,22,0.72)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '34px 36px',
              opacity: enter,
              transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
            }}
          >
            <div
              style={{
                color: index === 0 ? palette.red : palette.gold,
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

const SystemsOverlay: React.FC<{progress: number}> = ({progress}) => {
  const enter = spring({fps: 30, frame: progress * 30, config: {damping: 16, stiffness: 100}});
  const nodes = [
    {x: 960, y: 420, label: 'System'},
    {x: 640, y: 620, label: 'Automation'},
    {x: 960, y: 700, label: 'Process'},
    {x: 1280, y: 620, label: 'Outsource'},
  ];
  return (
    <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, opacity: enter}}>
      <line x1="960" y1="420" x2="640" y2="620" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
      <line x1="960" y1="420" x2="960" y2="700" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
      <line x1="960" y1="420" x2="1280" y2="620" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
      {nodes.map((node, index) => (
        <g
          key={node.label}
          transform={`translate(${node.x}, ${node.y})`}
          opacity={spring({fps: 30, frame: progress * 30 - index * 4, config: {damping: 20, stiffness: 110}})}
        >
          <circle r={index === 0 ? 100 : 78} fill="rgba(7,14,22,0.74)" stroke="rgba(255,255,255,0.12)" />
          <text
            textAnchor="middle"
            fill={index === 0 ? palette.gold : palette.text}
            fontFamily="Avenir Next, Helvetica Neue, sans-serif"
            fontSize={index === 0 ? 36 : 24}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

const FreedomOverlay: React.FC<{scene: DocumentaryScene; progress: number}> = ({scene, progress}) => {
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
          fontSize: 78,
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
      {scene.visualMode !== 'freedom-reveal' ? <HeaderCard scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'money-scale' ? <MoneyScaleOverlay progress={progress} /> : null}
      {scene.visualMode === 'proof-grid' ? <ProofGridOverlay scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'kinetic-quotes' ? <KineticQuoteOverlay scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'equation-reveal' ? <EquationOverlay scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'stats-wall' ? <StatsWallOverlay progress={progress} /> : null}
      {scene.visualMode === 'timeline-pressure' ? <TimelineOverlay scene={scene} progress={progress} /> : null}
      {scene.visualMode === 'market-network' ? <MarketNetworkOverlay progress={progress} /> : null}
      {scene.visualMode === 'split-contrast' ? <SplitContrastOverlay progress={progress} /> : null}
      {scene.visualMode === 'systems-scale' ? <SystemsOverlay progress={progress} /> : null}
      {scene.visualMode === 'freedom-reveal' ? <FreedomOverlay scene={scene} progress={progress} /> : null}
      <BottomCaption scene={scene} progress={progress} />
      <Audio src={staticFile(scene.audioFile)} />
    </AbsoluteFill>
  );
};

export const WealthEquationDocumentary: React.FC = () => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const bedFade = interpolate(frame, [0, fps * 3, wealthAudioTiming.totalFrames - fps * 4, wealthAudioTiming.totalFrames], [0, 0.17, 0.17, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: palette.bg}}>
      <Audio src={staticFile('audio/wealth-bed.wav')} volume={bedFade} />
      {scenes.map((scene, index) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames}>
          <SceneVisual scene={scene} index={index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
