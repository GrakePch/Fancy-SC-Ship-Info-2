import json
import sys
from pathlib import Path


def parse_indent(value: str) -> int:
    """Convert the indent argument to a non-negative integer."""
    try:
        indent = int(value)
    except ValueError as exc:
        raise SystemExit(f"Indent must be an integer, got: {value!r}") from exc

    if indent < 0:
        raise SystemExit("Indent must be zero or a positive integer.")

    return indent


def format_json_file(source_path: Path, output_dir: Path, output_name: str, indent: int = 2) -> Path:
    """Read, parse, and write the formatted JSON to the output directory."""
    if not source_path.is_file():
        raise SystemExit(f"Input file does not exist: {source_path}")

    try:
        # utf-8-sig strips a potential BOM if present at the start of the file
        with source_path.open("r", encoding="utf-8-sig") as src:
            data = json.load(src)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Failed to parse JSON: {exc}") from exc

    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / f"{output_name}.json"
    with output_path.open("w", encoding="utf-8") as dst:
        json.dump(data, dst, indent=indent, ensure_ascii=False)
        dst.write("\n")

    return output_path


def main(args: list[str]) -> None:
    if not args:
        raise SystemExit("Usage: python batchFormatJson.py <folder_path> [indent]")

    folder_path = Path(args[0])
    if not folder_path.is_dir():
        raise SystemExit(f"Input folder does not exist: {folder_path}")
    indent = parse_indent(args[1]) if len(args) > 1 else 2

    output_dir = Path("batchFormatted")
    file_map = {
        "0": "vehicle-basic-list",
        "1": "vehicle-main-list",
        "2": "vehicle-hardpoints-list",
        "3": "vehicle-item-list",
        "4": "fps-weapon-list",
    }

    for input_name, output_name in file_map.items():
        source_path = folder_path / input_name
        output_path = format_json_file(source_path, output_dir, output_name, indent)
        print(f"Formatted JSON written to: {output_path}")


if __name__ == "__main__":
    main(sys.argv[1:])
