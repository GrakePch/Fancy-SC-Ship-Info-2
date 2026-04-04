import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  ComposedChart,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import dmgTypeToColor from "../../assets/damageTypeToColor";

type LinePoint = {
  x: number;
  y: number;
};

type VerticalReferenceLabelProps = {
  value?: string | number;
  fill?: string;
  viewBox?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
};

const X_AXIS_CURVATURE = 100;
const DEFAULT_SAMPLE_MAX_DISTANCE = 500;
const TARGET_SAMPLE_POINTS = 50;
const DAMAGE_TYPE_ORDER: DamageType[] = ["Physical", "Energy", "Distortion", "Stun", "Thermal"];

function distanceToAxisX(distance: number, maxDistance: number) {
  if (distance <= 0) return 0;
  const safeMaxDistance = Math.max(1, maxDistance);
  const denominator = safeMaxDistance / (safeMaxDistance + X_AXIS_CURVATURE);
  return (distance / (distance + X_AXIS_CURVATURE)) / denominator * safeMaxDistance;
}

function axisXToDistance(axisX: number, maxDistance: number) {
  if (axisX <= 0) return 0;
  const safeMaxDistance = Math.max(1, maxDistance);
  if (axisX >= safeMaxDistance) return safeMaxDistance;
  return (axisX * X_AXIS_CURVATURE) / (safeMaxDistance + X_AXIS_CURVATURE - axisX);
}


function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function VerticalReferenceLabel({ value, fill = "var(--color-text-1)", viewBox }: VerticalReferenceLabelProps) {
  if (value === undefined || value === null || !viewBox) return null;

  const x = (viewBox.x ?? 0);
  const y = (viewBox.y ?? 0) + (viewBox.height ?? 0) - 6;

  return (
    <text
      x={x}
      y={y}
      dy="1em"
      fill={fill}
      fontWeight={500}
      transform={`rotate(90 ${x} ${y})`}
      textAnchor="end"
      fontSize={"0.875rem"}
    >
      {value}
    </text>
  );
}

type PersonalWeaponChartsProps = {
  ammunition?: WeaponAmmunition;
};

