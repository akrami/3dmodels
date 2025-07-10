export type Point = { x: number, z: number }

export function getPointsOnCircle(radius: number, n: number): Point[] {
    const r = radius / 2;
    const points: Point[] = [];

    for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n;
        const x = r * Math.cos(angle);
        const z = r * Math.sin(angle);
        points.push({ x, z });
    }

    return points;
}