export class StringUtils {
    static removeDoubleQuotes(value) {
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.substring(1, value.length - 1);
        }
        return value;
    }
}
//# sourceMappingURL=StringUtils.js.map