"""Modelos de dados usados no dashboard."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict


@dataclass
class ProducerSnapshot:
	"""Representa respostas de um produtor em um período específico."""

	producer_id: str
	name: str
	friendly_id: str
	period_label: str
	created_at: datetime
	metrics: Dict[str, float]
	bool_flags: Dict[str, bool]
	answers: Dict[str, str]
	metadata: Dict[str, str]
	score: float
	group: str
	clean_answers: Dict[str, str] = field(default_factory=dict)
	ibp: float = 0.0
