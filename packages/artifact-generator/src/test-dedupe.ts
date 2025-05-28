import { TaskDefinition } from './models/ArtifactModel.js';
import { ResolvedTask } from './resolvers/TaskResolver.js';
import { TaskGenerator } from './generators/TaskGenerator.js';

// Function to create a sample task for testing
function createSampleTask(
  name: string,
  workflowName: string,
  implementation: string,
  isOverridden: boolean = false
): ResolvedTask {
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

// Create test data that mimics the example from the issue description
function createTestData(): Map<string, ResolvedTask> {
  const tasks = new Map<string, ResolvedTask>();
  
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
  
  return tasks;
}

// Test function
function testTaskDeduplication() {
  console.log('Testing task deduplication...');
  
  const testTasks = createTestData();
  const generator = new TaskGenerator();
  const result = generator.generate(testTasks);
  
  console.log('Generated task groups:');
  
  // Print the result in a readable format
  result.forEach((taskGroup, index) => {
    console.log(`\nGroup ${index + 1}:`);
    taskGroup.forEach(task => {
      console.log(`  - Task ID: ${task.taskId}`);
      console.log(`    Workflow: ${task.workflow}`);
      console.log(`    Implementation: ${task.implementation}`);
      console.log(`    Dynamic parameters: ${task.dynamicParameters.join(', ')}`);
      console.log(`    Static parameters: ${JSON.stringify(task.staticParameters)}`);
    });
  });
  
  // Count unique workflow:task combinations
  const uniqueTasks = new Set<string>();
  result.flat().forEach(task => uniqueTasks.add(task.taskId));
  
  console.log('\nTotal task groups:', result.length);
  console.log('Total tasks:', result.flat().length);
  console.log('Unique task IDs:', uniqueTasks.size);
  
  // Validate that we don't have duplicate task1
  const task1Count = result.flat().filter(task => task.taskId.endsWith(':task1')).length;
  console.log('Task1 representations:', task1Count);
  console.log('Deduplication successful:', task1Count === 1);
}

// Run the test
testTaskDeduplication();