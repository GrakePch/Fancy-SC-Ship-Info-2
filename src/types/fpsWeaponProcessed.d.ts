declare global {
  type DamageType = "Physical" | "Energy" | "Distortion" | "Stun" | "Thermal";
  type FiringDamageType = "Physical" | "Energy" | "Distortion" | "Stun";
  type WeaponFiringLocalisedName = "@LOC_PLACEHOLDER" | "[AUTO]" | "[BURST]" | "[CHARGE]" | "[SEMI]" | "[SHOTGUN]";
  type WeaponPersonalSubType = "Large" | "Medium" | "Small";
  type WeaponPersonalTag = "HG" | "SMG" | "AR" | "SR" | "SG" | "LMG" | "GL" | "Heavy";
  type WeaponAttachmentSubType =
    | "Barrel"
    | "BottomAttachment"
    | "IronSight"
    | "Magazine"
    | "Missile"
    | "Utility";

  interface PortInfo {
    MinSize: number;
    MaxSize: number;
    DefaultInstalled: string;
  }

  interface WeaponPortGroup {
    Magazine: PortInfo;
    Optics: PortInfo;
    Barrel: PortInfo;
    UnderBarrel: PortInfo;
  }

  type WeaponDamageSummary = Partial<Record<FiringDamageType, number>>;

  interface WeaponFiringMode {
    Name: string;
    LocalisedName: WeaponFiringLocalisedName;
    RoundsPerMinute: number;
    DamagePerShot: WeaponDamageSummary;
    DamagePerSecond: WeaponDamageSummary;
  }

  interface WeaponDamageStat {
    ImpactDamage: number;
    MinDamage: number;
    DistanceStartDrop: number;
    DropPerMeter: number;
  }

  interface WeaponAmmunition {
    Speed: number;
    LifeTime: number;
    Range: number;
    DamageStats: Partial<Record<DamageType, WeaponDamageStat>>;
  }

  interface WeaponPersonal {
    ClassName: string;
    Name: string;
    NameKey: string;
    SubType: WeaponPersonalSubType;
    Tag: WeaponPersonalTag;
    Mass: number;
    Volume: number;
    ManufacturerCode: string;
    ManufacturerName: string;
    MaxDps: number;
    Firing: WeaponFiringMode[];
    Ammunition: WeaponAmmunition;
    Ports: WeaponPortGroup;
    DefaultMagazineCapacity: number;
  }

  interface WeaponAttachment {
    ClassName: string;
    Name: string;
    Size: number;
    SubType: WeaponAttachmentSubType;
  }

  type WeaponPersonalList = WeaponPersonal[];
  type WeaponAttachmentList = WeaponAttachment[];
}

export {};
