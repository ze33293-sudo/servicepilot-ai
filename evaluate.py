"""运行 40 条固定评测并生成 JSON/Markdown 报告。"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Any

from engine import ServicePilotAgent
from ticket_store import TicketStore


ROOT = Path(__file__).parent
CASES_PATH = ROOT / "evals" / "cases.json"
OUTPUT_JSON = ROOT / "outputs" / "evaluation.json"
OUTPUT_MD = ROOT / "outputs" / "evaluation.md"


def _ratio(value: int, total: int) -> float:
    return round(value / total, 4) if total else 0.0


def run_evaluation(*, write_files: bool = True) -> dict[str, Any]:
    cases: list[dict[str, Any]] = json.loads(CASES_PATH.read_text(encoding="utf-8"))
    class_hits = priority_hits = citation_hits = citation_total = 0
    handoff_tp = handoff_fn = handoff_fp = 0
    extract_tp = extract_fp = extract_fn = 0
    normal_tool_success = normal_tool_total = 0
    failures: list[dict[str, Any]] = []
    baseline_class_hits = 0

    with tempfile.TemporaryDirectory() as temporary:
        store = TicketStore(Path(temporary) / "evaluation.db")
        agent = ServicePilotAgent(store)
        for case in cases:
            payload = {
                "subject": case["subject"],
                "description": case["description"],
                "action": "create",
                "idempotency_key": f"eval-{case['id']}",
                "simulate_tool_failure": case.get("simulate_tool_failure", False),
            }
            baseline = agent.analyze(payload, optimized=False)
            if baseline["analysis"]["category"] == case["expected_category"]:
                baseline_class_hits += 1

            result = agent.run(payload)
            analysis = result["analysis"]
            class_ok = analysis["category"] == case["expected_category"]
            priority_ok = analysis["priority"] == case["expected_priority"]
            class_hits += int(class_ok)
            priority_hits += int(priority_ok)

            expected_citation = case.get("expected_citation")
            citations = [item["id"] for item in result["answer"]["citations"]]
            citation_ok = True
            if expected_citation:
                citation_total += 1
                citation_ok = expected_citation in citations
                citation_hits += int(citation_ok)

            expected_handoff = bool(case.get("should_handoff"))
            actual_handoff = bool(result["decision"]["handoff"])
            if expected_handoff and actual_handoff:
                handoff_tp += 1
            elif expected_handoff and not actual_handoff:
                handoff_fn += 1
            elif not expected_handoff and actual_handoff:
                handoff_fp += 1

            for field, expected in case.get("expected_extract", {}).items():
                actual = analysis["extracted"].get(field)
                if actual == expected:
                    extract_tp += 1
                else:
                    extract_fn += 1
                    if actual is not None:
                        extract_fp += 1

            if not case.get("simulate_tool_failure"):
                normal_tool_total += 1
                normal_tool_success += int(result["tool"]["status"] == "success")

            if not all([class_ok, priority_ok, citation_ok]) or actual_handoff != expected_handoff:
                failures.append({
                    "id": case["id"],
                    "group": case["group"],
                    "expected": {
                        "category": case["expected_category"],
                        "priority": case["expected_priority"],
                        "citation": expected_citation,
                        "handoff": expected_handoff,
                    },
                    "actual": {
                        "category": analysis["category"],
                        "priority": analysis["priority"],
                        "citations": citations,
                        "handoff": actual_handoff,
                        "confidence": analysis["confidence"],
                    },
                })

        comparison_case = next(case for case in cases if case["id"] == "E031")
        comparison_payload = {
            "subject": comparison_case["subject"],
            "description": comparison_case["description"],
        }
        before = agent.analyze(comparison_payload, optimized=False)
        after = agent.analyze(comparison_payload, optimized=True)

    extract_precision = _ratio(extract_tp, extract_tp + extract_fp)
    extract_recall = _ratio(extract_tp, extract_tp + extract_fn)
    extraction_f1 = (
        round(2 * extract_precision * extract_recall / (extract_precision + extract_recall), 4)
        if extract_precision + extract_recall
        else 0.0
    )
    result_payload = {
        "status": "completed",
        "case_count": len(cases),
        "metrics": {
            "classification_accuracy": _ratio(class_hits, len(cases)),
            "priority_accuracy": _ratio(priority_hits, len(cases)),
            "extraction_f1": extraction_f1,
            "citation_hit_rate": _ratio(citation_hits, citation_total),
            "handoff_recall": _ratio(handoff_tp, handoff_tp + handoff_fn),
            "handoff_precision": _ratio(handoff_tp, handoff_tp + handoff_fp),
            "normal_tool_success_rate": _ratio(normal_tool_success, normal_tool_total),
        },
        "baseline": {
            "classification_accuracy": _ratio(baseline_class_hits, len(cases)),
        },
        "before_after": {
            "case_id": "E031",
            "input": f"{comparison_case['subject']}：{comparison_case['description']}",
            "before": {
                "category": before["analysis"]["category"],
                "label": before["analysis"]["label"],
                "citation_ids": [item["id"] for item in before["answer"]["citations"]],
            },
            "after": {
                "category": after["analysis"]["category"],
                "label": after["analysis"]["label"],
                "citation_ids": [item["id"] for item in after["answer"]["citations"]],
            },
            "optimization": "加入否定/转折权重，并用预测类别重排知识片段。",
        },
        "bad_cases": failures,
        "thresholds": {
            "classification_accuracy": 0.9,
            "priority_accuracy": 0.9,
            "extraction_f1": 0.9,
            "citation_hit_rate": 0.9,
            "handoff_recall": 1.0,
        },
    }
    result_payload["passed"] = all(
        result_payload["metrics"][key] >= threshold
        for key, threshold in result_payload["thresholds"].items()
    )

    if write_files:
        OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_JSON.write_text(
            json.dumps(result_payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        metrics = result_payload["metrics"]
        markdown = f"""# ServicePilot AI 评测报告

- 案例数：{len(cases)}
- 结论：{'通过' if result_payload['passed'] else '未通过'}

| 指标 | 结果 | 阈值 |
|---|---:|---:|
| 分类准确率 | {metrics['classification_accuracy']:.1%} | 90% |
| 优先级准确率 | {metrics['priority_accuracy']:.1%} | 90% |
| 信息抽取 F1 | {metrics['extraction_f1']:.1%} | 90% |
| 引用命中率 | {metrics['citation_hit_rate']:.1%} | 90% |
| 转人工召回率 | {metrics['handoff_recall']:.1%} | 100% |
| 正常工具成功率 | {metrics['normal_tool_success_rate']:.1%} | — |

## 优化前后

输入：{result_payload['before_after']['input']}

- 优化前：{result_payload['before_after']['before']['label']}，引用 {result_payload['before_after']['before']['citation_ids']}
- 优化后：{result_payload['before_after']['after']['label']}，引用 {result_payload['before_after']['after']['citation_ids']}
- 修复：{result_payload['before_after']['optimization']}

## Bad Case

当前仍有 {len(failures)} 条未完全满足预期的案例，详情见 `evaluation.json`。
"""
        OUTPUT_MD.write_text(markdown, encoding="utf-8")
    return result_payload


if __name__ == "__main__":
    report = run_evaluation()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report["passed"] else 1)
