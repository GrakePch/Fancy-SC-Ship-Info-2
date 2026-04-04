import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Dot,
  Label,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dmgTypeToColor from "../../assets/damageTypeToColor";

type LinePoint = {
  x: number;
  y: number;
};

type PersonalWeaponChartsProps = {
  ammunition?: WeaponAmmunition;
};

export default function PersonalWeaponCharts({ ammunition }: PersonalWeaponChartsProps) {
  const { t: tUi } = useTranslation("ui");
  const damageStats = ammunition?.DamageStats ?? {};
  const damageTypes = Object.keys(damageStats);
  const hasDamageData = damageTypes.length > 0;

  const lineData = useMemo<Record<string, LinePoint[]>>(() => {
    if (!ammunition?.DamageStats) return {};

    const output: Record<string, LinePoint[]> = {};
    for (const dmgType of Object.keys(ammunition.DamageStats)) {
      const stat = ammunition.DamageStats[dmgType as DamageType];
      if (!stat) continue;
      const maxDmg = stat.ImpactDamage ?? 0;
      const minDmg = stat.MinDamage ?? maxDmg;
      const startDrop = stat.DistanceStartDrop ?? 0;
      const dropPerMeter = stat.DropPerMeter ?? 0;

      const points: LinePoint[] = [];
      let dmg = maxDmg;
      for (let x = 0; x <= 500; x += 1) {
        if (x > startDrop && dmg > minDmg) {
          dmg -= dropPerMeter;
        }
        points.push({ x, y: Math.max(Math.round(dmg * 100) / 100, minDmg) });
      }
      output[dmgType] = points;
    }
    return output;
  }, [ammunition]);

  const dropEnd = useMemo<Record<string, number>>(() => {
    if (!ammunition?.DamageStats) return {};
    const result: Record<string, number> = {};
    for (const dmgType of Object.keys(ammunition.DamageStats)) {
      const stat = ammunition.DamageStats[dmgType as DamageType];
      if (!stat) continue;
      const max = stat.ImpactDamage ?? 0;
      const min = stat.MinDamage ?? max;
      const minDistance = stat.DistanceStartDrop ?? 0;
      const dropPerMeter = stat.DropPerMeter ?? 0;
      if (dropPerMeter <= 0) {
        result[dmgType] = minDistance;
      } else {
        result[dmgType] = Math.round(minDistance + (max - min) / dropPerMeter);
      }
    }
    return result;
  }, [ammunition]);

  return (
    <div className="damage-drop-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 40, left: -16, bottom: 0 }}>
          <CartesianGrid />
          <XAxis dataKey="x" type="number" domain={[0, 500]} tick={false} />
          <YAxis dataKey="y" type="number" domain={[0, (dataMax: number) => (dataMax * 1.2)]} tick={false} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          {hasDamageData &&
            damageTypes.flatMap((dmgType) => {
              const stat = damageStats[dmgType as DamageType];
              if (!stat) return [];
              return [
              <ReferenceLine
                key={"y1_" + dmgType}
                y={stat.ImpactDamage ?? 0}
                label={
                  <Label
                    value={stat.ImpactDamage ?? 0}
                    position="left"
                    offset={8}
                    style={{ fill: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor], fontWeight: 600 }}
                  />
                }
                strokeWidth={0}
              />,
              <ReferenceLine
                key={"y2_" + dmgType}
                y={stat.MinDamage ?? 0}
                label={
                  <Label
                    value={stat.MinDamage ?? 0}
                    position="right"
                    offset={8}
                    style={{ fill: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor], fontWeight: 600 }}
                  />
                }
                strokeWidth={0}
              />,
              <ReferenceLine
                key={"x1_" + dmgType}
                x={stat.DistanceStartDrop ?? 0}
                label={
                  <Label
                    value={stat.DistanceStartDrop ?? 0}
                    position="bottom"
                    offset={8}
                    style={{ fill: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor], fontWeight: 600 }}
                  />
                }
                strokeDasharray="3 3"
                stroke={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]}
              />,
              <ReferenceLine
                key={"x2_" + dmgType}
                x={dropEnd[dmgType]}
                label={
                  <Label
                    value={dropEnd[dmgType]}
                    position="bottom"
                    offset={8}
                    style={{ fill: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor], fontWeight: 600 }}
                  />
                }
                strokeDasharray="3 3"
                stroke={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]}
              />,
              <Scatter
                key={"s_" + dmgType}
                data={lineData[dmgType]}
                name={tUi(dmgType, { defaultValue: dmgType })}
                fill={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]}
                shape={<Dot r={2} />}
                isAnimationActive={false}
              />,
            ];
            })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
