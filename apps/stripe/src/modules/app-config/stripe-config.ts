import { err, ok, Result } from "neverthrow";

import { BaseError } from "@/lib/errors";
import { StripePublishableKey } from "@/modules/stripe/stripe-publishable-key";
import { StripeRestrictedKey } from "@/modules/stripe/stripe-restricted-key";
import { StripeWebhookSecret } from "@/modules/stripe/stripe-webhook-secret";

export class StripeConfig {
  readonly name: string;
  readonly id: string;
  readonly restrictedKey: StripeRestrictedKey;
  readonly publishableKey: StripePublishableKey;
  readonly webhookSecret: StripeWebhookSecret;

  static ValidationError = BaseError.subclass("ValidationError", {
    props: {
      _internalName: "StripeConfig.ValidationError" as const,
    },
  });

  private constructor(props: {
    name: string;
    id: string;
    restrictedKey: StripeRestrictedKey;
    publishableKey: StripePublishableKey;
    webhookSecret: StripeWebhookSecret;
  }) {
    this.name = props.name;
    this.id = props.id;
    this.restrictedKey = props.restrictedKey;
    this.publishableKey = props.publishableKey;
    this.webhookSecret = props.webhookSecret;
  }

  static create(args: {
    name: string;
    id: string;
    webhookSecret: StripeWebhookSecret;
    restrictedKey: StripeRestrictedKey;
    publishableKey: StripePublishableKey;
  }): Result<StripeConfig, InstanceType<typeof StripeConfig.ValidationError>> {
    if (args.name.length === 0) {
      return err(new StripeConfig.ValidationError("Config name cannot be empty"));
    }

    if (args.id.length === 0) {
      return err(new StripeConfig.ValidationError("Config id cannot be empty"));
    }

    return ok(
      new StripeConfig({
        name: args.name,
        id: args.id,
        restrictedKey: args.restrictedKey,
        publishableKey: args.publishableKey,
        webhookSecret: args.webhookSecret,
      }),
    );
  }
}
