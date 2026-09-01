"""ServicePilot AI：分类、抽取、RAG、路由与工具编排。"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from ollama_client import synthesize
from ticket_store import TicketStore


CATEGORY_LABELS = {
    "refund_return": "退款退货",
    "logistics": "物流配送",
    "device_issue": "设备故障",
    "account_activation": "账号激活",
    "payment_invoice": "支付发票",
    "complaint_feedback": "投诉建议",
}

CATEGORY_KEYWORDS: dict[str, dict[str, float]] = {
    "refund_return": {
        "退款": 3.0, "退货": 3.0, "原路退回": 2.4, "没到账": 2.5,
        "未到账": 2.5, "退钱": 2.2, "无理由": 2.0, "取消订单": 1.8,
    },
    "logistics": {
        "物流": 2.7, "快递": 2.5, "配送": 2.3, "丢件": 3.2,
        "丢失": 2.8, "未收到": 2.5, "没收到": 2.5, "破损": 2.5,
        "没更新": 2.3, "签收异常": 2.5,
    },
    "device_issue": {
        "故障": 2.8, "无法开机": 3.4, "开不了机": 3.2, "黑屏": 2.8,
        "闪退": 2.8, "异响": 2.8, "发热": 2.2, "冒烟": 3.5,
        "起火": 4.0, "质量问题": 2.8, "坏了": 2.4, "保修": 2.0,
    },
    "account_activation": {
        "登录": 2.6, "账号": 2.2, "验证码": 3.0, "密码": 2.5,
        "激活": 2.6, "冻结": 3.0, "封禁": 3.0, "解绑": 2.7,
        "异地登录": 3.0,
    },
    "payment_invoice": {
        "发票": 3.2, "开票": 3.0, "抬头": 2.8, "税号": 2.8,
        "重复扣款": 3.8, "扣了两次": 3.8, "支付失败": 2.8,
        "扣款": 2.3, "银行卡": 1.8, "盗刷": 4.0, "交易": 1.2,
    },
    "complaint_feedback": {
        "投诉": 3.4, "差评": 2.7, "态度": 2.1, "消协": 3.2,
        "媒体": 2.6, "建议": 2.6, "希望增加": 2.5, "功能反馈": 2.8,
        "体验": 1.1, "改进": 1.5,
    },
}

PRODUCTS = [
    "AirBuds Pro", "Watch X2", "HomeHub Mini", "VisionPad 11",
    "PowerDock 65W", "SmartCam S3", "Router AX6", "Phone Z5",
]

CRITICAL_TERMS = [
    "起火", "冒烟", "爆炸", "触电", "人身安全", "数据泄露", "隐私泄露",
    "盗刷", "支付欺诈", "大面积故障", "系统宕机",
]
HIGH_TERMS = [
    "重复扣款", "扣了两次", "无法使用", "无法登录", "丢件", "丢失",
    "投诉", "消协", "媒体曝光", "72小时", "三天没更新", "紧急",
]
LOW_TERMS = ["建议", "希望增加", "咨询", "怎么", "是否支持", "功能反馈"]
SENSITIVE_TERMS = {
    "safety": ["起火", "冒烟", "爆炸", "触电", "人身安全", "鼓包"],
    "privacy": ["数据泄露", "隐私泄露", "身份证", "人脸数据", "通讯录泄露"],
    "payment_fraud": ["盗刷", "支付欺诈", "银行卡密码", "完整卡号"],
    "legal": ["律师函", "起诉", "法院", "报警", "监管投诉"],
}

KNOWLEDGE_PATH = Path(__file__).with_name("knowledge") / "documents.json"


def redact_sensitive(text: str) -> str:
    text = re.sub(r"(?<!\d)1[3-9]\d{9}(?!\d)", lambda m: f"{m.group()[:3]}****{m.group()[-4:]}", text)
    text = re.sub(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        lambda m: m.group()[0] + "***@" + m.group().split("@", 1)[1],
        text,
    )
    text = re.sub(r"(?<!\d)\d{16,19}(?!\d)", lambda m: f"{m.group()[:4]} **** **** {m.group()[-4:]}", text)
    return text


def _weighted_sections(text: str, optimized: bool) -> list[tuple[str, float]]:
    if not optimized:
        return [(text, 1.0)]
    match = re.search(r"不是(.+?)(?:，|,|；|;)?(?:而是|是)(.+)", text)
    if not match:
        return [(text, 1.0)]
    return [(match.group(1), 0.12), (match.group(2), 1.75)]


def classify(text: str, *, optimized: bool = True) -> dict[str, Any]:
    if not optimized:
        # Baseline 有意模拟常见的“从左到右遇到首个关键词即返回”实现，
        # 用于和优化后的加权、否定/转折识别进行可复现对比。
        lowered = text.lower()
        hits: list[tuple[int, float, str, str]] = []
        for category, keywords in CATEGORY_KEYWORDS.items():
            for keyword, weight in keywords.items():
                index = lowered.find(keyword.lower())
                if index >= 0:
                    hits.append((index, -weight, category, keyword))
        if not hits:
            return {
                "category": "unknown",
                "label": "待确认",
                "confidence": 0.3,
                "matched_keywords": [],
                "scores": {category: 0.0 for category in CATEGORY_LABELS},
            }
        hits.sort()
        _, _, category, keyword = hits[0]
        return {
            "category": category,
            "label": CATEGORY_LABELS[category],
            "confidence": 0.74,
            "matched_keywords": [keyword],
            "scores": {item: float(item == category) for item in CATEGORY_LABELS},
        }

    scores = {category: 0.0 for category in CATEGORY_LABELS}
    matches: dict[str, list[str]] = {category: [] for category in CATEGORY_LABELS}
    for section, multiplier in _weighted_sections(text, optimized):
        lowered = section.lower()
        for category, keywords in CATEGORY_KEYWORDS.items():
            for keyword, weight in keywords.items():
                if keyword.lower() in lowered:
                    scores[category] += weight * multiplier
                    matches[category].append(keyword)

    ranking = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    category, top = ranking[0]
    second = ranking[1][1]
    if top <= 0:
        return {
            "category": "unknown",
            "label": "待确认",
            "confidence": 0.3,
            "matched_keywords": [],
            "scores": scores,
        }
    margin = max(0.0, top - second)
    confidence = min(0.98, 0.56 + min(top, 5.0) * 0.065 + min(margin, 4.0) * 0.035)
    if second > 0 and margin < 0.7:
        confidence = min(confidence, 0.69)
    return {
        "category": category,
        "label": CATEGORY_LABELS[category],
        "confidence": round(confidence, 3),
        "matched_keywords": sorted(set(matches[category])),
        "scores": {key: round(value, 3) for key, value in scores.items()},
    }


def determine_priority(text: str, category: str) -> dict[str, Any]:
    if any(term in text for term in CRITICAL_TERMS):
        return {"priority": "P0", "reason": "命中安全、隐私或重大服务风险"}
    if any(term in text for term in HIGH_TERMS):
        return {"priority": "P1", "reason": "影响使用、资金或投诉时效"}
    if category == "complaint_feedback" and any(term in text for term in LOW_TERMS):
        return {"priority": "P3", "reason": "普通建议或咨询"}
    if any(term in text for term in LOW_TERMS) and category == "unknown":
        return {"priority": "P3", "reason": "普通咨询"}
    return {"priority": "P2", "reason": "标准售后处理时效"}


def extract_information(text: str) -> dict[str, Any]:
    order_match = re.search(r"\b(?:ORD|SO|DD)[-_]?\d{6,12}\b", text, re.IGNORECASE)
    amount_match = re.search(r"(?:￥|¥)?\s*(\d+(?:\.\d{1,2})?)\s*元", text)
    phone_match = re.search(r"(?<!\d)1[3-9]\d{9}(?!\d)", text)
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    time_match = re.search(r"今天|昨天|前天|\d{1,2}月\d{1,2}日|\d+\s*(?:小时|天|周|个月)前", text)
    product = next((item for item in PRODUCTS if item.lower() in text.lower()), None)
    if not product:
        product_match = re.search(r"(?:产品|型号)[:：]\s*([A-Za-z0-9][A-Za-z0-9 _-]{1,24})", text)
        product = product_match.group(1).strip() if product_match else None
    emotion = "negative" if any(term in text for term in ["生气", "愤怒", "投诉", "差评", "失望", "太差"]) else "neutral"
    contact = None
    if phone_match:
        raw = phone_match.group()
        contact = f"{raw[:3]}****{raw[-4:]}"
    elif email_match:
        raw = email_match.group()
        contact = raw[0] + "***@" + raw.split("@", 1)[1]
    return {
        "order_id": order_match.group().upper() if order_match else None,
        "product": product,
        "amount_yuan": float(amount_match.group(1)) if amount_match else None,
        "issue_time": time_match.group() if time_match else None,
        "customer_emotion": emotion,
        "contact_masked": contact,
    }


def detect_sensitive(text: str) -> list[str]:
    reasons: list[str] = []
    for reason, terms in SENSITIVE_TERMS.items():
        if any(term in text for term in terms):
            reasons.append(reason)
    return reasons


class KnowledgeBase:
    def __init__(self, path: str | Path = KNOWLEDGE_PATH) -> None:
        self.path = Path(path)
        self.documents: list[dict[str, Any]] = json.loads(
            self.path.read_text(encoding="utf-8")
        )
        self.by_id = {doc["id"]: doc for doc in self.documents}

    @staticmethod
    def _bigrams(text: str) -> set[str]:
        chars = [char for char in text.lower() if not char.isspace()]
        return {"".join(chars[index:index + 2]) for index in range(len(chars) - 1)}

    def retrieve(
        self,
        query: str,
        category: str,
        *,
        top_k: int = 3,
        category_aware: bool = True,
    ) -> list[dict[str, Any]]:
        query_bigrams = self._bigrams(query)
        scored: list[tuple[float, dict[str, Any]]] = []
        candidate_documents = self.documents
        if category_aware and category in CATEGORY_LABELS:
            candidate_documents = [
                doc for doc in self.documents if doc["category"] == category
            ]
        for doc in candidate_documents:
            keyword_hits = sum(1 for keyword in doc["keywords"] if keyword.lower() in query.lower())
            overlap = len(query_bigrams & self._bigrams(doc["content"] + doc["title"]))
            lexical = keyword_hits * 2.6 + min(overlap, 8) * 0.35
            if lexical <= 0:
                continue
            category_bonus = 2.6 if category_aware and doc["category"] == category else 0
            raw_score = lexical + category_bonus
            result = {
                **doc,
                "score": round(min(0.99, raw_score / 10), 3),
                "snippet": doc["content"][:96] + ("…" if len(doc["content"]) > 96 else ""),
            }
            scored.append((raw_score, result))
        scored.sort(key=lambda item: (-item[0], item[1]["id"]))
        return [item[1] for item in scored[:top_k]]

    def get(self, doc_id: str) -> dict[str, Any] | None:
        return self.by_id.get(doc_id)


class ServicePilotAgent:
    def __init__(
        self,
        store: TicketStore | None = None,
        knowledge_base: KnowledgeBase | None = None,
    ) -> None:
        self.store = store
        self.knowledge_base = knowledge_base or KnowledgeBase()

    def analyze(self, payload: dict[str, Any], *, optimized: bool = True) -> dict[str, Any]:
        subject = str(payload.get("subject", "")).strip()
        description = str(payload.get("description", "")).strip()
        if not subject or not description:
            raise ValueError("missing_required_fields")
        text = f"{subject}。{description}"
        classification = classify(text, optimized=optimized)
        priority = determine_priority(text, classification["category"])
        extracted = extract_information(text)
        sensitive = detect_sensitive(text)
        citations = self.knowledge_base.retrieve(
            text,
            classification["category"],
            category_aware=optimized,
        )

        handoff_reasons: list[str] = []
        if classification["confidence"] < 0.72:
            handoff_reasons.append("low_confidence")
        if sensitive:
            handoff_reasons.extend(f"sensitive_{item}" for item in sensitive)
        if not citations or citations[0]["score"] < 0.38:
            handoff_reasons.append("knowledge_gap")

        answer_text = "当前知识库没有足够依据，已建议转人工确认。"
        answer_source = "fallback"
        used_citations: list[dict[str, Any]] = citations
        if citations:
            deterministic = " ".join(
                f"{item['content']} [{item['id']}]" for item in citations[:2]
            )
            generated = synthesize(text, citations)
            if generated:
                allowed = set(generated["citation_ids"])
                used_citations = [item for item in citations if item["id"] in allowed]
                answer_text = generated["answer"]
                answer_source = "local_ollama"
            else:
                answer_text = deterministic
                answer_source = "extractive_fallback"

        analysis = {
            **classification,
            **priority,
            "extracted": extracted,
            "sensitive_flags": sensitive,
        }
        return {
            "analysis": analysis,
            "answer": {
                "text": answer_text,
                "citations": [
                    {key: item[key] for key in ["id", "title", "section", "source", "score", "snippet"]}
                    for item in used_citations
                ],
                "source": answer_source,
            },
            "decision": {
                "route": "human" if handoff_reasons else "auto",
                "handoff": bool(handoff_reasons),
                "reasons": list(dict.fromkeys(handoff_reasons)),
            },
            "trace": [
                {"step": "classify", "status": "success", "detail": classification["label"]},
                {"step": "extract", "status": "success", "detail": "结构化字段已脱敏"},
                {"step": "retrieve", "status": "success" if citations else "fallback", "detail": f"命中 {len(citations)} 条知识"},
                {"step": "route", "status": "human" if handoff_reasons else "auto", "detail": "、".join(handoff_reasons) or "允许自动处理"},
            ],
        }

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = self.analyze(payload)
        action = str(payload.get("action", "create"))
        if self.store is None:
            result["tool"] = {"name": action, "status": "skipped", "error": "store_unavailable"}
            return result

        if payload.get("simulate_tool_failure"):
            result["trace"].extend([
                {"step": f"tool.{action}", "status": "retry", "detail": "第 1 次调用失败"},
                {"step": f"tool.{action}", "status": "failed", "detail": "第 2 次调用失败，已停止重试"},
            ])
            result["decision"] = {
                "route": "human",
                "handoff": True,
                "reasons": list(dict.fromkeys(result["decision"]["reasons"] + ["tool_failure"])),
            }
            result["tool"] = {"name": action, "status": "failed", "attempts": 2, "error": "simulated_tool_failure"}
            return result

        try:
            if action == "create":
                analysis = result["analysis"]
                ticket = self.store.create({
                    "idempotency_key": payload.get("idempotency_key"),
                    "subject": redact_sensitive(str(payload.get("subject", ""))),
                    "description": redact_sensitive(str(payload.get("description", ""))),
                    "channel": payload.get("channel", "web"),
                    "customer_tier": payload.get("customer_tier", "standard"),
                    "category": analysis["category"],
                    "category_label": analysis["label"],
                    "category_confidence": analysis["confidence"],
                    "priority": analysis["priority"],
                    "extracted": analysis["extracted"],
                    "status": "awaiting_human" if result["decision"]["handoff"] else "triaged",
                    "handoff_reasons": result["decision"]["reasons"],
                })
            elif action == "query":
                ticket = self.store.get(str(payload.get("ticket_id", "")))
                if ticket is None:
                    raise LookupError("ticket_not_found")
            elif action == "update":
                ticket = self.store.update_status(
                    str(payload.get("ticket_id", "")),
                    str(payload.get("status", "")),
                    int(payload.get("version", 0)),
                )
                if ticket is None:
                    raise LookupError("ticket_not_found")
            else:
                raise ValueError("invalid_action")
            result["tool"] = {"name": action, "status": "success", "attempts": 1, "ticket": ticket}
            result["trace"].append({"step": f"tool.{action}", "status": "success", "detail": ticket["id"]})
        except (ValueError, RuntimeError, LookupError) as exc:
            reason = str(exc)
            result["decision"] = {
                "route": "human",
                "handoff": True,
                "reasons": list(dict.fromkeys(result["decision"]["reasons"] + ["tool_failure"])),
            }
            result["tool"] = {"name": action, "status": "failed", "attempts": 1, "error": reason}
            result["trace"].append({"step": f"tool.{action}", "status": "failed", "detail": reason})
        return result
