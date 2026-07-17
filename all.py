import os
import re
from pathlib import Path

# ==========================================================
# CONFIGURATION
# ==========================================================

ROOT = Path(__file__).parent.resolve()
OUTPUT = ROOT / "all.txt"

EXCLUDE_DIRS = {
    ".git",
    ".github",
    ".vs",
    ".idea",
    ".vscode",

    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",

    "bin",
    "obj",

    "__pycache__",
    "venv",
    ".venv",

    ".turbo",
    ".cache",
    ".angular",
}

EXCLUDE_FILES = {
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
}

ALLOWED_EXTENSIONS = {

    # Python
    ".py",

    # Javascript
    ".js",
    ".jsx",

    # Typescript
    ".ts",
    ".tsx",

    # React
    ".css",
    ".scss",
    ".sass",
    ".less",

    # HTML
    ".html",

    # C#
    ".cs",
    ".csproj",
    ".sln",
    ".props",
    ".targets",
    ".razor",
    ".cshtml",
    ".resx",

    # Java
    ".java",

    # C / C++
    ".c",
    ".cpp",
    ".h",
    ".hpp",

    # PHP
    ".php",

    # Go
    ".go",

    # Rust
    ".rs",

    # Config
    ".json",
    ".xml",
    ".yml",
    ".yaml",
    ".toml",
    ".ini",
    ".cfg",
    ".config",

    # Database
    ".sql",
    ".prisma",

    # Documentation
    ".md",
    ".txt",

    # Environment
    ".env",
    ".env.example",
}


# ==========================================================
# FILTRE
# ==========================================================

def should_include(file_path):

    parts = file_path.parts

    for p in parts:
        if p in EXCLUDE_DIRS:
            return False

    if file_path.name in EXCLUDE_FILES:
        return False

    return file_path.suffix.lower() in ALLOWED_EXTENSIONS


# ==========================================================
# IMPORTS
# ==========================================================

IMPORT_PATTERNS = [

    # Python
    r'^\s*import\s+.+',
    r'^\s*from\s+.+\s+import\s+.+',

    # Typescript / React
    r'^\s*import\s+.+from\s+[\'"].+[\'"]',
    r'^\s*import\s+[\'"].+[\'"]',

    # NodeJS
    r'^\s*const\s+.+require\(.+\)',
    r'^\s*let\s+.+require\(.+\)',
    r'^\s*var\s+.+require\(.+\)',

    # C#
    r'^\s*using\s+.+;',
    r'^\s*global\s+using\s+.+;',

    # C++
    r'^\s*#include\s+.+',

]


def extract_imports(content):

    imports = []

    for line in content.splitlines():

        txt = line.strip()

        for p in IMPORT_PATTERNS:

            if re.match(p, txt):

                imports.append(txt)

                break

    return imports


# ==========================================================
# TREE
# ==========================================================

def build_tree():

    lines = []

    for root, dirs, files in os.walk(ROOT):

        dirs[:] = sorted([d for d in dirs if d not in EXCLUDE_DIRS])

        level = len(Path(root).relative_to(ROOT).parts)

        indent = "    " * level

        folder = Path(root).name if level else ROOT.name

        lines.append(f"{indent}{folder}/")

        for file in sorted(files):

            path = Path(root) / file

            if should_include(path.relative_to(ROOT)):

                lines.append(f"{indent}    {file}")

    return "\n".join(lines)


# ==========================================================
# MAIN
# ==========================================================

with open(OUTPUT, "w", encoding="utf8") as out:

    out.write("=" * 120 + "\n")
    out.write("PROJECT STRUCTURE\n")
    out.write("=" * 120 + "\n\n")

    out.write(build_tree())

    out.write("\n\n\n")

    files = []

    for root, dirs, filenames in os.walk(ROOT):

        dirs[:] = sorted([d for d in dirs if d not in EXCLUDE_DIRS])

        for filename in filenames:

            path = Path(root) / filename

            rel = path.relative_to(ROOT)

            if should_include(rel):

                files.append(rel)

    files.sort()

    for rel in files:

        path = ROOT / rel

        try:

            content = path.read_text(
                encoding="utf8",
                errors="ignore"
            )

        except:

            continue

        imports = extract_imports(content)

        out.write("=" * 120 + "\n")
        out.write(f"FILE : {rel.as_posix()}\n")
        out.write("=" * 120 + "\n\n")

        out.write("DEPENDENCIES\n")
        out.write("-" * 120 + "\n")

        if imports:

            for imp in imports:

                out.write(imp + "\n")

        else:

            out.write("(none)\n")

        out.write("\n")

        out.write("CODE\n")
        out.write("-" * 120 + "\n\n")

        out.write(content)

        out.write("\n\n\n")

print()
print("=" * 60)
print("Done!")
print(f"Generated file : {OUTPUT}")
print("=" * 60)