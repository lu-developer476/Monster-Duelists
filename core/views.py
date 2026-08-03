"""Thin HTTP boundary for the backendless-first game.

The canonical catalog is ``data/cards.json``. Match simulation and persistence
belong to the browser; the old server match URLs intentionally remain as 410s
so existing clients fail explicitly instead of creating divergent state.
"""
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET

from .card_catalog import CardSeedDataError, serialized_cards_seed_data
from .catalog_validation import validate_catalog


@require_GET
@ensure_csrf_cookie
def index(request):
    return render(request, "core/index.html", {"cards_seed_json": serialized_cards_seed_data()})


@require_GET
def health(request):
    try:
        cards = serialized_cards_seed_data()
        errors = validate_catalog()
    except (CardSeedDataError, OSError, ValueError) as exc:
        return JsonResponse({"ok": False, "mode": "backendless", "checks": {"app": True, "catalog": False}, "message": str(exc)}, status=503)
    ok = bool(cards) and not errors
    return JsonResponse({"ok": ok, "mode": "backendless", "checks": {"app": True, "catalog": ok, "cards": len(cards), "database": "disabled"}, "errors": errors}, status=200 if ok else 503)


@require_GET
def cards_catalog(request):
    return JsonResponse({"ok": True, "cards": serialized_cards_seed_data(), "source": "seed"})


def _backendless_api_disabled(*_args, **_kwargs):
    return JsonResponse({"ok": False, "message": "El duelo contra la IA se ejecuta y guarda únicamente en este navegador."}, status=410)


get_active_match = _backendless_api_disabled
create_match_vs_ai = _backendless_api_disabled
get_match = _backendless_api_disabled
match_action = _backendless_api_disabled
