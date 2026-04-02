"""Funções utilitárias de transformação, normalização e análise."""

from __future__ import annotations

import math
from datetime import datetime, timezone
from statistics import fmean
from typing import TYPE_CHECKING, Dict, List, Optional, Tuple

from domain_constants import (
	BEM_ESTAR_KEYS,
	IBP_COMPONENT_FIELDS,
	IBP_COMPONENT_WEIGHTS,
	QUERY_FIELD_ALIASES,
	SANIDADE_KEYS,
)

if TYPE_CHECKING:
	from models import ProducerSnapshot


def clean_display_value(value: Optional[object]) -> str:
	"""Padroniza valores exibíveis e substitui vazios por 'Não Informado'."""

	if value is None:
		return "Não Informado"
	if isinstance(value, str):
		text = value.strip()
		return text if text else "Não Informado"
	if isinstance(value, bool):
		return "Sim" if value else "Não"
	if isinstance(value, (int, float)):
		if float(value).is_integer():
			return str(int(value))
		return str(value)
	return str(value)


def parse_bool(value: Optional[object]) -> bool:
	"""Normaliza respostas Sim/Não, True/False ou equivalentes."""

	if value is None:
		return False
	text = str(value).strip().lower()
	return text in {"sim", "s", "true", "1", "verdadeiro", "yes"}


def bool_to_rate(value: Optional[object]) -> float:
	"""Converte resposta binária em 0.0 ou 1.0."""

	return 1.0 if parse_bool(value) else 0.0


def _mean(values: List[float]) -> float:
	"""Retorna a média de uma lista numérica ou 0.0 quando vazia."""

	return fmean(values) if values else 0.0


def _weighted_average(values: Dict[str, float], weights: Dict[str, float]) -> float:
	"""Calcula média ponderada usando pesos normalizados."""

	total_weight = sum(weights.values()) or 1.0
	weighted_sum = sum(values.get(key, 0.0) * weight for key, weight in weights.items())
	return weighted_sum / total_weight


def _safe_division(numerator: float, denominator: float) -> float:
	"""Executa divisão segura para evitar erro de divisão por zero."""

	return numerator / denominator if denominator else 0.0


def _quality_problem_score(value: Optional[object]) -> float:
	"""Transforma a última ocorrência de problema de qualidade em um risco numérico."""

	text = clean_display_value(value).strip().lower()
	if not text or text == "não informado":
		return 0.4
	if "nunca" in text or "sem problema" in text:
		return 0.0
	if "mês" in text or "mes" in text:
		return 0.85
	if len(text) >= 7 and text[4] == "-":
		try:
			parsed = datetime.fromisoformat(f"{text}-01")
			months_ago = max((datetime.now(timezone.utc) - parsed.replace(tzinfo=timezone.utc)).days / 30.0, 0.0)
			if months_ago <= 3:
				return 1.0
			if months_ago <= 6:
				return 0.7
			if months_ago <= 12:
				return 0.4
			return 0.15
		except ValueError:
			return 0.45
	return 0.55


def _bin_income_share(value: Optional[object]) -> str:
	"""Agrupa a participação da renda do leite em faixas legíveis."""

	share = safe_float(value)
	if share <= 0:
		return "Não informado"
	if share <= 25:
		return "0-25%"
	if share <= 50:
		return "26-50%"
	if share <= 75:
		return "51-75%"
	return "76-100%"


def _component_score(snapshot: "ProducerSnapshot", field_names: List[str]) -> float:
	"""Média binária de um bloco de práticas de manejo."""

	return _mean([bool_to_rate(snapshot.bool_flags.get(field)) for field in field_names])


