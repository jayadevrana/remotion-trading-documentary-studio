import {Composition} from 'remotion';
import reelAudioTiming from './reelAudioTiming.json';
import {TradingStrategyReel} from './TradingStrategyReel';
import {TradingStrategyVideo} from './TradingStrategyVideo';
import audioTiming from './audioTiming.json';
import wealthAudioTiming from './wealthAudioTiming.json';
import {WealthEquationDocumentary} from './WealthEquationDocumentary';
import stockMarketDarkAudioTiming from './stockMarketDarkAudioTiming.json';
import {StockMarketDarkDocumentary} from './StockMarketDarkDocumentary';
import stockMarketEnglishAudioTiming from './stockMarketEnglishAudioTiming.json';
import {StockMarketEnglish150Documentary} from './StockMarketEnglish150Documentary';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TradingStrategyVideo"
        component={TradingStrategyVideo}
        durationInFrames={audioTiming.totalFrames}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="TradingStrategyReel"
        component={TradingStrategyReel}
        durationInFrames={reelAudioTiming.totalFrames}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
      <Composition
        id="WealthEquationDocumentary"
        component={WealthEquationDocumentary}
        durationInFrames={wealthAudioTiming.totalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="StockMarketDarkDocumentary"
        component={StockMarketDarkDocumentary}
        durationInFrames={stockMarketDarkAudioTiming.totalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="StockMarketEnglish150Documentary"
        component={StockMarketEnglish150Documentary}
        durationInFrames={stockMarketEnglishAudioTiming.totalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
