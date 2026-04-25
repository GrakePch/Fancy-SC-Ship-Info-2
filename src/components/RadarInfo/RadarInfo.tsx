import styles from "./RadarInfo.module.css";
import { useTranslation } from "react-i18next";
import Icon from "@mdi/react";
import icons from "../../assets/icons";

type RadarInfoProps = {
  radarPort: SpvPort;
  vItem?: any;
};

const RadarInfo = ({ radarPort, vItem }: RadarInfoProps) => {
  const { t } = useTranslation();
  const { t: tvi } = useTranslation("vehicle_item");

  const name = vItem?.stdItem?.Name || radarPort?.BaseLoadout?.Name || t("Radar.Unknown");
  const nameKey = vItem?.stdItem?.ClassName || radarPort?.BaseLoadout?.ClassName || radarPort?.Loadout;
  const size = vItem?.stdItem?.Size ?? radarPort?.Size ?? radarPort?.MaxSize;
  const gradePrimary = vItem?.stdItem?.Class || radarPort?.BaseLoadout?.Class || "?";
  const gradeNumeric = vItem?.stdItem?.Grade || radarPort?.BaseLoadout?.Grade;
  const gradeSecondary = gradeNumeric ? String.fromCharCode(64 + gradeNumeric) : "?";
  const grade = `${t(gradePrimary, { defaultValue: gradePrimary })} - ${gradeSecondary}`;
  const maxLockRange = vItem?.stdItem?.Radar?.AimAssist?.DistanceMax;
  const maxLockRangeDisplay =
    maxLockRange === undefined
      ? "-"
      : Number.isInteger(maxLockRange)
        ? `${maxLockRange.toFixed(0)} m`
        : `${maxLockRange.toFixed(1)} m`;
  const sensitivityIR = vItem?.stdItem?.Radar?.IR?.Sensitivity;
  const sensitivityEM = vItem?.stdItem?.Radar?.EM?.Sensitivity;
  const sensitivityCS = vItem?.stdItem?.Radar?.CS?.Sensitivity;
  const sensitivityRS = vItem?.stdItem?.Radar?.RS?.Sensitivity;
  const formatSensitivity = (value: number | undefined) =>
    value === undefined ? "-" : `${(value * 100).toFixed(0)}%`;

  return (
    <div className={styles.container}>
      <div className={styles.sectionInstalledInfo}>
        <Icon path={icons.radar} size="1.5rem" />
        <div className={styles.name}>{tvi(nameKey, { defaultValue: name })}</div>
        <div
          className={styles.grade}
          style={{
            color: gradePrimary ? `var(--color-${gradePrimary.toLocaleLowerCase()})` : "inherit",
          }}
        >
          {grade}
        </div>
        {size !== undefined && <div className={styles.icon}>S{size}</div>}
      </div>

      <div className={styles.sectionCommonInfo}>
        <div className={styles.commonKeyValue}>
          <Icon path={""} />
          <div>{t("Radar.MaxLockRange")}</div>
          <div>{maxLockRangeDisplay}</div>
        </div>
        <div className={styles.commonKeyValue}>
          <Icon path={icons.emission_type_ir} />
          <div>{t("Radar.InfraredSensitivity")}</div>
          <div>{formatSensitivity(sensitivityIR)}</div>
        </div>
        <div className={styles.commonKeyValue}>
          <Icon path={icons.emission_type_em} />
          <div>{t("Radar.ElectromagneticSensitivity")}</div>
          <div>{formatSensitivity(sensitivityEM)}</div>
        </div>
        <div className={styles.commonKeyValue}>
          <Icon path={icons.emission_type_cs} />
          <div>{t("Radar.CrossSectionSensitivity")}</div>
          <div>{formatSensitivity(sensitivityCS)}</div>
        </div>
        <div className={styles.commonKeyValue}>
          <Icon path={icons.radar} />
          <div>{t("Radar.RadarSignatureSensitivity")}</div>
          <div>{formatSensitivity(sensitivityRS)}</div>
        </div>
      </div>
    </div>
  );
};

export default RadarInfo;
