from django.core.management.base import BaseCommand, CommandError

from core.catalog_validation import validate_catalog


class Command(BaseCommand):
    help = "Valida el catálogo canónico y muestra todos los errores."

    def handle(self, *args, **options):
        errors = validate_catalog()
        if errors:
            raise CommandError("Catálogo inválido:\n" + "\n".join(f"- {error}" for error in errors))
        self.stdout.write(self.style.SUCCESS("Catálogo válido."))