def calculate_ibp(snapshot: "ProducerSnapshot") -> Tuple[float, Dict[str, float]]:
	"""Calcula o Índice de Boas Práticas com base nos campos de manejo."""

	components = {
		"vacinacao": _component_score(snapshot, IBP_COMPONENT_FIELDS["vacinacao"]),
		"exames": _component_score(snapshot, IBP_COMPONENT_FIELDS["exames"]),
		"ordenha": _component_score(snapshot, IBP_COMPONENT_FIELDS["ordenha"]),
		"treinamentos": _component_score(snapshot, IBP_COMPONENT_FIELDS["treinamentos"]),
	}
	ibp = _weighted_average(components, IBP_COMPONENT_WEIGHTS) * 100
	return max(min(ibp, 100.0), 0.0), components


def normalize_ibp_components(snapshot: "ProducerSnapshot") -> Dict[str, float]:
	"""Retorna os componentes do IBP já prontos para visualização."""

	_, components = calculate_ibp(snapshot)
	return components


def pearson_correlation(values_x: List[float], values_y: List[float]) -> float:
	"""Calcula correlação de Pearson sem dependências extras."""

	if len(values_x) != len(values_y) or len(values_x) < 2:
		return 0.0
	mean_x = _mean(values_x)
	mean_y = _mean(values_y)
	numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(values_x, values_y))
	denominator_x = math.sqrt(sum((x - mean_x) ** 2 for x in values_x))
	denominator_y = math.sqrt(sum((y - mean_y) ** 2 for y in values_y))
	return _safe_division(numerator, denominator_x * denominator_y)


def safe_float(value: Optional[object]) -> float:
	"""Converte texto em float (considerando vírgula). Retorna 0.0 em falhas."""

	if value is None:
		return 0.0
	if isinstance(value, (int, float)):
		return float(value)
	cleaned = str(value).replace(".", "").replace(",", ".")
	try:
		return float(cleaned)
	except ValueError:
		digits = "".join(ch for ch in cleaned if ch.isdigit() or ch == ".")
		return float(digits or 0.0)


def month_label(dt: datetime) -> str:
	"""Retorna rótulo AAAA-MM para agrupamentos."""

	return dt.strftime("%Y-%m")


def normalize(value: float, min_value: float, max_value: float) -> float:
	"""Normaliza valor para faixa [0, 1]."""

	if max_value == min_value:
		return 0.0
	clipped = max(min(value, max_value), min_value)
	return (clipped - min_value) / (max_value - min_value)


def normalize_query_fields(answer: Dict[str, str]) -> Dict[str, str]:
	"""Compatibiliza respostas legíveis vindas da query com as chaves antigas."""

	normalized = dict(answer)
	for alias, legacy in QUERY_FIELD_ALIASES.items():
		if alias in answer and legacy not in normalized:
			normalized[legacy] = answer[alias]
		if legacy in answer and alias not in normalized:
			normalized[alias] = answer[legacy]
	return normalized


def performance_radar_values(snapshot: "ProducerSnapshot") -> List[float]:
	"""Calcula os eixos do radar de desempenho para um produtor."""

	production = normalize(snapshot.metrics.get("producaoMediaDiaria842366", 0), 0, 60)
	tech = _safe_division(sum(snapshot.bool_flags.values()), max(len(snapshot.bool_flags), 1))
	sanidade = _mean([float(snapshot.bool_flags.get(key, False)) for key in SANIDADE_KEYS])
	bem_estar = _mean([float(snapshot.bool_flags.get(key, False)) for key in BEM_ESTAR_KEYS])
	capacity = normalize(snapshot.metrics.get("qualACapacidadeDoTanqueDeExpansao842415", 0), 0, 5000)
	return [production, tech, sanidade, bem_estar, capacity]


def average_performance_radar_values(snapshots: List["ProducerSnapshot"]) -> List[float]:
	"""Calcula a média dos eixos do radar para um conjunto de produtores."""

	if not snapshots:
		return [0.0] * 5
	axes = [performance_radar_values(snapshot) for snapshot in snapshots]
	return [_mean([axis[index] for axis in axes]) for index in range(5)]
