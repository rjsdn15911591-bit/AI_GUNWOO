import pytest
from app.services.quota_service import get_current_year_month


def test_year_month_format():
    ym = get_current_year_month()
    assert len(ym) == 7
    assert ym[4] == "-"
    year, month = ym.split("-")
    assert int(year) >= 2024
    assert 1 <= int(month) <= 12


def test_year_month_is_kst():
    from datetime import datetime
    from zoneinfo import ZoneInfo

    ym = get_current_year_month()
    expected = datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m")
    assert ym == expected
