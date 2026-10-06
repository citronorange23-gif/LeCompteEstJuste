import { createHash, timingSafeEqual } from "crypto";

const DEVICE_CREDENTIAL_PATTERN = /^[a-f0-9]{64}$/i;

export const hashDeviceCredential = (credential: string): string => {
    if (!DEVICE_CREDENTIAL_PATTERN.test(credential)) {
        throw new Error("invalid_device_credential");
    }

    return createHash("sha256").update(credential, "utf8").digest("hex");
};

export const matchesDeviceCredential = (
    credential: string,
    expectedHash: string
): boolean => {
    if (!/^[a-f0-9]{64}$/i.test(expectedHash)) return false;

    const actual = Buffer.from(hashDeviceCredential(credential), "hex");
    const expected = Buffer.from(expectedHash, "hex");

    return timingSafeEqual(actual, expected);
};