import argparse
import json
from pathlib import Path
from typing import Any

WEAPON_PERSONAL_ALLOWED_SUBTYPES = {"Large", "Medium", "Small"}

PORT_NAME_TO_KEY = {
    "magazine_attach": "Magazine",
    "optics_attach": "Optics",
    "barrel_attach": "Barrel",
    "underbarrel_attach": "UnderBarrel",
}


def to_number(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def to_string(value: Any) -> str:
    return value if isinstance(value, str) else ""


def classify_personal_tag(sub_type: str, raw_tags: str) -> str:
    if sub_type == "Small":
        return "HG"
    if sub_type == "Large":
        return "Heavy"
    if sub_type != "Medium":
        return "Other"

    tags = raw_tags.lower()
    if "sniper" in tags:
        return "SR"
    if "rifle" in tags:
        return "AR"
    if "shotgun" in tags:
        return "SG"
    if "smg" in tags:
        return "SMG"
    if "lmg" in tags:
        return "LMG"
    if "glauncher" in tags:
        return "GL"
    return "Other"


def build_damage_summary(damage_map: Any) -> dict[str, float]:
    source = damage_map if isinstance(damage_map, dict) else {}
    result: dict[str, float] = {}
    for damage_type, raw_value in source.items():
        if not isinstance(damage_type, str):
            continue
        value = to_number(raw_value)
        if value != 0:
            result[damage_type] = value
    return result


def default_port_info() -> dict[str, Any]:
    return {
        "MinSize": 0,
        "MaxSize": 0,
        "DefaultInstalled": "",
    }


def extract_ports(std_item: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result = {
        "Magazine": default_port_info(),
        "Optics": default_port_info(),
        "Barrel": default_port_info(),
        "UnderBarrel": default_port_info(),
    }
    ports = std_item.get("Ports")
    if not isinstance(ports, list):
        return result

    for port in ports:
        if not isinstance(port, dict):
            continue
        mapped_key = PORT_NAME_TO_KEY.get(port.get("PortName"))
        if not mapped_key:
            continue
        installed_item = port.get("InstalledItem")
        installed_class_name = ""
        if isinstance(installed_item, dict):
            installed_class_name = to_string(installed_item.get("ClassName"))
        result[mapped_key] = {
            "MinSize": int(to_number(port.get("MinSize"))),
            "MaxSize": int(to_number(port.get("MaxSize"))),
            "DefaultInstalled": installed_class_name or to_string(port.get("Loadout")),
        }
    return result


def extract_default_magazine_capacity(std_item: dict[str, Any]) -> float:
    ports = std_item.get("Ports")
    if not isinstance(ports, list):
        return 0.0

    # Prefer the configured default magazine port.
    for port in ports:
        if not isinstance(port, dict):
            continue
        if to_string(port.get("PortName")) != "magazine_attach":
            continue
        installed_item = port.get("InstalledItem")
        if isinstance(installed_item, dict):
            magazine = installed_item.get("Magazine")
            if isinstance(magazine, dict):
                return to_number(magazine.get("Capacity"))

    # Fallback: any installed magazine attachment that exposes capacity.
    for port in ports:
        if not isinstance(port, dict):
            continue
        installed_item = port.get("InstalledItem")
        if not isinstance(installed_item, dict):
            continue
        if to_string(installed_item.get("Type")) != "WeaponAttachment.Magazine":
            continue
        magazine = installed_item.get("Magazine")
        if isinstance(magazine, dict):
            return to_number(magazine.get("Capacity"))

    return 0.0


def extract_firing(std_item: dict[str, Any]) -> list[dict[str, Any]]:
    weapon = std_item.get("Weapon") if isinstance(std_item.get("Weapon"), dict) else {}
    firing_modes = weapon.get("Firing") if isinstance(weapon.get("Firing"), list) else []

    result: list[dict[str, Any]] = []
    for mode in firing_modes:
        if not isinstance(mode, dict):
            continue
        result.append(
            {
                "Name": to_string(mode.get("Name")),
                "LocalisedName": to_string(mode.get("LocalisedName")),
                "RoundsPerMinute": to_number(mode.get("RoundsPerMinute")),
                "DamagePerShot": build_damage_summary(mode.get("DamagePerShot")),
                "DamagePerSecond": build_damage_summary(mode.get("DamagePerSecond")),
            }
        )
    return result


def extract_ammunition(std_item: dict[str, Any]) -> dict[str, Any]:
    weapon = std_item.get("Weapon") if isinstance(std_item.get("Weapon"), dict) else {}
    ammunition = weapon.get("Ammunition") if isinstance(weapon.get("Ammunition"), dict) else {}
    damage_drop = ammunition.get("DamageDrop") if isinstance(ammunition.get("DamageDrop"), dict) else {}

    impact_damage = ammunition.get("ImpactDamage") if isinstance(ammunition.get("ImpactDamage"), dict) else {}
    min_damage = damage_drop.get("MinDamage") if isinstance(damage_drop.get("MinDamage"), dict) else {}
    min_distance = damage_drop.get("MinDistance") if isinstance(damage_drop.get("MinDistance"), dict) else {}
    drop_per_meter = damage_drop.get("DropPerMeter") if isinstance(damage_drop.get("DropPerMeter"), dict) else {}

    damage_types = set()
    for k, v in impact_damage.items():
        if isinstance(k, str) and to_number(v) != 0:
            damage_types.add(k)
    for k, v in min_damage.items():
        if isinstance(k, str) and to_number(v) != 0:
            damage_types.add(k)
    for k, v in min_distance.items():
        if isinstance(k, str) and to_number(v) != 0:
            damage_types.add(k)
    for k, v in drop_per_meter.items():
        if isinstance(k, str) and to_number(v) != 0:
            damage_types.add(k)

    damage_stats: dict[str, dict[str, float]] = {}
    for damage_type in sorted(damage_types):
        impact_damage_value = to_number(impact_damage.get(damage_type))
        if damage_type in min_damage:
            min_damage_value = to_number(min_damage.get(damage_type))
        else:
            min_damage_value = impact_damage_value
        damage_stats[damage_type] = {
            "ImpactDamage": impact_damage_value,
            "MinDamage": min_damage_value,
            "DistanceStartDrop": to_number(min_distance.get(damage_type)),
            "DropPerMeter": to_number(drop_per_meter.get(damage_type)),
        }

    return {
        "Speed": to_number(ammunition.get("Speed")),
        "LifeTime": to_number(ammunition.get("LifeTime")),
        "Range": to_number(ammunition.get("Range")),
        "DamageStats": damage_stats,
    }


def build_personal_row(item: dict[str, Any]) -> dict[str, Any] | None:
    std_item = item.get("stdItem")
    if not isinstance(std_item, dict):
        return None

    sub_type = to_string(item.get("subType"))
    if sub_type not in WEAPON_PERSONAL_ALLOWED_SUBTYPES:
        return None

    class_name = to_string(std_item.get("ClassName")) or to_string(item.get("className"))
    if not class_name:
        return None

    manufacturer = std_item.get("Manufacturer") if isinstance(std_item.get("Manufacturer"), dict) else {}
    firing = extract_firing(std_item)
    max_dps = 0.0
    for mode in firing:
        damage_per_second = mode.get("DamagePerSecond", {})
        dps = to_number(damage_per_second.get("Physical")) + to_number(damage_per_second.get("Energy"))
        if dps > max_dps:
            max_dps = dps

    return {
        "ClassName": class_name,
        "Name": to_string(std_item.get("Name")) or class_name,
        "NameKey": to_string(item.get("name")).lstrip("@").lower(),
        "SubType": sub_type,
        "Tag": classify_personal_tag(sub_type, to_string(item.get("tags"))),
        "Mass": to_number(std_item.get("Mass")),
        "Volume": to_number(std_item.get("Volume")),
        "ManufacturerCode": to_string(manufacturer.get("Code")),
        "ManufacturerName": to_string(manufacturer.get("Name")),
        "MaxDps": max_dps,
        "Firing": firing,
        "Ammunition": extract_ammunition(std_item),
        "Ports": extract_ports(std_item),
        "DefaultMagazineCapacity": extract_default_magazine_capacity(std_item),
    }


def build_attachment_row(item: dict[str, Any]) -> dict[str, Any] | None:
    std_item = item.get("stdItem")
    if not isinstance(std_item, dict):
        return None

    class_name = to_string(std_item.get("ClassName")) or to_string(item.get("className"))
    if not class_name:
        return None

    return {
        "ClassName": class_name,
        "Name": to_string(std_item.get("Name")) or class_name,
        "Size": int(to_number(std_item.get("Size") if std_item.get("Size") is not None else item.get("size"))),
        "SubType": to_string(item.get("subType")),
    }


def build_attachment_row_from_installed(installed_item: dict[str, Any]) -> dict[str, Any] | None:
    class_name = to_string(installed_item.get("ClassName"))
    if not class_name:
        return None

    raw_type = to_string(installed_item.get("Type"))
    if not raw_type.startswith("WeaponAttachment"):
        return None

    derived_sub_type = ""
    if "." in raw_type:
        derived_sub_type = raw_type.split(".", 1)[1]

    return {
        "ClassName": class_name,
        "Name": to_string(installed_item.get("Name")) or class_name,
        "Size": int(to_number(installed_item.get("Size"))),
        "SubType": derived_sub_type,
    }


def preprocess(input_path: Path, output_dir: Path) -> tuple[int, int]:
    if not input_path.is_file():
        raise SystemExit(f"Input file does not exist: {input_path}")

    with input_path.open("r", encoding="utf-8-sig") as src:
        raw = json.load(src)

    if not isinstance(raw, list):
        raise SystemExit("Expected top-level JSON array in fps-weapon-list.json")

    personal_rows: list[dict[str, Any]] = []
    attachment_by_class: dict[str, dict[str, Any]] = {}

    for item in raw:
        if not isinstance(item, dict):
            continue
        item_type = item.get("type")
        if item_type == "WeaponPersonal":
            row = build_personal_row(item)
            if row:
                personal_rows.append(row)
            std_item = item.get("stdItem")
            if isinstance(std_item, dict):
                for port in std_item.get("Ports") or []:
                    if not isinstance(port, dict):
                        continue
                    installed_item = port.get("InstalledItem")
                    if not isinstance(installed_item, dict):
                        continue
                    nested_attachment = build_attachment_row_from_installed(installed_item)
                    if nested_attachment:
                        attachment_by_class.setdefault(
                            nested_attachment["ClassName"],
                            nested_attachment,
                        )
        elif item_type == "WeaponAttachment":
            row = build_attachment_row(item)
            if row:
                attachment_by_class[row["ClassName"]] = row

    personal_rows.sort(key=lambda x: x["ClassName"])
    attachment_rows = sorted(attachment_by_class.values(), key=lambda x: x["ClassName"])

    output_dir.mkdir(parents=True, exist_ok=True)
    personal_out = output_dir / "fps-weapon-personal-list.json"
    attachment_out = output_dir / "fps-weapon-attachment-list.json"

    with personal_out.open("w", encoding="utf-8") as dst:
        json.dump(personal_rows, dst, indent=2, ensure_ascii=False)
        dst.write("\n")

    with attachment_out.open("w", encoding="utf-8") as dst:
        json.dump(attachment_rows, dst, indent=2, ensure_ascii=False)
        dst.write("\n")

    return len(personal_rows), len(attachment_rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Preprocess fps-weapon-list.json into normalized tables.")
    parser.add_argument(
        "--input",
        default="batchFormatted/fps-weapon-list.json",
        help="Input fps-weapon-list JSON path.",
    )
    parser.add_argument(
        "--output-dir",
        default="batchFormatted",
        help="Output directory for processed JSON files.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    personal_count, attachment_count = preprocess(input_path, output_dir)
    print(
        f"FPS preprocess complete: WeaponPersonal={personal_count}, "
        f"WeaponAttachment={attachment_count}, output_dir={output_dir}"
    )


if __name__ == "__main__":
    main()
