import { Injectable, Logger } from '@nestjs/common';
import { envs } from '../config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger(PaymentsService.name);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Stripe requires the amount in cents
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      // Define id of the order being paid
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });

    return session;
  }

  stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = envs.stripeWebhookSecret;

    let event: Stripe.Event;

    try {
      if (!sig) {
        return res.status(400).send('Missing stripe-signature header');
      }

      event = this.stripe.webhooks.constructEvent(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        req['rawBody'],
        sig,
        webhookSecret,
      );
    } catch (err) {
      const error = err as Error;
      this.logger.error('Error constructing event:', error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    switch (event.type) {
      case 'charge.succeeded': {
        const charge = event.data.object;
        this.logger.log('Charge was successful!', charge);
        break;
      }
      default:
        this.logger.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ sig });
  }
}
