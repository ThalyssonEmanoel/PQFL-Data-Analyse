"""Serviços de integração, logging e repositório de dados do dashboard."""

from __future__ import annotations

import csv
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests

from domain_constants import (
	BOOLEAN_ALIAS_TO_LEGACY,
	BOOLEAN_FLAGS,
	CANDIDATE_FIELDS,
	IBP_COMPONENT_WEIGHTS,
	PRIMARY_METRICS,
)
from domain_utils import (
	_mean,
	_quality_problem_score,
	_weighted_average,
	bool_to_rate,
	calculate_ibp,
	clean_display_value,
	month_label,
	normalize,
	normalize_ibp_components,
	normalize_query_fields,
	parse_bool,
	safe_float,
)
from models import ProducerSnapshot
from queries import API_QUERY, build_producer_record, get_sample_payload


class ColetumClient:
	"""Cliente HTTP com cache e fallback offline."""

	def __init__(self, endpoint: Dict[str, object], cache_file: Path) -> None:
		self.endpoint = endpoint
		self.cache_file = cache_file
		self.session = requests.Session()
		self.session.headers.update({"User-Agent": "PQFL-Dashboard/1.0"})

	def fetch_answers(self, *, use_cache: bool = True) -> Dict:
		"""Busca dados do endpoint ou do cache."""

		if use_cache and self.cache_file.exists():
			try:
				with self.cache_file.open("r", encoding="utf-8") as handler:
					cached = json.load(handler)
				return cached
			except json.JSONDecodeError:
				logging.warning("Cache corrompido. Ignorando arquivo.")

		token_value = str(self.endpoint.get("token", ""))
		if not token_value:
			message = "Token do webservice ausente. Defina COLETUM_TOKEN no arquivo .env."
			logging.error(message)
			if self.cache_file.exists():
				with self.cache_file.open("r", encoding="utf-8") as handler:
					return json.load(handler)
			raise RuntimeError(message)

		query_text = " ".join(API_QUERY.split())
		if not query_text:
			raise RuntimeError("Query GraphQL vazia. Verifique o arquivo queries.py")

		params = {
			str(self.endpoint["query_param"]): query_text,
			str(self.endpoint["token_param"]): token_value,
		}
		try:
			response = self.session.get(
				str(self.endpoint["url"]),
				params=params,
				timeout=30,
			)
			response.raise_for_status()
		except requests.RequestException as exc:
			logging.error("Falha na requisição: %s", exc)
			if self.cache_file.exists():
				with self.cache_file.open("r", encoding="utf-8") as handler:
					return json.load(handler)
			raise

		payload = response.json()
		timestamp = datetime.now(timezone.utc).isoformat()
		with self.cache_file.open("w", encoding="utf-8") as handler:
			json.dump({"fetched_at": timestamp, "data": payload}, handler, ensure_ascii=False)
		return {"fetched_at": timestamp, "data": payload}


class ActivityLogger:
	"""Persistência estruturada do log de atividades do usuário."""

	def __init__(self, log_file: Path) -> None:
		self.log_file = log_file
		self.records: List[Dict] = []
		if self.log_file.exists():
			try:
				with self.log_file.open("r", encoding="utf-8") as handler:
					self.records = json.load(handler)
			except json.JSONDecodeError:
				self.records = []

	def log(
		self,
		*,
		event: str,
		producer: Optional[str] = None,
		group: Optional[str] = None,
		period: Optional[str] = None,
		actions: Optional[List[str]] = None,
		status: str = "pendente",
		notes: Optional[str] = None,
	) -> None:
		entry = {
			"timestamp": datetime.now(timezone.utc).isoformat(),
			"event": event,
			"producer": producer,
			"group": group,
			"period": period,
			"actions": actions or [],
			"status": status,
			"notes": notes,
		}
		self.records.append(entry)
		with self.log_file.open("w", encoding="utf-8") as handler:
			json.dump(self.records, handler, ensure_ascii=False, indent=2)

	def export(self, file_path: Path) -> None:
		with file_path.open("w", encoding="utf-8") as handler:
			json.dump(self.records, handler, ensure_ascii=False, indent=2)

	def export_csv(self, file_path: Path) -> None:
		fieldnames = ["timestamp", "event", "producer", "group", "period", "status", "notes", "actions"]
		with file_path.open("w", encoding="utf-8", newline="") as handler:
			writer = csv.DictWriter(handler, fieldnames=fieldnames)
			writer.writeheader()
			for row in self.records:
				writer.writerow({
					**{key: row.get(key) for key in fieldnames if key != "actions"},
					"actions": "; ".join(row.get("actions", [])),
				})


