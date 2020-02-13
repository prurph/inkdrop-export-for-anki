"use babel";

import fs from "fs-extra";
// Can't use import * syntax unless we require corejs@2 or build with babel
const exportUtils = require("inkdrop-export-utils");
const csvStringify = require("csv-stringify/lib/sync");
const os = require("os");

const EXPORT_ROOT = `${os.homedir()}/Documents/inkdrop-to-anki`;
const ANKI_MEDIA =
  `${os.homedir()}/Library/Application Support/Anki2/Prescott/collection.media`;

module.exports = {
  activate() {
    this.subscription = inkdrop.commands.add(document.body, {
      "inkdrop-export-for-anki:export": () => this.exportForAnkiCommand()
    });
  },

  async exportForAnkiCommand() {
    const { notes, noteListBar } = inkdrop.store.getState();
    const note = notes.hashedItems[noteListBar.selectedNoteIds[0]];
    const dirToSave = `${EXPORT_ROOT}/${note.title}/`;
    this.exportNote(note, dirToSave);
  },

  async exportNote(note, dirToSave) {
    const imgDir = `${dirToSave}/images/`;
    fs.ensureDirSync(dirToSave);
    fs.ensureDirSync(imgDir);
    const markdown = await exportUtils.replaceImages(note.body, imgDir, imgDir);
    const outputHtml = await exportUtils.renderHTML(markdown);
    const csvData = [[note.title, outputHtml]];
    const csv = csvStringify(csvData, { delimiter: "\t" });
    try {
      fs.writeFileSync(`${dirToSave}/note.csv`, csv, "utf-8");
      fs.copySync(imgDir, ANKI_MEDIA);
    } catch (e) {
      inkdrop.notifications.addError("Failed to save HTML", {
        detail: e.message,
        dismissable: true
      });
    }
  },

  deactivate() {
    this.subscription.dispose();
  }
};
