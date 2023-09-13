import { FIELD_LENGTH_RATIO } from 'static/specs';

type RandomAction<A = void, R = void> = (...args: A[]) => R;

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.toLowerCase();

const random = (max: number, min = 0): number =>
    Math.round(Math.random() * (max - min) + min);

const randomString = (max: number, min = 0, allowIncorrect = false): string => {
    return new Array(
        random((allowIncorrect ? FIELD_LENGTH_RATIO : 1) * max, min),
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

const randomizeAction = <A, R>(actions: RandomAction<A, R>[], args: A[]): R => {
    const index: number = random(actions.length - 1);
    return actions[index](...args);
};

export type { RandomAction };
export { random, randomString, randomRange, randomizeAction };
