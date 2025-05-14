import { logger } from '../utils/logger';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  attempts: number;
  maxAttempts: number;
}

export type JobHandler<T = any> = (data: T) => Promise<any>;

interface QueueOptions {
  maxConcurrent: number;
  defaultMaxAttempts: number;
}

/**
 * Simple in-memory job queue system
 * In a production environment, this would be replaced with a proper distributed queue
 * like Bull MQ, AWS SQS, or similar technologies
 */
class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processingJobs: Set<string> = new Set();
  private jobIdCounter: number = 0;
  private options: QueueOptions;
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  constructor(options: Partial<QueueOptions> = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent || 3,
      defaultMaxAttempts: options.defaultMaxAttempts || 3
    };
  }

  /**
   * Start the job queue processor
   */
  start(): void {
    if (this.processingInterval) {
      return; // Already started
    }

    logger.info('Starting job queue processor', {
      maxConcurrent: this.options.maxConcurrent,
      defaultMaxAttempts: this.options.defaultMaxAttempts
    });

    // Process jobs every 2 seconds
    this.processingInterval = setInterval(() => {
      this.processNextJobs().catch(error => {
        logger.error('Error in job queue processor', { error });
      });
    }, 2000);
  }

  /**
   * Stop the job queue processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Job queue processor stopped');
    }
  }

  /**
   * Register a job handler for a specific job type
   * 
   * @param jobType - The type of job
   * @param handler - The handler function
   */
  registerHandler<T>(jobType: string, handler: JobHandler<T>): void {
    this.handlers.set(jobType, handler);
    logger.debug(`Registered handler for job type: ${jobType}`);
  }

  /**
   * Add a job to the queue
   * 
   * @param jobType - The type of job
   * @param data - The job data
   * @param options - Job options
   * @returns The job ID
   */
  async addJob<T>(
    jobType: string, 
    data: T, 
    options: { 
      priority?: number; 
      maxAttempts?: number;
    } = {}
  ): Promise<string> {
    // Verify handler exists
    if (!this.handlers.has(jobType)) {
      throw new Error(`No handler registered for job type: ${jobType}`);
    }

    const id = `job_${Date.now()}_${++this.jobIdCounter}`;
    const job: Job<T> = {
      id,
      type: jobType,
      data,
      status: 'pending',
      priority: options.priority || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      attempts: 0,
      maxAttempts: options.maxAttempts || this.options.defaultMaxAttempts
    };

    this.jobs.set(id, job);
    logger.debug(`Added job to queue`, { jobId: id, jobType, priority: job.priority });

    return id;
  }

  /**
   * Process the next available jobs
   */
  private async processNextJobs(): Promise<void> {
    // Skip if already processing
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending jobs sorted by priority (higher number = higher priority)
      const pendingJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'pending')
        .sort((a, b) => b.priority - a.priority);

      // Determine how many jobs we can process concurrently
      const availableSlots = this.options.maxConcurrent - this.processingJobs.size;

      if (availableSlots <= 0 || pendingJobs.length === 0) {
        return;
      }

      // Start processing jobs up to the available slot limit
      const jobsToProcess = pendingJobs.slice(0, availableSlots);
      
      for (const job of jobsToProcess) {
        this.executeJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a specific job
   * 
   * @param job - The job to execute
   */
  private async executeJob(job: Job): Promise<void> {
    // Mark job as processing
    job.status = 'processing';
    job.startedAt = new Date();
    job.updatedAt = new Date();
    job.attempts++;
    this.processingJobs.add(job.id);

    logger.info(`Processing job`, { 
      jobId: job.id, 
      jobType: job.type, 
      attempt: `${job.attempts}/${job.maxAttempts}`
    });

    try {
      // Get the handler for this job type
      const handler = this.handlers.get(job.type);

      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      // Execute the handler
      await handler(job.data);

      // Mark job as completed
      job.status = 'completed';
      job.completedAt = new Date();
      job.updatedAt = new Date();

      logger.info(`Job completed successfully`, { jobId: job.id, jobType: job.type });
    } catch (error) {
      // Handle job failure
      logger.error(`Job execution failed`, { 
        jobId: job.id, 
        jobType: job.type, 
        error,
        attempt: job.attempts,
        maxAttempts: job.maxAttempts
      });

      job.updatedAt = new Date();
      
      // Check if we should retry
      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        logger.info(`Job will be retried`, { 
          jobId: job.id, 
          attempt: job.attempts, 
          maxAttempts: job.maxAttempts 
        });
      } else {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        logger.warn(`Job has exceeded maximum attempts and will not be retried`, { 
          jobId: job.id, 
          attempts: job.attempts, 
          maxAttempts: job.maxAttempts 
        });
      }
    } finally {
      // Remove job from processing set
      this.processingJobs.delete(job.id);
    }
  }

  /**
   * Get a job by ID
   * 
   * @param id - The job ID
   * @returns The job or undefined if not found
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs 
   * 
   * @param filter - Optional filter function
   * @returns Array of jobs matching the filter
   */
  getJobs(filter?: (job: Job) => boolean): Job[] {
    const jobs = Array.from(this.jobs.values());
    return filter ? jobs.filter(filter) : jobs;
  }

  /**
   * Remove completed or failed jobs older than a certain time
   * 
   * @param olderThan - Remove jobs completed before this date
   */
  cleanup(olderThan: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): void {
    const jobsToRemove: string[] = [];

    this.jobs.forEach(job => {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.updatedAt < olderThan
      ) {
        jobsToRemove.push(job.id);
      }
    });

    jobsToRemove.forEach(id => {
      this.jobs.delete(id);
    });

    logger.info(`Cleaned up ${jobsToRemove.length} old jobs`);
  }
}

// Export singleton instance
export const jobQueue = new JobQueue({
  maxConcurrent: 2, // Process max 2 jobs concurrently
  defaultMaxAttempts: 3 // Try jobs up to 3 times before giving up
});

// Start the job queue when this module is loaded
if (process.env.NODE_ENV !== 'test') {
  jobQueue.start();
  // Setup periodic cleanup of old jobs
  setInterval(() => {
    jobQueue.cleanup();
  }, 60 * 60 * 1000); // Clean up every hour
}