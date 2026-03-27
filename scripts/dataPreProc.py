import json
import sys
from pathlib import Path


def preprocess_vehicle_basic_list(file_path: Path) -> int:
    """Replace Manufacturer value 'Argo' with 'Argo Astronautics'."""
    if not file_path.is_file():
        raise SystemExit(f"Input file does not exist: {file_path}")

    try:
        with file_path.open("r", encoding="utf-8-sig") as src:
            data = json.load(src)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Failed to parse JSON: {exc}") from exc

    if not isinstance(data, list):
        raise SystemExit("Expected top-level JSON array in vehicle-basic-list.json")

    replacements = 0
    for item in data:
        if isinstance(item, dict) and item.get("Manufacturer") == "Argo":
            item["Manufacturer"] = "Argo Astronautics"
            replacements += 1

    with file_path.open("w", encoding="utf-8") as dst:
        json.dump(data, dst, indent=2, ensure_ascii=False)
        dst.write("\n")

    return replacements


def main(args: list[str]) -> None:
    target = Path(args[0]) if args else Path("batchFormatted/vehicle-basic-list.json")
    replacements = preprocess_vehicle_basic_list(target)
    print(f"Preprocess complete: {replacements} replacement(s) in {target}")


if __name__ == "__main__":
    main(sys.argv[1:])
