"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function loadJson(context, relativePath) {
    const filePath = path.join(context.extensionPath, relativePath);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function activate(context) {
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
        if (!input)
            return;
        if (functions.functions && functions.functions[input]) {
            vscode.window.showInformationMessage(`✔ Funzione OK: ${input} → ${functions.functions[input]}`);
        }
        else {
            vscode.window.showErrorMessage(errors.errors?.unknown_function || 'Funzione non trovata');
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
        if (!input)
            return;
        if (input.includes('os') || input.includes('sys')) {
            vscode.window.showErrorMessage(imports.errors.blocked_import);
        }
        else {
            vscode.window.showInformationMessage('Import OK ✔');
        }
    });
    const debugJson = vscode.commands.registerCommand('dromi.debugJson', () => {
        vscode.window.showInformationMessage(`JSON caricati ✔ Funzioni: ${Object.keys(functions.functions || {}).length}`);
    });
    // =========================
    // 🔴 ERRORI ROSSI (.dr)
    // =========================
    const diagnostics = vscode.languages.createDiagnosticCollection('dromi');
    context.subscriptions.push(diagnostics);
    function validateDocument(document) {
        if (document.languageId !== 'dromi')
            return;
        const diagnosticsList = [];
        const lines = document.getText().split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // 🔴 esempio: funzione sconosciuta
            const match = line.match(/([a-zA-Z_]+)\(/);
            if (match) {
                const func = match[1];
                if (!functions.functions?.[func]) {
                    const range = new vscode.Range(i, 0, i, line.length);
                    diagnosticsList.push(new vscode.Diagnostic(range, `Funzione '${func}' non trovata in Dromi`, vscode.DiagnosticSeverity.Error));
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
    const completionProvider = vscode.languages.registerCompletionItemProvider('dromi', {
        provideCompletionItems() {
            const items = [];
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
    });
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
function deactivate() { }
