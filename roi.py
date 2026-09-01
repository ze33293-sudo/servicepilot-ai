"""ServicePilot AI 的可调 ROI 模拟模型。"""

from __future__ import annotations

from typing import Any


DEFAULT_ASSUMPTIONS: dict[str, float] = {
    "monthly_tickets": 1000,
    "baseline_minutes": 8,
    "automation_rate": 0.55,
    "automated_minutes": 1.5,
    "review_minutes": 3,
    "hourly_cost": 60,
    "fcr_before": 0.68,
    "fcr_after": 0.78,
}


def calculate_roi(values: dict[str, Any] | None = None) -> dict[str, float | str]:
    """按明确的模拟假设计算节省时间、成本和一次解决率变化。"""

    assumptions = DEFAULT_ASSUMPTIONS.copy()
    if values:
        for key in assumptions:
            if key in values:
                assumptions[key] = float(values[key])

    volume = max(0.0, assumptions["monthly_tickets"])
    baseline_minutes = max(0.0, assumptions["baseline_minutes"])
    automation_rate = min(1.0, max(0.0, assumptions["automation_rate"]))
    automated_minutes = max(0.0, assumptions["automated_minutes"])
    review_minutes = max(0.0, assumptions["review_minutes"])
    hourly_cost = max(0.0, assumptions["hourly_cost"])

    old_total_minutes = volume * baseline_minutes
    new_average_minutes = (
        automation_rate * automated_minutes
        + (1 - automation_rate) * review_minutes
    )
    new_total_minutes = volume * new_average_minutes
    saved_hours = max(0.0, old_total_minutes - new_total_minutes) / 60
    saved_cost = saved_hours * hourly_cost
    fcr_improvement = (
        assumptions["fcr_after"] - assumptions["fcr_before"]
    ) * 100

    return {
        **{key: round(value, 4) for key, value in assumptions.items()},
        "new_average_minutes": round(new_average_minutes, 2),
        "saved_hours": round(saved_hours, 1),
        "saved_cost": round(saved_cost, 0),
        "fcr_improvement_points": round(fcr_improvement, 1),
        "disclaimer": "模拟结果，不代表真实生产收益。",
    }
