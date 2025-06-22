export class StringUtils {
	public static removeDoubleQuotes(value: string): string {
		if (value.startsWith('"') && value.endsWith('"')) {
			return value.substring(1, value.length - 1);
		}

		return value;
	}
}