import React, { useState, useMemo } from 'react';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  symbol: string;
  currentPrice: number;
  priceChange: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  currentPrice,
  priceChange,
}) => {
  const [timeframe, setTimeframe] = useState<'1m' | '15m' | '1h' | '4h' | '1D'>('1h');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showMA, setShowMA] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

  // Generate realistic historical candle data around currentPrice
  const candles: CandleData[] = useMemo(() => {
    const list: CandleData[] = [];
    const count = 42;
    let base = currentPrice * (1 - (priceChange / 100) * 0.8);
    const volatility = currentPrice * 0.006;

    for (let i = 0; i < count; i++) {
      const delta = (Math.random() - 0.48) * volatility;
      const open = base;
      const close = i === count - 1 ? currentPrice : base + delta;
      const high = Math.max(open, close) + Math.random() * volatility * 0.6;
      const low = Math.min(open, close) - Math.random() * volatility * 0.6;
      const volume = Math.floor(Math.random() * 850 + 120);

      const d = new Date(Date.now() - (count - i) * 3600 * 1000);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

      list.push({ time: timeStr, open, high, low, close, volume });
      base = close;
    }
    return list;
  }, [symbol, timeframe]);

  // Compute boundaries
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxV = 0;
    candles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxV) maxV = c.volume;
    });
    const padding = (max - min) * 0.1 || 1;
    return { minPrice: min - padding, maxPrice: max + padding, maxVol: maxV || 100 };
  }, [candles]);

  const activeCandle = hoveredCandle || candles[candles.length - 1];

  // Canvas coordinates helper
  const chartHeight = 280;
  const chartWidth = 680;
  const volHeight = 60;

  const getY = (val: number) => {
    return chartHeight - ((val - minPrice) / (maxPrice - minPrice)) * (chartHeight - 30);
  };

  const candleWidth = chartWidth / candles.length;

  return (
    <div className="w-full bg-[#0E131D] rounded-2xl border border-slate-800 p-4 space-y-3">
      {/* Chart Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-semibold">
            {(['1m', '15m', '1h', '4h', '1D'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeframe === tf ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setChartType('candle')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                chartType === 'candle' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                chartType === 'line' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Line
            </button>
          </div>

          {/* MA Indicator Toggle */}
          <button
            onClick={() => setShowMA(!showMA)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              showMA ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            MA (7/25)
          </button>
        </div>

        {/* Live Candle OHLC Readout */}
        {activeCandle && (
          <div className="hidden sm:flex items-center space-x-3 text-[11px] font-mono">
            <span className="text-slate-500">O: <strong className="text-slate-200">{activeCandle.open.toFixed(2)}</strong></span>
            <span className="text-slate-500">H: <strong className="text-emerald-400">{activeCandle.high.toFixed(2)}</strong></span>
            <span className="text-slate-500">L: <strong className="text-rose-400">{activeCandle.low.toFixed(2)}</strong></span>
            <span className="text-slate-500">C: <strong className="text-cyan-400">{activeCandle.close.toFixed(2)}</strong></span>
            <span className="text-slate-500">Vol: <strong className="text-slate-300">{activeCandle.volume}</strong></span>
          </div>
        )}
      </div>

      {/* SVG Chart Stage */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + volHeight}`}
          className="w-full h-72 select-none cursor-crosshair"
          onMouseLeave={() => setHoveredCandle(null)}
        >
          {/* Horizontal Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
            const priceVal = minPrice + (maxPrice - minPrice) * (1 - ratio);
            const y = chartHeight * ratio;
            return (
              <g key={idx}>
                <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#1E293B" strokeDasharray="3 3" />
                <text x={chartWidth - 60} y={y - 4} fill="#64748B" fontSize="10" fontFamily="monospace">
                  {priceVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Moving Average lines (simulated) */}
          {showMA && (
            <>
              {/* MA7 (Cyan) */}
              <path
                d={candles.reduce((acc, c, i) => {
                  const slice = candles.slice(Math.max(0, i - 6), i + 1);
                  const avg = slice.reduce((sum, item) => sum + item.close, 0) / slice.length;
                  const x = i * candleWidth + candleWidth / 2;
                  const y = getY(avg);
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="1.5"
                opacity="0.8"
              />
              {/* MA25 (Amber) */}
              <path
                d={candles.reduce((acc, c, i) => {
                  const slice = candles.slice(Math.max(0, i - 24), i + 1);
                  const avg = slice.reduce((sum, item) => sum + item.close, 0) / slice.length;
                  const x = i * candleWidth + candleWidth / 2;
                  const y = getY(avg);
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.5"
                opacity="0.8"
              />
            </>
          )}

          {/* Line or Candlestick mode */}
          {chartType === 'line' ? (
            <>
              {/* Area gradient under line */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`${candles.reduce((acc, c, i) => {
                  const x = i * candleWidth + candleWidth / 2;
                  const y = getY(c.close);
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }, '')} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                fill="url(#chartGradient)"
              />
              <path
                d={candles.reduce((acc, c, i) => {
                  const x = i * candleWidth + candleWidth / 2;
                  const y = getY(c.close);
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
              />
            </>
          ) : (
            candles.map((c, i) => {
              const xCenter = i * candleWidth + candleWidth / 2;
              const isBullish = c.close >= c.open;
              const color = isBullish ? '#10B981' : '#F43F5E';
              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2, Math.abs(yOpen - yClose));
              const width = Math.max(3, candleWidth * 0.7);

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredCandle(c)}
                  className="transition-opacity hover:opacity-80"
                >
                  {/* Wick */}
                  <line
                    x1={xCenter}
                    y1={yHigh}
                    x2={xCenter}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Body */}
                  <rect
                    x={xCenter - width / 2}
                    y={bodyTop}
                    width={width}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })
          )}

          {/* Volume Histogram at bottom */}
          {candles.map((c, i) => {
            const xCenter = i * candleWidth + candleWidth / 2;
            const isBullish = c.close >= c.open;
            const color = isBullish ? '#10B98144' : '#F43F5E44';
            const vHeight = (c.volume / maxVol) * (volHeight - 10);
            const vY = chartHeight + volHeight - vHeight;
            const width = Math.max(3, candleWidth * 0.7);

            return (
              <rect
                key={`vol-${i}`}
                x={xCenter - width / 2}
                y={vY}
                width={width}
                height={vHeight}
                fill={color}
              />
            );
          })}
        </svg>
      </div>

      {/* Footer legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" /> MA(7)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400 rounded-full" /> MA(25)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-700/60 rounded" /> Vol ({symbol.split('/')[0]})
          </span>
        </div>
        <span className="font-mono">Timezone: UTC (Real-time Feed)</span>
      </div>
    </div>
  );
};