class ActionEngine:
	"""Gera sugestões de ações com base nos indicadores e grupo."""

	BASE_ACTIONS = {
		"P1": [
			"Manter protocolos atuais e reforçar treinamentos trimestrais.",
			"Documentar boas práticas e compartilhar com outros produtores.",
		],
		"P2": [
			"Planejar análise de solo e ajuste fino da dieta.",
			"Expandir uso de registros zootécnicos para ganho genético.",
		],
		"P3": [
			"Implementar controle leiteiro mensal e identificar gargalos.",
			"Priorizar assistência técnica para manejo sanitário.",
		],
		"P4": [
			"Adotar plano emergencial de higiene e bem-estar animal.",
			"Restabelecer registros financeiros básicos e metas semanais.",
		],
	}

	def build_for_producer(self, snapshot: ProducerSnapshot) -> List[str]:
		actions = list(self.BASE_ACTIONS.get(snapshot.group, []))
		production = snapshot.metrics.get("producaoMediaDiaria842366", 0)
		capacity = snapshot.metrics.get("qualACapacidadeDoTanqueDeExpansao842415", 0)
		people = snapshot.metrics.get("quantasPessoasEstaoEnvolvidasNaAtividadeLeiteira842372", 0)
		if production < 15:
			actions.append("Rever dieta, conforto e genética para elevar a produção média acima de 18 L/vaca/dia.")
		if capacity and production and capacity < production * 50:
			actions.append("Dimensionar o tanque de expansão para suportar pelo menos 2 ordenhas completas.")
		if not snapshot.bool_flags.get("utilizaPre_dippingAntesDaOrdenha842439", False) or not snapshot.bool_flags.get("utilizaSolucaoPos_dippingAposAOrdenha842440", False):
			actions.append("Implantar rotina completa de pré e pós-dipping para reduzir mastite.")
		if not snapshot.bool_flags.get("possuiCalendarioSanitarioVacinacoesEndoEEctoparasitasEtc842452", False):
			actions.append("Estruturar um calendário sanitário com apoio técnico e registrar as intervenções.")
		if people < 2:
			actions.append("Mapear necessidades de mão de obra e promover capacitação cruzada na equipe.")
		return actions

	def build_for_group(self, group: str) -> List[str]:
		return self.BASE_ACTIONS.get(group, [])


