import { DateTime } from 'luxon';
import { ValueTransformer } from 'typeorm';

export class DateToMilliTransformer implements ValueTransformer {
  to(dateTime?: DateTime): Date | undefined {
    return dateTime ? dateTime.toJSDate() : undefined;
  }

  from(data: Date | null): DateTime | undefined {
    return data ? DateTime.fromJSDate(data) : undefined;
  }
}
