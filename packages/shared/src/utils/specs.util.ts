type RandomAction<A = void, R = void> = (...args: A[]) => R;

const random = (max: number, min = 0): number =>
    Math.round(Math.random() * (max - min) + min);

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
export { random, randomRange, randomizeAction };
