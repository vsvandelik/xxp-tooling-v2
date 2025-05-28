import { ESPACEVisitor } from '@extremexp/core';
import { ExperimentDeclarationContext } from '@extremexp/core/src/language/generated/ESPACEParser';
import {
  ControlFlow,
  DataDefinition,
  ExperimentModel,
  SpaceModel,
} from '../models/ExperimentModel.js';

export class ExperimentModelVisitor extends ESPACEVisitor<any> {
  override visitExperimentDeclaration = (ctx: ExperimentDeclarationContext): ExperimentModel => {
    const header = ctx.experimentHeader();
    const body = ctx.experimentBody();

    const experimentName = header.IDENTIFIER().getText();
    const spaces: SpaceModel[] = [];
    const dataDefinitions: DataDefinition[] = [];
    let controlFlow: ControlFlow | null = null;

    for (const content of body.experimentContent()) {
      if (content.spaceDeclaration()) {
        spaces.push(this.visit(content.spaceDeclaration()!));
      } else if (content.controlBlock()) {
        controlFlow = this.visit(content.controlBlock()!);
      } else if (content.dataDefinition()) {
        dataDefinitions.push(this.visit(content.dataDefinition()!));
      }
    }

    // TODO: Error when some of the parts are not defined

    return new ExperimentModel(experimentName, spaces, dataDefinitions, controlFlow);
  };
}
