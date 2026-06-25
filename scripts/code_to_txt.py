import os

EXCLUDE_DIRS = {"node_modules", ".git", ".next", "__pycache__", "venv", ".venv"}
EXCLUDE_FILES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".gitignore", ".env"}
EXCLUDE_EXTS = {".pyc", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".eot", ".ttf", ".otf"}
ALLOWED_EXTS = {".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss", ".html", ".md", ".py", ".java", ".xml", ".yml", ".yaml", ".prisma", ".env.example", ".toml", ".cfg", ".ini", ".txt"}

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
OUTPUT = os.path.join(ROOT, "all.txt")

def should_include(rel_path: str) -> bool:
    parts = rel_path.replace("\\", "/").split("/")
    if any(p in EXCLUDE_DIRS for p in parts):
        return False
    fname = parts[-1]
    if fname in EXCLUDE_FILES:
        return False
    ext = os.path.splitext(fname)[1].lower()
    if ext in EXCLUDE_EXTS:
        return False
    if ALLOWED_EXTS and ext not in ALLOWED_EXTS:
        return False
    return True

def main():
    with open(OUTPUT, "w", encoding="utf-8") as out:
        for root, dirs, files in os.walk(ROOT):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for fname in sorted(files):
                rel_path = os.path.relpath(os.path.join(root, fname), ROOT)
                if not should_include(rel_path):
                    continue
                fpath = os.path.join(root, fname)
                try:
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                except Exception:
                    continue
                out.write(f"===== {rel_path} =====\n")
                out.write(content)
                out.write("\n\n")

    print(f"Done -> {OUTPUT}")

if __name__ == "__main__":
    main()
