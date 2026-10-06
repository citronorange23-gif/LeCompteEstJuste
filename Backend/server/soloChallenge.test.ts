import assert from "node:assert/strict";
import test from "node:test";
import {
    calculateSoloPoints,
    validateSoloOperations,
} from "./soloChallenge";
import {
    hashDeviceCredential,
    matchesDeviceCredential,
} from "./deviceCredential";

test("accepts a legal sequence that reaches the target", () => {
    assert.equal(
        validateSoloOperations(
            [2, 3, 4, 7, 11],
            23,
            [
                { first: 2, operator: "+", second: 3, result: 5 },
                { first: 5, operator: "+", second: 7, result: 12 },
                { first: 12, operator: "+", second: 11, result: 23 },
            ]
        ),
        true
    );
});

test("rejects reused numbers and fabricated operation results", () => {
    assert.equal(
        validateSoloOperations(
            [2, 3],
            10,
            [
                { first: 2, operator: "+", second: 3, result: 5 },
                { first: 2, operator: "+", second: 3, result: 10 },
            ]
        ),
        false
    );

    assert.equal(
        validateSoloOperations(
            [2, 3],
            6,
            [{ first: 2, operator: "×", second: 3, result: 5 }]
        ),
        false
    );
});

test("rejects a shortcut that cannot satisfy the generated target difficulty", () => {
    assert.equal(
        validateSoloOperations(
            [2, 3],
            5,
            [{ first: 2, operator: "+", second: 3, result: 5 }]
        ),
        false
    );
});

test("applies the proportional hint penalty, including zero after all hints", () => {
    assert.equal(calculateSoloPoints(0, 3), 10);
    assert.equal(calculateSoloPoints(1, 3), 6);
    assert.equal(calculateSoloPoints(2, 3), 3);
    assert.equal(calculateSoloPoints(3, 3), 0);
});

test("hashes valid device credentials and rejects a different credential", () => {
    const credential = "a1".repeat(32);
    const hash = hashDeviceCredential(credential);

    assert.equal(hash.length, 64);
    assert.equal(matchesDeviceCredential(credential, hash), true);
    assert.equal(matchesDeviceCredential("b2".repeat(32), hash), false);
    assert.throws(() => hashDeviceCredential("short"), {
        message: "invalid_device_credential",
    });
});