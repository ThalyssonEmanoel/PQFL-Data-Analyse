"""Ponto de entrada da interface desktop do dashboard PQFL."""

from __future__ import annotations

import logging
import math
import threading
from pathlib import Path
from typing import Dict, List, Optional

import tkinter as tk
from tkinter import filedialog

import ttkbootstrap as tb
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
from ttkbootstrap.constants import BOTH, CENTER, E, NSEW, W, X
from ttkbootstrap.dialogs import Messagebox
from ttkbootstrap.widgets.scrolled import ScrolledFrame

from charts import ChartFactory
from config import API_DOC, CACHE_FILE, LOG_FILE
from domain_constants import (
	METRIC_LABEL_TO_KEY,
	PERFORMANCE_RADAR_LABELS,
	PRIMARY_METRICS,
)
from domain_utils import (
	_mean,
	average_performance_radar_values,
	performance_radar_values,
)
from models import ProducerSnapshot
from services import ActionEngine, ActivityLogger, ColetumClient, DataRepository


class MainMenuFrame(tb.Frame):
	"""Tela inicial com cards de navegação."""

	def __init__(self, master: "DashboardApp") -> None:
		super().__init__(master, padding=30)
		self.app = master
		self.columnconfigure((0, 1, 2, 3), weight=1, uniform="cards")
		self._build_cards()

	def _build_cards(self) -> None:
		items = [
			{
				"title": "Produtores",
				"desc": "Consulta detalhada, gráficos e ações recomendadas.",
				"command": lambda: self._navigate("producers"),
			},
			{
				"title": "Grupos",
				"desc": "Análise comparativa P1–P4 com insights por grupo.",
				"command": lambda: self._navigate("groups"),
			},
			{
				"title": "Comparar Informações",
				"desc": "Evolução mensal e movimentos entre grupos.",
				"command": lambda: self._navigate("compare"),
			},
			{
				"title": "Diagnóstico Executivo",
				"desc": "Painéis temáticos, IBP, perfil socioeconômico e gargalos críticos.",
				"command": lambda: self._navigate("diagnostico"),
			},
		]
		for idx, item in enumerate(items):
			card = tb.Frame(self, padding=20, relief="ridge", borderwidth=2)
			card.grid(row=0, column=idx, padx=15, sticky=NSEW)
			title = tb.Label(card, text=item["title"], font=("Segoe UI", 18, "bold"))
			title.pack(pady=(0, 10))
			desc = tb.Label(card, text=item["desc"], wraplength=250, justify=CENTER)
			desc.pack(pady=(0, 20))
			btn = tb.Button(card, text="Abrir", command=item["command"], bootstyle="primary-outline")
			btn.pack(fill=X)

	def _navigate(self, target: str) -> None:
		self.app.logger.log(event="navegacao", notes=f"Tela {target}")
		self.app.show_frame(target)


