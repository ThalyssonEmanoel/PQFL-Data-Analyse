"""Fábrica de gráficos matplotlib reutilizáveis para o dashboard."""

from __future__ import annotations

import math
import textwrap
from typing import Dict, List

import tkinter as tk
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure

from domain_constants import (
	IBP_COMPONENT_FIELDS,
	IBP_COMPONENT_WEIGHTS,
	IBP_RADAR_LABELS,
	PERFORMANCE_RADAR_LABELS,
	PRIMARY_METRICS,
)
from domain_utils import (
	_bin_income_share,
	_mean,
	_weighted_average,
	bool_to_rate,
	parse_bool,
	pearson_correlation,
	performance_radar_values,
	top_pqfl_factor_gaps,
)
from models import ProducerSnapshot

try:  # mplcursors garante tooltip interativo sem quebrar se não estiver instalado
	import mplcursors  # type: ignore
except ImportError:  # pragma: no cover - dependência opcional
	mplcursors = None


class ChartFactory:
	"""Responsável por construir figuras matplotlib reutilizáveis."""

	def __init__(self) -> None:
		self._cursor_refs: List = []

	def _attach_cursor(self, canvas: FigureCanvasTkAgg) -> None:
		if mplcursors is None:
			return
		cursor = mplcursors.cursor(canvas.figure, hover=True)
		cursor.connect("add", lambda sel: sel.annotation.set_text(f"{sel.target[0]:.0f}: {sel.target[1]:.1f}"))
		self._cursor_refs.append(cursor)

	def line_chart(self, parent: tk.Widget, history: List[ProducerSnapshot], metric_key: str) -> FigureCanvasTkAgg:
		figure = Figure(figsize=(4, 2.5), dpi=100)
		axis = figure.add_subplot(111)
		axis.set_title(PRIMARY_METRICS.get(metric_key, metric_key))
		points = [(snap.created_at, snap.metrics.get(metric_key, 0)) for snap in history]
		if points:
			x_vals = [pt[0] for pt in points]
			y_vals = [pt[1] for pt in points]
			axis.plot_date(x_vals, y_vals, "-o", color="#08a9f4")
		axis.grid(True, linestyle="--", alpha=0.4)
		figure.autofmt_xdate()
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		self._attach_cursor(canvas)
		return canvas

	def bar_chart(self, parent: tk.Widget, snapshot: ProducerSnapshot) -> FigureCanvasTkAgg:
		figure = Figure(figsize=(4, 2.5), dpi=100)
		axis = figure.add_subplot(111)
		labels = ["Produção", "Capacidade", "% renda"]
		values = [
			snapshot.metrics.get("producaoMediaDiaria842366", 0),
			snapshot.metrics.get("qualACapacidadeDoTanqueDeExpansao842415", 0),
			snapshot.metrics.get("quantosRepresentaARendaDoLeiteNaPropriedade842371", 0),
		]
		axis.bar(labels, values, color=["#2dd4bf", "#6366f1", "#f97316"])
		axis.set_title("Indicadores produtivos")
		axis.grid(axis="y", linestyle="--", alpha=0.4)
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		self._attach_cursor(canvas)
		return canvas

	def radar_chart(self, parent: tk.Widget, snapshot: ProducerSnapshot) -> FigureCanvasTkAgg:
		labels = PERFORMANCE_RADAR_LABELS
		values = performance_radar_values(snapshot)
		values.append(values[0])
		angles = [n / float(len(labels)) * 2 * math.pi for n in range(len(labels))]
		angles.append(angles[0])

		figure = Figure(figsize=(4.2, 3.2), dpi=100)
		axis = figure.add_subplot(111, polar=True)
		axis.plot(angles, values, color="#fcd34d")
		axis.fill(angles, values, color="#fcd34d", alpha=0.25)
		axis.set_xticks(angles[:-1])
		axis.set_xticklabels(labels)
		axis.set_yticklabels([])
		axis.set_title("Radar de desempenho", pad=12)
		figure.subplots_adjust(top=0.84, bottom=0.08, left=0.06, right=0.94)
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		return canvas

	def pqfl_factor_gaps_chart(self, parent: tk.Widget, snapshot: ProducerSnapshot) -> FigureCanvasTkAgg:
		"""Mostra os fatores oficiais do PQFL com maior não conformidade."""

		figure = Figure(figsize=(5.8, 3.6), dpi=110)
		axis = figure.add_subplot(111)
		diagnostics = top_pqfl_factor_gaps(snapshot, top_n=5)
		if diagnostics:
			labels = [textwrap.fill(str(item.get("factor_label", "Fator")), width=28) for item in diagnostics]
			gaps = [float(item.get("gap", 0.0)) * 100 for item in diagnostics]
			colors = ["#dc2626", "#ea580c", "#f97316", "#fb923c", "#fdba74"]
			bars = axis.barh(labels, gaps, color=colors[: len(labels)])
			axis.invert_yaxis()
			axis.tick_params(axis="y", labelsize=9)
			for bar, value in zip(bars, gaps):
				label_x = min(value + 1.0, 96.0)
				axis.text(label_x, bar.get_y() + bar.get_height() / 2, f"{value:.0f}%", va="center", fontsize=9)
		else:
			axis.barh(["Sem dados"], [0], color="#94a3b8")
		axis.set_xlim(0, 100)
		axis.set_xlabel("Não conformidade (%)")
		axis.set_title("Top falhas por fator PQFL")
		axis.grid(axis="x", linestyle="--", alpha=0.3)
		figure.subplots_adjust(left=0.50, right=0.98, top=0.88, bottom=0.20)
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		return canvas

	def quality_biosafety_chart(self, parent: tk.Widget, records: List[Dict[str, object]]) -> FigureCanvasTkAgg:
		figure = Figure(figsize=(5.5, 3.2), dpi=100)
		axis = figure.add_subplot(111)
		categories = ["Pré-dipping", "Pós-dipping", "Controle mastite", "Problemas de qualidade"]
		if records:
			values = [
				_mean([bool_to_rate(row.get("pre_dipping")) for row in records]),
				_mean([bool_to_rate(row.get("pos_dipping")) for row in records]),
				_mean([bool_to_rate(row.get("controle_mastite")) for row in records]),
				_mean([row.get("quality_risk", 0.0) for row in records]),
			]
		else:
			values = [0.0, 0.0, 0.0, 0.0]
		colors = ["#22c55e", "#16a34a", "#0ea5e9", "#ef4444"]
		bars = axis.bar(categories, [v * 100 for v in values], color=colors)
		axis.set_ylim(0, 100)
		axis.set_ylabel("Percentual")
		axis.set_title("Qualidade e Biosseguridade")
		axis.grid(axis="y", linestyle="--", alpha=0.3)
		for bar, value in zip(bars, values):
			axis.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 2, f"{value * 100:.0f}%", ha="center", va="bottom", fontsize=9)
		if records:
			hygiene_scores = [row.get("hygiene_score", 0.0) for row in records]
			quality_risks = [row.get("quality_risk", 0.0) for row in records]
			correlation = pearson_correlation(hygiene_scores, quality_risks)
			axis.text(0.02, 0.92, f"Correlação higiene x problema: {correlation:.2f}", transform=axis.transAxes, fontsize=9, bbox=dict(facecolor="white", alpha=0.7, edgecolor="none"))
		figure.tight_layout()
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		return canvas

	def tank_efficiency_scatter(self, parent: tk.Widget, records: List[Dict[str, object]]) -> FigureCanvasTkAgg:
		figure = Figure(figsize=(5.5, 3.2), dpi=100)
		axis = figure.add_subplot(111)
		with_tank = [row for row in records if row.get("tanque_proporcional") == "Sim"]
		without_tank = [row for row in records if row.get("tanque_proporcional") != "Sim"]
		if with_tank:
			axis.scatter(
				[row.get("producao_media_diaria", 0.0) for row in with_tank],
				[row.get("capacidade_tanque", 0.0) for row in with_tank],
				color="#22c55e",
				label="Tanque proporcional: Sim",
				s=70,
				alpha=0.85,
			)
		if without_tank:
			axis.scatter(
				[row.get("producao_media_diaria", 0.0) for row in without_tank],
				[row.get("capacidade_tanque", 0.0) for row in without_tank],
				color="#ef4444",
				label="Tanque proporcional: Não",
				s=70,
				alpha=0.85,
			)
		axis.set_xlabel("Produção média diária")
		axis.set_ylabel("Capacidade do tanque")
		axis.set_title("Eficiência de Tanque")
		axis.grid(True, linestyle="--", alpha=0.3)
		axis.legend(loc="best")
		figure.tight_layout()
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		return canvas

	def logistic_risk_chart(self, parent: tk.Widget, records: List[Dict[str, object]]) -> FigureCanvasTkAgg:
		figure = Figure(figsize=(5.5, 3.2), dpi=100)
		axis = figure.add_subplot(111)
		categories = sorted({str(row.get("vias_acesso", "Não Informado")) for row in records}) if records else ["Não Informado"]
		energy_rates: List[float] = []
		internet_rates: List[float] = []
		for category in categories:
			bucket = [row for row in records if str(row.get("vias_acesso", "Não Informado")) == category]
			energy_rates.append(_mean([1.0 if row.get("energia_estavel") == "Sim" else 0.0 for row in bucket]))
			internet_rates.append(_mean([1.0 if row.get("internet") == "Sim" else 0.0 for row in bucket]))
		indices = list(range(len(categories)))
		width = 0.36
		axis.bar([idx - width / 2 for idx in indices], [value * 100 for value in energy_rates], width=width, label="Energia estável", color="#3b82f6")
		axis.bar([idx + width / 2 for idx in indices], [value * 100 for value in internet_rates], width=width, label="Internet", color="#8b5cf6")
		axis.set_xticks(indices)
		axis.set_xticklabels(categories, rotation=20, ha="right")
		axis.set_ylim(0, 100)
		axis.set_ylabel("Cobertura (%)")
		axis.set_title("Risco Logístico")
		axis.grid(axis="y", linestyle="--", alpha=0.3)
		axis.legend(loc="best")
		figure.tight_layout()
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		return canvas

	def socioeconomic_pareto_chart(self, parent: tk.Widget, records: List[Dict[str, object]]) -> FigureCanvasTkAgg:
		figure = Figure(figsize=(5.5, 3.2), dpi=100)
		axis = figure.add_subplot(111)
		counts: Dict[str, int] = {}
		for row in records:
			category = str(row.get("escolaridade", "Não Informado"))
			counts[category] = counts.get(category, 0) + 1
		ordered = sorted(counts.items(), key=lambda item: item[1], reverse=True)
		categories = [item[0] for item in ordered] or ["Não Informado"]
		values = [item[1] for item in ordered] or [0]
		total = sum(values) or 1
		cumulative = []
		accumulator = 0
		for value in values:
			accumulator += value
			cumulative.append(accumulator / total * 100)
		bars = axis.bar(categories, values, color="#0ea5e9")
		axis.set_ylabel("Frequência")
		axis.set_title("Pareto de Escolaridade")
		axis.grid(axis="y", linestyle="--", alpha=0.3)
		axis_twin = axis.twinx()
		axis_twin.plot(categories, cumulative, color="#f97316", marker="o", linewidth=2)
		axis_twin.set_ylabel("Cumulativo (%)")
		axis_twin.set_ylim(0, 110)
		for bar, value in zip(bars, values):
			axis.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05, str(value), ha="center", va="bottom", fontsize=9)
		figure.tight_layout()
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		return canvas

	def income_pie_chart(self, parent: tk.Widget, records: List[Dict[str, object]]) -> FigureCanvasTkAgg:
		figure = Figure(figsize=(5.5, 3.2), dpi=100)
		axis = figure.add_subplot(111)
		counts: Dict[str, int] = {}
		for row in records:
			bucket = _bin_income_share(row.get("renda_leite_percentual"))
			counts[bucket] = counts.get(bucket, 0) + 1
		labels = list(counts.keys()) or ["Não informado"]
		values = list(counts.values()) or [1]
		colors = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8"]
		axis.pie(values, labels=labels, autopct="%1.0f%%", startangle=90, colors=colors[: len(values)])
		axis.set_title("Participação da Renda do Leite")
		figure.tight_layout()
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		return canvas

	def ibp_radar_chart(self, parent: tk.Widget, records: List[Dict[str, object]]) -> FigureCanvasTkAgg:
		figure = Figure(figsize=(5.8, 3.4), dpi=100)
		axis = figure.add_subplot(111, polar=True)
		angles = [n / float(len(IBP_RADAR_LABELS)) * 2 * math.pi for n in range(len(IBP_RADAR_LABELS))]
		angles.append(angles[0])
		series = {}
		for row in records:
			system = str(row.get("sistema_producao", "Não Informado"))
			series.setdefault(system, []).append(row)
		palette = ["#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#a855f7", "#14b8a6"]
		for idx, (system, items) in enumerate(sorted(series.items(), key=lambda item: item[0])):
			if not items:
				continue
			components = {
				"vacinacao": _mean([
					_mean([1.0 if parse_bool(row.get(field_name)) else 0.0 for field_name in IBP_COMPONENT_FIELDS["vacinacao"]])
					for row in items
				]),
				"exames": _mean([
					_mean([1.0 if parse_bool(row.get(field_name)) else 0.0 for field_name in IBP_COMPONENT_FIELDS["exames"]])
					for row in items
				]),
				"ordenha": _mean([
					_mean([1.0 if parse_bool(row.get(field_name)) else 0.0 for field_name in IBP_COMPONENT_FIELDS["ordenha"]])
					for row in items
				]),
				"treinamentos": _mean([
					_mean([1.0 if parse_bool(row.get(field_name)) else 0.0 for field_name in IBP_COMPONENT_FIELDS["treinamentos"]])
					for row in items
				]),
			}
			ibp_value = _weighted_average(components, IBP_COMPONENT_WEIGHTS)
			values = [components["vacinacao"], components["exames"], components["ordenha"], components["treinamentos"], ibp_value]
			values.append(values[0])
			axis.plot(angles, values, color=palette[idx % len(palette)], linewidth=2, label=system)
			axis.fill(angles, values, color=palette[idx % len(palette)], alpha=0.12)
		axis.set_xticks(angles[:-1])
		axis.set_xticklabels(IBP_RADAR_LABELS)
		axis.set_yticklabels([])
		axis.set_ylim(0, 1)
		axis.set_title("Índice de Boas Práticas por Sistema")
		axis.legend(loc="upper right", bbox_to_anchor=(1.35, 1.12))
		figure.tight_layout()
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		return canvas

	def animal_welfare_stacked_bar(self, parent: tk.Widget, records: List[Dict[str, object]]) -> FigureCanvasTkAgg:
		figure = Figure(figsize=(5.5, 3.2), dpi=100)
		axis = figure.add_subplot(111)
		fields = ["ambiente_limpo", "instalacoes_bem_estar", "bem_estar_geral"]
		labels = ["Ambiente limpo", "Instalações", "Bem-estar geral"]
		segments = {"Sim": [], "Não": [], "Não Informado": []}
		for field_name in fields:
			values = [str(row.get(field_name, "Não Informado")) for row in records]
			total = max(len(values), 1)
			segments["Sim"].append(values.count("Sim") / total * 100)
			segments["Não"].append(values.count("Não") / total * 100)
			segments["Não Informado"].append(values.count("Não Informado") / total * 100)
		bottom = [0.0] * len(fields)
		colors = {"Sim": "#22c55e", "Não": "#ef4444", "Não Informado": "#94a3b8"}
		for label in ["Sim", "Não", "Não Informado"]:
			axis.bar(labels, segments[label], bottom=bottom, color=colors[label], label=label)
			bottom = [current + addition for current, addition in zip(bottom, segments[label])]
		axis.set_ylim(0, 100)
		axis.set_ylabel("Percentual")
		axis.set_title("Bem-Estar Animal")
		axis.grid(axis="y", linestyle="--", alpha=0.3)
		axis.legend(loc="best")
		figure.tight_layout()
		canvas = FigureCanvasTkAgg(figure, master=parent)
		canvas.draw()
		return canvas
