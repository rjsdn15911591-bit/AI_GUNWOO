from app.services.recipe_service import calculate_match_ratio


def test_full_match():
    ratio = calculate_match_ratio(["당근", "양파", "돼지고기"], ["당근", "양파", "돼지고기", "소금"])
    assert ratio == 1.0


def test_partial_match():
    ratio = calculate_match_ratio(["당근", "양파", "돼지고기", "마늘"], ["당근", "양파"])
    assert ratio == 0.5


def test_no_ingredients():
    assert calculate_match_ratio(["당근"], []) == 0.0


def test_empty_recipe():
    assert calculate_match_ratio([], ["당근"]) == 0.0


def test_synonym_normalization():
    ratio = calculate_match_ratio(["파"], ["대파"])
    assert ratio == 1.0
