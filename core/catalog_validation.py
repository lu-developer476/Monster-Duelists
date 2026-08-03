"""Collect-all validation for the canonical card catalog."""
from pathlib import Path
import re

from django.conf import settings

from .card_catalog import CARDS_DATA_PATH, load_cards_seed_data, slugify_card_name

VALID_STAGES = {"base", "fusion", "evolution"}


def validate_catalog(path=CARDS_DATA_PATH):
    errors = []
    cards = load_cards_seed_data(path)
    names, slugs, spell_ids = set(), set(), set()
    for index, card in enumerate(cards):
        where = f"cards[{index}]"
        if not isinstance(card, dict):
            errors.append(f"{where}: debe ser un objeto")
            continue
        name = card.get("name")
        slug = slugify_card_name(name or "")
        if not name:
            errors.append(f"{where}.name: requerido")
        elif name in names:
            errors.append(f"{where}.name: nombre duplicado {name}")
        names.add(name)
        if not slug or slug in slugs:
            errors.append(f"{where}: slug vacío o duplicado {slug}")
        slugs.add(slug)
        if card.get("stage") not in VALID_STAGES:
            errors.append(f"{where}.stage: etapa inválida")
        for low, high in (("level_min", "level_max"), ("hp_min", "hp_max")):
            a, b = card.get(low, card.get("hp") if low == "hp_min" else None), card.get(high, card.get("hp") if high == "hp_max" else None)
            if not isinstance(a, int) or not isinstance(b, int) or a < 0 or b < a:
                errors.append(f"{where}: rango {low}/{high} inválido")
        image = str(card.get("image", ""))
        if not image or image.startswith(("http://", "https://")):
            pass
        else:
            relative = image.removeprefix("public/")
            if not (Path(settings.BASE_DIR) / "public" / relative).is_file():
                errors.append(f"{where}.image: no existe {image}")
        for spell_index, spell in enumerate(card.get("spells", [])):
            spell_where = f"{where}.spells[{spell_index}]"
            if not isinstance(spell, dict):
                errors.append(f"{spell_where}: debe ser un objeto")
                continue
            spell_id = spell.get("id") or f"{slug}-{slugify_card_name(spell.get('name', ''))}"
            if spell_id in spell_ids:
                errors.append(f"{spell_where}.id: identificador duplicado {spell_id}")
            spell_ids.add(spell_id)
            for field in ("cost", "damage_min", "damage_max"):
                if not isinstance(spell.get(field), int) or spell[field] < 0:
                    errors.append(f"{spell_where}.{field}: entero no negativo requerido")
            if "range" in spell and not ((isinstance(spell["range"], int) and spell["range"] >= 0) or (isinstance(spell["range"], str) and re.fullmatch(r"\d+-\d+", spell["range"]))):
                errors.append(f"{spell_where}.range: entero no negativo requerido")
            if isinstance(spell.get("damage_min"), int) and isinstance(spell.get("damage_max"), int) and spell["damage_max"] < spell["damage_min"]:
                errors.append(f"{spell_where}: rango de daño inválido")
    return errors
