import { FIELD_LENGTH_RATIO } from '../static/globals';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.toLowerCase();

const random = (max: number, min = 0): number =>
    Math.trunc(Math.random() * (1 + max - min) + min);

const randomString = (
    max: number,
    min = 0,
    isIncorrectAllow = false,
): string => {
    return new Array(
        random((isIncorrectAllow ? FIELD_LENGTH_RATIO : 1) * max, min),
    )
        .fill(null)
        .map(() => CHARACTERS.charAt(random(CHARACTERS.length)))
        .join('');
};

const randomRange = (max: number, min = 0): [number, number] => {
    let startId = random(max, min);
    let endId = random(max, min);
    if (startId > endId) [startId, endId] = [endId, startId];
    return [startId, endId];
};

const randomizeAction = <T>(
    percent: number,
    action: () => T,
    fallback: () => T,
): T => (random(100) <= percent ? action() : fallback());

export { random, randomString, randomRange, randomizeAction };
