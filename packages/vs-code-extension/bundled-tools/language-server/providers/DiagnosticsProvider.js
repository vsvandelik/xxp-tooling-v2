import { DocumentDiagnosticReportKind, } from 'vscode-languageserver';
import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
export class DiagnosticsProvider extends Provider {
    logger = Logger.getLogger();
    addHandlers() {
        this.connection?.languages.diagnostics.on(this.onDiagnostics.bind(this));
    }
    onDiagnostics(diagnosticParams) {
        this.logger.info(`Recieved diagnostics request for document: ${diagnosticParams.textDocument.uri}`);
        const document = this.documentManager?.getDocument(diagnosticParams.textDocument.uri);
        if (!document) {
            this.logger.warn(`Document with diagnostics not found: ${diagnosticParams.textDocument.uri}`);
            return {
                kind: DocumentDiagnosticReportKind.Full,
                items: [],
            };
        }
        if (!document.diagnostics?.length) {
            return {
                kind: DocumentDiagnosticReportKind.Full,
                items: [],
            };
        }
        return {
            kind: DocumentDiagnosticReportKind.Full,
            items: document.diagnostics,
        };
    }
}
//# sourceMappingURL=DiagnosticsProvider.js.map