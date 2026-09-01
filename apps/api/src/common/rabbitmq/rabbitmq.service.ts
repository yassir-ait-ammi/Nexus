import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';

export const EVENTS_EXCHANGE = 'nexus.events';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private readonly connection: AmqpConnectionManager;
  private readonly publishChannel: ChannelWrapper;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get('RABBITMQ_HOST', 'localhost');
    const port = this.configService.get('RABBITMQ_PORT', 5672);
    this.connection = amqp.connect([`amqp://${host}:${port}`]);
    this.connection.on('connect', () => this.logger.log('Connected to RabbitMQ'));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`Disconnected from RabbitMQ: ${err?.message}`),
    );

    this.publishChannel = this.connection.createChannel({
      json: false,
      setup: (channel: ConfirmChannel) => channel.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true }),
    });
  }

  async onModuleInit() {
    await this.publishChannel.waitForConnect();
  }

  async onModuleDestroy() {
    await this.publishChannel.close();
    await this.connection.close();
  }

  publish(routingKey: string, payload: unknown): Promise<boolean> {
    return this.publishChannel.publish(EVENTS_EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
  }

  // Sets up a durable queue bound to the given routing key and starts
  // consuming it. `handler` throwing nacks the message without requeueing
  // (dead rather than looping forever on a poison message) — good enough
  // for this project's scale; a real system would route failures to a
  // dead-letter queue for inspection/retry instead of just dropping them.
  async consume(queueName: string, routingKey: string, handler: (payload: any) => Promise<void>) {
    const consumerChannel = this.connection.createChannel({
      json: false,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
        await channel.assertQueue(queueName, { durable: true });
        await channel.bindQueue(queueName, EVENTS_EXCHANGE, routingKey);
        await channel.consume(queueName, async (msg) => {
          if (!msg) return;
          try {
            const payload: unknown = JSON.parse(msg.content.toString());
            await handler(payload);
            channel.ack(msg);
          } catch (err) {
            this.logger.error(`Failed to process message on ${queueName}: ${(err as Error).message}`);
            channel.nack(msg, false, false);
          }
        });
      },
    });
    await consumerChannel.waitForConnect();
  }
}
