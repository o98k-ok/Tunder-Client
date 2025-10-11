#!/bin/bash
set -e

# 获取参数
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# 获取当前分支
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 确定特性目录
if [[ $BRANCH == feature/* ]]; then
    FEATURE_NAME=$(echo "$BRANCH" | sed 's/feature\///')
    SPECS_DIR=".specify/features/${FEATURE_NAME}"
else
    echo "Error: Not on a feature branch (current: $BRANCH)" >&2
    exit 1
fi

# 检查 spec 文件是否存在
FEATURE_SPEC="${SPECS_DIR}/spec.md"
if [ ! -f "$FEATURE_SPEC" ]; then
    echo "Error: Spec file not found: $FEATURE_SPEC" >&2
    exit 1
fi

# 创建必要的目录
mkdir -p "${SPECS_DIR}/design"
mkdir -p "${SPECS_DIR}/contracts"
mkdir -p "${SPECS_DIR}/checklists"

# 创建或复制 plan.md
IMPL_PLAN="${SPECS_DIR}/plan.md"
PLAN_TEMPLATE=".specify/templates/plan-template.md"

if [ ! -f "$IMPL_PLAN" ]; then
    if [ -f "$PLAN_TEMPLATE" ]; then
        cp "$PLAN_TEMPLATE" "$IMPL_PLAN"
    else
        # 创建基础 plan 文件
        cat > "$IMPL_PLAN" << 'EOF'
# Implementation Plan

## Feature
[Feature name]

## Status
- **Status**: Draft
- **Created**: $(date +%Y-%m-%d)

## Technical Context
[Fill in technical details]

## Constitution Check
[Fill in compliance check]

## Implementation Phases
[Fill in phases]

EOF
    fi
fi

# 输出结果
if [ "$JSON_OUTPUT" = true ]; then
    ABS_FEATURE_SPEC="$(cd "$(dirname "$FEATURE_SPEC")" && pwd)/$(basename "$FEATURE_SPEC")"
    ABS_IMPL_PLAN="$(cd "$(dirname "$IMPL_PLAN")" && pwd)/$(basename "$IMPL_PLAN")"
    ABS_SPECS_DIR="$(cd "$SPECS_DIR" && pwd)"
    echo "{\"FEATURE_SPEC\":\"$ABS_FEATURE_SPEC\",\"IMPL_PLAN\":\"$ABS_IMPL_PLAN\",\"SPECS_DIR\":\"$ABS_SPECS_DIR\",\"BRANCH\":\"$BRANCH\"}"
else
    echo "Branch: $BRANCH"
    echo "Spec: $FEATURE_SPEC"
    echo "Plan: $IMPL_PLAN"
fi

