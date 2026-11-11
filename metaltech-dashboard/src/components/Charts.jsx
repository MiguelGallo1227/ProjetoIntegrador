import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { TIPOS, fmtTime } from '../utils/format';

const AXIS = { fontSize: 12, fill: 'currentColor' };

// Props: leituras, limiar
export function LevelChart({ leituras, limiar }) {
  const data = leituras.map((l) => ({ hora: fmtTime(l.timestamp), nivel: l.nivelReservatorio }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="hora" tick={AXIS} minTickGap={40} />
        <YAxis domain={[0, 100]} tick={AXIS} unit="%" />
        <Tooltip formatter={(v) => [`${v}%`, 'Nível']} />
        <ReferenceLine y={limiar} stroke="#d0453b" strokeDasharray="5 4" label={{ value: 'Limiar', fill: '#d0453b', fontSize: 12, position: 'insideTopRight' }} />
        <Line type="monotone" dataKey="nivel" name="Nível" stroke="var(--mt-metal)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Contagem acumulada por tipo dentro da janela exibida. Props: leituras
export function CountChart({ leituras }) {
  let m = 0;
  let n = 0;
  const data = leituras.map((l) => {
    if (l.tipoPeca === 'METALICA') m += 1;
    else n += 1;
    return { hora: fmtTime(l.timestamp), metalicas: m, naoMetalicas: n };
  });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="hora" tick={AXIS} minTickGap={40} />
        <YAxis tick={AXIS} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="metalicas" name="Metálicas" stroke={TIPOS.METALICA.color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="naoMetalicas" name="Não metálicas" stroke={TIPOS.NAO_METALICA.color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Props: metalicas, naoMetalicas
export function ProportionChart({ metalicas, naoMetalicas }) {
  const data = [
    { name: 'Metálicas', value: metalicas, color: TIPOS.METALICA.color },
    { name: 'Não metálicas', value: naoMetalicas, color: TIPOS.NAO_METALICA.color },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Props: bins (resultado de histogram)
export function HistogramChart({ bins }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={bins} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
        <XAxis dataKey="faixa" tick={AXIS} />
        <YAxis tick={AXIS} allowDecimals={false} />
        <Tooltip formatter={(v) => [v, 'Leituras']} labelFormatter={(l) => `Nível ${l}%`} />
        <Bar dataKey="quantidade" fill="var(--mt-metal)" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
