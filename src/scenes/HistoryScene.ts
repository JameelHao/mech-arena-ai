/**
 * HistoryScene - Display recent battle history and win/loss stats
 */

import Phaser from "phaser";
import type { BattleRecord } from "../types/storage";
import { parseLogMessage } from "../utils/logColors";
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
  private detailOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "HistoryScene" });
  }

  async create(): Promise<void> {
    this.page = 0;
    this.detailOverlay = undefined;
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
      .text(listX + listW * 0.5, headerY, "Turns", {
        fontSize,
        color: COLORS.dimText,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    this.add
      .text(listX + listW * 0.62, headerY, "HP", {
        fontSize,
        color: COLORS.dimText,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    this.add
      .text(listX + listW * 0.78, headerY, "Date", {
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
        .text(listX + listW * 0.5, rowY, `${record.turns}`, {
          fontSize,
          color: COLORS.text,
        })
        .setOrigin(0, 0.5);

      // HP
      const hpColor = record.result === "win" ? COLORS.win : COLORS.loss;
      this.add
        .text(
          listX + listW * 0.62,
          rowY,
          `${record.playerHpLeft}/${record.opponentHpLeft}`,
          { fontSize, color: hpColor },
        )
        .setOrigin(0, 0.5);

      // Date
      const date = new Date(record.timestamp);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      this.add
        .text(listX + listW * 0.78, rowY, dateStr, {
          fontSize,
          color: COLORS.dimText,
        })
        .setOrigin(0, 0.5);

      // Clickable row zone
      const rowZone = this.add
        .zone(listX, rowY - rowH * 0.4, listW, rowH)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      rowZone.on("pointerdown", () => {
        this.showDetailPanel(record);
      });
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

  private showDetailPanel(record: BattleRecord): void {
    if (this.detailOverlay) {
      this.detailOverlay.destroy();
    }

    const { width: w, height: h } = this.scale;
    this.detailOverlay = this.add.container(0, 0);

    // Dark backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.75);
    backdrop.fillRect(0, 0, w, h);
    this.detailOverlay.add(backdrop);

    // Panel
    const panelW = Math.min(w * 0.8, 400);
    const panelH = Math.min(h * 0.55, 350);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2a2a2e, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    panel.lineStyle(2, 0x555555);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
    this.detailOverlay.add(panel);

    const fontSize = `${Math.max(13, Math.floor(w * 0.02))}px`;
    const cx = w / 2;
    let y = panelY + 20;
    const lineH = Math.max(22, h * 0.04);

    // Result title
    const resultText = record.result === "win" ? "VICTORY" : "DEFEAT";
    const resultColor = record.result === "win" ? COLORS.win : COLORS.loss;
    const title = this.add
      .text(cx, y, resultText, {
        fontSize: `${Math.max(20, Math.floor(w * 0.035))}px`,
        color: resultColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);
    this.detailOverlay.add(title);
    y += lineH + 10;

    // Matchup
    const matchup = `${record.playerMechType.toUpperCase()} vs ${record.opponentMechType.toUpperCase()}`;
    this.detailOverlay.add(
      this.add
        .text(cx, y, matchup, { fontSize, color: COLORS.text })
        .setOrigin(0.5, 0),
    );
    y += lineH;

    // Turns
    this.detailOverlay.add(
      this.add
        .text(cx, y, `Turns: ${record.turns}`, { fontSize, color: COLORS.text })
        .setOrigin(0.5, 0),
    );
    y += lineH;

    // Player HP
    this.detailOverlay.add(
      this.add
        .text(cx, y, `Your HP: ${record.playerHpLeft}`, {
          fontSize,
          color: COLORS.win,
        })
        .setOrigin(0.5, 0),
    );
    y += lineH;

    // Opponent HP
    this.detailOverlay.add(
      this.add
        .text(cx, y, `Enemy HP: ${record.opponentHpLeft}`, {
          fontSize,
          color: COLORS.loss,
        })
        .setOrigin(0.5, 0),
    );
    y += lineH;

    // Date
    const date = new Date(record.timestamp);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    this.detailOverlay.add(
      this.add
        .text(cx, y, dateStr, { fontSize, color: COLORS.dimText })
        .setOrigin(0.5, 0),
    );
    y += lineH + 5;

    // Prompt
    const promptLabel = record.prompt
      ? record.prompt.length > 80
        ? `${record.prompt.slice(0, 77)}...`
        : record.prompt
      : "No strategy saved";
    const promptColor = record.prompt ? COLORS.accent : COLORS.dimText;
    this.detailOverlay.add(
      this.add
        .text(cx, y, `Strategy: ${promptLabel}`, {
          fontSize: `${Math.max(11, Math.floor(w * 0.016))}px`,
          color: promptColor,
          wordWrap: { width: panelW - 40 },
        })
        .setOrigin(0.5, 0),
    );

    // View Replay button (only if battleLog exists)
    if (record.battleLog && record.battleLog.length > 0) {
      const replayBtnW = Math.min(panelW * 0.5, 150);
      const replayBtnH = 32;
      const replayBtnX = cx - replayBtnW / 2;
      const replayBtnY = panelY + panelH - 36 - 15 - replayBtnH - 10;

      const replayBg = this.add.graphics();
      replayBg.fillStyle(COLORS.accentHex, 1);
      replayBg.fillRoundedRect(
        replayBtnX,
        replayBtnY,
        replayBtnW,
        replayBtnH,
        6,
      );
      this.detailOverlay.add(replayBg);

      this.detailOverlay.add(
        this.add
          .text(cx, replayBtnY + replayBtnH / 2, "View Replay", {
            fontSize: `${Math.max(12, Math.floor(w * 0.018))}px`,
            color: "#000000",
            fontStyle: "bold",
          })
          .setOrigin(0.5),
      );

      const replayZone = this.add
        .zone(replayBtnX, replayBtnY, replayBtnW, replayBtnH)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      replayZone.on("pointerdown", () => {
        this.detailOverlay?.destroy();
        this.detailOverlay = undefined;
        this.showReplayPanel(record);
      });
      this.detailOverlay.add(replayZone);
    }

    // Close button
    const closeBtnW = Math.min(panelW * 0.4, 120);
    const closeBtnH = 36;
    const closeBtnX = cx - closeBtnW / 2;
    const closeBtnY = panelY + panelH - closeBtnH - 15;

    const closeBg = this.add.graphics();
    closeBg.fillStyle(COLORS.buttonBg, 1);
    closeBg.fillRoundedRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH, 6);
    closeBg.lineStyle(1, COLORS.panelBorder);
    closeBg.strokeRoundedRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH, 6);
    this.detailOverlay.add(closeBg);

    this.detailOverlay.add(
      this.add
        .text(cx, closeBtnY + closeBtnH / 2, "Close", {
          fontSize,
          color: COLORS.text,
        })
        .setOrigin(0.5),
    );

    const closeZone = this.add
      .zone(closeBtnX, closeBtnY, closeBtnW, closeBtnH)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    closeZone.on("pointerdown", () => {
      this.detailOverlay?.destroy();
      this.detailOverlay = undefined;
    });
    this.detailOverlay.add(closeZone);

    // Also close on backdrop click
    const backdropZone = this.add
      .zone(0, 0, w, h)
      .setOrigin(0)
      .setInteractive();
    backdropZone.on("pointerdown", () => {
      this.detailOverlay?.destroy();
      this.detailOverlay = undefined;
    });
    this.detailOverlay.addAt(backdropZone, 1);

    // Fade in
    this.detailOverlay.setAlpha(0);
    this.tweens.add({
      targets: this.detailOverlay,
      alpha: 1,
      duration: 200,
      ease: "Power2",
    });
  }

  private showReplayPanel(record: BattleRecord): void {
    if (this.detailOverlay) {
      this.detailOverlay.destroy();
    }

    const { width: w, height: h } = this.scale;
    this.detailOverlay = this.add.container(0, 0);

    // Dark backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.85);
    backdrop.fillRect(0, 0, w, h);
    this.detailOverlay.add(backdrop);

    // Panel
    const panelW = Math.min(w * 0.9, 500);
    const panelH = h * 0.85;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    panel.lineStyle(2, 0x555555);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
    this.detailOverlay.add(panel);

    const cx = w / 2;
    const titleFontSize = `${Math.max(16, Math.floor(w * 0.025))}px`;
    const logFontSize = Math.max(11, Math.floor(w * 0.015));

    // Title
    const resultLabel =
      record.result === "win" ? "VICTORY REPLAY" : "DEFEAT REPLAY";
    const resultColor = record.result === "win" ? COLORS.win : COLORS.loss;
    this.detailOverlay.add(
      this.add
        .text(cx, panelY + 15, resultLabel, {
          fontSize: titleFontSize,
          color: resultColor,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0),
    );

    // Log container with mask for scrolling
    const logX = panelX + 15;
    const logY = panelY + 45;
    const logW = panelW - 30;
    const logH = panelH - 100;
    const lineH = logFontSize + 5;

    const logContainer = this.add.container(logX, logY);
    this.detailOverlay.add(logContainer);

    // Render log lines
    const logs = record.battleLog ?? [];
    for (let i = 0; i < logs.length; i++) {
      const { displayMsg, color } = parseLogMessage(logs[i]);
      const isTurnHeader = logs[i].startsWith("[TURN]");
      const isKeyEvent =
        logs[i].includes("wins") ||
        logs[i].includes("defeated") ||
        logs[i].startsWith("[SUP]");

      logContainer.add(
        this.add.text(
          0,
          i * lineH,
          `${isTurnHeader ? "" : "  "}${displayMsg}`,
          {
            fontSize: `${logFontSize}px`,
            color: isKeyEvent ? "#ffdd44" : color,
            fontStyle: isTurnHeader || isKeyEvent ? "bold" : "normal",
            wordWrap: { width: logW },
          },
        ),
      );
    }

    // Mask to clip overflow
    const maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(logX, logY, logW, logH);
    logContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, maskGfx));

    // Scroll via drag
    const totalLogH = logs.length * lineH;
    const maxScrollY = Math.max(0, totalLogH - logH);
    let scrollOffset = 0;

    const scrollZone = this.add
      .zone(logX, logY, logW, logH)
      .setOrigin(0)
      .setInteractive();

    scrollZone.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      scrollOffset = Math.max(
        0,
        Math.min(maxScrollY, scrollOffset - pointer.velocity.y * 0.3),
      );
      logContainer.y = logY - scrollOffset;
    });
    this.detailOverlay.add(scrollZone);

    // Close button
    const closeBtnW = Math.min(panelW * 0.35, 120);
    const closeBtnH = 34;
    const closeBtnX = cx - closeBtnW / 2;
    const closeBtnY = panelY + panelH - closeBtnH - 12;

    const closeBg = this.add.graphics();
    closeBg.fillStyle(COLORS.buttonBg, 1);
    closeBg.fillRoundedRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH, 6);
    closeBg.lineStyle(1, COLORS.panelBorder);
    closeBg.strokeRoundedRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH, 6);
    this.detailOverlay.add(closeBg);

    this.detailOverlay.add(
      this.add
        .text(cx, closeBtnY + closeBtnH / 2, "Close", {
          fontSize: `${Math.max(13, Math.floor(w * 0.02))}px`,
          color: COLORS.text,
        })
        .setOrigin(0.5),
    );

    const closeZone = this.add
      .zone(closeBtnX, closeBtnY, closeBtnW, closeBtnH)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    closeZone.on("pointerdown", () => {
      this.detailOverlay?.destroy();
      this.detailOverlay = undefined;
    });
    this.detailOverlay.add(closeZone);

    // Fade in
    this.detailOverlay.setAlpha(0);
    this.tweens.add({
      targets: this.detailOverlay,
      alpha: 1,
      duration: 200,
      ease: "Power2",
    });
  }

  private handleResize(): void {
    this.buildUI();
  }
}
