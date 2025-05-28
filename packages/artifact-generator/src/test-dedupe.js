import { TaskGenerator } from './generators/TaskGenerator.js';
import { TaskDefinition } from './models/ArtifactModel.js';

// Create a mock TaskDefinition class for testing if the real one is not accessible
class MockTaskDefinition {
  constructor(
    taskId,
    workflow,
    implementation,
    dynamicParameters,
    staticParameters,
    inputData,
    outputData
  ) {
    this.taskId = taskId;
    this.workflow = workflow;
    this.implementation = implementation;
    this.dynamicParameters = dynamicParameters;
    this.staticParameters = staticParameters;
    this.inputData = inputData;
    this.outputData = outputData;
  }
}

// Create test data that simulates the example from the issue description
const tasks = new Map();

// Function to create a sample task for testing
function createSampleTask(name, workflowName, implementation, isOverridden = false) {
  const id = `${workflowName}:${name}`;
  
  const dynamicParameters = ['secondParam', 'thirdParam'];
  const staticParameters = isOverridden ? { secondParam: 20 } : { firstParam: 0.2 };
  
  return {
    id,
    name,
    workflowName,
    implementation,
    parameters: new Map(),
    inputs: ['inputData'],
    outputs: ['outputData'],
    dynamicParameters,
    staticParameters,
  };
}

// Task1 in workflows A1 and A2 (inherited from A, not overridden)
const task1_A1 = createSampleTask('task1', 'A1', 'path/to/task1.py');
const task1_A2 = createSampleTask('task1', 'A2', 'path/to/task1.py');

// Task2 in workflow A1 (overridden)
const task2_A1 = createSampleTask('task2', 'A1', 'path/to/new_task2.py', true);

// Task2 in workflow A2 (overridden differently)
const task2_A2 = createSampleTask('task2', 'A2', 'path/to/new_task3.py');

tasks.set(task1_A1.id, task1_A1);
tasks.set(task1_A2.id, task1_A2);
tasks.set(task2_A1.id, task2_A1);
tasks.set(task2_A2.id, task2_A2);

console.log('Testing task deduplication...');
console.log('Input tasks:');
for (const [id, task] of tasks.entries()) {
  console.log(`  - ${id}: ${task.implementation}`);
}

// Inject our mock TaskDefinition if needed
const generator = new TaskGenerator();
if (!TaskDefinition) {
  generator.createTaskDefinition = function(resolvedTask) {
    return new MockTaskDefinition(
      resolvedTask.id,
      resolvedTask.workflowName,
      resolvedTask.implementation,
      resolvedTask.dynamicParameters,
      resolvedTask.staticParameters,
      resolvedTask.inputs,
      resolvedTask.outputs
    );
  };
}

const result = generator.generate(tasks);

console.log('\nResults after deduplication:');
let totalTasks = 0;
result.forEach((group, i) => {
  console.log(`\nGroup ${i + 1}:`);
  group.forEach(task => {
    console.log(`  - ${task.taskId}: ${task.implementation}`);
    totalTasks++;
  });
});

console.log('\nSummary:');
console.log(`Original tasks: ${tasks.size}`);
console.log(`Tasks after deduplication: ${totalTasks}`);

// Check if task1 is deduplicated
const task1Entries = result.flat().filter(task => task.taskId.includes(':task1'));
console.log(`Task1 entries: ${task1Entries.length} (expected: 1)`);
console.log(`Deduplication successful: ${task1Entries.length === 1}`);

if (task1Entries.length === 1) {
  console.log(`Selected task1: ${task1Entries[0].taskId}`);
}