class ProducersFrame(tb.Frame):
	"""Lista produtora com busca e gráficos."""

	def __init__(self, master: "DashboardApp") -> None:
		super().__init__(master)
		self.app = master
		self.chart_factory = ChartFactory()
		self.selected_producer: Optional[ProducerSnapshot] = None
		self._build_layout()

	def _build_layout(self) -> None:
		top = tb.Frame(self, padding=15)
		top.pack(fill=X)
		tb.Label(top, text="Produtores", font=("Segoe UI", 20, "bold")).pack(side=tk.LEFT)
		search_frame = tb.Frame(top)
		search_frame.pack(side=tk.RIGHT)
		tb.Label(search_frame, text="Buscar:").pack(side=tk.LEFT)
		self.search_var = tk.StringVar()
		entry = tb.Entry(search_frame, textvariable=self.search_var, width=30)
		entry.pack(side=tk.LEFT, padx=5)
		entry.bind("<KeyRelease>", lambda *_: self._populate_list())

		body = tb.Frame(self)
		body.pack(fill=BOTH, expand=True)
		self.tree = tb.Treeview(body, columns=("grupo", "score"), show="tree headings")
		self.tree.heading("#0", text="Produtor")
		self.tree.heading("grupo", text="Grupo")
		self.tree.heading("score", text="Score")
		self.tree.column("#0", width=250, anchor=W)
		self.tree.column("grupo", width=80, anchor=CENTER)
		self.tree.column("score", width=120, anchor=CENTER)
		self.tree.bind("<<TreeviewSelect>>", self._on_select)
		self.tree.pack(side=tk.LEFT, fill=BOTH, expand=False, padx=(15, 0), pady=15)

		self.detail_frame = tb.Frame(body, padding=15)
		self.detail_frame.pack(side=tk.LEFT, fill=BOTH, expand=True)
		self.detail_title = tb.Label(self.detail_frame, text="Selecione um produtor", font=("Segoe UI", 18, "bold"))
		self.detail_title.pack(anchor=W)

		self.chart_container = tb.Frame(self.detail_frame)
		self.chart_container.pack(fill=BOTH, expand=True, pady=10)

		# Novo: seleção de indicador para o gráfico de linha
		self.metric_var = tk.StringVar(value=PRIMARY_METRICS["producaoMediaDiaria842366"])
		metric_frame = tb.Frame(self.detail_frame)
		metric_frame.pack(anchor=W, pady=(0, 5))
		metric_label = tb.Label(metric_frame, text="Indicador do gráfico de linha:")
		metric_label.pack(side=tk.LEFT)
		metric_combo = tb.Combobox(metric_frame, textvariable=self.metric_var, width=30, values=list(PRIMARY_METRICS.values()))
		metric_combo.pack(side=tk.LEFT, padx=5)
		metric_combo.bind("<<ComboboxSelected>>", lambda *_: self._update_charts())

		btn_frame = tb.Frame(self.detail_frame)
		btn_frame.pack(anchor=E)
		tb.Button(btn_frame, text="Ações recomendadas", command=self._open_actions, bootstyle="primary").pack(side=tk.LEFT, padx=5)
		tb.Button(btn_frame, text="Voltar", command=lambda: self.app.show_frame("menu"), bootstyle="secondary").pack(side=tk.LEFT)

	def _populate_list(self) -> None:
		self.tree.delete(*self.tree.get_children())
		search = self.search_var.get().lower().strip()
		try:
			producers = self.app.repository.list_latest_snapshots()
		except RuntimeError:
			return
		for snapshot in producers:
			if search and search not in snapshot.name.lower():
				continue
			self.tree.insert("", tk.END, iid=snapshot.producer_id, values=(snapshot.group, f"{snapshot.score:.1f}"), text=snapshot.name)

	def refresh(self) -> None:
		self._populate_list()

	def _on_select(self, _event: tk.Event) -> None:
		selection = self.tree.selection()
		if not selection:
			return
		producer_id = selection[0]
		try:
			snapshot = self.app.repository.get_snapshot(producer_id)
		except RuntimeError:
			return
		if not snapshot:
			return
		self.selected_producer = snapshot
		self.detail_title.config(text=f"{snapshot.name} — Grupo {snapshot.group} ({snapshot.score:.1f})")
		self._update_charts()
		self.app.logger.log(event="detalhe_produtor", producer=snapshot.name, group=snapshot.group, period=snapshot.period_label)

	def _update_charts(self):
		for child in self.chart_container.winfo_children():
			child.destroy()
		if not self.selected_producer:
			return
		producer_id = self.selected_producer.producer_id
		history = self.app.repository.get_history(producer_id)
		metric_key = METRIC_LABEL_TO_KEY.get(self.metric_var.get(), self.metric_var.get())
		line = self.chart_factory.line_chart(self.chart_container, history, metric_key)
		line.get_tk_widget().grid(row=0, column=0, padx=5, pady=5)
		bar = self.chart_factory.bar_chart(self.chart_container, self.selected_producer)
		bar.get_tk_widget().grid(row=0, column=1, padx=5, pady=5)
		radar = self.chart_factory.radar_chart(self.chart_container, self.selected_producer)
		radar.get_tk_widget().grid(row=1, column=0, columnspan=2, padx=5, pady=5)

	def _open_actions(self) -> None:
		if not self.selected_producer:
			Messagebox.show_warning("Selecione um produtor primeiro.", "Ações")
			return
		actions = self.app.actions.build_for_producer(self.selected_producer)
		modal = ActionModal(self.app, f"Ações — {self.selected_producer.name}", actions)
		modal.show()


