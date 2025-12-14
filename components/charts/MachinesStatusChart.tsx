import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';

interface Machine {
  id: string;
  name: string;
  value: number;
  warning: number;
  critical: number;
}

interface Props {
  machines: Machine[];
}

export default function MachinesStatusChart({ machines }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={machines}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value">
          {machines.map((m) => {
            let color = 'green';
            if (m.value >= m.warning) color = 'orange';
            if (m.value >= m.critical) color = 'red';
            return <Cell key={m.id} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
