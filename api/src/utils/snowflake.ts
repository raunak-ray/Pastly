import { AppError } from "./AppError";

export class Snowflake {
  private readonly workerId: bigint;
  private readonly epoch: bigint = 1767225600000n;
  private sequence: bigint = 0n;
  private lastTimestamp: bigint = -1n;
  private readonly maxSequence: bigint = 4095n;

  constructor(workerId: number) {
    if (!Number.isInteger(workerId) || workerId < 0 || workerId > 1023) {
      throw new AppError("Worker id must be between 0 and 1023");
    }

    this.workerId = BigInt(workerId);
  }

  public generate(): bigint {
    let timestamp = BigInt(Date.now());

    if (timestamp < this.lastTimestamp) {
      throw new AppError("Clock moves backwards. Retry again after some time");
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & this.maxSequence;

      if (this.sequence === 0n) {
        while (timestamp <= this.lastTimestamp) {
          timestamp = BigInt(Date.now());
        }
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    return (
      ((timestamp - this.epoch) << 22n) | (this.workerId << 12n) | this.sequence
    );
  }

  public encode(id: bigint): string {
    const chars =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    if (id < 0n) {
      throw new AppError("Invalid id");
    }

    if (id === 0n) return "0";

    let result = "";

    while (id > 0n) {
      const remainder = Number(id % 62n);
      result = chars[remainder] + result;
      id /= 62n;
    }

    return result;
  }
}