class GroupsFrame(tb.Frame):
	"""Fluxo de grupos P1–P4."""

	COLORS = {
		"P1": "#14532d",
		"P2": "#22c55e",
		"P3": "#fb923c",
		"P4": "#dc2626",
	}

	def __init__(self, master: "DashboardApp") -> None:
		super().__init__(master, padding=20)
		self.app = master
		self.chart_factory = ChartFactory()
		self.list_frame = tb.Frame(self)
		self.list_frame.pack(fill=BOTH, expand=True, pady=10)
		self.detail_frame = tb.Frame(self)
		self.detail_frame.pack(fill=BOTH, expand=True, pady=10)
		self.selected_group = tk.StringVar()
		self._build_cards()

	def _build_cards(self) -> None:
		for child in self.list_frame.winfo_children():
			child.destroy()
		try:
			groups = self.app.repository.list_by_group()
		except RuntimeError:
			groups = {"P1": [], "P2": [], "P3": [], "P4": []}
		for idx, group in enumerate(["P1", "P2", "P3", "P4"]):
			card = tb.Frame(self.list_frame, padding=15)
			card.grid(row=0, column=idx, padx=10, sticky=NSEW)
			card.configure(style="Card.TFrame")
			tb.Label(card, text=group, font=("Segoe UI", 20, "bold"), foreground=self.COLORS[group]).pack()
			tb.Label(card, text=f"{len(groups.get(group, []))} produtores").pack()
			tb.Button(card, text="Ver grupo", command=lambda g=group: self._open_group(g), bootstyle="link").pack(pady=5)
			tb.Button(card, text="Ações", command=lambda g=group: self._open_actions(g), bootstyle="secondary-outline").pack()

	def refresh(self) -> None:
		self._build_cards()

	def _open_group(self, group: str) -> None:
		self.selected_group.set(group)
		for child in self.detail_frame.winfo_children():
			child.destroy()
		header_frame = tb.Frame(self.detail_frame)
		header_frame.pack(fill=X)
		header = tb.Label(header_frame, text=f"Grupo {group}", font=("Segoe UI", 18, "bold"))
		header.pack(side=tk.LEFT, anchor=W)
		tb.Button(header_frame, text="Voltar", command=lambda: self.app.show_frame("menu"), bootstyle="secondary").pack(side=tk.RIGHT)

		# Novo: gráficos agregados do grupo
		chart_frame = tb.Frame(self.detail_frame)
		chart_frame.pack(fill=BOTH, expand=True, pady=10)
		try:
			group_items = self.app.repository.list_by_group().get(group, [])
		except RuntimeError:
			group_items = []

		if group_items:
			# Gráfico de barras: médias dos principais indicadores
			metrics = ["producaoMediaDiaria842366", "qualACapacidadeDoTanqueDeExpansao842415", "quantosRepresentaARendaDoLeiteNaPropriedade842371"]
			labels = [PRIMARY_METRICS.get(m, m) for m in metrics]
			values = [_mean([snap.metrics.get(m, 0) for snap in group_items]) for m in metrics]
			fig_bar = Figure(figsize=(3.5, 2.5), dpi=100)
			ax_bar = fig_bar.add_subplot(111)
			ax_bar.bar(labels, values, color=["#2dd4bf", "#6366f1", "#f97316"])
			ax_bar.set_title("Média dos indicadores do grupo")
			ax_bar.grid(axis="y", linestyle="--", alpha=0.4)
			canvas_bar = FigureCanvasTkAgg(fig_bar, master=chart_frame)
			canvas_bar.draw()
			canvas_bar.get_tk_widget().pack(side=tk.LEFT, padx=5)

			# Gráfico radar: radar médio do grupo
			labels_radar = PERFORMANCE_RADAR_LABELS
			values_radar = average_performance_radar_values(group_items)
			values_radar.append(values_radar[0])
			angles = [n / float(len(labels_radar)) * 2 * math.pi for n in range(len(labels_radar))]
			angles.append(angles[0])
			fig_radar = Figure(figsize=(3.5, 2.5), dpi=100)
			ax_radar = fig_radar.add_subplot(111, polar=True)
			ax_radar.plot(angles, values_radar, color="#fcd34d")
			ax_radar.fill(angles, values_radar, color="#fcd34d", alpha=0.25)
			ax_radar.set_xticks(angles[:-1])
			ax_radar.set_xticklabels(labels_radar)
			ax_radar.set_yticklabels([])
			ax_radar.set_title("Radar médio do grupo")
			canvas_radar = FigureCanvasTkAgg(fig_radar, master=chart_frame)
			canvas_radar.draw()
			canvas_radar.get_tk_widget().pack(side=tk.LEFT, padx=5)

			# Boxplot: distribuição da produção diária
			prod_values = [snap.metrics.get("producaoMediaDiaria842366", 0) for snap in group_items]
			fig_box = Figure(figsize=(2.5, 2.5), dpi=100)
			ax_box = fig_box.add_subplot(111)
			ax_box.boxplot(prod_values, vert=True, patch_artist=True, boxprops=dict(facecolor="#08a9f4", alpha=0.4))
			ax_box.set_title("Distribuição produção diária")
			ax_box.set_xticklabels(["Produção média diária"])
			canvas_box = FigureCanvasTkAgg(fig_box, master=chart_frame)
			canvas_box.draw()
			canvas_box.get_tk_widget().pack(side=tk.LEFT, padx=5)

		listbox = tb.Treeview(self.detail_frame, columns=("score",), show="tree headings")
		listbox.heading("#0", text="Produtor")
		listbox.heading("score", text="Score")
		listbox.column("#0", width=280, anchor=W)
		listbox.pack(fill=BOTH, expand=True, pady=10)
		try:
			group_items = self.app.repository.list_by_group().get(group, [])
		except RuntimeError:
			group_items = []
		for snap in group_items:
			listbox.insert("", tk.END, iid=snap.producer_id, values=(f"{snap.score:.1f}"), text=snap.name)
		listbox.bind("<<TreeviewSelect>>", lambda e, g=group, lb=listbox: self._open_producer_modal(lb, g))
		self.app.logger.log(event="grupo_aberto", group=group)

	def _open_actions(self, group: str) -> None:
		actions = self.app.actions.build_for_group(group)
		modal = ActionModal(self.app, f"Ações — {group}", actions)
		modal.show()

	def _open_producer_modal(self, listbox: tb.Treeview, group: str) -> None:
		selection = listbox.selection()
		if not selection:
			return
		producer_id = selection[0]
		try:
			snapshot = self.app.repository.get_snapshot(producer_id)
		except RuntimeError:
			return
		if not snapshot:
			return
		actions = self.app.actions.build_for_producer(snapshot)
		modal = ActionModal(self.app, f"{snapshot.name} — {group}", actions)
		modal.show()
		self.app.logger.log(event="acao_produtor_grupo", producer=snapshot.name, group=group)


