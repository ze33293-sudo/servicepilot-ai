from __future__ import annotations

import unittest

from evaluate import run_evaluation
from roi import calculate_roi


class EvaluationTests(unittest.TestCase):
    def test_40_case_evaluation_passes(self) -> None:
        result = run_evaluation(write_files=False)
        self.assertEqual(result["case_count"], 40)
        self.assertTrue(result["passed"])
        self.assertEqual(result["before_after"]["before"]["category"], "logistics")
        self.assertEqual(result["before_after"]["after"]["category"], "refund_return")

    def test_default_roi_matches_documented_values(self) -> None:
        result = calculate_roi()
        self.assertEqual(result["saved_hours"], 97.1)
        self.assertEqual(result["saved_cost"], 5825.0)
        self.assertEqual(result["fcr_improvement_points"], 10.0)

    def test_roi_clamps_automation_rate(self) -> None:
        result = calculate_roi({"automation_rate": 2})
        self.assertEqual(result["automation_rate"], 2.0)
        self.assertGreaterEqual(result["saved_hours"], 0)


if __name__ == "__main__":
    unittest.main()
