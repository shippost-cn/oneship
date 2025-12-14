import {
  WorkflowExecution,
  WorkflowStep,
  WorkflowStepStatus,
  IProvider,
} from '@oneship/core';
import { WorkflowDefinition, WorkflowStepDefinition } from './workflow-definition';
import {
  StepExecutionContext,
  IStepExecutor,
  CreateOrderStepExecutor,
  QueryOrderStepExecutor,
  CheckFreeShippingStepExecutor,
  WebhookStepExecutor,
  DelayStepExecutor,
} from './step-executor';

/**
 * Workflow engine for executing workflows asynchronously
 */
export class WorkflowEngine {
  private stepExecutors: Map<string, IStepExecutor> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private webhookCaller: (url: string, payload: any) => Promise<void>;

  constructor(webhookCaller: (url: string, payload: any) => Promise<void>) {
    this.webhookCaller = webhookCaller;
    this.registerDefaultExecutors();
  }

  /**
   * Register default step executors
   */
  private registerDefaultExecutors(): void {
    this.registerExecutor('create_order', new CreateOrderStepExecutor());
    this.registerExecutor('query_order', new QueryOrderStepExecutor());
    this.registerExecutor('check_free_shipping', new CheckFreeShippingStepExecutor());
    this.registerExecutor('webhook', new WebhookStepExecutor(this.webhookCaller));
    this.registerExecutor('delay', new DelayStepExecutor());
  }

  /**
   * Register a custom step executor
   */
  registerExecutor(stepType: string, executor: IStepExecutor): void {
    this.stepExecutors.set(stepType, executor);
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflow: WorkflowDefinition,
    context: StepExecutionContext,
    providers: Map<string, IProvider>
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      workflowId: workflow.id,
      orderId: context.orderId,
      status: WorkflowStepStatus.RUNNING,
      steps: [],
      startedAt: new Date(),
    };

    this.executions.set(execution.id, execution);

    // Execute workflow asynchronously
    this.executeWorkflowAsync(workflow, execution, context, providers).catch((error) => {
      execution.status = WorkflowStepStatus.FAILED;
      execution.error = error.message;
      execution.completedAt = new Date();
    });

    return execution;
  }

  /**
   * Execute workflow asynchronously
   */
  private async executeWorkflowAsync(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    initialContext: StepExecutionContext,
    providers: Map<string, IProvider>
  ): Promise<void> {
    const context = { ...initialContext };
    let currentStepId: string | undefined = workflow.steps[0]?.id;

    while (currentStepId) {
      const stepDef = workflow.steps.find((s) => s.id === currentStepId);
      if (!stepDef) {
        break;
      }

      const step = await this.executeStep(stepDef, context, providers, execution);
      execution.steps.push(step);

      if (step.status === WorkflowStepStatus.FAILED) {
        execution.status = WorkflowStepStatus.FAILED;
        execution.error = step.error;
        execution.completedAt = new Date();
        break;
      }

      // Update context with step output
      if (step.output) {
        Object.assign(context, step.output);
      }

      // Determine next step
      if (step.status === WorkflowStepStatus.SUCCESS) {
        currentStepId = stepDef.onSuccess;
      } else if (step.status === WorkflowStepStatus.FAILED) {
        currentStepId = stepDef.onFailure;
      } else {
        break;
      }
    }

    if (execution.status === WorkflowStepStatus.RUNNING) {
      execution.status = WorkflowStepStatus.SUCCESS;
    }
    execution.completedAt = new Date();
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    stepDef: WorkflowStepDefinition,
    context: StepExecutionContext,
    providers: Map<string, IProvider>,
    execution: WorkflowExecution
  ): Promise<WorkflowStep> {
    const step: WorkflowStep = {
      id: stepDef.id,
      name: stepDef.name,
      status: WorkflowStepStatus.RUNNING,
      provider: stepDef.provider,
      input: context,
      startedAt: new Date(),
    };

    try {
      const executor = this.stepExecutors.get(stepDef.type);
      if (!executor) {
        throw new Error(`No executor found for step type: ${stepDef.type}`);
      }

      let attempts = 0;
      const maxAttempts = stepDef.retry?.maxAttempts || 1;
      const retryDelay = stepDef.retry?.delay || 0;

      while (attempts < maxAttempts) {
        try {
          const result = await executor.execute(stepDef, context, providers);
          step.status = WorkflowStepStatus.SUCCESS;
          step.output = result.output;
          step.completedAt = new Date();

          // Update context for next step
          if (result.nextStepId) {
            // This will be handled by the workflow executor
          }

          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }
    } catch (error) {
      step.status = WorkflowStepStatus.FAILED;
      step.error = (error as Error).message;
      step.completedAt = new Date();
    }

    return step;
  }

  /**
   * Get workflow execution by ID
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Generate execution ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