class ComparisonFrame(tb.Frame):
	"""Comparação de períodos."""

	def __init__(self, master: "DashboardApp") -> None:
		super().__init__(master, padding=20)
		self.app = master
		self.chart_factory = ChartFactory()
		self.period_a = tk.StringVar()
		self.period_b = tk.StringVar()
		self._build_layout()

	def _build_layout(self) -> None:
		period_frame = tb.Frame(self)
		period_frame.pack(fill=X, pady=10)
		tb.Button(period_frame, text="Voltar", command=lambda: self.app.show_frame("menu"), bootstyle="secondary").pack(side=tk.RIGHT, padx=5)
		tb.Label(period_frame, text="Período A").pack(side=tk.LEFT)
		self.combo_a = tb.Combobox(period_frame, textvariable=self.period_a, width=12)
		self.combo_a.pack(side=tk.LEFT, padx=5)
		tb.Label(period_frame, text="Período B").pack(side=tk.LEFT)
		self.combo_b = tb.Combobox(period_frame, textvariable=self.period_b, width=12)
		self.combo_b.pack(side=tk.LEFT, padx=5)
		tb.Button(period_frame, text="Aplicar", command=self._populate).pack(side=tk.LEFT, padx=5)

		self.tree = tb.Treeview(self, columns=("grp_a", "grp_b"), show="tree headings")
		self.tree.heading("#0", text="Produtor")
		self.tree.heading("grp_a", text="Grupo A")
		self.tree.heading("grp_b", text="Grupo B")
		self.tree.column("#0", width=280, anchor=W)
		self.tree.column("grp_a", width=100, anchor=CENTER)
		self.tree.column("grp_b", width=100, anchor=CENTER)
		self.tree.pack(fill=BOTH, expand=True, pady=10)
		self.tree.bind("<<TreeviewSelect>>", self._on_select)

		self.detail = tb.Frame(self)
		self.detail.pack(fill=BOTH, expand=True)

	def refresh(self) -> None:
		try:
			periods = self.app.repository.list_periods()
		except RuntimeError:
			periods = []
		self.combo_a.configure(values=periods)
		self.combo_b.configure(values=periods)
		if periods:
			self.period_a.set(periods[0])
			self.period_b.set(periods[-1])
		self._populate()

	def _populate(self) -> None:
		self.tree.delete(*self.tree.get_children())
		period_a = self.period_a.get()
		period_b = self.period_b.get()
		if not (period_a and period_b):
			return
		try:
			all_snaps = self.app.repository.list_latest_snapshots()
		except RuntimeError:
			return
		for snapshot in all_snaps:
			snap_a = self.app.repository.get_snapshot(snapshot.producer_id, period_a)
			snap_b = self.app.repository.get_snapshot(snapshot.producer_id, period_b)
			if not snap_a or not snap_b:
				continue
			self.tree.insert("", tk.END, iid=snapshot.producer_id, values=(snap_a.group, snap_b.group), text=snapshot.name)

	def _on_select(self, _event: tk.Event) -> None:
		selection = self.tree.selection()
		if not selection:
			return
		producer_id = selection[0]
		period_a = self.period_a.get()
		period_b = self.period_b.get()
		try:
			snap_a = self.app.repository.get_snapshot(producer_id, period_a)
			snap_b = self.app.repository.get_snapshot(producer_id, period_b)
		except RuntimeError:
			return
		if not snap_a or not snap_b:
			return
		for child in self.detail.winfo_children():
			child.destroy()
		header = tb.Label(
			self.detail,
			text=f"{snap_a.name}: {period_a} ({snap_a.group}) ➜ {period_b} ({snap_b.group})",
			font=("Segoe UI", 14, "bold"),
		)
		header.pack(anchor=W, pady=5)
		comparison_text = self._infer_actions(snap_a, snap_b)
		tb.Label(self.detail, text=comparison_text, wraplength=800, justify=tk.LEFT).pack(anchor=W)

		chart_frame = tb.Frame(self.detail)
		chart_frame.pack(fill=BOTH, expand=True)
		history = self.app.repository.get_history(producer_id)
		chart = self.chart_factory.line_chart(chart_frame, history, "producaoMediaDiaria842366")
		chart.get_tk_widget().pack(side=tk.LEFT, padx=5, pady=5)
		bar_frame = tb.Frame(chart_frame)
		bar_frame.pack(side=tk.LEFT, padx=5)
		self.chart_factory.bar_chart(bar_frame, snap_a).get_tk_widget().pack(pady=5)
		self.chart_factory.bar_chart(bar_frame, snap_b).get_tk_widget().pack(pady=5)

		# Novo: radar comparativo dos dois períodos
		labels_radar = PERFORMANCE_RADAR_LABELS
		angles = [n / float(len(labels_radar)) * 2 * math.pi for n in range(len(labels_radar))]
		angles.append(angles[0])
		fig_radar = Figure(figsize=(3.5, 2.5), dpi=100)
		ax_radar = fig_radar.add_subplot(111, polar=True)
		vals_a = performance_radar_values(snap_a)
		vals_b = performance_radar_values(snap_b)
		vals_a.append(vals_a[0])
		vals_b.append(vals_b[0])
		ax_radar.plot(angles, vals_a, color="#6366f1", label=f"{period_a}")
		ax_radar.fill(angles, vals_a, color="#6366f1", alpha=0.15)
		ax_radar.plot(angles, vals_b, color="#f97316", label=f"{period_b}")
		ax_radar.fill(angles, vals_b, color="#f97316", alpha=0.15)
		ax_radar.set_xticks(angles[:-1])
		ax_radar.set_xticklabels(labels_radar)
		ax_radar.set_yticklabels([])
		ax_radar.set_title("Radar comparativo")
		ax_radar.legend(loc="upper right", bbox_to_anchor=(1.2, 1.1))
		canvas_radar = FigureCanvasTkAgg(fig_radar, master=chart_frame)
		canvas_radar.draw()
		canvas_radar.get_tk_widget().pack(side=tk.LEFT, padx=5)
		self.app.logger.log(event="comparacao_produtor", producer=snap_a.name, period=f"{period_a} vs {period_b}")

	def _infer_actions(self, snap_a: ProducerSnapshot, snap_b: ProducerSnapshot) -> str:
		delta = snap_b.metrics.get("producaoMediaDiaria842366", 0) - snap_a.metrics.get("producaoMediaDiaria842366", 0)
		if delta > 5:
			return "Indicadores sugerem reforço nutricional e genética positiva entre os períodos."
		if delta < -5:
			return "Produção caiu — sugerir revisão de sanidade e conforto térmico."
		if snap_a.group != snap_b.group:
			return "Mudança de grupo possivelmente ligada a ajustes em registros e controle leiteiro."
		return "Sem mudanças significativas, manter plano atual com pequenas melhorias."