class DataRepository:
	"""Transforma o payload bruto em modelos para uso na UI."""

	def __init__(self, payload: Dict) -> None:
		self.raw_payload = payload
		self.snapshots: Dict[str, Dict[str, ProducerSnapshot]] = {}
		self.latest_snapshot: Dict[str, ProducerSnapshot] = {}
		self._parse_payload()

		if not self.snapshots:
			self._seed_sample_data()

	def _clean_answer_value(self, value: Optional[object]) -> str:
		"""Normaliza qualquer resposta textual para exibição legível."""

		return clean_display_value(value)

	def _build_clean_answers(self, answer: Dict[str, str]) -> Dict[str, str]:
		"""Cria uma versão amigável do payload com nulos padronizados."""

		return {key: self._clean_answer_value(value) for key, value in answer.items()}

	def _parse_payload(self) -> None:
		data = self.raw_payload.get("data", self.raw_payload)
		if isinstance(data, list):
			data = data[0] if data else {}
		answer_block = data.get("answer", {})
		if isinstance(answer_block, list):
			answer_block = answer_block[0] if answer_block else {}
		answers = answer_block.get("answer", [])
		metadata = answer_block.get("metaData", [])

		if isinstance(answers, dict):
			answers = [answers]
		if isinstance(metadata, dict):
			metadata = [metadata]
		if metadata and len(metadata) != len(answers):
			while len(metadata) < len(answers):
				metadata.append(metadata[-1])

		if not answers:
			return

		for idx, answer in enumerate(answers):
			answer = normalize_query_fields(answer)
			meta = metadata[idx] if idx < len(metadata) else {}
			created_at = self._parse_datetime(meta.get("createdAt")) or datetime.now(timezone.utc)
			period_label = month_label(created_at)
			producer_id = meta.get("userId") or answer.get("cpf842335") or f"anon-{idx}"
			friendly_id = meta.get("friendlyId", str(answer.get("nome842334", "Sem nome")))
			metrics = {key: safe_float(answer.get(key)) for key in PRIMARY_METRICS}
			bool_flags = {key: parse_bool(answer.get(key)) for key in BOOLEAN_FLAGS}
			for alias, legacy in BOOLEAN_ALIAS_TO_LEGACY.items():
				bool_flags[alias] = bool_flags.get(legacy, False)
			score, group = self._classify(metrics, bool_flags)
			snapshot = ProducerSnapshot(
				producer_id=producer_id,
				name=answer.get("nome842334") or friendly_id,
				friendly_id=friendly_id,
				period_label=period_label,
				created_at=created_at,
				metrics=metrics,
				bool_flags=bool_flags,
				answers=answer,
				metadata=meta,
				score=score,
				group=group,
				clean_answers=self._build_clean_answers(answer),
				ibp=0.0,
			)
			snapshot.ibp, _ = calculate_ibp(snapshot)
			self.snapshots.setdefault(producer_id, {})[period_label] = snapshot
			latest = self.latest_snapshot.get(producer_id)
			if latest is None or snapshot.created_at > latest.created_at:
				self.latest_snapshot[producer_id] = snapshot

	def _seed_sample_data(self) -> None:
		self.raw_payload = get_sample_payload()
		self._parse_payload()
	def _parse_datetime(self, value: Optional[str]) -> Optional[datetime]:
		if not value:
			return None
		try:
			return datetime.fromisoformat(value.replace("Z", "+00:00"))
		except ValueError:
			return None

	def _classify(self, metrics: Dict[str, float], flags: Dict[str, bool]) -> Tuple[float, str]:
		production = normalize(metrics.get("producaoMediaDiaria842366", 0), 0, 60)
		capacity = normalize(metrics.get("qualACapacidadeDoTanqueDeExpansao842415", 0), 0, 5000)
		people = normalize(metrics.get("quantasPessoasEstaoEnvolvidasNaAtividadeLeiteira842372", 0), 0, 15)
		tech_ratio = _mean([float(flag) for flag in flags.values()])
		score = (0.45 * production + 0.20 * capacity + 0.25 * tech_ratio + 0.10 * people) * 100
		score = max(min(score, 100), 0)
		if score >= 75:
			group = "P1"
		elif score >= 55:
			group = "P2"
		elif score >= 35:
			group = "P3"
		else:
			group = "P4"
		return score, group

	def list_latest_snapshots(self) -> List[ProducerSnapshot]:
		return sorted(self.latest_snapshot.values(), key=lambda snap: snap.name.lower())

	def list_periods(self) -> List[str]:
		periods = {snap.period_label for snaps in self.snapshots.values() for snap in snaps.values()}
		return sorted(periods)

	def list_by_group(self) -> Dict[str, List[ProducerSnapshot]]:
		groups: Dict[str, List[ProducerSnapshot]] = {"P1": [], "P2": [], "P3": [], "P4": []}
		for snap in self.list_latest_snapshots():
			groups.setdefault(snap.group, []).append(snap)
		groups["P1"] = sorted(groups["P1"], key=lambda s: s.score, reverse=True)
		groups["P2"] = sorted(groups["P2"], key=lambda s: s.score, reverse=True)
		groups["P3"] = sorted(groups["P3"], key=lambda s: s.score)
		groups["P4"] = sorted(groups["P4"], key=lambda s: s.score)
		return groups

	def get_history(self, producer_id: str) -> List[ProducerSnapshot]:
		history = self.snapshots.get(producer_id, {})
		return sorted(history.values(), key=lambda snap: snap.created_at)

	def get_snapshot(self, producer_id: str, period_label: Optional[str] = None) -> Optional[ProducerSnapshot]:
		if period_label:
			return self.snapshots.get(producer_id, {}).get(period_label)
		return self.latest_snapshot.get(producer_id)

	def iter_latest_records(self) -> List[Dict[str, object]]:
		"""Retorna registros consolidados da última resposta de cada produtor."""

		records: List[Dict[str, object]] = []
		for snapshot in self.list_latest_snapshots():
			hygiene_score = _mean([
				bool_to_rate(snapshot.bool_flags.get("pre_dipping")),
				bool_to_rate(snapshot.bool_flags.get("pos_dipping")),
				bool_to_rate(snapshot.bool_flags.get("controle_mastite")),
			])
			quality_risk = _quality_problem_score(snapshot.clean_answers.get("ultima_qualidade_leite"))
			records.append(build_producer_record(snapshot, hygiene_score, quality_risk))
		return records

	def diagnose_bottlenecks(self) -> List[str]:
		"""Resume os principais gargalos da base usando conformidade média."""

		records = self.iter_latest_records()
		if not records:
			return ["Sem dados suficientes para diagnóstico."]

		candidate_fields = CANDIDATE_FIELDS
		conformity = [
			(label, _mean([1.0 if row.get(field_name) == "Sim" else 0.0 for row in records]))
			for label, field_name in candidate_fields.items()
		]
		conformity.sort(key=lambda item: item[1])
		return [f"{label}: conformidade média de {score * 100:.1f}%" for label, score in conformity[:4]]

	def ibp_by_system(self) -> Dict[str, Dict[str, float]]:
		"""Agrupa o IBP e seus componentes por sistema de produção."""

		aggregated: Dict[str, Dict[str, List[float]]] = {}
		for snapshot in self.list_latest_snapshots():
			system = snapshot.clean_answers.get("sistema_producao", "Não Informado")
			bucket = aggregated.setdefault(system, {key: [] for key in IBP_COMPONENT_WEIGHTS})
			components = normalize_ibp_components(snapshot)
			for key, value in components.items():
				bucket[key].append(value)
		results: Dict[str, Dict[str, float]] = {}
		for system, component_lists in aggregated.items():
			component_means = {key: _mean(values) for key, values in component_lists.items()}
			component_means["ibp"] = _weighted_average(component_means, IBP_COMPONENT_WEIGHTS) * 100
			results[system] = component_means
		return results
