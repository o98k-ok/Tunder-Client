#!/bin/bash
set -e

# 获取参数
JSON_OUTPUT=false
FEATURE_DESC=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            FEATURE_DESC="$1"
            shift
            ;;
    esac
done

if [ -z "$FEATURE_DESC" ]; then
    echo "Error: No feature description provided" >&2
    exit 1
fi

# 生成 feature ID（日期 + 简化描述）
DATE=$(date +%Y%m%d)
FEATURE_SLUG=$(echo "$FEATURE_DESC" | iconv -t ASCII//TRANSLIT 2>/dev/null | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | cut -c1-30 | sed 's/-$//')

# 如果转换失败，使用默认名称
if [ -z "$FEATURE_SLUG" ]; then
    FEATURE_SLUG="request-save-refactor"
fi

BRANCH_NAME="feature/${DATE}-${FEATURE_SLUG}"
FEATURE_DIR=".specify/features/${DATE}-${FEATURE_SLUG}"
SPEC_FILE="${FEATURE_DIR}/spec.md"

# 创建功能目录
mkdir -p "$FEATURE_DIR/checklists"
mkdir -p "$FEATURE_DIR/design"

# 创建并切换到新分支
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# 创建初始 spec 文件
cat > "$SPEC_FILE" << 'EOF'
# Feature Specification

## Overview

[Feature description will be filled]

## Status

- **Status**: Draft
- **Created**: $(date +%Y-%m-%d)
- **Last Updated**: $(date +%Y-%m-%d)

EOF

# 输出结果
if [ "$JSON_OUTPUT" = true ]; then
    ABS_SPEC_FILE="$(cd "$(dirname "$SPEC_FILE")" && pwd)/$(basename "$SPEC_FILE")"
    ABS_FEATURE_DIR="$(cd "$FEATURE_DIR" && pwd)"
    echo "{\"BRANCH_NAME\":\"$BRANCH_NAME\",\"SPEC_FILE\":\"$ABS_SPEC_FILE\",\"FEATURE_DIR\":\"$ABS_FEATURE_DIR\"}"
else
    echo "Branch: $BRANCH_NAME"
    echo "Spec file: $SPEC_FILE"
fi