class ExecutiveInsightsFrame(tb.Frame):
	"""Painel executivo com os principais diagnósticos temáticos."""

	def __init__(self, master: "DashboardApp") -> None:
		super().__init__(master, padding=20)
		self.app = master
		self.chart_factory = ChartFactory()
		self.summary_var = tk.StringVar(value="Carregando diagnóstico executivo...")
		self._build_layout()

	def _build_layout(self) -> None:
		header = tb.Frame(self)
		header.pack(fill=X, pady=(0, 10))
		tb.Label(header, text="Diagnóstico Executivo", font=("Segoe UI", 20, "bold")).pack(side=tk.LEFT)
		tb.Button(header, text="Voltar", command=lambda: self.app.show_frame("menu"), bootstyle="secondary").pack(side=tk.RIGHT)

		summary_box = tb.Frame(self, padding=15)
		summary_box.pack(fill=X, pady=(0, 10))
		tb.Label(summary_box, text="Gargalos e leitura gerencial", font=("Segoe UI", 14, "bold")).pack(anchor=W)
		tb.Label(summary_box, textvariable=self.summary_var, justify=tk.LEFT, wraplength=1280).pack(anchor=W, pady=(6, 0))

		self.notebook = tb.Notebook(self)
		self.notebook.pack(fill=BOTH, expand=True)
		self._tabs: Dict[str, tb.Frame] = {}
		for key, label in [
			("qualidade", "Qualidade"),
			("tanque", "Tanque"),
			("logistica", "Logística"),
			("socioeconomico", "Socioeconômico"),
			("ibp", "IBP"),
			("bem_estar", "Bem-Estar"),
		]:
			tab = tb.Frame(self.notebook, padding=12)
			self.notebook.add(tab, text=label)
			self._tabs[key] = tab

	def refresh(self) -> None:
		try:
			records = self.app.repository.iter_latest_records()
		except RuntimeError:
			records = []
		self.summary_var.set(self._build_summary(records))
		self._render_tabs(records)

	def _build_summary(self, records: List[Dict[str, object]]) -> str:
		if not records:
			return "Sem dados suficientes para construir o diagnóstico executivo."
		avg_ibp = _mean([float(row.get("ibp", 0.0)) for row in records])
		avg_production = _mean([float(row.get("producao_media_diaria", 0.0)) for row in records])
		avg_hygiene = _mean([float(row.get("hygiene_score", 0.0)) for row in records])
		top_producer = max(records, key=lambda row: float(row.get("ibp", 0.0)))
		bottlenecks = self.app.repository.diagnose_bottlenecks()
		lines = [
			f"Produtores analisados: {len(records)}",
			f"IBP médio: {avg_ibp:.1f}%",
			f"Produção média diária: {avg_production:.1f} L",
			f"Higiene operacional média: {avg_hygiene * 100:.1f}%",
			f"Melhor referência de IBP: {str(top_producer.get('name', 'Não informado'))} ({float(top_producer.get('ibp', 0.0)):.1f}%)",
			"Principais gargalos:",
		]
		lines.extend([f"- {item}" for item in bottlenecks])
		return "\n".join(lines)

	def _render_tabs(self, records: List[Dict[str, object]]) -> None:
		for child in self._tabs.values():
			for widget in child.winfo_children():
				widget.destroy()

		self._render_chart(self._tabs["qualidade"], self.chart_factory.quality_biosafety_chart, records)
		self._render_chart(self._tabs["tanque"], self.chart_factory.tank_efficiency_scatter, records)
		self._render_chart(self._tabs["logistica"], self.chart_factory.logistic_risk_chart, records)
		self._render_chart(self._tabs["socioeconomico"], self._socioeconomic_panel, records)
		self._render_chart(self._tabs["ibp"], self.chart_factory.ibp_radar_chart, records)
		self._render_chart(self._tabs["bem_estar"], self.chart_factory.animal_welfare_stacked_bar, records)

	def _render_chart(self, parent: tb.Frame, builder, records: List[Dict[str, object]]) -> None:
		widget = builder(parent, records)
		if hasattr(widget, "get_tk_widget"):
			widget.get_tk_widget().pack(fill=BOTH, expand=True)
		elif hasattr(widget, "pack"):
			widget.pack(fill=BOTH, expand=True)

	def _socioeconomic_panel(self, parent: tb.Frame, records: List[Dict[str, object]]):
		panel = tb.Frame(parent)
		charts = tb.Frame(panel)
		charts.pack(fill=BOTH, expand=True)
		left = tb.Frame(charts)
		left.pack(side=tk.LEFT, fill=BOTH, expand=True, padx=(0, 8))
		right = tb.Frame(charts)
		right.pack(side=tk.LEFT, fill=BOTH, expand=True, padx=(8, 0))
		self.chart_factory.socioeconomic_pareto_chart(left, records).get_tk_widget().pack(fill=BOTH, expand=True)
		self.chart_factory.income_pie_chart(right, records).get_tk_widget().pack(fill=BOTH, expand=True)
		return panel