export default function PersonalWeaponCharts({ ammunition }: PersonalWeaponChartsProps) {
  const { t: tUi } = useTranslation("ui");
  const damageStats = ammunition?.DamageStats ?? {};
  const damageTypes = DAMAGE_TYPE_ORDER.filter((type) => type !== "Stun" && Boolean(damageStats[type]));
  const hasDamageData = damageTypes.length > 0;
  const sampleMaxDistance = Math.max(0, Math.round(ammunition?.Range ?? DEFAULT_SAMPLE_MAX_DISTANCE));
  const maxRangeAxisX = distanceToAxisX(sampleMaxDistance, sampleMaxDistance);
  const getDamageTypeLabel = (dmgType: string) =>
    tUi(`DamageType.${dmgType}`, { defaultValue: tUi(dmgType, { defaultValue: dmgType }) });

  const lineData = useMemo<Record<string, LinePoint[]>>(() => {
    if (!ammunition?.DamageStats) return {};

    const output: Record<string, LinePoint[]> = {};
    const axisMax = distanceToAxisX(sampleMaxDistance, sampleMaxDistance);

    for (const dmgType of damageTypes) {
      const stat = ammunition.DamageStats[dmgType as DamageType];
      if (!stat) continue;
      const maxDmg = stat.ImpactDamage;
      const minDmg = stat.MinDamage;
      const startDrop = stat.DistanceStartDrop;
      const dropPerMeter = stat.DropPerMeter;
      const dropEndDistance =
        dropPerMeter > 0 ? Math.round(startDrop + (maxDmg - minDmg) / dropPerMeter) : startDrop;

      const sampledDistances = new Set<number>();
      for (let i = 0; i < TARGET_SAMPLE_POINTS; i += 1) {
        const axisX = TARGET_SAMPLE_POINTS > 1 ? (i / (TARGET_SAMPLE_POINTS - 1)) * axisMax : 0;
        const distance = axisXToDistance(axisX, sampleMaxDistance);
        if (!Number.isFinite(distance)) continue;
        sampledDistances.add(Math.round(distance));
      }

      sampledDistances.add(0);
      sampledDistances.add(Math.round(startDrop));
      sampledDistances.add(Math.round(dropEndDistance));
      sampledDistances.add(sampleMaxDistance);

      const sortedDistances = [...sampledDistances]
        .filter((distance) => distance >= 0 && distance <= sampleMaxDistance)
        .sort((a, b) => a - b);

      const points: LinePoint[] = sortedDistances.map((distance) => {
        const dropDistance = Math.max(0, distance - startDrop);
        const damage = Math.max(minDmg, maxDmg - dropDistance * dropPerMeter);
        return { x: distanceToAxisX(distance, sampleMaxDistance), y: round2(damage) };
      });

      output[dmgType] = points;
    }
    return output;
  }, [ammunition, damageTypes, sampleMaxDistance]);

  const effectiveMinDamage = useMemo<Record<string, number>>(() => {
    if (!ammunition?.DamageStats) return {};
    const result: Record<string, number> = {};

    for (const dmgType of damageTypes) {
      const stat = ammunition.DamageStats[dmgType as DamageType];
      if (!stat) continue;

      const dropDistance = Math.max(0, sampleMaxDistance - stat.DistanceStartDrop);
      const minAtRange = Math.max(stat.MinDamage, stat.ImpactDamage - dropDistance * stat.DropPerMeter);
      result[dmgType] = round2(minAtRange);
    }

    return result;
  }, [ammunition, damageTypes, sampleMaxDistance]);

  const dropEnd = useMemo<Record<string, number>>(() => {
    if (!ammunition?.DamageStats) return {};
    const result: Record<string, number> = {};
    for (const dmgType of damageTypes) {
      const stat = ammunition.DamageStats[dmgType as DamageType];
      if (!stat) continue;
      const max = stat.ImpactDamage;
      const min = stat.MinDamage;
      const minDistance = stat.DistanceStartDrop;
      const dropPerMeter = stat.DropPerMeter;
      if (dropPerMeter <= 0) {
        result[dmgType] = minDistance;
      } else {
        result[dmgType] = Math.round(minDistance + (max - min) / dropPerMeter);
      }
    }
    return result;
  }, [ammunition, damageTypes]);

  return (
    <div className="damage-drop-chart">
      <div className={`damage-drop-legend${damageTypes.length > 1 ? " is-horizontal" : ""}`}>
        {damageTypes.map((dmgType) => (
          <div key={`legend_${dmgType}`} className="damage-drop-legend-item">
            <span
              className="damage-drop-legend-dot"
              style={{ backgroundColor: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor] }}
            />
            <span style={{ color: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor] }}>
              {getDamageTypeLabel(dmgType)}
            </span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            {damageTypes.map((dmgType) => (
              <linearGradient key={`fillGradient_${dmgType}`} id={`fillGradient_${dmgType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="x" type="number" domain={[0, sampleMaxDistance]} tick={false} height={0} />
          <YAxis dataKey="y" type="number" domain={[0, (dataMax: number) => (dataMax * 1.2)]} tick={false} width={0} />

          {hasDamageData &&
            damageTypes.map((dmgType) => (
              <Area
                key={"a_" + dmgType}
                data={lineData[dmgType]}
                name={dmgType}
                dataKey="y"
                type="linear"
                stroke={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]}
                strokeWidth={3}
                fill={`url(#fillGradient_${dmgType})`}
                baseValue={0}
                dot={false}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            ))}

          {hasDamageData &&
            damageTypes.flatMap((dmgType) => {
              const stat = damageStats[dmgType as DamageType]!;
              return [
                <ReferenceLine
                  key={"maxDamage_" + dmgType}
                  y={stat.ImpactDamage}
                  label={
                    <Label
                      value={stat.ImpactDamage}
                      position="insideBottomLeft"
                      offset={6}
                      style={{ fill: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor], fontWeight: 600 }}
                    />
                  }
                  strokeWidth={0}
                />,
                <ReferenceLine
                  key={"minDamage_" + dmgType}
                  y={effectiveMinDamage[dmgType]}
                  label={
                    <Label
                      value={effectiveMinDamage[dmgType]}
                      position="insideBottomRight"
                      offset={6}
                      style={{ fill: dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor], fontWeight: 600 }}
                    />
                  }
                  strokeWidth={0}
                />,
                stat.DistanceStartDrop > 0 ? (
                  <ReferenceLine
                    key={"dropStart_" + dmgType}
                    x={distanceToAxisX(stat.DistanceStartDrop, sampleMaxDistance)}
                    label={
                      <Label
                        value={`${stat.DistanceStartDrop}m`}
                        position="insideBottomRight"
                        content={<VerticalReferenceLabel />}
                      />
                    }
                    strokeDasharray="3 3"
                    stroke={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]}
                  />
                ) : null,
                dropEnd[dmgType] > 0 &&
                dropEnd[dmgType] <= sampleMaxDistance &&
                dropEnd[dmgType] - stat.DistanceStartDrop >= 5 ? (
                  <ReferenceLine
                    key={"dropEnd_" + dmgType}
                    x={distanceToAxisX(dropEnd[dmgType], sampleMaxDistance)}
                    label={
                      <Label
                        value={`${dropEnd[dmgType]}m`}
                        position="insideBottomRight"
                        content={<VerticalReferenceLabel />}
                      />
                    }
                    strokeDasharray="3 3"
                    stroke={dmgTypeToColor[dmgType as keyof typeof dmgTypeToColor]}
                  />
                ) : null,
              ];
            })}

          <ReferenceLine
            x={maxRangeAxisX}
            label={
              <Label
                value={`${sampleMaxDistance}m`}
                position="insideBottomRight"
                content={<VerticalReferenceLabel />}
              />
            }
            strokeWidth={0}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
