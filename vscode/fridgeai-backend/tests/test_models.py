def test_models_import():
    from app.models.user import User, RefreshToken
    from app.models.subscription import Subscription, WebhookEvent
    from app.models.fridge import Refrigerator, Ingredient
    from app.models.usage import MonthlyUsage

    assert User.__tablename__ == "users"
    assert RefreshToken.__tablename__ == "refresh_tokens"
    assert Subscription.__tablename__ == "subscriptions"
    assert WebhookEvent.__tablename__ == "webhook_events"
    assert Refrigerator.__tablename__ == "refrigerators"
    assert Ingredient.__tablename__ == "ingredients"
    assert MonthlyUsage.__tablename__ == "monthly_usage"
