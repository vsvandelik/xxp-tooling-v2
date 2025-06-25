function nameToFileName(name) {
    if (!name || name.length === 0) {
        throw new Error('Name cannot be empty');
    }
    return name.charAt(0).toLowerCase() + name.slice(1);
}
export function workflowNameToFileName(workflowName) {
    return `${nameToFileName(workflowName)}.xxp`;
}
//# sourceMappingURL=naming.js.map