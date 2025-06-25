import { addDiagnostic } from '../helpers/Diagnostics.js';
import { FileUtils } from '../../../utils/FileUtils.js';
export class FileVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitFileName(ctx) {
        const stringNode = ctx.STRING();
        if (!stringNode) {
            return this.builder.visitChildren(ctx);
        }
        try {
            FileUtils.validateFilePath(stringNode.getText());
        }
        catch (error) {
            if (error instanceof Error) {
                addDiagnostic(this.builder, ctx, error.message);
            }
        }
        return this.builder.visitChildren(ctx);
    }
}
//# sourceMappingURL=FileVisitor.js.map