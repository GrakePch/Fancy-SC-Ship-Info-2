import { Fragment, useMemo } from "react";
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

type DamageDrop = {
  MinDistance: Record<string, number>;
  DropPerMeter: Record<string, number>;
  MinDamage: Record<string, number>;
};

type WeaponAmmunition = {
  ImpactDamage?: Record<string, number>;
  DamageDrop?: DamageDrop;
};

type LinePoint = {
  x: number;
  y: number;
};

type PersonalWeaponChartsProps = {
  ammunition?: WeaponAmmunition;
};

export default function PersonalWeaponCharts({ ammunition }: PersonalWeaponChartsProps) {
  const { t: tUi } = useTranslation("ui");
  const safeImpactDamage = ammunition?.ImpactDamage ?? {};
  const safeDamageDrop: DamageDrop = ammunition?.DamageDrop ?? {
    MinDistance: {},
    DropPerMeter: {},
    MinDamage: {},
  };
  const hasDamageData = ammunition?.ImpactDamage != null && ammunition?.DamageDrop != null;

  const lineData = useMemo<Record<string, LinePoint[]>>(() => {
    if (!ammunition?.ImpactDamage || !ammunition.DamageDrop) return {};

    const output: Record<string, LinePoint[]> = {};
    for (const dmgType of Object.keys(ammunition.ImpactDamage)) {
      const maxDmg = ammunition.ImpactDamage[dmgType] ?? 0;
      const minDmg = ammunition.DamageDrop.MinDamage[dmgType] ?? maxDmg;
      const startDrop = ammunition.DamageDrop.MinDistance[dmgType] ?? 0;
      const dropPerMeter = ammunition.DamageDrop.DropPerMeter[dmgType] ?? 0;

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
    if (!ammunition?.ImpactDamage || !ammunition.DamageDrop) return {};
    const result: Record<string, number> = {};
    for (const dmgType of Object.keys(ammunition.ImpactDamage)) {
      const max = ammunition.ImpactDamage[dmgType] ?? 0;
      const min = ammunition.DamageDrop.MinDamage[dmgType] ?? max;
      const minDistance = ammunition.DamageDrop.MinDistance[dmgType] ?? 0;
      const dropPerMeter = ammunition.DamageDrop.DropPerMeter[dmgType] ?? 0;
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
      <center>功能维护中</center>
      {false && (<ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 40, left: -16, bottom: 0 }}>
          <CartesianGrid />
          <XAxis dataKey="x" type="number" domain={[0, 500]} ticks={[0, 500]} />
          <YAxis dataKey="y" type="number" domain={[0, 70]} ticks={[0]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          {hasDamageData &&
            Object.keys(safeImpactDamage).map((dmgType) => (
              <Fragment key={dmgType}>
                <ReferenceLine
                  y={safeImpactDamage[dmgType] ?? 0}
                  label={
                    <Label
                      value={safeImpactDamage[dmgType] ?? 0}
                      position="left"
                      offset={8}
                      style={{ fill: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor], fontWeight: 600 }}
                    />
                  }
                  strokeWidth={0}
                />
                <ReferenceLine
                  y={safeDamageDrop.MinDamage[dmgType] ?? 0}
                  label={
                    <Label
                      value={safeDamageDrop.MinDamage[dmgType] ?? 0}
                      position="right"
                      offset={8}
                      style={{ fill: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor], fontWeight: 600 }}
                    />
                  }
                  strokeWidth={0}
                />
                <ReferenceLine
                  x={safeDamageDrop.MinDistance[dmgType] ?? 0}
                  label={
                    <Label
                      value={safeDamageDrop.MinDistance[dmgType] ?? 0}
                      position="bottom"
                      offset={8}
                      style={{ fill: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor], fontWeight: 600 }}
                    />
                  }
                  strokeDasharray="3 3"
                  stroke={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]}
                />
                <ReferenceLine
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
                />
                <Scatter
                  data={lineData[dmgType]}
                  name={tUi(dmgType, { defaultValue: dmgType })}
                  fill={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]}
                  shape={<Dot r={2} />}
                  isAnimationActive={false}
                />
              </Fragment>
            ))}
        </ScatterChart>
      </ResponsiveContainer>)}
    </div>
  );
}
