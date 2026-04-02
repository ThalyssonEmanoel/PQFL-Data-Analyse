"""Configuração de ambiente e caminhos usados pela aplicação."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Dict

BASE_DIR = Path(__file__).parent
CACHE_DIR = BASE_DIR / "cache"
LOG_DIR = BASE_DIR / "logs"
ENV_FILE = BASE_DIR / ".env"
CACHE_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)


def load_env_file(path: Path) -> None:
	"""Carrega pares chave=valor do .env para variáveis de ambiente."""

	def _strip_quotes(text: str) -> str:
		if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
			return text[1:-1]
		return text

	if not path.exists():
		logging.warning("Arquivo .env não encontrado em %s", path)
		return

	with path.open("r", encoding="utf-8") as handler:
		for line in handler:
			line = line.strip()
			if not line or line.startswith("#") or "=" not in line:
				continue
			key, value = line.split("=", 1)
			os.environ.setdefault(key.strip(), _strip_quotes(value.strip()))


load_env_file(ENV_FILE)

COLETUM_TOKEN = os.getenv("COLETUM_TOKEN", "")
if not COLETUM_TOKEN:
	logging.warning("COLETUM_TOKEN ausente. Configure o arquivo .env para acessar o webservice.")

API_DOC: Dict[str, object] = {
	"url": "https://coletum.com/api/graphql",
	"method": "GET",
	"query_param": "query",
	"token_param": "token",
	"token": COLETUM_TOKEN,
	"notes": {
		"limites": "Recomendado < 60 chamadas/minuto. Use cache local.",
		"autenticacao": "Token via querystring, sem cabeçalhos extras.",
		"timeout": "30s com backoff exponencial.",
	},
}

CACHE_FILE = CACHE_DIR / "answers_cache.json"
LOG_FILE = LOG_DIR / "activity_log.json"
