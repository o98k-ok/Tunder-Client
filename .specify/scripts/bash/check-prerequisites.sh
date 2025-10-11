#!/bin/bash

# 查找最新的特性目录
FEATURE_DIR=$(ls -td .specify/features/*/ 2>/dev/null | head -1)

if [ -z "$FEATURE_DIR" ]; then
    echo '{"error":"No feature directory found"}' >&2
    exit 1
fi

# 检查是否需要 tasks.md
if [[ "$*" == *"--require-tasks"* ]]; then
    if [ ! -f "${FEATURE_DIR}tasks.md" ]; then
        echo '{"error":"tasks.md not found, please run /speckit.tasks first"}' >&2
        exit 1
    fi
fi

# 构建可用文档列表
AVAILABLE_DOCS=()

# 检查各种文档
[ -f "${FEATURE_DIR}spec.md" ] && AVAILABLE_DOCS+=("spec.md")
[ -f "${FEATURE_DIR}plan.md" ] && AVAILABLE_DOCS+=("plan.md")
[ -f "${FEATURE_DIR}tasks.md" ] && AVAILABLE_DOCS+=("tasks.md")
[ -f "${FEATURE_DIR}design/research.md" ] && AVAILABLE_DOCS+=("design/research.md")
[ -f "${FEATURE_DIR}design/data-model.md" ] && AVAILABLE_DOCS+=("design/data-model.md")
[ -f "${FEATURE_DIR}design/quickstart.md" ] && AVAILABLE_DOCS+=("design/quickstart.md")

# 构建 JSON 数组
DOCS_JSON="["
for doc in "${AVAILABLE_DOCS[@]}"; do
    DOCS_JSON+="\"$doc\","
done
DOCS_JSON="${DOCS_JSON%,}]"

# 输出 JSON
echo "{\"FEATURE_DIR\":\"$FEATURE_DIR\",\"AVAILABLE_DOCS\":$DOCS_JSON}"
