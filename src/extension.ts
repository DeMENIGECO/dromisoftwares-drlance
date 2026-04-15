import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function loadJson(context: vscode.ExtensionContext, relativePath: string) {
  const filePath = path.join(context.extensionPath, relativePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function activate(context: vscode.ExtensionContext) {

  console.log('DrLance attivo 🚀');

  // 📦 JSON
  const functions = loadJson(context, 'json/dr/dr_funct.json');
  const errors = loadJson(context, 'json/problems/common.json');
  const imports = loadJson(context, 'json/problems/imports.json');
  const tips = loadJson(context, 'json/ext/coding/suggerimenti.json');
  const deprecated = loadJson(context, 'json/avvises/deprecated.json');
  const colors = loadJson(context, 'json/colors.json');

  // =========================
  // 🔥 COMANDI BASE
  // =========================

  const hello = vscode.commands.registerCommand('dromi.hello', () => {
    vscode.window.showInformationMessage('DrLance è attivo su Dromi! 🚀');
  });

  const checkFunction = vscode.commands.registerCommand('dromi.checkFunction', async () => {

    const input = await vscode.window.showInputBox({
      prompt: 'Inserisci funzione Dromi da controllare'
    });

    if (!input) return;

    if (functions.functions && functions.functions[input]) {
      vscode.window.showInformationMessage(
        `✔ Funzione OK: ${input} → ${functions.functions[input]}`
      );
    } else {
      vscode.window.showErrorMessage(
        errors.errors?.unknown_function || 'Funzione non trovata'
      );
    }
  });

  const tipCommand = vscode.commands.registerCommand('dromi.tip', () => {

    const list = tips.tips || [];
    const random = list[Math.floor(Math.random() * list.length)];

    vscode.window.showInformationMessage(`💡 ${random}`);
  });

  const checkImport = vscode.commands.registerCommand('dromi.checkImport', async () => {

    const input = await vscode.window.showInputBox({
      prompt: 'Inserisci import da controllare'
    });

    if (!input) return;

    if (input.includes('os') || input.includes('sys')) {
      vscode.window.showErrorMessage(imports.errors.blocked_import);
    } else {
      vscode.window.showInformationMessage('Import OK ✔');
    }
  });

  const debugJson = vscode.commands.registerCommand('dromi.debugJson', () => {
    vscode.window.showInformationMessage(
      `JSON caricati ✔ Funzioni: ${Object.keys(functions.functions || {}).length}`
    );
  });

  // =========================
  // 🔴 ERRORI ROSSI (.dr)
  // =========================

  const diagnostics = vscode.languages.createDiagnosticCollection('dromi');
  context.subscriptions.push(diagnostics);

  function validateDocument(document: vscode.TextDocument) {

    if (document.languageId !== 'dromi') return;

    const diagnosticsList: vscode.Diagnostic[] = [];

    const lines = document.getText().split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 🔴 esempio: funzione sconosciuta
      const match = line.match(/([a-zA-Z_]+)\(/);

      if (match) {
        const func = match[1];

        if (!functions.functions?.[func]) {

          const range = new vscode.Range(i, 0, i, line.length);

          diagnosticsList.push(
            new vscode.Diagnostic(
              range,
              `Funzione '${func}' non trovata in Dromi`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      }
    }

    diagnostics.set(document.uri, diagnosticsList);
  }

  vscode.workspace.onDidChangeTextDocument(e => {
    validateDocument(e.document);
  });

  vscode.workspace.onDidOpenTextDocument(doc => {
    validateDocument(doc);
  });

  // =========================
  // 💡 INTELLISENSE
  // =========================

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    'dromi',
    {
      provideCompletionItems() {

        const items: vscode.CompletionItem[] = [];

        // 🔁 carica funzioni da JSON automaticamente
        if (functions.functions) {
          for (const key of Object.keys(functions.functions)) {

            const item = new vscode.CompletionItem(key);
            item.detail = functions.functions[key];
            item.kind = vscode.CompletionItemKind.Function;

            items.push(item);
          }
        }

        return items;
      }
    }
  );

  // =========================
  // 📌 REGISTRA TUTTO
  // =========================

  context.subscriptions.push(hello);
  context.subscriptions.push(checkFunction);
  context.subscriptions.push(tipCommand);
  context.subscriptions.push(checkImport);
  context.subscriptions.push(debugJson);
  context.subscriptions.push(completionProvider);
}

export function deactivate() {}