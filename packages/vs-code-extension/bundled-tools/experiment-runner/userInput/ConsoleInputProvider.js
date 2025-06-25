export class ConsoleInputProvider {
    async getInput(prompt) {
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise(resolve => {
            rl.question(prompt + ' ', answer => {
                rl.close();
                resolve(answer);
            });
        });
    }
}
//# sourceMappingURL=ConsoleInputProvider.js.map