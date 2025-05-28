// Simple test to verify task deduplication
const TaskGenerator = require('./dist/generators/TaskGenerator.js').TaskGenerator;

// Mock TaskDefinition class for testing
class TaskDefinition {
  constructor(taskId, workflow, implementation, dynamicParams, staticParams, inputs, outputs) {
    this.taskId = taskId;
    this.workflow = workflow;
    this.implementation = implementation;
    this.dynamicParameters = dynamicParams;
    this.staticParameters = staticParams;
    this.inputData = inputs;
    this.outputData = outputs;
  }
}

// Create a test instance with a custom TaskDefinition factory
class TestTaskGenerator extends TaskGenerator {
  createTaskDefinition(resolvedTask) {
    return new TaskDefinition(
      resolvedTask.id,
      resolvedTask.workflowName,
      resolvedTask.implementation,
      resolvedTask.dynamicParameters,
      resolvedTask.staticParameters,
      resolvedTask.inputs,
      resolvedTask.outputs
    );
  }
}

// Create test data
function createTestData() {
  const tasks = new Map();
  
  // Helper function to create tasks
  function createTask(name, workflow, impl, isOverridden = false) {
    const id = `${workflow}:${name}`;
    return {
      id,
      name,
      workflowName: workflow,
      implementation: impl,
      parameters: new Map(),
      dynamicParameters: ['secondParam', 'thirdParam'],
      staticParameters: isOverridden ? { secondParam: 20 } : { firstParam: 0.2 },
      inputs: ['inputData'],
      outputs: ['outputData']
    };
  }
  
  // Create identical task1 in both workflows (should be deduplicated)
  const task1_A1 = createTask('task1', 'A1', 'path/to/task1.py');
  const task1_A2 = createTask('task1', 'A2', 'path/to/task1.py');
  
  // Create different task2 in both workflows (should remain separate)
  const task2_A1 = createTask('task2', 'A1', 'path/to/new_task2.py', true);
  const task2_A2 = createTask('task2', 'A2', 'path/to/new_task3.py');
  
  tasks.set(task1_A1.id, task1_A1);
  tasks.set(task1_A2.id, task1_A2);
  tasks.set(task2_A1.id, task2_A1);
  tasks.set(task2_A2.id, task2_A2);
  
  return tasks;
}

// Run test
function runTest() {
  console.log('Testing task deduplication...');
  
  const tasks = createTestData();
  console.log(`Input tasks: ${tasks.size}`);
  console.log('Input task IDs:');
  for (const id of tasks.keys()) {
    console.log(`  - ${id}`);
  }
  
  const generator = new TestTaskGenerator();
  const result = generator.generate(tasks);
  
  console.log('\nOutput task groups:');
  result.forEach((group, i) => {
    console.log(`\nGroup ${i + 1} (workflow: ${group[0]?.workflow}):`);
    group.forEach(task => {
      console.log(`  - ${task.taskId}: ${task.implementation}`);
    });
  });
  
  // Count task1 instances to verify deduplication
  const allTasks = result.flat();
  const task1Count = allTasks.filter(t => t.taskId.includes(':task1')).length;
  
  console.log('\nSummary:');
  console.log(`Original tasks: ${tasks.size}`);
  console.log(`Output tasks: ${allTasks.length}`);
  console.log(`Task1 instances: ${task1Count}`);
  console.log(`Deduplication successful: ${task1Count === 1 && allTasks.length === 3}`);
}

runTest();