class ActionModal:
	"""Modal reutilizável para listar ações."""

	def __init__(self, app: "DashboardApp", title: str, actions: List[str]) -> None:
		self.app = app
		self.title = title
		self.actions = actions
		self.window: Optional[tk.Toplevel] = None

	def show(self) -> None:
		window = tk.Toplevel(self.app)
		window.title(self.title)
		window.geometry("480x320")
		window.transient(self.app)
		window.grab_set()
		window.bind("<Escape>", lambda *_: window.destroy())
		frame = tb.Frame(window, padding=15)
		frame.pack(fill=BOTH, expand=True)
		scroll = ScrolledFrame(frame, autohide=True)
		scroll.pack(fill=BOTH, expand=True)
		if hasattr(scroll, "scrollable_frame"):
			body = scroll.scrollable_frame
		else:
			body = scroll
		for action in self.actions:
			tb.Label(body, text=f"• {action}", wraplength=430, justify=tk.LEFT).pack(anchor=W, pady=5)
		tb.Button(frame, text="Concluir", command=window.destroy, bootstyle="primary").pack(side=tk.BOTTOM, pady=10)
		self.window = window


class DashboardApp(tb.Window):
	"""Aplicação principal."""

	def __init__(self) -> None:
		super().__init__(themename="superhero")
		self.title("PQFL — Dashboard Produtores")
		self.geometry("1400x900")
		self.resizable(True, True)

		logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

		self.client = ColetumClient(API_DOC, CACHE_FILE)
		self.logger = ActivityLogger(LOG_FILE)
		self.actions = ActionEngine()
		self._repository: Optional[DataRepository] = None

		self.status_var = tk.StringVar(value="Carregando dados...")
		status_bar = tb.Label(self, textvariable=self.status_var, relief="groove")
		status_bar.pack(fill=X, side=tk.BOTTOM)

		self._build_menu()
		self.frames: Dict[str, tb.Frame] = {}
		self._build_frames()

		threading.Thread(target=self._load_data, daemon=True).start()

	def _build_frames(self) -> None:
		self.container = tb.Frame(self)
		self.container.pack(fill=BOTH, expand=True)
		self.frames["menu"] = MainMenuFrame(self)
		self.frames["producers"] = ProducersFrame(self)
		self.frames["groups"] = GroupsFrame(self)
		self.frames["compare"] = ComparisonFrame(self)
		self.frames["diagnostico"] = ExecutiveInsightsFrame(self)
		for frame in self.frames.values():
			frame.place(relx=0, rely=0, relwidth=1, relheight=1)
		self.show_frame("menu")

	def _build_menu(self) -> None:
		menubar = tk.Menu(self)
		file_menu = tk.Menu(menubar, tearoff=0)
		file_menu.add_command(label="Exportar log (JSON)", command=self._export_log_json)
		file_menu.add_command(label="Exportar log (CSV)", command=self._export_log_csv)
		file_menu.add_separator()
		file_menu.add_command(label="Sair", command=self.destroy)
		menubar.add_cascade(label="Arquivo", menu=file_menu)

		help_menu = tk.Menu(menubar, tearoff=0)
		help_menu.add_command(label="Webservice", command=self._show_endpoint_doc)
		menubar.add_cascade(label="Ajuda", menu=help_menu)
		self.config(menu=menubar)

	def _export_log_json(self) -> None:
		file_path = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON", "*.json")])
		if not file_path:
			return
		self.logger.export(Path(file_path))
		Messagebox.show_info("Log exportado em JSON.", "Exportação")

	def _export_log_csv(self) -> None:
		file_path = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV", "*.csv")])
		if not file_path:
			return
		self.logger.export_csv(Path(file_path))
		Messagebox.show_info("Log exportado em CSV.", "Exportação")

	def _show_endpoint_doc(self) -> None:
		details = (
			f"URL: {API_DOC['url']}\n"
			f"Método: {API_DOC['method']}\n"
			f"Parâmetros: {API_DOC['query_param']} (GraphQL) / {API_DOC['token_param']} (token)\n"
			f"Autenticação: token em querystring\n"
			f"Notas: {API_DOC['notes']['limites']}\n"
		)
		Messagebox.show_info(details, "Webservice Coletum")

	def _load_data(self) -> None:
		try:
			payload = self.client.fetch_answers()
			data = payload.get("data", payload)
			self.repository = DataRepository(data)
			self._after_data_ready("Dados carregados com sucesso.")
		except Exception as exc:  # pragma: no cover - tratar erro runtime
			logging.error("Erro ao carregar dados: %s", exc)
			self.repository = DataRepository({})
			self._after_data_ready("Falha ao acessar API. Usando dados offline.")

	def _after_data_ready(self, message: str) -> None:
		def update_ui() -> None:
			self.status_var.set(message)
			self.frames["producers"].refresh()
			self.frames["groups"].refresh()
			self.frames["compare"].refresh()
			self.frames["diagnostico"].refresh()

		self.after(0, update_ui)

	def show_frame(self, name: str) -> None:
		frame = self.frames.get(name)
		if frame:
			frame.lift()

	@property
	def repository(self) -> DataRepository:
		if self._repository is None:
			raise RuntimeError("Dados ainda não carregados.")
		return self._repository

	@repository.setter
	def repository(self, value: DataRepository) -> None:
		self._repository = value


def main() -> None:
	app = DashboardApp()
	app.mainloop()


if __name__ == "__main__":
	main()
