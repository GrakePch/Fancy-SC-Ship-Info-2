declare global {
  type SpvPersonalWeaponSubType = "Knife" | "Large" | "Gadget" | "Medium" | "Grenade" | "Small";

  interface SpvPersonalWeaponManufacturer {
    Code: string;
    Name: string;
  }

  interface SpvPersonalWeaponHeatController {
    EnableHeat: boolean;
    InitialTemperature: number;
    PoweredAmbientCoolingMultiplier: number;
    MinOperatingTemperature: number;
    MinCoolingTemperature: number;
    Signature: {
      EnableSignature: boolean;
      MinTemperatureForIR: number;
      TemperatureToIR: number;
      StartIREmission: number;
    };
    Overheat: {
      EnableOverheat: boolean;
      MaxTemperature: number;
      WarningTemperature: number;
      RecoveryTemperature: number;
    };
  }

  interface SpvPersonalWeaponDurability {
    Lifetime: number;
  }

  interface SpvPersonalWeaponSpread {
    Min: number;
    Max: number;
    FirstAttack: number;
    PerAttack: number;
    Decay: number;
  }

  type SpvDamageType = "Physical" | "Energy" | "Distortion" | "Thermal" | "Stun";
  type SpvPersonalWeaponDamageMap = Partial<Record<SpvDamageType, number>>;
  type SpvPersonalWeaponLocalisedName =
    | "[SEMI]"
    | "[AUTO]"
    | "[CHARGE]"
    | "[BURST]"
    | "[SHOTGUN]"
    | "Tractor"
    | "@LOC_PLACEHOLDER";

  interface SpvPersonalWeaponAimModifier {
    SpreadModifier: SpvPersonalWeaponSpread;
  }

  interface SpvPersonalWeaponFireChargedParameters {
    ChargeTime: number;
    OverchargeTime: number;
    OverchargedTime: number;
    Cooldown: number;
    FireOnFullCharge: boolean;
    FireOnlyOnFullCharge: boolean;
    Modifiers: {
      DamageMultiplier: number;
      DamageOverTimeMultiplier: number;
      FireRateMultiplier: number;
      ProjectileSpeedMultiplier: number;
    };
  }

  interface SpvPersonalWeaponBeamConfig {
    HitType: string;
    FullDamageRange: number;
    ZeroDamageRange: number;
    HitRadius: number;
    HeatPerSecond: number;
    WearPerSecond: number;
    MinEnergyDraw: number;
    MaxEnergyDraw: number;
    ChargeUpTime: number;
    ChargeDownTime: number;
  }

  type SpvPersonalWeaponFireType =
    | "single"
    | "rapid"
    | "sequence"
    | "charged"
    | "beam"
    | "rapidBeam"
    | "tractorbeam"
    | "burst 3"
    | "burst 5";

  interface SpvPersonalWeaponActionBase {
    Name: string;
    LocalisedName: SpvPersonalWeaponLocalisedName;
    DamagePerSecond: SpvPersonalWeaponDamageMap;
  }

  interface SpvPersonalWeaponSingleLikeAction extends SpvPersonalWeaponActionBase {
    FireType: "single" | "sequence" | "charged" | "burst 3" | "burst 5";
    DamagePerShot?: SpvPersonalWeaponDamageMap;
    RoundsPerMinute: number;
    AmmoPerShot: number;
    PelletsPerShot: number;
    HeatPerShot: number;
    WearPerShot: number;
    Spread: SpvPersonalWeaponSpread;
    AimModifier: SpvPersonalWeaponAimModifier;
  }

  interface SpvPersonalWeaponSingleAction extends SpvPersonalWeaponSingleLikeAction {
    FireType: "single";
    DamagePerShot: SpvPersonalWeaponDamageMap;
  }

  interface SpvPersonalWeaponSequenceAction extends SpvPersonalWeaponSingleLikeAction {
    FireType: "sequence";
    DamagePerShot: SpvPersonalWeaponDamageMap;
    ShotPerAction?: number;
    ShotPerSequence?: number;
  }

  interface SpvPersonalWeaponBurstAction extends SpvPersonalWeaponSingleLikeAction {
    FireType: "burst 3" | "burst 5";
    DamagePerShot: SpvPersonalWeaponDamageMap;
    ShotPerAction: number;
  }

  interface SpvPersonalWeaponRapidAction extends SpvPersonalWeaponActionBase {
    FireType: "rapid";
    DamagePerShot: SpvPersonalWeaponDamageMap;
    RoundsPerMinute: number;
    AmmoPerShot: number;
    PelletsPerShot: number;
    HeatPerShot: number;
    WearPerShot: number;
    Spread: SpvPersonalWeaponSpread;
    AimModifier: SpvPersonalWeaponAimModifier;
    SpinUpTime: number;
    SpinDownTime: number;
  }

  interface SpvPersonalWeaponChargedAction extends SpvPersonalWeaponSingleLikeAction {
    FireType: "charged";
    DamagePerShot: SpvPersonalWeaponDamageMap;
    FireChargedParameters: SpvPersonalWeaponFireChargedParameters;
    AmmoSpeed?: number;
    AmmoRange?: number;
    AimModifier?: SpvPersonalWeaponAimModifier;
  }

  interface SpvPersonalWeaponBeamAction extends SpvPersonalWeaponActionBase {
    FireType: "beam";
    RoundsPerMinute: number;
    AmmoPerShot: number;
    PelletsPerShot: number;
    HeatPerShot: number;
    WearPerShot: number;
    Spread: SpvPersonalWeaponSpread;
    Beam: SpvPersonalWeaponBeamConfig;
  }

  interface SpvPersonalWeaponTractorBeamAction extends SpvPersonalWeaponActionBase {
    FireType: "tractorbeam";
    DamagePerShot: SpvPersonalWeaponDamageMap;
    RoundsPerMinute: number;
    AmmoPerShot: number;
    PelletsPerShot: number;
    HeatPerShot: number;
    WearPerShot: number;
  }

  interface SpvPersonalWeaponRapidBeamAction extends SpvPersonalWeaponActionBase {
    FireType: "rapidBeam";
    DamagePerShot: SpvPersonalWeaponDamageMap;
    DefaultWeaponAction?: Omit<SpvPersonalWeaponAction, "DefaultWeaponAction" | "ConditionalWeaponActions">;
    ConditionalWeaponActions?: Omit<SpvPersonalWeaponAction, "DefaultWeaponAction" | "ConditionalWeaponActions">;
  }

  type SpvPersonalWeaponAction =
    | SpvPersonalWeaponSingleAction
    | SpvPersonalWeaponRapidAction
    | SpvPersonalWeaponSequenceAction
    | SpvPersonalWeaponChargedAction
    | SpvPersonalWeaponBeamAction
    | SpvPersonalWeaponRapidBeamAction
    | SpvPersonalWeaponTractorBeamAction
    | SpvPersonalWeaponBurstAction;

  interface SpvPersonalWeaponAmmunition {
    Speed: number;
    LifeTime: number;
    Range: number;
    Size: number;
    Penetration: {
      BasePenetrationDistance: number;
      NearRadius: number;
      FarRadius: number;
    };
    ImpactDamage: SpvPersonalWeaponDamageMap;
    DamageDrop: {
      MinDistance: SpvPersonalWeaponDamageMap;
      DropPerMeter: SpvPersonalWeaponDamageMap;
      MinDamage: SpvPersonalWeaponDamageMap;
    };
    ExplosionRadiusMin?: number;
    ExplosionRadiusMax?: number;
    DetonationDamage?: SpvPersonalWeaponDamageMap;
  }

  interface SpvPersonalWeaponRepool {
    AmmoPerSecond: number;
    MagMergeDuration: number;
    UnstowMagDuration: number;
  }

  interface SpvPersonalWeaponWeaponModifier {
    AimModifier: {
      ZoomScale: number;
      SecondZoomScale: number;
      ZoomTimeScale: number;
    };
    RecoilModifier: {
      RecoilMultiplier: number;
      DecayMultiplier: number;
      AimRecoilModifier: {
        RandomPitchMultiplier: number;
        RandomYawMultiplier: number;
        DecayMultiplier: number;
        CurveRecoil: {
          PitchMaxDegrees: number;
          YawMaxDegrees: number;
          RollMaxDegrees: number;
        };
      };
    };
    SpreadModifier: SpvPersonalWeaponSpread;
    DamageMultiplier: number;
    DamageOverTimeMultiplier: number;
    FireRateMultiplier: number;
    ProjectileSpeedMultiplier: number;
    ChargeTimeMultiplier: number;
    AmmoCostMultiplier: number;
    HeatGenerationMultiplier: number;
    BarrelEffectsStrength: number;
    SoundRadiusMultiplier: number;
  }

  interface SpvPersonalWeaponInstalledItem {
    Class: string;
    ClassName: string;
    Description: string;
    Grade: number;
    HeatController: SpvPersonalWeaponHeatController;
    Manufacturer: SpvPersonalWeaponManufacturer;
    Mass: number;
    Name: string;
    Size: number;
    Type: string;
    Volume?: number;
    Tags?: string[];
    Magazine?: {
      Capacity: number;
      AllowRepool: boolean;
    };
    Missile?: {
      ArmTime: number;
      BoostPhaseDuration: number;
      FuelTankSize: number;
      IgniteTime: number;
      LockAngle: number;
      LockRangeMax: number;
      LockRangeMin: number;
      LockRate: number;
      LockTime: number;
      MaxDistance: number;
      MaxLifeTime: number;
      MinLockRatio: number;
      MinTrackingSignal: number;
      SafetyDistance: number;
      Speed: number;
      TerminalPhaseEngagementAngle: number;
      TerminalPhaseEngagementTime: number;
      TrackingSignal: number;
      Explosion: {
        MinRadius: number;
        MaxRadius: number;
        Proximity: number;
        Damage: SpvPersonalWeaponDamageMap;
      };
    };
    WeaponModifier?: SpvPersonalWeaponWeaponModifier;
    Ports?: SpvPersonalWeaponPort[];
  }

  interface SpvPersonalWeaponPort {
    PortName: string;
    MinSize: number;
    MaxSize: number;
    Tags: string[];
    Flags: string[];
    RequiredTags?: string[];
    PortTags?: string[];
    Types?: string[];
    Loadout?: string;
    InstalledItem?: SpvPersonalWeaponInstalledItem;
  }

  interface SpvPersonalWeaponWeapon {
    Firing: SpvPersonalWeaponAction[];
    Repool: SpvPersonalWeaponRepool;
    Ammunition?: SpvPersonalWeaponAmmunition;
    HeatParameters?: {
      MinTemp: number;
      OverheatTemp: number;
      TempAfterOverheatFix: number;
      OverheatFixTime: number;
      TimeTillCoolingStarts: number;
      CoolingPerSecond: number;
    };
    Consumption?: {
      MaxAmmo: number;
      RequestedAmmoLoad: number;
      CostPerBullet: number;
      RequestedRegenPerSec: number;
      MaxRegenPerSec: number;
      Cooldown: number;
    };
  }

  interface SpvPersonalWeaponStdItemBase {
    ClassName: string;
    Size: number;
    Mass: number;
    Volume: number;
    Grade: number;
    Type: string;
    Classification: string;
    Name: string;
    Tags: string[];
    HeatController: SpvPersonalWeaponHeatController;
    Class?: string;
    Description?: string;
    Manufacturer?: SpvPersonalWeaponManufacturer;
  }

  interface SpvPersonalWeaponKnifeStdItem extends SpvPersonalWeaponStdItemBase {
    Type: "WeaponPersonal.Knife";
  }

  interface SpvPersonalWeaponLargeStdItem extends SpvPersonalWeaponStdItemBase {
    Type: "WeaponPersonal.Large";
    Durability: SpvPersonalWeaponDurability;
    Ports: SpvPersonalWeaponPort[];
    Weapon: SpvPersonalWeaponWeapon;
  }

  interface SpvPersonalWeaponMediumStdItem extends SpvPersonalWeaponStdItemBase {
    Type: "WeaponPersonal.Medium";
    Weapon: SpvPersonalWeaponWeapon;
    Ports: SpvPersonalWeaponPort[];
    Durability?: SpvPersonalWeaponDurability;
  }

  interface SpvPersonalWeaponSmallStdItem extends SpvPersonalWeaponStdItemBase {
    Type: "WeaponPersonal.Small";
    Weapon: SpvPersonalWeaponWeapon;
    Ports: SpvPersonalWeaponPort[];
    Durability: SpvPersonalWeaponDurability;
    TractorBeam?: {
      Tractor: Record<string, number>;
      Towing: Record<string, number>;
    };
  }

  interface SpvPersonalWeaponGrenadeStdItem extends SpvPersonalWeaponStdItemBase {
    Type: "WeaponPersonal.Grenade";
    Explosive: {
      RadiusMin: number;
      RadiusMax: number;
      DetonationDelay: number;
      Pressure: number;
      Damage: Pick<Record<SpvDamageType, number>, "Physical">;
    };
  }

  interface SpvPersonalWeaponGadgetStdItem extends SpvPersonalWeaponStdItemBase {
    Type: "WeaponPersonal.Gadget";
    Ports: SpvPersonalWeaponPort[];
    Weapon: SpvPersonalWeaponWeapon;
    Durability?: SpvPersonalWeaponDurability;
    MiningLaser?: {
      Firing: {
        LaserPower: number;
        MinDamageDistance: number;
        FullDamageDistance: number;
      }[];
      ThrottleMinimum: number;
      ThrottleLerpSpeed: number;
    };
    Radar?: {
      AimAssist: {
        DistanceMin: number;
        DistanceMax: number;
        OutsideRangeBufferDistance: number;
      };
      EM: SpvPersonalWeaponRadarSignal;
      IR: SpvPersonalWeaponRadarSignal;
      CS: SpvPersonalWeaponRadarSignal;
      DB: SpvPersonalWeaponRadarSignal;
      ID: SpvPersonalWeaponRadarSignal;
      RS: SpvPersonalWeaponRadarSignal;
      Scan1: SpvPersonalWeaponRadarSignal;
      Scan2: SpvPersonalWeaponRadarSignal;
    };
    TractorBeam?: {
      Tractor: Record<string, number>;
      Towing: Record<string, number>;
    };
    WeaponModifier?: SpvPersonalWeaponWeaponModifier;
  }

  interface SpvPersonalWeaponRadarSignal {
    Sensitivity: number;
    GroundSensitivity: number;
    Piercing: number;
    PermitPassiveDetection: boolean;
    PermitActiveDetection: boolean;
  }

  interface SpvPersonalWeaponBase {
    className: string;
    reference: string;
    itemName: string;
    type: "WeaponPersonal";
    subType: SpvPersonalWeaponSubType;
    tags: string;
    requiredTags: string;
    size: number;
    grade: number;
    name: string;
    classification: string;
    manufacturer?: string;
  }

  interface SpvPersonalWeaponKnife extends SpvPersonalWeaponBase {
    subType: "Knife";
    stdItem: SpvPersonalWeaponKnifeStdItem;
  }

  interface SpvPersonalWeaponLarge extends SpvPersonalWeaponBase {
    subType: "Large";
    stdItem: SpvPersonalWeaponLargeStdItem;
  }

  interface SpvPersonalWeaponGadget extends SpvPersonalWeaponBase {
    subType: "Gadget";
    stdItem: SpvPersonalWeaponGadgetStdItem;
  }

  interface SpvPersonalWeaponMedium extends SpvPersonalWeaponBase {
    subType: "Medium";
    stdItem: SpvPersonalWeaponMediumStdItem;
  }

  interface SpvPersonalWeaponGrenade extends SpvPersonalWeaponBase {
    subType: "Grenade";
    stdItem: SpvPersonalWeaponGrenadeStdItem;
  }

  interface SpvPersonalWeaponSmall extends SpvPersonalWeaponBase {
    subType: "Small";
    stdItem: SpvPersonalWeaponSmallStdItem;
  }

  type SpvPersonalWeapon =
    | SpvPersonalWeaponKnife
    | SpvPersonalWeaponLarge
    | SpvPersonalWeaponGadget
    | SpvPersonalWeaponMedium
    | SpvPersonalWeaponGrenade
    | SpvPersonalWeaponSmall;
}

export {};
