/**
 * HistoryScene - Display recent battle history and win/loss stats
 */

import Phaser from "phaser";
import type { BattleRecord } from "../types/storage";
import { loadBattleHistory } from "../utils/storage";

const COLORS = {
  background: 0x1a1a1a,
  text: "#ffffff",
  accent: "#00ff88",
  accentHex: 0x00ff88,
  panelBg: 0x2a2a2a,
  panelBorder: 0x444444,
  win: "#00ff88",
  loss: "#ff4500",
  dimText: "#888888",
  buttonBg: 0x333333,
  buttonHover: 0x444444,
} as const;

const ROWS_PER_PAGE = 8;

export class HistoryScene extends Phaser.Scene {
  private records: BattleRecord[] = [];
  private page = 0;

  constructor() {
    super({ key: "HistoryScene" });
  }

  async create(): Promise<void> {
    this.page = 0;
    this.records = await loadBattleHistory();
    this.buildUI();
    this.scale.on("resize", this.handleResize, this);
  }

  private buildUI(): void {
    this.children.removeAll(true);
    const { width: w, height: h } = this.scale;

    // Title
    this.add
      .text(w / 2, h * 0.06, "BATTLE HISTORY", {
        fontSize: `${Math.max(20, Math.floor(w * 0.035))}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Stats panel
    this.drawStatsPanel(w, h);

    // Battle list
    this.drawBattleList(w, h);

    // Navigation
    this.drawNavigation(w, h);

    // Back button
    this.drawBackButton(w, h);
  }

  private drawStatsPanel(w: number, h: number): void {
    const panelX = w * 0.05;
    const panelY = h * 0.12;
    const panelW = w * 0.9;
    const panelH = h * 0.1;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.panelBg, 0.9);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    bg.lineStyle(1, COLORS.panelBorder);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

    const wins = this.records.filter((r) => r.result === "win").length;
    const losses = this.records.filter((r) => r.result === "loss").length;
    const total = this.records.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    const fontSize = `${Math.max(12, Math.floor(w * 0.018))}px`;
    const centerY = panelY + panelH / 2;
    const colW = panelW / 4;

    this.add
      .text(panelX + colW * 0.5, centerY, `Total: ${total}`, {
        fontSize,
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(panelX + colW * 1.5, centerY, `Wins: ${wins}`, {
        fontSize,
        color: COLORS.win,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(panelX + colW * 2.5, centerY, `Losses: ${losses}`, {
        fontSize,
        color: COLORS.loss,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(panelX + colW * 3.5, centerY, `Win Rate: ${winRate}%`, {
        fontSize,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private drawBattleList(w: number, h: number): void {
    const listX = w * 0.05;
    const listY = h * 0.25;
    const listW = w * 0.9;
    const rowH = h * 0.065;
    const fontSize = `${Math.max(11, Math.floor(w * 0.016))}px`;

    // Header
    const headerY = listY;
    this.add
      .text(listX + 10, headerY, "Result", {
        fontSize,
        color: COLORS.dimText,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    this.add
      .text(listX + listW * 0.2, headerY, "Matchup", {
        fontSize,
        color: COLORS.dimText,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    this.add
      .text(listX + listW * 0.55, headerY, "Turns", {
        fontSize,
        color: COLORS.dimText,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    this.add
      .text(listX + listW * 0.7, headerY, "Date", {
        fontSize,
        color: COLORS.dimText,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    // Separator
    const sep = this.add.graphics();
    sep.lineStyle(1, COLORS.panelBorder);
    sep.lineBetween(
      listX,
      listY + rowH * 0.4,
      listX + listW,
      listY + rowH * 0.4,
    );

    // Rows
    const start = this.page * ROWS_PER_PAGE;
    const pageRecords = this.records.slice(start, start + ROWS_PER_PAGE);

    if (pageRecords.length === 0) {
      this.add
        .text(w / 2, listY + rowH * 2, "No battles yet. Go fight!", {
          fontSize: `${Math.max(14, Math.floor(w * 0.022))}px`,
          color: COLORS.dimText,
        })
        .setOrigin(0.5);
      return;
    }

    for (let i = 0; i < pageRecords.length; i++) {
      const record = pageRecords[i];
      const rowY = listY + rowH * (i + 1);

      // Alternating row bg
      if (i % 2 === 0) {
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0x222222, 0.5);
        rowBg.fillRect(listX, rowY - rowH * 0.4, listW, rowH);
      }

      // Result
      const resultText = record.result === "win" ? "WIN" : "LOSS";
      const resultColor = record.result === "win" ? COLORS.win : COLORS.loss;
      this.add
        .text(listX + 10, rowY, resultText, {
          fontSize,
          color: resultColor,
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);

      // Matchup
      const matchup = `${record.playerMechType.toUpperCase()} vs ${record.opponentMechType.toUpperCase()}`;
      this.add
        .text(listX + listW * 0.2, rowY, matchup, {
          fontSize,
          color: COLORS.text,
        })
        .setOrigin(0, 0.5);

      // Turns
      this.add
        .text(listX + listW * 0.55, rowY, `${record.turns}`, {
          fontSize,
          color: COLORS.text,
        })
        .setOrigin(0, 0.5);

      // Date
      const date = new Date(record.timestamp);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      this.add
        .text(listX + listW * 0.7, rowY, dateStr, {
          fontSize,
          color: COLORS.dimText,
        })
        .setOrigin(0, 0.5);
    }
  }

  private drawNavigation(w: number, h: number): void {
    const totalPages = Math.max(
      1,
      Math.ceil(this.records.length / ROWS_PER_PAGE),
    );
    const navY = h * 0.88;
    const btnSize = Math.max(30, w * 0.05);
    const fontSize = `${Math.max(12, Math.floor(w * 0.018))}px`;

    // Page text
    this.add
      .text(w / 2, navY, `${this.page + 1} / ${totalPages}`, {
        fontSize,
        color: COLORS.text,
      })
      .setOrigin(0.5);

    // Prev button
    if (this.page > 0) {
      this.createNavButton(w / 2 - btnSize * 2, navY, btnSize, "<", () => {
        this.page--;
        this.buildUI();
      });
    }

    // Next button
    if (this.page < totalPages - 1) {
      this.createNavButton(w / 2 + btnSize * 2, navY, btnSize, ">", () => {
        this.page++;
        this.buildUI();
      });
    }
  }

  private createNavButton(
    x: number,
    y: number,
    size: number,
    label: string,
    onClick: () => void,
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.buttonBg);
    bg.fillRoundedRect(x - size / 2, y - size / 2, size, size, 6);
    bg.lineStyle(1, COLORS.panelBorder);
    bg.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 6);

    this.add
      .text(x, y, label, {
        fontSize: `${Math.max(14, size * 0.5)}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(x - size / 2, y - size / 2, size, size)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    zone.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(COLORS.buttonHover);
      bg.fillRoundedRect(x - size / 2, y - size / 2, size, size, 6);
      bg.lineStyle(1, COLORS.accentHex);
      bg.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 6);
    });

    zone.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(COLORS.buttonBg);
      bg.fillRoundedRect(x - size / 2, y - size / 2, size, size, 6);
      bg.lineStyle(1, COLORS.panelBorder);
      bg.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 6);
    });

    zone.on("pointerdown", onClick);
  }

  private drawBackButton(w: number, h: number): void {
    const btnW = Math.min(w * 0.25, 160);
    const btnH = 36;
    const btnX = w * 0.05;
    const btnY = h * 0.93 - btnH / 2;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.accentHex);
    bg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);

    this.add
      .text(btnX + btnW / 2, btnY + btnH / 2, "Back to Battle", {
        fontSize: `${Math.max(12, Math.floor(w * 0.018))}px`,
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(btnX, btnY, btnW, btnH)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    zone.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x00cc66);
      bg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
    });

    zone.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(COLORS.accentHex);
      bg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
    });

    zone.on("pointerdown", () => {
      this.scale.off("resize", this.handleResize, this);
      this.scene.start("BattleScene");
    });
  }

  private handleResize(): void {
    this.buildUI();
  }
}
