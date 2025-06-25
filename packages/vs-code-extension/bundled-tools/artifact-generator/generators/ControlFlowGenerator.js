import { ControlDefinition, TransitionDefinition } from '../models/ArtifactModel.js';
export class ControlFlowGenerator {
    generate(experiment) {
        if (!experiment.controlFlow) {
            return this.createDefaultControlFlow(experiment);
        }
        const transitions = [];
        let startSpace = '';
        for (const transition of experiment.controlFlow.transitions) {
            if (transition.from === 'START') {
                startSpace = transition.to;
            }
            else {
                transitions.push(new TransitionDefinition(transition.from, transition.to, transition.condition));
            }
        }
        for (const transition of experiment.controlFlow.transitions) {
            if (transition.from !== 'START') {
                const existing = transitions.find(t => t.from === transition.from &&
                    t.to === transition.to &&
                    t.condition === transition.condition);
                if (!existing) {
                    transitions.push(new TransitionDefinition(transition.from, transition.to, transition.condition));
                }
            }
        }
        return new ControlDefinition(startSpace, transitions);
    }
    createDefaultControlFlow(experiment) {
        if (experiment.spaces.length === 0) {
            throw new Error('No spaces defined in experiment');
        }
        if (experiment.spaces.length === 1) {
            return new ControlDefinition(experiment.spaces[0].name, [
                new TransitionDefinition(experiment.spaces[0].name, 'END'),
            ]);
        }
        const transitions = [];
        const startSpace = experiment.spaces[0].name;
        for (let i = 0; i < experiment.spaces.length - 1; i++) {
            transitions.push(new TransitionDefinition(experiment.spaces[i].name, experiment.spaces[i + 1].name));
        }
        transitions.push(new TransitionDefinition(experiment.spaces[experiment.spaces.length - 1].name, 'END'));
        return new ControlDefinition(startSpace, transitions);
    }
}
//# sourceMappingURL=ControlFlowGenerator.js.map